import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  ZOOM_MAX,
  ZOOM_MIN,
  ZOOM_STEP,
  fitZoom,
  shrinkZoom,
  step,
} from './useFitZoom.js';
import { PAGE_WIDTH } from './pagination.js';
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

  describe('space the candidate recorded above a block', () => {
    /**
     * A second block that carries `lead` pixels of recorded space, laid out
     * the way a browser lays it: the space sits above it, so its natural top
     * is further down by exactly that much.
     */
    function spaced(lead: number, first = USABLE - 40, second = 100) {
      const blocks = column('main', [first, second]);
      blocks[1] = { ...blocks[1], top: blocks[1].top + lead, lead };
      return blocks;
    }

    it('spends the space that fitted on the sheet the block came from', () => {
      // The block fits with up to 50px of space above it. At 60 it crosses,
      // and only the 10px beyond what fitted goes above it on the new sheet.
      const plan = planPagination(spaced(60, USABLE - 150, 100));
      expect(plan.targets.get(1)).toBe(TEXT_TOP(1) + 10);
    });

    it('starts on the first line just after crossing, then moves one step at a time', () => {
      const just = planPagination(spaced(50.5, USABLE - 150, 100));
      expect(just.targets.get(1)).toBe(TEXT_TOP(1) + 0.5);
      const more = planPagination(spaced(70, USABLE - 150, 100));
      expect(more.targets.get(1)).toBe(TEXT_TOP(1) + 20);
    });

    it('does not move a block whose space still fits', () => {
      const plan = planPagination(spaced(50, USABLE - 150, 100));
      expect(plan.pushes.has(1)).toBe(false);
    });

    it('keeps all the space of a block that would not have fitted anyway', () => {
      const plan = planPagination(spaced(60));
      expect(plan.targets.get(1)).toBe(TEXT_TOP(1) + 60);
      expect(plan.leads.get(1)).toBe(60);
    });

    it('moves the block further down as the space grows', () => {
      // The reported bug: every extra step of space shortened the push by
      // the same amount, so the block never moved on its new sheet.
      const small = planPagination(spaced(60));
      const large = planPagination(spaced(200));
      expect(large.targets.get(1)).toBe((small.targets.get(1) ?? 0) + 140);
    });

    it('caps the space so the block still fits on its new sheet', () => {
      const plan = planPagination(spaced(5000, USABLE - 40, 300));
      expect(plan.targets.get(1)).toBe(TEXT_TOP(1) + USABLE - 300);
      expect(plan.pages).toBe(2);
    });

    it('adds nothing for a block that stays where it is', () => {
      const blocks = column('main', [100, 100]);
      blocks[1] = { ...blocks[1], top: blocks[1].top + 50, lead: 50 };
      const plan = planPagination(blocks);
      expect(plan.pushes.size).toBe(0);
      expect(plan.leads.size).toBe(0);
    });

    it('still starts an unspaced block on the first line', () => {
      const plan = planPagination(column('main', [USABLE - 40, 100]));
      expect(plan.targets.get(1)).toBe(TEXT_TOP(1));
      expect(plan.leads.has(1)).toBe(false);
    });
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

describe('a view zoom changes nothing about where pages break', () => {
  /**
   * What `PagedSheet` does with a zoomed layout: every rect comes back
   * multiplied, and every one is divided again before the plan sees it.
   */
  const asMeasuredUnderZoom = <T>(
    blocks: MeasuredBlock<T>[],
    zoom: number,
  ): MeasuredBlock<T>[] =>
    blocks.map((block) => ({
      ...block,
      top: (block.top * zoom) / zoom,
      height: (block.height * zoom) / zoom,
    }));

  it('plans identically at 1.15 as at 1', () => {
    /* Tall enough to break: three pages of content at Letter height. */
    const blocks = column('main', [400, 400, 400, 400, 400, 400, 400]);
    const plain = planPagination(blocks);
    const zoomed = planPagination(asMeasuredUnderZoom(blocks, 1.15));

    expect(zoomed.pages).toBe(plain.pages);
    expect([...zoomed.pushes]).toEqual([...plain.pushes]);
    expect([...zoomed.targets]).toEqual([...plain.targets]);
  });

  it('survives a zoom that does not divide cleanly', () => {
    // 1.07 is what a 900px canvas yields, and it is not a round binary fraction.
    const blocks = column('main', [333, 289, 517, 461, 380]);
    expect([
      ...planPagination(asMeasuredUnderZoom(blocks, 1.07)).pushes,
    ]).toEqual([...planPagination(blocks).pushes]);
  });
});

describe('shrinkZoom', () => {
  it('leaves a page that fits at its own size', () => {
    expect(shrinkZoom(816, 0.35)).toBe(1);
    expect(shrinkZoom(1400, 0.35)).toBe(1);
  });

  it('shrinks to a phone, rounded down so the page never overflows', () => {
    expect(shrinkZoom(358, 0.35)).toBe(0.43);
  });

  it('stops at the floor rather than becoming unreadable', () => {
    expect(shrinkZoom(100, 0.35)).toBe(0.35);
  });
});

describe('fitZoom', () => {
  it('does nothing when it is not asked to', () => {
    expect(fitZoom(4000, 1)).toBe(1);
  });

  it('takes what it was asked for when there is room', () => {
    // 8.5in is 816px; 1.15 of that plus clearance is comfortably under 1200.
    expect(fitZoom(1200, 1.15)).toBe(1.15);
  });

  it('takes only what fits, rather than what it was asked for', () => {
    /*
     * The whole point: a horizontal scrollbar is worse than a small page, so a
     * container with room for 8% gets 8% and not the 15% requested.
     */
    const zoom = fitZoom(910, 1.15);
    expect(zoom).toBeLessThan(1.15);
    expect(zoom * PAGE_WIDTH).toBeLessThanOrEqual(910);
  });

  it('never shrinks the page', () => {
    // Narrower than a page: the answer is 1, never a fraction of it. Shrinking
    // would make the résumé's own type scale ambiguous.
    expect(fitZoom(500, 1.15)).toBe(1);
    expect(fitZoom(0, 1.15)).toBe(1);
  });

  it('leaves clearance, so fitting exactly is not one pixel from not fitting', () => {
    expect(fitZoom(PAGE_WIDTH, 1.15)).toBe(1);
  });
});

describe('one press of a zoom control', () => {
  it('lands on the next round step, from wherever the page was sized', () => {
    /*
     * The automatic value is whatever fits, so it is rarely on the grid. A
     * press moves to the next MULTIPLE rather than adding a step, which is what
     * keeps the numbers round instead of walking 108 → 118 → 128.
     */
    expect(step(1.15, ZOOM_STEP)).toBe(1.2);
    expect(step(1.15, -ZOOM_STEP)).toBe(1.1);
    expect(step(1.08, ZOOM_STEP)).toBe(1.1);
    expect(step(1.08, -ZOOM_STEP)).toBe(1);
  });

  it('is never stuck on a value the grid cannot represent exactly', () => {
    // `1.2 / 0.1` is 12.000000000000002; without an epsilon a press of − here
    // would floor to itself and the control would do nothing.
    expect(step(1.2, -ZOOM_STEP)).toBe(1.1);
    expect(step(1.2, ZOOM_STEP)).toBe(1.3);
    expect(step(0.7, -ZOOM_STEP)).toBe(0.6);
  });

  it('stops at the ends rather than running past them', () => {
    expect(step(ZOOM_MAX, ZOOM_STEP)).toBe(ZOOM_MAX);
    expect(step(ZOOM_MIN, -ZOOM_STEP)).toBe(ZOOM_MIN);
  });

  it('goes below actual size, where the automatic value will not', () => {
    /*
     * The asymmetry is deliberate: an automatic shrink is indistinguishable
     * from a résumé whose type scale changed, but somebody who pressed the
     * button knows which of the two they did.
     */
    expect(step(1, -ZOOM_STEP)).toBeLessThan(1);
    expect(fitZoom(400, 1.15)).toBe(1);
  });
});

/**
 * What pagination must not do to the reader.
 *
 * Asserted in the stylesheet because the defect is a browser behaviour, and
 * jsdom has neither the layout nor the scrolling to show it. It was found in a
 * real Chrome driven over CDP: typing one letter into a skill dragged the
 * canvas 621px and took the line being typed off the screen.
 */
describe('the paged canvas does not move under the reader', () => {
  const css = readFileSync(
    join(import.meta.dirname, 'paged.css'),
    'utf8',
  ).replace(/\/\*[\s\S]*?\*\//g, '');

  it('adds a page push to the block\u2019s own margin rather than replacing it', () => {
    /*
     * A push is written as an inline `margin-top`, and inline beats the
     * stylesheet — so pushing a block onto the next sheet used to DELETE the
     * margin it was drawn with. A candidate who had opened a gap above a
     * section watched it disappear the moment that section crossed a page
     * boundary, and the correction loop then had to rediscover the lost
     * distance by measuring, which it does to within half a pixel and no
     * closer.
     *
     * Asserted against the source, because the thing that would break is an
     * arithmetic decision inside a function jsdom cannot run: it measures
     * nothing, so there is no layout here to push.
     */
    const source = readFileSync(
      join(import.meta.dirname, 'PagedSheet.tsx'),
      'utf8',
    ).replace(/\/\*[\s\S]*?\*\//g, '');

    // The block's own margin is read once the inline ones are cleared…
    expect(source).toMatch(/getComputedStyle\(block\)\.marginTop/);
    // …and the push that gets written is that margin plus the plan's offset.
    expect(source).toMatch(/\(own\[index\] \?\? 0\) \+ offset/);
    // Never the offset on its own, which is what threw the margin away.
    expect(source).not.toMatch(/marginTop = `\$\{offset\}px`/);
  });

  it('opts out of the browser holding the document still', () => {
    /*
     * Scroll anchoring compensates for content that changes size above the
     * reader. Every measuring pass here CLEARS each block's `margin-top` and
     * writes it back — `measure` has to read a natural layout before it can
     * plan the breaks — and the browser reads that as the document collapsing
     * and re-expanding, then compensates for both halves without them
     * cancelling.
     *
     * The paginator is what holds this document still; the browser must not
     * also try.
     */
    const rule = css.slice(css.indexOf('.tpl-pages {'));
    expect(rule.slice(0, rule.indexOf('}'))).toMatch(/overflow-anchor:\s*none/);
  });
});
