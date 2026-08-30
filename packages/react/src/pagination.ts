/**
 * Where the pages break — as arithmetic, with no DOM in it.
 *
 * Separated from `PagedSheet` because the two halves fail for different reasons
 * and are checked by different means. Reading the layout is a browser question
 * that jsdom cannot answer (every measurement there is zero). Deciding where a
 * sheet ends is a model, and a model can be handed measurements and held to its
 * answer — which is what `pagination.spec.ts` does, and what no test could do
 * while this lived inside a `useCallback` closed over a ref.
 */

/** Letter at 96dpi, and the document's own vertical margin, both in CSS pixels. */
export const PAGE_HEIGHT = 11 * 96;
/** Letter's other dimension, which is what a view zoom has to fit into. */
export const PAGE_WIDTH = 8.5 * 96;
export const PAGE_MARGIN = 0.5 * 96;
/** The gap drawn between sheets on screen. Presentation only — never printed. */
export const SHEET_GAP = 28;

/**
 * One block as the browser reported it, tagged with the column it flows down.
 *
 * `flow` is opaque here on purpose: the model only ever compares flows for
 * identity, so it does not need to know they are elements, and a test can label
 * them `'main'` and `'aside'`.
 */
export interface MeasuredBlock<TFlow> {
  flow: TFlow;
  /** Natural position in flow coordinates, before any push. */
  top: number;
  height: number;
  /** A heading, which must not be the last thing on a sheet. */
  keepWithNext: boolean;
}

export interface PaginationPlan {
  /** Block index → how far down it must be pushed. Absent means "not pushed". */
  pushes: Map<number, number>;
  /** Block index → where a pushed block is SUPPOSED to start. */
  targets: Map<number, number>;
  /** How many sheets the document occupies. Never below one. */
  pages: number;
}

/** Sheet `k` occupies `[pitch*k, pitch*k + PAGE_HEIGHT)`. */
const pitch = PAGE_HEIGHT + SHEET_GAP;
const textTop = (k: number) => pitch * k + PAGE_MARGIN;
const textBottom = (k: number) => pitch * k + PAGE_HEIGHT - PAGE_MARGIN;
const usable = PAGE_HEIGHT - PAGE_MARGIN * 2;

/**
 * Plan the breaks: which blocks move down, how far, and how many sheets result.
 *
 * Every push is derived arithmetically from ONE reading of the natural layout,
 * rather than by measuring, pushing, and measuring again — that costs a reflow
 * per block on every keystroke. Pushing a block down by `p` shifts everything
 * after it **in the same flow** by exactly `p`, so a running offset per flow is
 * all the later blocks need.
 *
 * **Per flow**, and that is the load-bearing word. A template that sets regions
 * side by side has more than one column, and a push in one of them does not move
 * the other. Carrying a single running offset across both — which is what this
 * did while every template was one column — would measure every block of the
 * second column against a position it never occupied, and the sidebar would walk
 * off the sheet on the first break.
 *
 * A document with no declared flow puts every block in the same one, so the maps
 * below hold a single entry and the arithmetic is the single running offset it
 * replaced. Single-column templates are not paginated by a new code path.
 */
export function planPagination<TFlow>(
  blocks: readonly MeasuredBlock<TFlow>[],
): PaginationPlan {
  const pushes = new Map<number, number>();
  const targets = new Map<number, number>();
  if (blocks.length === 0) return { pushes, targets, pages: 1 };

  /*
   * The next block in the SAME flow, for `keepWithNext`.
   *
   * Resolved in one backward pass rather than by searching forward per block: a
   * heading is kept with what follows it *in its own column*, and the block that
   * happens to come next in the document can be the top of the other one.
   */
  const nextInFlow = new Array<number>(blocks.length).fill(-1);
  const lastSeen = new Map<TFlow, number>();
  for (let i = blocks.length - 1; i >= 0; i--) {
    nextInFlow[i] = lastSeen.get(blocks[i].flow) ?? -1;
    lastSeen.set(blocks[i].flow, i);
  }

  /** Per flow: how far its content has been pushed, and the sheet it is on. */
  const shifts = new Map<TFlow, number>();
  const sheets = new Map<TFlow, number>();
  /** How far down the document reaches once every push is applied. */
  let bottom = 0;

  for (const [index, block] of blocks.entries()) {
    const shift = shifts.get(block.flow) ?? 0;
    let sheet = sheets.get(block.flow) ?? 0;
    let top = block.top + shift;

    // A block taller than a whole sheet cannot be rescued by pushing it; let it
    // run, and count the sheets it spans.
    if (block.height > usable) {
      sheets.set(
        block.flow,
        Math.max(sheet, Math.floor((top + block.height) / pitch)),
      );
      bottom = Math.max(bottom, top + block.height);
      continue;
    }

    /*
     * A section heading must not be the last thing on a sheet. It is measured
     * together with whatever follows it — the same intent as the stylesheet's
     * `break-after: avoid`, which the printer applies to this very document.
     *
     * UNLESS what follows cannot fit on a sheet by itself. Holding a heading
     * against a block that overflows wherever it starts buys nothing and costs a
     * page: the heading is pushed to a fresh sheet, the block still overruns,
     * and the sheet the heading came from is left empty. That is exactly how a
     * 56-item keyword rail emptied its own first page — the list is one block,
     * taller than the paper, so its heading was moved every single time.
     */
    const next = nextInFlow[index];
    const nextHeight = next === -1 ? 0 : blocks[next].height;
    const withNext =
      block.keepWithNext && nextHeight <= usable ? nextHeight : 0;

    if (top + block.height + withNext > textBottom(sheet)) {
      sheet += 1;
      const push = textTop(sheet) - top;
      pushes.set(index, push);
      targets.set(index, textTop(sheet));
      shifts.set(block.flow, shift + push);
      sheets.set(block.flow, sheet);
      top = textTop(sheet);
    }

    // Accumulated as the loop goes, with the offset that was in force for THIS
    // block — a flow's final offset belongs to its last block, not to every
    // block that preceded the pushes making it up.
    bottom = Math.max(bottom, top + block.height);
  }

  /*
   * The deepest sheet ANY flow reaches decides the count.
   *
   * Per flow rather than "the last block in the document", because the last
   * block of a two-column page is the foot of the sidebar, which is routinely
   * the shorter column — trusting it would drop the sheet the main column is
   * still running onto.
   */
  let deepest = 0;
  for (const sheet of sheets.values()) deepest = Math.max(deepest, sheet);

  return {
    pushes,
    targets,
    pages: Math.max(deepest + 1, Math.ceil(bottom / pitch) || 1),
  };
}
