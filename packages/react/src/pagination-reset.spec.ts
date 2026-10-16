import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * Every property a pagination pass WRITES, the next pass CLEARS.
 *
 * The bug this exists to stop shipped in exported PDFs. Printing writes
 * `break-before` and `padding-top` as well as `margin-top`, and only the margin
 * was reset — so the second pass measured a document still carrying the first
 * pass's page breaks. Under `emulatedMediaType: print` the renderer's layout is
 * genuinely fragmented, so those breaks move the rects the plan is built from:
 * it read a heading already at the top of page two, decided what followed no
 * longer fitted, and broke again. Every pass added one break, and several run.
 *
 * A résumé the editor drew on two pages exported on three, EDUCATION alone at
 * the top of page two and its entries stranded on page three.
 *
 * Asserted against the SOURCE rather than as behaviour, and not for want of
 * trying: jsdom computes no layout, so every rect is zero, the plan pushes
 * nothing, and a rendered test cannot reach the branch at all. The renderer
 * that can is a headless Chromium behind a network call. What is checkable
 * here is the invariant that was actually broken — a property written and not
 * cleared — and it is the one a fourth property would break again.
 */
const HERE = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(HERE, 'PagedSheet.tsx'), 'utf8').replace(
  /\/\*[\s\S]*?\*\/|\/\/.*$/gm,
  '',
);

/** Inline style properties the component assigns a value to. */
const written = new Set(
  [...source.matchAll(/\.style\.(\w+)\s*=\s*(?!'';)/g)].map(([, prop]) => prop),
);

/** Inline style properties it clears back to the stylesheet's value. */
const cleared = new Set(
  [...source.matchAll(/\.style\.(\w+)\s*=\s*'';/g)].map(([, prop]) => prop),
);

describe('a pagination pass measures a document it has not already moved', () => {
  it('writes the properties printing needs', () => {
    // A guard on the guard: if these stop being written the test below passes
    // vacuously, and the invariant would be unprotected rather than satisfied.
    expect(written).toContain('marginTop');
    expect(written).toContain('breakBefore');
    expect(written).toContain('paddingTop');
  });

  it('clears every one of them before measuring again', () => {
    const unreset = [...written].filter((prop) => !cleared.has(prop));
    expect(
      unreset,
      'these are written by a pagination pass and never cleared, so the next ' +
        'pass measures a layout this component already moved:\n  ' +
        unreset.join('\n  '),
    ).toEqual([]);
  });
});
