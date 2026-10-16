import { createContext, useContext, useMemo, type ReactNode } from 'react';
import {
  TEMPLATE_CATALOGS,
  matchLocale,
  resolveCatalog,
  type DocumentMessages,
  type EditorMessages,
  type NounForms,
  type PartialCatalog,
  type PluralForms,
} from './catalog.js';
import { format, list, plural, type MessageParams } from './format.js';
import { useDocumentLanguage } from '../presentation-context.js';

interface LocaleState {
  locale: string | undefined;
  catalogs: Readonly<Record<string, PartialCatalog>>;
}

const LocaleContext = createContext<LocaleState>({
  locale: undefined,
  catalogs: TEMPLATE_CATALOGS,
});

export interface TemplateLocaleProviderProps {
  /** The editor's language: a BCP 47 code. Unknown or absent means English. */
  locale?: string;
  /**
   * More catalogs, or replacements for the bundled ones, by locale code. Each
   * may be partial; what it lacks is English.
   */
  catalogs?: Readonly<Record<string, PartialCatalog>>;
  children: ReactNode;
}

/**
 * The language the library's controls speak, and the catalogs it may use.
 *
 * Optional: without it everything is English. The DOCUMENT's language is not
 * set here — it is the presentation's `language`, because the export renderer
 * has the stored presentation and nothing else, and paper must match screen.
 */
export function TemplateLocaleProvider({
  locale,
  catalogs,
  children,
}: TemplateLocaleProviderProps) {
  const value = useMemo(
    () => ({
      locale,
      catalogs: catalogs
        ? { ...TEMPLATE_CATALOGS, ...catalogs }
        : TEMPLATE_CATALOGS,
    }),
    [locale, catalogs],
  );
  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export interface EditorText {
  readonly locale: string;
  readonly t: EditorMessages;
  /** A collection noun's forms, by the stable word `COLLECTIONS` names it with. */
  noun(key: string): NounForms;
  /** A field's guidance, by the key core's `PLACEHOLDERS` uses. */
  placeholder(key: string): string;
  /** A collection's section name, by its `COLLECTIONS` id. */
  sectionName(id: string): string;
  format(message: string, params?: MessageParams): string;
  plural(forms: PluralForms, count: number): string;
  list(items: readonly string[]): string;
}

export interface DocumentText {
  readonly locale: string;
  readonly t: DocumentMessages;
}

function useResolved(requested: string | undefined) {
  const { catalogs } = useContext(LocaleContext);
  return useMemo(() => {
    const locale = matchLocale(requested, catalogs);
    return { locale, catalog: resolveCatalog(catalogs[locale] ?? {}) };
  }, [requested, catalogs]);
}

/** The editor's words, in the editor's language. */
export function useEditorText(): EditorText {
  const { locale } = useContext(LocaleContext);
  const resolved = useResolved(locale);
  return useMemo(() => {
    const t = resolved.catalog.editor;
    const nouns = t.nouns as Readonly<Record<string, NounForms>>;
    const placeholders = t.placeholders as Readonly<Record<string, string>>;
    const sections = t.sections as Readonly<Record<string, string>>;
    return {
      locale: resolved.locale,
      t,
      noun: (key) => nouns[key] ?? unknownNoun(key),
      placeholder: (key) => placeholders[key] ?? '',
      sectionName: (id) => sections[id] ?? id,
      format,
      plural: (forms, count) => plural(forms, count, resolved.locale),
      list: (items) => list(items, resolved.locale),
    };
  }, [resolved]);
}

/** What the document prints, in the document's language. */
export function useDocumentText(): DocumentText {
  const resolved = useResolved(useDocumentLanguage());
  return useMemo(
    () => ({ locale: resolved.locale, t: resolved.catalog.document }),
    [resolved],
  );
}

/**
 * Forms for a noun no catalog knows — a third-party template's own. English-
 * shaped, because the word itself is all there is; it reads correctly in English
 * and degrades elsewhere rather than failing.
 */
function unknownNoun(word: string): NounForms {
  const other = word.endsWith('s') ? word : `${word}s`;
  return {
    one: word,
    other,
    title: word.charAt(0).toUpperCase() + word.slice(1),
    a: `${/^[aeiou]/i.test(word) ? 'an' : 'a'} ${word}`,
    this: `this ${word}`,
    count: { one: `{count} ${word}`, other: `{count} ${other}` },
  };
}
