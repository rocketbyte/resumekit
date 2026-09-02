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

/**
 * The body of one rule, with its comments stripped.
 *
 * Comments go because these assertions are about DECLARATIONS: this file
 * explains at length why it does not use padding, and a naive search would
 * find the word and call it a padding.
 */
function rule(selector: string): string {
  const at = css.indexOf(`${selector} {`);
  expect(at, `${selector} exists`).toBeGreaterThan(-1);
  return css.slice(at, css.indexOf('}', at)).replace(/\/\*[\s\S]*?\*\//g, '');
}

describe('a gap is space ABOVE a block, not space around a line', () => {
  it('anchors the strip so its bottom edge is the top of the block', () => {
    /*
     * The bug this replaced: with the strip centred on the gap, dragging down
     * opened space above the line AND below it, so the block floated somewhere
     * under the line the candidate was moving instead of sitting against it.
     *
     * `bottom: 100%` puts the strip entirely in the margin above the element,
     * so it takes no clicks from the first line of it either.
     */
    expect(rule('.tpl-space')).toMatch(/bottom:\s*100%/);
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

  it('renders no element to hold the space', () => {
    /*
     * The fault this replaced, and the reason it is worth a test: a wrapper is
     * a real element, present in the editor and absent from the preview, so the
     * same document measured differently in the two. It also made every entry
     * an only child, which silently broke `:first-of-type` in Harvard and the
     * `+` rule in Cobalt — 4pt above every role on screen against 7pt in the
     * preview.
     *
     * So the space is a MARGIN on the résumé's own element, contributed through
     * a property its template's existing rule adds in, and the control that
     * sets it is absolutely positioned and occupies no layout.
     */
    expect(css).not.toContain('.tpl-gap');
    expect(rule('[data-spaced]')).toMatch(/--tpl-space-height:\s*calc\(/);
    // Nothing here may give the element a box of its own.
    expect(rule('[data-spaced]')).not.toMatch(
      /(^|[\s;])(padding|border|height)\s*:/,
    );
    expect(rule('.tpl-space')).toMatch(/position:\s*absolute/);
  });

  it('keeps a gap from swallowing a page break', () => {
    /*
     * The paginator pushes a block onto the next sheet by giving it a top
     * margin, and that block is very often a section's first child. A first
     * child's top margin collapses with its parent's and collapsing takes the
     * LARGER, so a section carrying a gap absorbed the push whole: dragging the
     * gap wider did nothing until it passed the push, and then everything moved
     * at once.
     */
    expect(rule('[data-spaced]')).toMatch(/display:\s*flow-root/);
  });

  it('separates hosting a control from carrying space', () => {
    /*
     * Two markers, because they are true at different times. Hosting is an
     * editor-only fact and gives the handle somewhere to hang; carrying space
     * is a fact about the DOCUMENT and so must be identically true in the
     * preview and the export. One marker meant the editor styled every gap as
     * though it were open.
     */
    expect(rule('[data-gap]')).toMatch(/position:\s*relative/);
    expect(rule('[data-gap]')).not.toMatch(/--tpl-space-height/);
  });

  it('adds the space to the template\u2019s own margin rather than replacing it', () => {
    /*
     * The rule that decides a template's natural rhythm stays the only rule
     * that decides it: a gap is that rhythm PLUS what the candidate asked for.
     * A separate rule setting `margin-top` would have been a specificity race
     * with the template, and would have thrown away the template's own spacing
     * the moment anyone opened a gap.
     */
    const harvard = readFileSync(
      join(HERE, '..', 'templates', 'harvard', 'harvard.css'),
      'utf8',
    );
    for (const selector of [
      '.tpl-harvard__section',
      '.tpl-harvard__entry',
      '.tpl-harvard__entry:first-of-type',
    ]) {
      const at = harvard.indexOf(`${selector} {`);
      expect(at, `${selector} exists`).toBeGreaterThan(-1);
      const body = harvard.slice(at, harvard.indexOf('}', at));
      expect(body, `${selector} adds the recorded space`).toMatch(
        /margin-top:\s*calc\([\s\S]*var\(--tpl-space-height, 0px\)/,
      );
    }
  });

  it('eases the gap rather than jumping it', () => {
    /*
     * A step is a fifth of the template's own rhythm — a few pixels — and a few
     * pixels arriving instantly reads as the page flinching rather than as the
     * document opening up.
     */
    expect(rule('[data-spaced]')).toMatch(/transition:\s*margin-top\s+\d+ms/);
    // And not for somebody who has asked for less motion.
    expect(css).toMatch(
      /@media \(prefers-reduced-motion: reduce\)[\s\S]*\[data-spaced\]/,
    );
  });

  it('leaves the control off the printed page and the space on it', () => {
    // The split the whole design rests on.
    expect(css).toMatch(/@media print \{\s*\.tpl-space \{\s*display: none/);
  });
});
