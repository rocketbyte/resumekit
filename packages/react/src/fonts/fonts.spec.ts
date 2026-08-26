import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DOCUMENT_FONTS } from '@cvgs/core';
import { describe, expect, it } from 'vitest';

/**
 * The catalog promises a supplied face for every typeface it offers. This is
 * where that promise is kept or broken: a seventh entry added to
 * `DOCUMENT_FONTS` without font files here fails this suite rather than
 * shipping a document drawn in whatever the reader happens to have installed.
 */
const here = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(join(here, 'fonts.css'), 'utf8');

/** Every `@font-face` block in `fonts.css`, parsed into what it declares. */
const faces = [...css.matchAll(/@font-face\s*\{([^}]*)\}/g)].map(
  ([, body]) => ({
    family: /font-family:\s*'([^']+)'/.exec(body)?.[1] ?? '',
    style: /font-style:\s*(\w+)/.exec(body)?.[1] ?? '',
    weight: /font-weight:\s*(\d+)/.exec(body)?.[1] ?? '',
    display: /font-display:\s*(\w+)/.exec(body)?.[1] ?? '',
    file: /url\('\.\/([^']+)'\)/.exec(body)?.[1] ?? '',
  }),
);

const fontIds = Object.keys(DOCUMENT_FONTS) as (keyof typeof DOCUMENT_FONTS)[];

/** The four styles the templates set: regular and bold, upright and italic. */
const REQUIRED = [
  { weight: '400', style: 'normal' },
  { weight: '400', style: 'italic' },
  { weight: '700', style: 'normal' },
  { weight: '700', style: 'italic' },
];

describe('the supplied typefaces', () => {
  it.each(fontIds)('%s is supplied as files this library ships', (id) => {
    const { supplied } = DOCUMENT_FONTS[id];
    const declared = faces.filter((f) => f.family === supplied);

    for (const { weight, style } of REQUIRED) {
      const face = declared.find(
        (f) => f.weight === weight && f.style === style,
      );
      expect(
        face,
        `${supplied} ${weight} ${style} is not declared`,
      ).toBeDefined();
      expect(face?.file).not.toBe('');
      expect(
        existsSync(join(here, face?.file ?? '')),
        `${face?.file} is declared but not shipped`,
      ).toBe(true);
    }
  });

  it.each(fontIds)('%s ships its licence beside the files', (id) => {
    const { supplied } = DOCUMENT_FONTS[id];
    const stem = faces.find((f) => f.family === supplied)?.file.split('-')[0];
    const licences = join(here, 'licenses');
    const found = [`${stem}-OFL.txt`, `${stem}-GUST-FONT-LICENSE.txt`].some(
      (n) => existsSync(join(licences, n)),
    );
    expect(found, `no licence recorded for ${supplied}`).toBe(true);
  });

  it('declares nothing it does not ship, and ships nothing it does not declare', () => {
    const suppliedFamilies = new Set(
      fontIds.map((id) => DOCUMENT_FONTS[id].supplied),
    );
    const declaredFamilies = new Set(faces.map((f) => f.family));
    expect([...declaredFamilies].sort()).toEqual([...suppliedFamilies].sort());
    expect(faces).toHaveLength(fontIds.length * REQUIRED.length);
  });

  it('lets every face swap in, so a slow font never blanks the document', () => {
    // `swap` over the default `auto`: the résumé is readable in the fallback
    // while the file arrives, and the supplied face replaces it. A blocking
    // period would leave the page empty on a slow connection.
    for (const face of faces) expect(face.display).toBe('swap');
  });

  it('is reached by anything that mounts the document', () => {
    const document = readFileSync(join(here, '..', 'document.css'), 'utf8');
    expect(document).toMatch(/@import\s+'\.\/fonts\/fonts\.css';/);
  });
});
