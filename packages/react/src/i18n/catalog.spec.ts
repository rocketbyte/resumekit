import { describe, expect, it } from 'vitest';
import {
  COLLECTIONS,
  DATE_ISSUE_MESSAGE,
  LANGUAGE_LEVELS,
  PLACEHOLDERS,
} from '@cvgs/core';
import en from './locales/en.json';
import es from './locales/es.json';
import {
  TEMPLATE_CATALOGS,
  matchLocale,
  resolveCatalog,
  type PartialCatalog,
} from './catalog.js';
import { format, list, plural } from './format.js';

type Tree = { [key: string]: string | Tree };

/** Every message as `path → text`, so two catalogs compare key by key. */
function flatten(tree: Tree, prefix = ''): Map<string, string> {
  const out = new Map<string, string>();
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') out.set(path, value);
    else for (const [k, v] of flatten(value, path)) out.set(k, v);
  }
  return out;
}

const placeholders = (message: string) =>
  new Set([...message.matchAll(/\{(\w+)\}/g)].map((m) => m[1]));

const english = flatten(en as Tree);

const NOUN_SENTENCES = ['editor.entry.', 'editor.library.', 'editor.refusal.'];
const NOUN_FORMS = ['one', 'other', 'title', 'a', 'this'];

describe.each(Object.entries(TEMPLATE_CATALOGS))('the %s catalog', (_, raw) => {
  const messages = flatten(raw as Tree);

  it('has every message the English one has, and no other', () => {
    expect([...messages.keys()].sort()).toEqual([...english.keys()].sort());
  });

  it('has no empty message', () => {
    const empty = [...messages].filter(([, text]) => !text.trim());
    expect(empty).toEqual([]);
  });

  it('uses only the placeholders its English message is given', () => {
    for (const [key, text] of messages) {
      const allowed = placeholders(english.get(key) ?? '');
      // A sentence given a noun is given all its forms, and may place any one.
      if (NOUN_SENTENCES.some((group) => key.startsWith(group)))
        for (const form of NOUN_FORMS) allowed.add(form);
      for (const used of placeholders(text))
        expect(allowed, key).toContain(used);
    }
  });
});

/*
 * Core keeps its English — the pipeline and the tests read it — and the
 * catalog mirrors it by key. When core's words change, this fails until the
 * catalog follows, so the editor never shows a stale English.
 */
describe('core-owned text', () => {
  it('guides every field with core’s own words', () => {
    expect(en.editor.placeholders).toEqual(PLACEHOLDERS);
  });

  it('warns about dates in core’s own words', () => {
    expect(en.editor.dateIssues).toEqual(DATE_ISSUE_MESSAGE);
  });

  it('names every collection’s section as core does', () => {
    expect(en.editor.sections).toEqual(
      Object.fromEntries(
        Object.entries(COLLECTIONS).map(([id, def]) => [id, def.label]),
      ),
    );
  });

  it('gives every noun core names its forms', () => {
    for (const { noun } of Object.values(COLLECTIONS)) {
      expect(Object.keys(en.editor.nouns), noun).toContain(noun);
      expect(
        (en.editor.nouns as Record<string, { one: string }>)[noun]?.one,
      ).toBe(noun);
    }
  });

  it('names every language level', () => {
    expect(Object.keys(en.document.levels).sort()).toEqual(
      [...LANGUAGE_LEVELS].sort(),
    );
  });
});

describe('resolving a catalog', () => {
  it('fills what a partial catalog lacks from English', () => {
    const fr: PartialCatalog = { editor: { zoom: { in: 'Zoomer' } } };
    const catalog = resolveCatalog(fr);
    expect(catalog.editor.zoom.in).toBe('Zoomer');
    expect(catalog.editor.zoom.out).toBe('Zoom out');
    expect(catalog.document.sections.experience).toBe('Experience');
  });

  it('serves a regional tag with its language, and anything else in English', () => {
    expect(matchLocale('es-MX', TEMPLATE_CATALOGS)).toBe('es');
    expect(matchLocale('fr', TEMPLATE_CATALOGS)).toBe('en');
    expect(matchLocale(undefined, TEMPLATE_CATALOGS)).toBe('en');
  });
});

describe('formatting', () => {
  it('places parameters and leaves an unknown one visible', () => {
    expect(format('Move {this} up', { this: 'this role' })).toBe(
      'Move this role up',
    );
    expect(format('Hi {name}')).toBe('Hi {name}');
  });

  it('chooses the plural the language uses', () => {
    const forms = { one: '{count} punto', other: '{count} puntos' };
    expect(plural(forms, 1, 'es')).toBe('1 punto');
    expect(plural(forms, 3, 'es')).toBe('3 puntos');
  });

  it('places a noun with its own article', () => {
    const { entry, nouns } = es.editor;
    expect(format(entry.moveUp, nouns.bullet)).toBe('Subir este punto');
    expect(format(entry.moveUp, nouns.skill)).toBe('Subir esta habilidad');
  });

  it('joins a list in the language’s own words', () => {
    expect(list(['3 puntos', '1 puesto'], 'es')).toBe('3 puntos y 1 puesto');
    expect(list(['3 bullets', '1 role'], 'en')).toBe('3 bullets and 1 role');
  });
});
