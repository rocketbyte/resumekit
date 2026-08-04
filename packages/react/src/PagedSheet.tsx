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
  PAGE_HEIGHT,
  SHEET_GAP,
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

export interface PagedSheetProps {
  /** Re-measure whenever this changes — a style change resizes everything. */
  measureKey: string;
  children: ReactNode;
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
export function PagedSheet({ measureKey, children }: PagedSheetProps) {
  const flow = useRef<HTMLDivElement>(null);
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

    const origin = root.getBoundingClientRect().top;

    /*
     * Write, then read, then write — never interleaved.
     *
     * Measuring a block, pushing it, then measuring the next forces the browser
     * to lay the document out again once PER BLOCK, on every keystroke. Instead
     * the natural layout is read in a single pass and handed whole to
     * `planPagination`, which decides every push arithmetically. One reflow, not
     * one per block.
     */
    for (const block of blocks) block.style.marginTop = '';

    const measured: MeasuredBlock<Element>[] = blocks.map((block) => {
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
        top: rect.top - origin,
        height: rect.height,
        keepWithNext: block.hasAttribute('data-keep-with-next'),
      };
    });

    const plan = planPagination(measured);

    /*
     * Back onto the elements the plan indexed. The model deals in positions, so
     * it never sees a node and cannot move one by mistake.
     */
    const pushes = new Map<HTMLElement, number>();
    const targets = new Map<HTMLElement, number>();
    for (const [index, offset] of plan.pushes) {
      pushes.set(blocks[index], offset);
      blocks[index].style.marginTop = `${offset}px`;
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
      const after = root.getBoundingClientRect().top;
      let worst = 0;
      for (const [block, target] of targets) {
        const actual = block.getBoundingClientRect().top - after;
        const residual = target - actual;
        if (Math.abs(residual) < 0.5) continue;
        worst = Math.max(worst, Math.abs(residual));
        const next = Math.max(0, (pushes.get(block) ?? 0) + residual);
        pushes.set(block, next);
        block.style.marginTop = `${next}px`;
      }
      if (worst === 0) break;
    }

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
      if (!root || running.current) return;
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
      <div
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
            '--page-gap': `${SHEET_GAP}px`,
            /*
             * The sheets are absolutely positioned decoration, so they add
             * nothing to this element's height — it would otherwise collapse to
             * the TEXT, and a short document would render as a sliver of paper
             * cut off mid-page. Reserving the sheets' full extent here keeps a
             * page looking like a page when it is nearly empty, which is exactly
             * the state a record starts in.
             */
            '--pages': pages,
          } as React.CSSProperties
        }
      >
        {/* Decoration. Nothing in here is content, so nothing here can be lost. */}
        <div className="tpl-pages__sheets" aria-hidden="true">
          {Array.from({ length: pages }, (_, i) => (
            <div
              key={i}
              className="tpl-sheet"
              style={{ top: `${i * (PAGE_HEIGHT + SHEET_GAP)}px` }}
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
    </RepaginateContext.Provider>
  );
}
