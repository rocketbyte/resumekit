import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { TEMPLATES, type TemplateId } from '@cvgs/core';
import { REGISTERED_NODES, TEMPLATE_RENDERERS } from '../registry.js';
import { BOUNDED_NODE_PROPS, FORBIDDEN_NODE_PROPS } from './locked.js';

/**
 * The lock.
 *
 * Craft.js is a page-builder library used here to forbid page building, so the
 * guarantee that the design cannot be altered has to be asserted, not assumed.
 * These tests walk the registry rather than naming components, so a node added
 * later cannot quietly skip them.
 */

interface CraftConfig {
  rules?: Record<string, () => boolean>;
}

// Vitest serves modules from the project root, so `import.meta.url` is not a
// filesystem path here — resolve from the project's own root instead. That root
// is this library now, so the document lives at `src/` rather than inside an
// app's feature folder.
const FEATURE_DIR = join(process.cwd(), 'src');
const NODE_DIR = join(FEATURE_DIR, 'nodes');
const TEMPLATE_DIR = join(FEATURE_DIR, 'templates');

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return entry.name.endsWith('.tsx') && !entry.name.includes('.spec.')
      ? [path]
      : [];
  });
}

const templateSources = [
  ...sourceFiles(NODE_DIR),
  ...sourceFiles(TEMPLATE_DIR),
];

describe('the registry and the catalog agree', () => {
  it('renders exactly the templates the catalog offers', () => {
    expect(Object.keys(TEMPLATE_RENDERERS).sort()).toEqual(
      (Object.keys(TEMPLATES) as TemplateId[]).sort(),
    );
  });

  it('gives every template a document and a resolver that can build it', () => {
    for (const [id, renderer] of Object.entries(TEMPLATE_RENDERERS)) {
      expect(renderer.Document, id).toBeTypeOf('function');
      expect(Object.values(renderer.resolver)).toContain(renderer.Document);
    }
  });
});

describe('every registered node refuses movement', () => {
  it.each(REGISTERED_NODES)(
    '%s declares all four rules false',
    (name, node) => {
      const config = (node as unknown as { craft?: CraftConfig }).craft;
      expect(config?.rules, `${name} declares no craft rules`).toBeDefined();

      const rules = config?.rules ?? {};
      for (const rule of ['canDrag', 'canDrop', 'canMoveIn', 'canMoveOut']) {
        expect(rules[rule], `${name}.${rule}`).toBeTypeOf('function');
        expect(rules[rule]?.(), `${name}.${rule}`).toBe(false);
      }
    },
  );
});

