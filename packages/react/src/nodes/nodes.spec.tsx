import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { TEMPLATES, type TemplateId } from '@cvgs/core';
import { REGISTERED_NODES, TEMPLATE_RENDERERS } from '../registry.js';
import { FORBIDDEN_NODE_PROPS } from './locked.js';

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
  it('exposes no presentational prop on any node', () => {
    /*
     * A node's prop surface is easy to widen and hard to notice widening, so
     * this reads the declared prop interfaces rather than trusting types.
     */
    for (const path of templateSources) {
      const source = readFileSync(path, 'utf8');
      const interfaces =
        source.match(/interface \w+Props \{[\s\S]*?\n\}/g) ?? [];
      for (const block of interfaces) {
        for (const forbidden of FORBIDDEN_NODE_PROPS) {
          expect(block, `${path} declares a "${forbidden}" prop`).not.toMatch(
            new RegExp(`^\\s*${forbidden}\\??:`, 'm'),
          );
        }
      }
    }
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
