import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DOCUMENT_FONTS } from '@resumekit/schema';
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

/**
 * Faces a TEMPLATE sets, which the catalog does not offer.
 *
 * A design whose identity is its typeface — Computer Modern, Raleway — is drawn
 * in that face, but it is not a typeface the candidate picks, so it is no entry
 * in `DOCUMENT_FONTS`. Each ships only the styles its templates set, rather
 * than the catalog's four; `README.md` says which template sets which.
 *
 * `Lato` is also a catalog entry: what is listed here is only what it ships
 * beyond the catalog's four.
 */
const TEMPLATE_FACES: Record<
  string,
  { licence: string; styles: readonly string[] }
> = {
  'Latin Modern Roman': {
    licence: 'latinmodern-GUST-FONT-LICENSE.txt',
    styles: ['400 normal', '400 italic', '700 normal', '700 italic'],
  },
  'Latin Modern Roman Caps': {
    licence: 'latinmodern-GUST-FONT-LICENSE.txt',
    styles: ['400 normal'],
  },
  'Latin Modern Mono': {
    licence: 'latinmodern-GUST-FONT-LICENSE.txt',
    styles: ['400 normal'],
  },
  'Source Sans 3': {
    licence: 'sourcesans3-OFL.txt',
    styles: [
      '300 normal',
      '300 italic',
      '400 normal',
      '400 italic',
      '700 normal',
    ],
  },
  Roboto: {
    licence: 'roboto-OFL.txt',
    styles: [
      '100 normal',
      '300 normal',
      '300 italic',
      '400 normal',
      '400 italic',
      '700 normal',
    ],
  },
  Raleway: {
    licence: 'raleway-OFL.txt',
    styles: [
      '300 normal',
      '400 normal',
      '400 italic',
      '500 normal',
      '700 normal',
    ],
  },
  Lato: {
    licence: 'lato-OFL.txt',
    styles: ['100 normal', '300 normal', '300 italic'],
  },
  'Roboto Slab': {
    licence: 'robotoslab-APACHE-2.0.txt',
    styles: ['700 normal'],
  },
  'Clear Sans': {
    licence: 'clearsans-APACHE-2.0.txt',
    styles: ['400 normal', '400 italic'],
  },
  Cabin: { licence: 'cabin-OFL.txt', styles: ['700 normal'] },
  Cochineal: {
    licence: 'cochineal-OFL.txt',
    styles: ['400 normal', '400 italic', '700 normal'],
  },
  Inconsolata: { licence: 'inconsolata-OFL.txt', styles: ['400 normal'] },
};

const templateFamilies = Object.keys(TEMPLATE_FACES);
const catalogFamilies = new Set(
  Object.values(DOCUMENT_FONTS).map((f) => f.supplied as string),
);

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

  it.each(templateFamilies)(
    '%s ships exactly the styles its templates set, with its licence',
    (family) => {
      const { licence, styles } = TEMPLATE_FACES[family];
      const catalog = catalogFamilies.has(family)
        ? REQUIRED.map((r) => `${r.weight} ${r.style}`)
        : [];
      const declared = faces.filter((f) => f.family === family);
      expect(declared.map((f) => `${f.weight} ${f.style}`).sort()).toEqual(
        [...catalog, ...styles].sort(),
      );
      for (const face of declared) {
        expect(
          existsSync(join(here, face.file)),
          `${face.file} is declared but not shipped`,
        ).toBe(true);
      }
      expect(existsSync(join(here, 'licenses', licence))).toBe(true);
    },
  );

  it('declares nothing it does not ship, and ships nothing it does not declare', () => {
    const declaredFamilies = new Set(faces.map((f) => f.family));
    expect([...declaredFamilies].sort()).toEqual(
      [...new Set([...catalogFamilies, ...templateFamilies])].sort(),
    );
    const files = readdirSync(here).filter((n) => n.endsWith('.woff2'));
    expect(faces.map((f) => f.file).sort()).toEqual(files.sort());
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

/**
 * Both surfaces measure a document drawn in the SUPPLIED face, not a fallback.
 *
 * A résumé's typeface is a webfont, and until it loads the browser draws
 * something else — `TeX Gyre Heros` matches Helvetica's metrics, while a Mac's
 * `Helvetica Neue` is a different set of advances. So a paginator that measures
 * before the face arrives plans against line breaking that is about to change,
 * and the plan outlives the layout it was made from.
 *
 * That is not hypothetical. The export waited for the fonts and the screen did
 * not, and the two disagreed by one block: an education entry the exported file
 * fitted on page one with 17px to spare, which the screen pushed onto page two.
 *
 * Asserted against the source for the reason the rest of this feature's
 * invariants are: jsdom loads no fonts and lays nothing out, so there is no
 * measurable difference here to test, and the only thing that can observe one
 * is a real browser behind a network call.
 */
describe('nothing is measured before the faces are ready', () => {
  const read = (name: string) =>
    readFileSync(join(here, '..', name), 'utf8').replace(
      /\/\*[\s\S]*?\*\/|\/\/.*$/gm,
      '',
    );

  it.each([
    ['the screen', 'PagedSheet.tsx'],
    ['the export', '../../export/src/entry.tsx'],
  ])('%s waits for document.fonts.ready', (_surface, file) => {
    expect(read(file)).toMatch(/fonts\??\.ready|fonts\.ready/);
  });
});