describe('the design is not addressable', () => {
  it('exposes no ARBITRARY presentational prop on any node', () => {
    /*
     * A node's prop surface is easy to widen and hard to notice widening, so
     * this reads the declared prop interfaces rather than trusting types.
     *
     * Bounded formatting (`bold`, `align`, `ink`) is allowed — see `locked.ts`.
     * What is forbidden is anything through which a caller could express
     * arbitrary presentation.
     */
    for (const path of templateSources) {
      const source = readFileSync(path, 'utf8');
      const interfaces =
        source.match(/interface \w+Props \{[\s\S]*?\n\}/g) ?? [];
      for (const block of interfaces) {
        for (const forbidden of FORBIDDEN_NODE_PROPS) {
          const match = block.match(
            new RegExp(`^\\s*${forbidden}\\??:\\s*(.+?);`, 'm'),
          );
          if (!match) continue;

          /*
           * `style?: DocumentStyle` is the document's own catalog-bounded style
           * — a typeface id, an ink id and a scale — not a CSS style object. It
           * is the one way presentation legitimately enters: once, at the
           * template root, with every value vetted by the domain. A `style`
           * typed as anything else would be arbitrary, and still fails here.
           */
          expect(
            match[1].trim(),
            `${path} declares "${forbidden}" as something unbounded`,
          ).toBe('DocumentStyle');
        }
      }
    }
  });

  it('types every formatting prop to the catalog, never to a raw string', () => {
    // `FieldFormatting` is the single declaration the three nodes extend, so
    // this is where a free-string `align` or `ink` would have to appear.
    const source = readFileSync(join(NODE_DIR, 'formatting.ts'), 'utf8');
    for (const [prop, type] of Object.entries(BOUNDED_NODE_PROPS)) {
      expect(source, `${prop} is not bounded`).toMatch(
        new RegExp(`${prop}\\?:\\s*${type}\\b`),
      );
    }
    expect(source).not.toMatch(/(align|ink)\?:\s*string/);
  });

  it('declares no canvas, so there is no drop target anywhere', () => {
    for (const path of templateSources) {
      const source = readFileSync(path, 'utf8');
      expect(source, `${path} declares a canvas`).not.toMatch(
        /<Element[^>]*\scanvas\b/,
      );
      expect(source, `${path} declares canvas in craft config`).not.toMatch(
        /isCanvas\s*:\s*true/,
      );
    }
  });

  it('never connects a drag handle', () => {
    for (const path of templateSources) {
      const source = readFileSync(path, 'utf8');
      expect(source, `${path} connects a drag handle`).not.toMatch(
        /connectors[\s\S]{0,40}\bdrag\b/,
      );
    }
  });

  it('offers no control that adds or removes a section', () => {
    // Structural edits are claims about the candidate's history, which this
    // product grounds through the interview rather than through free typing.
    for (const path of templateSources) {
      const source = readFileSync(path, 'utf8');
      expect(source).not.toMatch(
        /experience\.push|education\.push|skills\.push/,
      );
      expect(source).not.toMatch(
        /Add (a )?(job|role|school|section|skill group)/i,
      );
    }
  });
});

/**
 * Structural authoring did not reopen the design surface.
 *
 * `editor-structural-authoring` adds three ways to put content in the document
 * and no way to lay it out. These assert the second half — the part that would
 * be easy to lose while adding the first.
 */
