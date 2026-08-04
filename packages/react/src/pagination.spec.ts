import { describe, expect, it } from 'vitest';
import {
  PAGE_HEIGHT,
  PAGE_MARGIN,
  SHEET_GAP,
  planPagination,
  type MeasuredBlock,
} from './pagination.js';

/**
 * Where the pages break.
 *
 * Testable at all because the model was separated from the measuring: jsdom has
 * no layout engine, so a test that goes through the DOM can only assert that
 * pagination does no harm. Handed measurements, the model can be held to its
 * answer — which is what these do.
 */

const PITCH = PAGE_HEIGHT + SHEET_GAP;
const TEXT_TOP = (k: number) => PITCH * k + PAGE_MARGIN;
const TEXT_BOTTOM = (k: number) => PITCH * k + PAGE_HEIGHT - PAGE_MARGIN;
const USABLE = PAGE_HEIGHT - PAGE_MARGIN * 2;

/** Blocks stacked one after another down a single flow, as a browser lays them. */
function column<TFlow>(
  flow: TFlow,
  heights: readonly number[],
  start = PAGE_MARGIN,
): MeasuredBlock<TFlow>[] {
  let top = start;
  return heights.map((height) => {
    const block = { flow, top, height, keepWithNext: false };
    top += height;
    return block;
  });
}

describe('planPagination', () => {
  it('is one sheet, and no push, for content that fits', () => {
    const plan = planPagination(column('main', [100, 200, 300]));
    expect(plan.pushes.size).toBe(0);
    expect(plan.pages).toBe(1);
  });

  it('is one sheet with no blocks at all', () => {
    // A record with nothing in it is still a page, not zero pages.
    expect(planPagination([]).pages).toBe(1);
  });

  it('pushes a block that would cross the boundary onto the next sheet', () => {
    // Two blocks that together overflow the first sheet's text area.
    const plan = planPagination(column('main', [USABLE - 40, 100]));
    expect(plan.pushes.has(0)).toBe(false);
    expect(plan.targets.get(1)).toBe(TEXT_TOP(1));
    expect(plan.pages).toBe(2);
  });

  it('does not move a heading for a block that cannot fit anywhere', () => {
    /*
     * The bug that emptied Meridian's rail on its own first page. The keyword
     * list is one block and is taller than the paper, so holding its heading
     * against it pushed the heading to a fresh sheet — where the list still
     * overran, and the sheet the heading came from was left blank.
     */
    const blocks = column('aside', [20, USABLE * 2]);
    blocks[0].keepWithNext = true;
    const plan = planPagination(blocks);
    expect(plan.pushes.has(0)).toBe(false);
  });

  it('lets a block taller than a sheet run, and counts what it spans', () => {
    // Pushing it cannot rescue it — it would overflow wherever it started.
    const plan = planPagination(column('main', [USABLE + PITCH + 10]));
    expect(plan.pushes.size).toBe(0);
    expect(plan.pages).toBeGreaterThanOrEqual(2);
  });

  it('does not leave a heading alone at the foot of a sheet', () => {
    const blocks = column('main', [USABLE - 30, 20, 200]);
    blocks[1].keepWithNext = true;
    const plan = planPagination(blocks);
    // The heading fits by itself and is moved anyway, because what follows it
    // does not.
    expect(plan.targets.get(1)).toBe(TEXT_TOP(1));
  });

  describe('a single flow — every template before Meridian', () => {
    it('paginates identically whether or not the flow is named', () => {
      const heights = [400, 400, 400, 400, 400, 400];
      const unnamed = planPagination(column('root', heights));
      const named = planPagination(column('main', heights));
      expect([...named.pushes]).toEqual([...unnamed.pushes]);
      expect(named.pages).toBe(unnamed.pages);
    });

    it('carries one running offset down the whole document', () => {
      // Two breaks in a row: the second is computed against a position that
      // already includes the first push, which is the property a per-flow map
      // must not lose for a single-column document.
      const plan = planPagination(column('main', [USABLE - 20, 60, USABLE]));
      expect(plan.targets.get(1)).toBe(TEXT_TOP(1));
      expect(plan.targets.get(2)).toBe(TEXT_TOP(2));
      expect(plan.pages).toBe(3);
    });
  });

  describe('two flows side by side — Meridian', () => {
    /**
     * Both columns start at the top of the page, so their natural `top` values
     * overlap. That is what breaks a single running offset: in document order
     * the sidebar comes after the whole main column, and would otherwise inherit
     * every push the main column accumulated.
     */
    function twoColumns(main: number[], aside: number[]) {
      return [...column('main', main), ...column('aside', aside)];
    }

    it('does not displace one column with the other column’s pushes', () => {
      // The main column breaks twice; the sidebar fits on one sheet and must
      // not move at all.
      const plan = planPagination(
        twoColumns([USABLE - 20, 60, USABLE], [100, 100]),
      );
      expect(plan.pushes.has(3)).toBe(false);
      expect(plan.pushes.has(4)).toBe(false);
    });

    it('breaks each column by its own height', () => {
      const plan = planPagination(
        twoColumns([USABLE - 30, 200], [USABLE - 10, 200]),
      );
      // One block of each column moved, each to the top of sheet two.
      expect(plan.targets.get(1)).toBe(TEXT_TOP(1));
      expect(plan.targets.get(3)).toBe(TEXT_TOP(1));
      expect(plan.pages).toBe(2);
    });

    it('counts the sheets the DEEPEST column reaches, not the last one written', () => {
      /*
       * The sidebar is last in the document and is routinely the shorter
       * column. Deriving the page count from it — which is what "the last block
       * decides" did — drops the sheets the main column is still running onto.
       */
      const plan = planPagination(
        twoColumns([USABLE - 10, USABLE - 10, USABLE - 10], [80]),
      );
      expect(plan.pages).toBe(3);
    });

    it('keeps a sidebar heading with the sidebar block that follows it', () => {
      // Not with whatever comes next in the document, which for the LAST main
      // block is the top of the sidebar.
      const blocks = twoColumns([200], [USABLE - 30, 20, 200]);
      blocks[2].keepWithNext = true;
      const plan = planPagination(blocks);
      expect(plan.targets.get(2)).toBe(TEXT_TOP(1));
    });

    it('does not move a main-column heading for a sidebar block’s height', () => {
      /*
       * The last block of the main column is followed in document order by the
       * first block of the sidebar. Measuring it against that block's height
       * would break a page for a block sitting beside it, not below it.
       */
      const blocks = twoColumns([USABLE - 30], [USABLE]);
      blocks[0].keepWithNext = true;
      const plan = planPagination(blocks);
      expect(plan.pushes.has(0)).toBe(false);
    });
  });

  it('never plans a push that starts a block above the text area', () => {
    const plan = planPagination(column('main', [USABLE - 5, 300, 300, 300]));
    for (const target of plan.targets.values()) {
      const sheet = Math.floor(target / PITCH);
      expect(target).toBeGreaterThanOrEqual(TEXT_TOP(sheet));
      expect(target).toBeLessThan(TEXT_BOTTOM(sheet));
    }
  });
});
