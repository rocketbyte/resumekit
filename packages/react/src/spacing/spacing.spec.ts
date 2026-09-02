import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * The GEOMETRY of a structural gap, asserted against the stylesheet.
 *
 * jsdom computes no layout, so there is no rendered box to measure here and no
 * honest way to write these as behaviour. They are asserted as the rules that
 * produce the behaviour instead — which is the same bargain `nodes.spec.tsx`
 * makes for the skills row, and worth making for the same reason: each of these
 * was a bug somebody saw before it was a line of CSS.
 */

const HERE = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(join(HERE, 'spacing.css'), 'utf8');

/** The body of one rule, so an assertion cannot match a neighbour's property. */
function rule(selector: string): string {
  const at = css.indexOf(`${selector} {`);
  expect(at, `${selector} exists`).toBeGreaterThan(-1);
  return css.slice(at, css.indexOf('}', at));
}

describe('a gap is space ABOVE a block, not space around a line', () => {
  it('anchors the strip so its bottom edge is the top of the block', () => {
    /*
     * The bug this replaced: with the strip centred on the gap, dragging down
     * opened space above the line AND below it, so the block floated somewhere
     * under the line the candidate was moving instead of sitting against it.
     *
     * `100% - height` is where the wrapper's padding ends and the block begins.
     */
    expect(rule('.tpl-space')).toMatch(
      /bottom:\s*calc\(\s*100%\s*-\s*var\(--tpl-space-height/,
    );
    // And never the other anchoring, which is what centring needs.
    expect(rule('.tpl-space')).not.toMatch(/\btop:\s/);
  });

  it('draws the line, the knob and the readout on that bottom edge', () => {
    // All three mark the same boundary, so all three sit on it.
    for (const selector of [
      '.tpl-space__line',
      '.tpl-space__knob',
      '.tpl-space__readout',
    ]) {
      expect(rule(selector), `${selector} sits on the boundary`).toMatch(
        /bottom:\s*0/,
      );
      expect(rule(selector), `${selector} is not centred`).not.toMatch(
        /top:\s*50%/,
      );
    }
  });

  it('keeps the space on the wrapper and off the block', () => {
    /*
     * Space above a thing is not the thing getting bigger. Padding on the block
     * grew its box and took its selection outline with it, and made the gap
     * part of the entry rather than part of the document between two entries.
     */
    expect(rule('.tpl-gap')).toMatch(/padding-top:\s*var\(--tpl-space-height/);
    // The same length drives the padding and the strip, so they cannot disagree.
    expect(rule('.tpl-gap')).toMatch(/--tpl-space-height:\s*calc\(/);
  });

  it('leaves the control off the printed page and the space on it', () => {
    // The split the whole design rests on.
    expect(css).toMatch(/@media print \{\s*\.tpl-space \{\s*display: none/);
    expect(rule('.tpl-gap')).not.toMatch(/@media print/);
  });
});