describe('an editable field is the size of its own text', () => {
  /*
   * The defect this guards: clicking a phone number, a date or an email handed
   * the field the ENTIRE row. A single-line field was a bare `<input>` carrying
   * `width: 100%`, and a percentage width on an inline-level box resolves
   * against the nearest BLOCK ancestor — so the tint band ran the width of the
   * page and everything sharing the line with it was pushed onto a line of its
   * own. The document rearranged itself around the field you were reading.
   *
   * Asserted on the source, because the property is a LAYOUT one and jsdom
   * computes no layout. What can be checked here is that the two things the fix
   * rests on are still true, and both are one edit away from being undone.
   */
  const css = readFileSync(join(NODE_DIR, 'template-node.css'), 'utf8');
  const field = readFileSync(join(NODE_DIR, 'EditableText.tsx'), 'utf8');
  /* The comments here discuss the element that was removed, by name. */
  const code = field.replace(/\/\*[\s\S]*?\*\//g, '');

  it('sizes a line to its content rather than to its row', () => {
    const rule = css.slice(css.indexOf('.tpl-grow--inline {'));
    const body = rule.slice(0, rule.indexOf('}'));
    // Shrink-to-fit, and never past the column it sits in.
    expect(body).toMatch(/display:\s*inline-grid/);
    expect(body).toMatch(/max-width:\s*100%/);
  });

  it('gives every field the mirror that measures it', () => {
    // The wrapper carries the mirror class and the string to measure; without
    // `data-value` the mirror is empty and the box collapses.
    expect(code).toMatch(/tpl-grow--inline/);
    expect(code).toMatch(/data-value=/);
  });

  it('lets no widget have an opinion about its own width', () => {
    /*
     * A textarea's intrinsic width is twenty characters, and in an inline grid
     * THAT sizes the column — `width: 100%` counts for nothing while a track is
     * being measured. `cols={1}` is what leaves the mirror in charge.
     */
    expect(code).toMatch(/cols=\{1\}/);
  });

  it('uses one widget for every field, so wrapping text can be edited', () => {
    /*
     * An `<input>` cannot wrap. Three templates put a link's URL into a 153pt
     * rail where the static text runs to three lines, and an input collapsed it
     * to the one line it can show — the same box, edited or not, is the rule
     * this whole file exists for. A line stays a line by REFUSING Enter, not by
     * being given a widget that cannot hold two.
     */
    expect(code).not.toMatch(/<input/);
    expect(code).toMatch(/e\.key === 'Enter'/);
  });
});

describe('authored content is as locked as written content', () => {
  it('adds no canvas and no drag handle anywhere', () => {
    const source = readFileSync(join(NODE_DIR, 'CustomSections.tsx'), 'utf8');
    expect(source).not.toMatch(/<Element[^>]*\scanvas\b/);
    expect(source).not.toMatch(/isCanvas\s*:\s*true/);
    expect(source).not.toMatch(/connectors\s*:\s*\{[^}]*\bdrag\b/);
    expect(source).not.toMatch(/\bdrag\s*\(/);
  });

  it('gives an authored NODE no presentational property', () => {
    const source = readFileSync(join(NODE_DIR, 'CustomSections.tsx'), 'utf8');
    /*
     * Scoped to `<Element …>` — the props that reach a Craft node — not to the
     * whole file. The plain host elements around them carry `className` like
     * every template document does; that is the template's own markup, and it
     * is not a surface a candidate can express anything through.
     */
    const elements = source.match(/<Element[\s\S]*?\/>/g) ?? [];
    expect(elements.length).toBeGreaterThan(0);
    for (const element of elements) {
      for (const banned of FORBIDDEN_NODE_PROPS) {
        expect(element, `${banned} reached an authored node`).not.toMatch(
          new RegExp(`\\s${banned}=`),
        );
      }
    }
  });

  it('renders authored fields through the same locked nodes', () => {
    /*
     * The heading is still drawn by `CustomSections`; the ENTRIES moved into
     * each template's own entry component when `document-collections` (#57)
     * ended the shared neutral layout. So the assertion follows them: whichever
     * template draws a candidate's section, it draws it through the same
     * editable nodes the writer's fields use, which is what puts it under the
     * lock assertions above without naming it again.
     */
    expect(readFileSync(join(NODE_DIR, 'CustomSections.tsx'), 'utf8')).toMatch(
      /is=\{EditableText\}/,
    );

    const TEMPLATES = join(NODE_DIR, '..', 'templates');
    for (const template of readdirSync(TEMPLATES, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)) {
      const source = readFileSync(
        join(TEMPLATES, template, 'entries.tsx'),
        'utf8',
      );
      expect(source, `${template} draws a custom entry`).toMatch(
        /CustomEntry\(/,
      );
      expect(source, `${template} uses the shared nodes`).toMatch(
        /is=\{EditableText\}/,
      );
      expect(source, `${template} uses the shared bullet list`).toMatch(
        /is=\{EditableBulletList\}/,
      );
    }
  });

  it('gives a template no way to change a collection', () => {
    /*
     * The boundary the whole layer rests on. A template supplies markup; the
     * verbs live in `collections/` and are handed to nobody. Asserted rather
     * than left to discipline, because it erodes the first time somebody needs
     * a button "just here".
     */
    const TEMPLATES = join(NODE_DIR, '..', 'templates');
    for (const template of readdirSync(TEMPLATES, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)) {
      const dir = join(TEMPLATES, template);
      for (const file of readdirSync(dir).filter((f) => f.endsWith('.tsx'))) {
        if (file.endsWith('.spec.tsx')) continue;
        const source = readFileSync(join(dir, file), 'utf8');
        for (const verb of [
          'useCollection',
          'useSectionCollection',
          'useCustomEntries',
        ]) {
          expect(source, `${template}/${file} reached a mutator`).not.toContain(
            verb,
          );
        }
      }
    }
  });
});
