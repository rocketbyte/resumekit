import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..');
const LAYOUT = join(SRC, 'kit/layout.css');

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return files(path);
    return /\.(tsx?|css)$/.test(name) ? [path] : [];
  });
}

/*
 * `layout.css` applies to the whole document, so an attribute it selects on
 * must mean nothing else: the compiler's layout nodes emit it, and no other
 * source may. (`data-gap` once collided with the editor's spacing marker and
 * turned every entry into a column.)
 */
describe('the layout stylesheet', () => {
  it('selects only attributes nothing else in the library uses', () => {
    const attributes = [
      ...new Set(
        [...readFileSync(LAYOUT, 'utf8').matchAll(/\[(data-[\w-]+)/g)].map(
          (m) => m[1] as string,
        ),
      ),
    ];
    expect(attributes.every((a) => a.startsWith('data-layout'))).toBe(true);
    const users = files(SRC)
      .filter(
        (f) =>
          f !== LAYOUT &&
          !f.includes('/compiler/') &&
          !f.endsWith('.spec.ts') &&
          !f.endsWith('.spec.tsx') &&
          !/\/templates\/[^/]+\/(\w+Document|entries)\.tsx$/.test(f),
      )
      .filter((f) =>
        attributes.some((a) => readFileSync(f, 'utf8').includes(a)),
      )
      .map((f) => relative(SRC, f));
    expect(users).toEqual([]);
  });
});
