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
/* The control lives in the container's rail (builder-element-rail). */
const railCss = readFileSync(join(HERE, '..', 'rail', 'rail.css'), 'utf8');

/**
 * The body of one rule, with its comments stripped.
 *
 * Comments go because these assertions are about DECLARATIONS: this file
 * explains at length why it does not use padding, and a naive search would
 * find the word and call it a padding.
 */
function rule(selector: string, sheet = css): string {
  const at = sheet.indexOf(`${selector} {`);
  expect(at, `${selector} exists`).toBeGreaterThan(-1);
  return sheet
    .slice(at, sheet.indexOf('}', at))
    .replace(/\/\*[\s\S]*?\*\//g, '');
}

describe('a gap is space ABOVE a block, not space around a line', () => {
  it('shows the gap entirely above the block it belongs to', () => {
    /*
     * The bug this guards: a highlight centred on the boundary opened space
     * above the line AND below it, so the block floated under the line the
     * candidate was moving. `bottom: 100%` puts it wholly in the margin above.
     */
    expect(rule('.tpl-rail-gap', railCss)).toMatch(/bottom:\s*100%/);
    expect(rule('.tpl-rail-gap', railCss)).not.toMatch(/(?:^|[\s;{])top:\s/m);
  });

  it('centres the rail on the container it acts on', () => {
    // Beside the sheet, on the container's vertical middle.
    const rail = rule('.tpl-rail', railCss);
    expect(rail).toMatch(/top:\s*50%/);
    expect(rail).toMatch(/transform:\s*translateY\(-50%\)/);
    // Outside the page's left edge unless its column moves it to the right.
    expect(rail).toMatch(/right:\s*var\(\s*--tpl-rail-right,\s*calc\(100%/);
    expect(rail).toMatch(/left:\s*var\(--tpl-rail-left,\s*auto\)/);
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
    // The control and the gap it shows occupy no layout.
    expect(rule('.tpl-rail', railCss)).toMatch(/position:\s*absolute/);
    expect(rule('.tpl-rail-gap', railCss)).toMatch(/position:\s*absolute/);
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
    // The split the whole design rests on: the rail and the gap it shows are
    // chrome, and the margin that holds the space is not.
    expect(railCss).toMatch(
      /@media print \{\s*\.tpl-rail,\s*\.tpl-rail-gap \{\s*display: none/,
    );
    expect(css).not.toMatch(/@media print[\s\S]*\[data-spaced\]/);
  });
});

describe('a gap belongs to the element that recorded it', () => {
  /**
   * The `@property` block, with its comments stripped — same bargain as
   * `rule()` above, and needed because this file explains inheritance at
   * length before it turns it off.
   */
  const registration = () => {
    const at = css.indexOf('@property --tpl-space-height');
    expect(at, '--tpl-space-height is registered').toBeGreaterThan(-1);
    return css.slice(at, css.indexOf('}', at)).replace(/\/\*[\s\S]*?\*\//g, '');
  };

  it('does not hand the recorded gap down to what is inside it', () => {
    /*
     * The bug this exists to stop, which shipped: a custom property inherits,
     * and `.tpl-harvard__section` and `.tpl-harvard__entry` BOTH add
     * `var(--tpl-space-height)` into their own `margin-top`. So a section
     * carrying a gap handed the same figure to every entry inside it and each
     * one added it again — spacing Experience away from what was above it also
     * pushed its roles apart from each other, by exactly the same amount.
     *
     * Not testable as behaviour here: jsdom computes no cascade for a
     * registered property and no layout to measure the difference in. The rule
     * that produces the behaviour is what there is to assert.
     */
    expect(registration()).toMatch(/inherits:\s*false/);
  });

  it('starts every element at no gap rather than at nothing', () => {
    /*
     * `inherits: false` alone would leave an undeclared element with the
     * guaranteed-invalid value, and `calc()` around that poisons the whole
     * margin rather than contributing zero to it. The initial value is what
     * makes an element with no gap lay out exactly as it did before spacing
     * existed.
     */
    expect(registration()).toMatch(/initial-value:\s*0px/);
    expect(registration()).toMatch(/syntax:\s*'<length>'/);
  });

  it('is the one place the figure is turned into a length', () => {
    // Consumers add `var(--tpl-space-height)` and never rebuild it from steps;
    // a second calc somewhere else would inherit the bug back in.
    expect(rule('[data-spaced]')).toMatch(/--tpl-space-height:/);
    const consumers = css.match(/--tpl-space-steps/g) ?? [];
    expect(
      consumers.length,
      'steps are read once, where the length is made',
    ).toBe(1);
  });
});
