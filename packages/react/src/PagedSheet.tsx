import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import {
  ZOOM_SETTLE_MS,
  ZOOM_MAX,
  ZOOM_MIN,
  ZOOM_STEP,
  step,
  useFitZoom,
} from './useFitZoom.js';
import {
  PAGE_HEIGHT,
  SHEET_GAP,
  PAGE_MARGIN,
  planPagination,
  type MeasuredBlock,
} from './pagination.js';
import './paged.css';

/** How many times a single pagination will re-measure before giving up. */
const MAX_PASSES = 4;
/** How many times one pass corrects a push against where it actually landed. */
const MAX_CORRECTIONS = 3;

/**
 * A repaginate handle, published to whatever can see the content change.
 *
 * Neither React nor a ResizeObserver can: the document's text lives in Craft's
 * own store, so a keystroke re-renders a node WITHOUT re-rendering this
 * component or its children, and the observer proved not to deliver for content
 * growth inside the observed subtree. The component that CAN see it subscribes
 * to Craft and calls this.
 */
const RepaginateContext = createContext<() => void>(() => undefined);

/** Ask the enclosing `PagedSheet` to re-measure. A no-op outside one. */
export function useRepaginate(): () => void {
  return useContext(RepaginateContext);
}

/**
 * How much the sheet is magnified, for the one thing that has to divide by it.
 *
 * The page is drawn with CSS `zoom`, so a pointer that has travelled 30 screen
 * pixels has travelled 30/zoom document pixels — and a control that turns
 * pointer travel into a document measurement gets it wrong by the zoom unless
 * it knows. Everything else in here works in document pixels already and needs
 * this no more than `useRepaginate` needs a scale.
 */
const ZoomContext = createContext(1);

/** The sheet's current magnification. `1` — no zoom — outside a sheet. */
export function useSheetZoom(): number {
  return useContext(ZoomContext);
}

export interface PagedSheetProps {
  /** Re-measure whenever this changes — a style change resizes everything. */
  measureKey: string;
  children: ReactNode;
  /**
   * The most this may be zoomed for VIEWING, as a multiplier. `1`, the default,
   * is no zoom at all — the read-only document and the export renderer both take
   * it, because a rendered page is the page and nothing may scale it.
   *
   * The value actually applied is the lesser of this and what fits across the
   * container: see `useFitZoom`.
   */
  maxZoom?: number;
  /**
   * How long to leave the page at its own size before fitting it, in ms.
   *
   * Default `0`: fitted during the first layout pass, so a surface that merely
   * renders a document is never seen at the wrong size. A surface that arrives
   * on a screen still settling passes a delay — see `useFitZoom`.
   */
  fitDelayMs?: number;
  /**
   * The gap between sheets, in CSS pixels. Defaults to the gap drawn on screen.
   *
   * The export passes `0`, because paper has no gap between its pages — and that
   * is the ONLY difference between how the editor paginates a document and how
   * the exported file does. It reaches both the paginator's arithmetic and the
   * sheets' positions, so the two cannot disagree.
   */
  sheetGap?: number;
}

/**
 * The document, shown as discrete sheets.
 *
 * The flow is **never restructured**. The obvious implementation — measure the
 * blocks, then render each page's blocks into its own page container — moves DOM
 * nodes between parents whenever a break shifts. Those nodes are Craft.js linked
 * nodes holding the candidate's edits, and re-parenting risks remounting them
 * against their JSX-supplied initial props: a repagination would cost somebody
 * their typing, which is the worst bug this feature could have.
 *
 * So content renders as one continuous column and pagination is a set of numbers
 * applied to elements that were already there: a block that would straddle a
 * boundary is pushed down by top margin so it starts on the next sheet. The
 * sheets themselves are inert, absolutely positioned behind the flow, and carry
 * no content at all.
 *
 * It also degrades honestly — before the first measurement, or if measurement
 * fails, the reader sees a continuous document rather than a broken one.
 */
