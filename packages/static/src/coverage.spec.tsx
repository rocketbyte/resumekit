import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import type { TemplateId } from '@resumekit/schema';
import { TEMPLATE_RENDERERS } from '@resumekit/react';
import { renderStatic } from './render.js';
import { FIXTURES } from './fixtures.js';

const TEMPLATES = join(
  dirname(fileURLToPath(import.meta.url)),
  '../../react/src/templates',
);

/*
 * The static stylesheet keeps only rules some fixture page can match
 * (`scripts/build-static-css.ts`), so a class no fixture draws would lose its
 * rules unseen. Every class a template's source names must be drawn.
 */
describe('the fixtures the static stylesheet is pruned against', () => {
  for (const id of Object.keys(TEMPLATE_RENDERERS) as TemplateId[]) {
    it(`draw every class ${id} names`, () => {
      const source = readdirSync(join(TEMPLATES, id))
        .filter((f) => f.endsWith('.tsx') && !f.endsWith('.spec.tsx'))
        .map((f) => readFileSync(join(TEMPLATES, id, f), 'utf8'))
        .join('\n');
      const named = new Set(
        [...source.matchAll(/className="([^"]+)"/g)].flatMap((m) =>
          (m[1] ?? '').split(/\s+/),
        ),
      );
      const drawn = new Set(
        Object.values(FIXTURES).flatMap((resume) =>
          [false, true].flatMap((picture) =>
            [
              ...renderStatic(id, resume, { picture }).matchAll(
                /class="([^"]+)"/g,
              ),
            ].flatMap((m) => (m[1] ?? '').split(/\s+/)),
          ),
        ),
      );
      expect([...named].filter((c) => !drawn.has(c))).toEqual([]);
    });
  }
});
