import type { PluralForms } from './catalog.js';

export type MessageParams = Readonly<Record<string, unknown>>;

/**
 * `{name}` in a message replaced by `params.name`.
 *
 * Only strings and numbers are placed; a placeholder with no such parameter is
 * left as written, so a mistake shows on screen instead of vanishing.
 */
export function format(message: string, params: MessageParams = {}): string {
  return message.replace(/\{(\w+)\}/g, (whole, name: string) => {
    const value = params[name];
    return typeof value === 'string' || typeof value === 'number'
      ? String(value)
      : whole;
  });
}

const pluralRules = new Map<string, Intl.PluralRules>();

/** The form of `forms` the language uses for `count`, with `{count}` placed. */
export function plural(
  forms: PluralForms,
  count: number,
  locale: string,
): string {
  let rules = pluralRules.get(locale);
  if (!rules) {
    rules = new Intl.PluralRules(locale);
    pluralRules.set(locale, rules);
  }
  const message = forms[rules.select(count)] ?? forms.other;
  return format(message, { count });
}

const listFormats = new Map<string, Intl.ListFormat>();

/** "a, b and c" in the language's own words and punctuation. */
export function list(items: readonly string[], locale: string): string {
  let formatter = listFormats.get(locale);
  if (!formatter) {
    formatter = new Intl.ListFormat(locale, {
      style: 'long',
      type: 'conjunction',
    });
    listFormats.set(locale, formatter);
  }
  return formatter.format(items);
}
