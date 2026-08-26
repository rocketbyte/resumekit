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
// filesystem path here — resolve from the project's own root instead.
const FEATURE_DIR = join(process.cwd(), 'src', 'features', 'template');
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
    const source = readFileSync(join(NODE_DIR, 'CustomSections.tsx'), 'utf8');
    // Not a bespoke editable: the same components the writer's fields use, so
    // the lock assertions above cover them without naming them again.
    expect(source).toMatch(/is=\{EditableText\}/);
    expect(source).toMatch(/is=\{EditableBulletList\}/);
  });
});
