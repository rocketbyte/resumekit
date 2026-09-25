import en from './locales/en.json';
import es from './locales/es.json';

/**
 * Everything the library says, in one language.
 *
 * The English catalog IS the shape: a message the code reads that English does
 * not define is a type error, and a translation is a JSON file with the same
 * keys. `editor` is what the person editing reads; `document` is what the
 * résumé prints, and follows the document's own language.
 */
export type TemplateCatalog = typeof en;
export type EditorMessages = TemplateCatalog['editor'];
export type DocumentMessages = TemplateCatalog['document'];

/** The forms a noun takes, so a sentence can place it without English grammar. */
export type NounForms = EditorMessages['nouns']['role'];

/** A plural message: one string per CLDR category the language uses. */
export type PluralForms = Partial<Record<Intl.LDMLPluralRule, string>> & {
  other: string;
};

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends string ? string : DeepPartial<T[K]>;
};

/**
 * A catalog as a consumer may supply it: any subset of the English keys. Each
 * message it lacks is English, so a translation can ship before it is finished
 * and a new message never renders blank.
 */
export type PartialCatalog = DeepPartial<TemplateCatalog>;

/** The catalogs the library ships. English is also the fallback for every other. */
export const TEMPLATE_CATALOGS: Readonly<Record<string, PartialCatalog>> = {
  en,
  es,
};

export const BASE_LOCALE = 'en';

type Tree = { [key: string]: string | Tree };

function merge(base: Tree, over: Tree | undefined): Tree {
  if (!over) return base;
  const out: Tree = { ...base };
  for (const [key, value] of Object.entries(over)) {
    const current = base[key];
    if (typeof value === 'string') out[key] = value;
    else if (value && typeof value === 'object')
      out[key] = merge(typeof current === 'object' ? current : {}, value);
  }
  return out;
}

const resolved = new WeakMap<PartialCatalog, TemplateCatalog>();

/** A catalog with every message it lacks filled from English. Memoised per catalog. */
export function resolveCatalog(partial: PartialCatalog): TemplateCatalog {
  let catalog = resolved.get(partial);
  if (!catalog) {
    catalog = merge(en as Tree, partial as Tree) as TemplateCatalog;
    resolved.set(partial, catalog);
  }
  return catalog;
}

/**
 * The code among `available` that serves `requested`: the exact tag, else its
 * language (`es-MX` → `es`), else English.
 */
export function matchLocale(
  requested: string | undefined,
  available: Readonly<Record<string, unknown>>,
): string {
  if (!requested) return BASE_LOCALE;
  if (requested in available) return requested;
  const language = requested.split('-')[0] ?? '';
  return language in available ? language : BASE_LOCALE;
}