export function PagedSheet({
  measureKey,
  children,
  maxZoom = 1,
  fitDelayMs = 0,
  sheetGap = SHEET_GAP,
}: PagedSheetProps) {
  const flow = useRef<HTMLDivElement>(null);
  const pagesRef = useRef<HTMLDivElement>(null);
  const fit = useFitZoom(pagesRef, maxZoom, fitDelayMs);

  /*
   * The gap, held in a ref so `paginate` can stay dependency-free.
   *
   * `paginate` is deliberately a `useCallback` over `[]` — it is scheduled from
   * effects, a resize listener and a microtask guard, and a changing identity
   * would re-subscribe all of them on every render. The gap is a constant per
   * surface in practice (28 in the editor, 0 in the export), so reading it
   * through a ref keeps that property without the callback growing a dependency.
   */
  const gapRef = useRef(sheetGap);
  gapRef.current = sheetGap;

  /*
   * A gap of zero means paper: sheets are contiguous only when they are pages.
   * Derived rather than passed separately, so the two cannot be set to disagree.
   */
  const printing = sheetGap === 0;
  const printingRef = useRef(printing);
  printingRef.current = printing;

  /*
   * The candidate's own zoom, once they have expressed one.
   *
   * `null` means "whatever fits", so the automatic value keeps tracking the
   * window. The moment they touch a control it stops: a resize must not undo a
   * choice somebody made, and this is the smallest way to say which of the two
   * is currently in charge.
   *
   * Never stored, on purpose. It is a fact about how somebody is looking at the
   * document, not about the document — `editor-usability` (#35) is explicit that
   * a view zoom must not become part of the artifact, because the résumé's own
   * type scale already is.
   */
  const [chosen, setChosen] = useState<number | null>(null);
  const zoom = chosen ?? fit;

  /*
   * Pagination is suspended while the zoom is easing.
   *
   * Measurements are divided by the TARGET zoom, and during a transition the
   * layout is at neither the old value nor the new one — so a pass mid-animation
   * would divide real rects by a scale they are not yet at and plan the pages
   * against numbers that are true for no frame. The ResizeObserver fires on
   * every one of those frames, so this is not a rare case; it is every press.
   *
   * A timer rather than `transitionend`, because `zoom` is not interpolable
   * everywhere: where the browser snaps instead of easing, no event ever fires
   * and pagination would stay suspended for good.
   */
  const zooming = useRef(false);
  const settled = useRef(zoom);

  /*
   * Read by `measure`, which must not be rebuilt when the zoom changes: it is a
   * `useCallback` the observers are bound to, and re-creating it would tear down
   * and re-attach them on every resize.
   */
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;
  const [pages, setPages] = useState(1);
  /*
   * Re-entrancy guard, cleared synchronously.
   *
   * Pagination writes margins, which resizes the flow, which is what the
   * observer below watches — so it must not be able to call itself while it is
   * running. Deliberately NOT a frame- or timer-based guard: one of those
   * latches shut whenever its callback does not run (a backgrounded tab, a
   * throttled frame loop) and pagination then stops for good. This flag is set
   * and cleared inside one synchronous body, so it cannot outlive the call.
   *
   * The asynchronous half of the loop needs no guard: paginate is idempotent, so
   * a second pass computes the same margins, changes no size, and ends there.
   */
  const running = useRef(false);

  /**
   * One measuring pass. Returns a signature of the pushes it applied, so the
   * caller can tell whether anything moved.
   */
  const measure = useCallback((root: HTMLDivElement): string => {
    /*
     * The blocks, with a splittable one replaced by the items inside it.
     *
     * A block is what moves whole onto the next sheet, and for almost everything
     * a résumé holds that is right — an experience entry belongs with its own
     * bullets. A **keyword rail** is the exception: fifty-odd skills are one list
     * because they are one field, and treating them as one block makes a thing
     * taller than the paper, which no amount of pushing can place. Such a
     * container marks itself `data-split` and its list items become the blocks,
     * so the rail breaks between two skills like a list rather than being moved
     * around like a paragraph.
     *
     * Document order is preserved, because `flatMap` preserves it.
     */
    const blocks = Array.from(
      root.querySelectorAll<HTMLElement>('[data-block]'),
    ).flatMap((block) =>
      block.hasAttribute('data-split')
        ? Array.from(block.querySelectorAll<HTMLElement>('li'))
        : [block],
    );
    // Nothing to measure is a stable state, not a failure.
    if (blocks.length === 0) return '';

    /*
     * Everything below is read from `getBoundingClientRect`, which reports the
     * VIEWPORT box — so under a view zoom every distance comes back multiplied
     * by it, while `PAGE_HEIGHT` and the margins the plan is compared against
     * stay in unzoomed CSS pixels. Dividing here is what keeps the two in the
     * same units: without it a document at 1.15 would break its pages 15% early.
     *
     * The pushes written back need no such correction. They are CSS lengths
     * applied INSIDE the zoomed subtree, so the browser scales them itself.
     */
    const scale = zoomRef.current;
    const origin = root.getBoundingClientRect().top / scale;

    /*
     * Write, then read, then write — never interleaved.
     *
     * Measuring a block, pushing it, then measuring the next forces the browser
     * to lay the document out again once PER BLOCK, on every keystroke. Instead
     * the natural layout is read in a single pass and handed whole to
     * `planPagination`, which decides every push arithmetically. One reflow, not
     * one per block.
     */
    /*
     * EVERY property a pass writes, cleared before the next one measures — not
     * just the margin.
     *
     * The bug this fixes, which reached exported PDFs: printing writes
     * `break-before` and `padding-top` as well (see the print branch below), and
     * only the margin was ever reset. So the second pass measured a document
     * that was still carrying the FIRST pass's page breaks. Under
     * `emulatedMediaType: print` the renderer's layout is genuinely fragmented,
     * so those breaks move the rects `getBoundingClientRect` reports — the plan
     * read a heading already sitting at the top of page two, concluded that what
     * followed no longer fitted, and broke again. Every pass added one more
     * break, and the paginator ran several: the layout effect, the resize
     * observer, and the export's settle loop.
     *
     * The symptom was exact. A résumé the editor drew on two pages exported on
     * three, with EDUCATION alone at the top of page two and its entries
     * stranded on page three.
     *
     * `''` restores the stylesheet's value rather than zeroing it, which is what
     * makes this a reset to the NATURAL layout instead of a fourth opinion
     * about spacing. `pagination-reset.spec.ts` fails if a future pass writes a
     * property this loop does not clear.
     */
    for (const block of blocks) {
      /*
       * A block this component moved is held still while it is put back, so
       * the read below sees its natural margin rather than the first frame of
       * an animation back to it. See `still` below.
       */
      if (block.style.marginTop) block.style.transition = 'none';
      block.style.marginTop = '';
      block.style.breakBefore = '';
      block.style.paddingTop = '';
    }

    /*
     * Hands animation back to every block this pass did not move.
     *
     * A spaced block eases its `margin-top` (`spacing.css`), and a push IS a
     * `margin-top`. Left to ease, a push had not moved the block when the
     * correction loop measured it, so the loop read the whole push as missing
     * and added it again, three times over. The saved résumé showed the entry
     * far down its new page, with space the candidate never asked for. The
     * editor hid it only because a drag switches the easing off.
     *
     * So a moved block never animates. The layout is read first, so handing a
     * block its easing back starts no animation of its own.
     */
    const still = (moved: ReadonlySet<Element>) => {
      void root.getBoundingClientRect();
      for (const block of blocks) {
        if (!moved.has(block)) block.style.transition = '';
      }
    };

    /*
     * Each block's OWN top margin, read once the inline ones are cleared.
     *
     * A push is written as an inline `margin-top`, which REPLACES whatever the
     * stylesheet gave the block rather than adding to it — so pushing a block
     * onto the next sheet used to delete the margin it was drawn with, and a
     * candidate who had opened a gap above a section watched it vanish the
     * moment that section crossed a page boundary. The correction loop below
     * then had to rediscover the lost distance by measuring, which it does to
     * within half a pixel and no closer.
     *
     * Kept here so the push can be written as the block's own margin PLUS the
     * offset. The plan's offsets are distances to move FROM the natural layout,
     * and the natural layout already includes these — so adding them back is
     * what makes the block move by exactly what the plan asked for.
     */
    const own = blocks.map(
      (block) => Number.parseFloat(getComputedStyle(block).marginTop) || 0,
    );

    /*
     * The space the candidate recorded above each block. The planner decides
     * how much of it a block keeps when it is moved onto a new sheet.
     *
     * A gap belongs to the FIRST block inside the element that carries it: a
     * spaced entry is itself a block, but a spaced section holds its gap above
     * its heading. Blocks come in document order, so the first one found inside
     * a spaced element is the one that claims its gap, and no gap is counted
     * twice.
     *
     * Read as `--tpl-space-height`, which is registered as a `<length>` and so
     * computes to pixels. A browser that cannot register it answers with the
     * unresolved `calc()`, which parses as nothing: such a block keeps no space
     * at the top of a sheet, which is how every block behaved before.
     */
    const claimed = new Set<Element>();
    const leads = blocks.map((block) => {
      let lead = 0;
      for (
        let el: Element | null = block;
        el && el !== root;
        el = el.parentElement
      ) {
        if (!el.hasAttribute('data-spaced') || claimed.has(el)) continue;
        claimed.add(el);
        lead +=
          Number.parseFloat(
            getComputedStyle(el).getPropertyValue('--tpl-space-height'),
          ) || 0;
      }
      return lead;
    });

    const measured: MeasuredBlock<Element>[] = blocks.map((block, index) => {
      const rect = block.getBoundingClientRect();
      return {
        /*
         * Which COLUMN this block flows down. A template that lays regions side
         * by side marks each one `[data-flow]`; everything else answers `root`,
         * so a single-column document is one flow.
         *
         * Read from the block's PARENT, so a block that is itself a flow root
         * belongs to the flow around it rather than to itself.
         */
        flow: block.parentElement?.closest<Element>('[data-flow]') ?? root,
        top: rect.top / scale - origin,
        height: rect.height / scale,
        keepWithNext: block.hasAttribute('data-keep-with-next'),
        lead: leads[index],
      };
    });

    const plan = planPagination(measured, gapRef.current);

    /*
     * ── Printing takes the same PLAN and applies it differently ─────────────
     *
     * On screen a page break is a block pushed down by `margin-top` until it
     * sits at the top of the next sheet. On paper that does not survive, and the
     * reason is CSS fragmentation rather than anything about this code: when the
     * printer breaks a flow across pages it TRUNCATES the margin at the break,
     * and the element's own padding — the page's inner margin, which every
     * template carries on its root box — is applied to the first fragment only.
     * The measured symptom was exact: page one's text started 0.59in down and
     * page two's started 0.064in down, flush against the paper's edge.
     *
     * So printing asks the browser for the break instead of positioning it.
     * `break-before: page` puts the block at the top of a new sheet — the SAME
     * block the shared paginator chose, so the decision is still made in one
     * place — and `padding-top` re-establishes the page's inner margin, because
     * padding at the start of a fragment is preserved where a margin is not.
     *
     * The correction pass below is skipped for the same reason: it exists to
     * verify a block landed where it was pushed, and nothing is being pushed.
     */
    if (printingRef.current) {
      for (const index of plan.pushes.keys()) {
        const el = blocks[index];
        /*
         * Zero, not cleared. Clearing restores the block's own CSS margin — the
         * space a section carries above itself — and at the top of a fresh page
         * that is not space between sections, it is space above the first line
         * of the page. It measured as 1.31in where the first page reads 0.59in.
         */
        el.style.transition = 'none';
        el.style.marginTop = '0px';
        el.style.breakBefore = 'page';
        /*
         * Plus the space the candidate recorded above this block, as padding
         * for the same reason: a margin at the start of a page does not print.
         */
        el.style.paddingTop = `${PAGE_MARGIN + (plan.leads.get(index) ?? 0)}px`;
      }
      still(new Set([...plan.pushes.keys()].map((index) => blocks[index])));
      setPages((current) => (current === plan.pages ? current : plan.pages));
      return [...plan.pushes.keys()].join(',');
    }

    /*
     * Back onto the elements the plan indexed. The model deals in positions, so
     * it never sees a node and cannot move one by mistake.
     */
    const pushes = new Map<HTMLElement, number>();
    const targets = new Map<HTMLElement, number>();
    for (const [index, offset] of plan.pushes) {
      const applied = (own[index] ?? 0) + offset;
      pushes.set(blocks[index], applied);
      blocks[index].style.transition = 'none';
      blocks[index].style.marginTop = `${applied}px`;
    }
    for (const [index, target] of plan.targets) {
      targets.set(blocks[index], target);
    }

    /*
     * Apply, then VERIFY — do not trust the prediction.
     *
     * The arithmetic above assumes a block moves by exactly what it is given.
     * Real layout disagrees: a pushed block is often the first child of its
     * section, so its margin COLLAPSES with the section's and part of the offset
     * is swallowed; and a multi-column block settles to a different height once
     * laid out. Predicting either is how a section heading ended up floating in
     * the gap between two pages.
     *
     * Measuring the residual absorbs both without modelling them — which is also
     * why the offset is a MARGIN. A margin moves the block's box, so the
     * correction can see whether it worked; padding moves only the content
     * inside the box, leaving the measured position unchanged and the loop
     * correcting forever.
     *
     * So the residual is measured and corrected. Passes over a settled layout
     * read a residual of zero and change nothing.
     */
    for (let correction = 0; correction < MAX_CORRECTIONS; correction++) {
      const after = root.getBoundingClientRect().top / scale;
      let worst = 0;
      for (const [block, target] of targets) {
        const actual = block.getBoundingClientRect().top / scale - after;
        const residual = target - actual;
        if (Math.abs(residual) < 0.5) continue;
        worst = Math.max(worst, Math.abs(residual));
        const next = Math.max(0, (pushes.get(block) ?? 0) + residual);
        pushes.set(block, next);
        block.style.marginTop = `${next}px`;
      }
      if (worst === 0) break;
    }
    still(new Set(pushes.keys()));

    // Only when it actually changed: this runs on every content change, and a
    // needless state write would re-render the whole document.
    setPages((current) => (current === plan.pages ? current : plan.pages));

    return [...pushes.values()].map((v) => Math.round(v)).join(',');
  }, []);

  /*
   * Measure at most once per task.
   *
   * A single keystroke can produce several renders — the node write, the edits
   * report, the dirty-state settle — and each would otherwise measure the whole
   * document. The microtask coalesces them into one pass, and still runs before
   * the browser paints, so the reader never sees an unpaginated frame.
   *
   * A microtask specifically, because it always runs. A frame or a timer can be
   * throttled to a standstill in a background tab, and pagination that stops
   * there stays stopped — which is exactly how an earlier frame-based guard
   * latched shut and silently stopped repaginating altogether.
   */
  const scheduled = useRef(false);

  const paginate = useCallback(() => {
    if (scheduled.current) return;
    scheduled.current = true;
    queueMicrotask(() => {
      scheduled.current = false;
      const root = flow.current;
      if (!root || running.current || zooming.current) return;
      running.current = true;
      try {
        /*
         * Measure until it stops changing.
         *
         * One pass is not enough: measuring reads the layout, and the layout can
         * still be settling — a multi-column block reflows to a different height
         * once its content is laid out, which moves every block after it and
         * leaves the pushes computed against numbers that no longer hold. That
         * is how a section heading ended up floating in the gap BETWEEN two
         * pages: pushed by the right amount for a layout that then shrank.
         *
         * Each pass clears its own margins and re-reads, so a pass over a stable
         * layout is a no-op that returns the same signature and ends the loop.
         * Bounded, because "keep going until it settles" must terminate even if
         * a pathological layout oscillates.
         */
        let previous = '';
        for (let pass = 0; pass < MAX_PASSES; pass++) {
          const applied = measure(root);
          if (applied === previous) break;
          previous = applied;
        }
      } finally {
        running.current = false;
      }
    });
  }, [measure]);

  /*
   * Layout effect so the reader never sees the unpaginated arrangement.
   *
   * `children` IS a dependency, and deliberately so: it is the only trigger that
   * fires for certain when the document's content changes. The ResizeObserver
   * below looks like it should cover this and in practice does not fire reliably
   * for content growth inside the observed subtree — typing enough to spill onto
   * a second page left the document still showing one. React is the honest
   * signal; the observer is the backstop for what React cannot see, like the
   * window resizing.
   *
   * The cost this used to carry is gone: the frame guard above coalesces every
   * call within a frame into a single measurement, so a burst of renders
   * paginates once.
   */
  useLayoutEffect(paginate, [paginate, measureKey, children]);

  /*
   * And again once the document's own faces have arrived.
   *
   * The screen/paper divergence this closes: the export waits for
   * `document.fonts.ready` before it paginates, and this component did not — so
   * the two halves of the one guarantee this file exists to make were measuring
   * documents drawn in different typefaces.
   *
   * A résumé's face is a webfont. Until it loads the browser draws the fallback,
   * and the fallback is not metrically equal to it — `TeX Gyre Heros` matches
   * Helvetica, while a Mac's `Helvetica Neue` is a different set of advances. So
   * the first pass can plan against line breaking that is about to change, and
   * the plan outlives the layout it was made from. The measured symptom was one
   * block: an education entry the exported file fitted on page one with 17px to
   * spare, and the screen pushed onto page two.
   *
   * `document.fonts.ready` is the browser's own answer to "are the metrics
   * final", so nothing here guesses at a delay. It is already resolved on a warm
   * cache, which makes this a microtask and a second measuring pass that finds
   * nothing to change.
   *
   * Feature-detected, because pagination is presentation: an environment with no
   * font loading API must still paginate, not throw. `cancelled` because a
   * promise that settles after unmount must not measure a document that is gone.
   */
  useEffect(() => {
    const fonts = globalThis.document?.fonts;
    if (!fonts?.ready) return;
    let cancelled = false;
    void fonts.ready.then(() => {
      if (!cancelled) paginate();
    });
    return () => {
      cancelled = true;
    };
  }, [paginate]);

  /*
   * Once the zoom has settled, measure once.
   *
   * A uniform scale cannot move a page break on its own — `pagination.spec.ts`
   * asserts the plan is identical at 1.15 as at 1 — so this is not correcting
   * for the zoom itself. It is correcting for what the zoom does to text: line
   * breaking happens at the scaled width, and a line that fit at 100% can wrap
   * at 115%, which moves everything under it.
   */
  useEffect(() => {
    if (settled.current === zoom) return;
    settled.current = zoom;
    zooming.current = true;
    const timer = setTimeout(() => {
      zooming.current = false;
      paginate();
    }, ZOOM_SETTLE_MS);
    return () => clearTimeout(timer);
  }, [zoom, paginate]);

  useEffect(() => {
    const root = flow.current;
    if (!root) return;
    /*
     * The document reflows when the window does and when its own content grows;
     * both must repaginate, and neither writes anything to the document.
     *
     * Feature-detected rather than assumed: pagination is presentation, so an
     * environment without a ResizeObserver must show a continuous document, not
     * a crashed one. The layout-effect pass above still runs there.
     */
    const observer =
      typeof ResizeObserver === 'function'
        ? new ResizeObserver(() => paginate())
        : null;
    observer?.observe(root);
    window.addEventListener('resize', paginate);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', paginate);
    };
  }, [paginate]);

  return (
    <RepaginateContext.Provider value={paginate}>
      <ZoomProvider zoom={zoom}>
        {/*
         * OUTSIDE the zoomed element, or the control would zoom with the page and
         * the button for making things smaller would grow as you pressed it.
         *
         * Rendered only where a zoom is offered at all, so the read-only document
         * and the export renderer emit nothing — they pass the default `maxZoom`
         * of 1 and never reach this branch.
         */}
        {maxZoom > 1 && (
          <div
            className="tpl-zoom"
            data-chrome
            role="group"
            aria-label="View zoom"
          >
            <button
              type="button"
              className="tpl-zoom__btn"
              aria-label="Zoom out"
              title="Zoom out"
              disabled={zoom <= ZOOM_MIN}
              onClick={() => setChosen(step(zoom, -ZOOM_STEP))}
            >
              −
            </button>
            <button
              type="button"
              className="tpl-zoom__value"
              /* The percentage is also the way back: one press returns the page
               to the size the canvas has room for, which is where it started. */
              aria-label={`Zoom ${Math.round(zoom * 100)} percent — reset to fit`}
              title="Reset to fit"
              onClick={() => setChosen(null)}
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              type="button"
              className="tpl-zoom__btn"
              aria-label="Zoom in"
              title="Zoom in"
              disabled={zoom >= ZOOM_MAX}
              onClick={() => setChosen(step(zoom, ZOOM_STEP))}
            >
              +
            </button>
          </div>
        )}

        <div
          ref={pagesRef}
          className="tpl-pages"
          /*
           * There is a gap to hide only once there are two sheets. The stylesheet
           * masks the flow off at every boundary, and a mask costs a composited
           * layer on the element the candidate types into — so a one-page résumé
           * does not carry one.
           */
          data-multipage={pages > 1 ? '' : undefined}
          style={
            {
              '--page-h': `${PAGE_HEIGHT}px`,
              '--page-gap': `${sheetGap}px`,
              /*
               * The sheets are absolutely positioned decoration, so they add
               * nothing to this element's height — it would otherwise collapse to
               * the TEXT, and a short document would render as a sliver of paper
               * cut off mid-page. Reserving the sheets' full extent here keeps a
               * page looking like a page when it is nearly empty, which is exactly
               * the state a record starts in.
               */
              '--pages': pages,
              /*
               * `zoom` rather than `transform: scale()`, because zoom takes part
               * in layout: the element's own box grows with it, so the canvas
               * scrolls naturally and no height has to be reserved by hand. A
               * transform would leave the box its unzoomed size and the sheets
               * would overlap whatever follows them.
               *
               * Undefined at 1 so the property is absent from an unzoomed
               * document — which is every document outside the editor.
               */
              zoom: zoom === 1 ? undefined : zoom,
              /*
               * The transition's duration, supplied from the same constant that
               * decides how long pagination waits — so the stylesheet and the
               * measurement pause cannot drift apart.
               */
              '--zoom-ms': `${ZOOM_SETTLE_MS}ms`,
            } as React.CSSProperties
          }
        >
          {/* Decoration. Nothing in here is content, so nothing here can be lost. */}
          <div className="tpl-pages__sheets" aria-hidden="true">
            {Array.from({ length: pages }, (_, i) => (
              <div
                key={i}
                className="tpl-sheet"
                style={{ top: `${i * (PAGE_HEIGHT + sheetGap)}px` }}
              >
                <span className="tpl-sheet__number">
                  {i + 1} / {pages}
                </span>
              </div>
            ))}
          </div>

          <div className="tpl-pages__flow" ref={flow}>
            {children}
          </div>
        </div>
      </ZoomProvider>
    </RepaginateContext.Provider>
  );
}

/** Split out so the sheet's own re-render is not a new context object. */
function ZoomProvider({
  zoom,
  children,
}: {
  zoom: number;
  children: ReactNode;
}) {
  return <ZoomContext.Provider value={zoom}>{children}</ZoomContext.Provider>;
}
