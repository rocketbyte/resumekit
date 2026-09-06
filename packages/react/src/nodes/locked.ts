/**
 * What a template's editable fields may and may not carry.
 *
 * This file used to open with `LOCKED_RULES` — four movement predicates every
 * node answered `false`, because Craft.js is a page-builder library and this is
 * deliberately the opposite of one. `retire-craftjs` removed the library, and
 * with it the capability those predicates existed to refuse. The file's own
 * argument is why they went rather than being kept for safety: "rules are
 * configuration, and configuration is one API change away from meaning
 * something else". A capability that does not exist cannot be re-enabled by
 * accident, and `nodes.spec.tsx` now asserts the absence directly.
 *
 * What remains is the rule that was never about Craft at all.
 */

/**
 * Prop names a template node may never accept.
 *
 * The rule is **no arbitrary presentation**, not "no presentation". A node may
 * take a bounded formatting value from the catalog — a boolean emphasis, a named
 * `align`, a named `ink` — because those can only express what the domain has
 * vetted, and what they MEAN is still decided by the template's stylesheet.
 * What it may never take is a value through which a caller could express
 * anything at all: a style object, a class name, a raw colour, a dimension.
 *
 * That is the distinction that was actually load-bearing in #29, and the one
 * `resume-document-formatting` (#30) preserves while making formatting possible.
 *
 * Enforced by test rather than by types alone, because a component's prop
 * surface is easy to widen and hard to notice widening.
 */
export const FORBIDDEN_NODE_PROPS: readonly string[] = [
  'style',
  'className',
  'class',
  'background',
  'font',
  'fontFamily',
  'fontSize',
  'size',
  'width',
  'height',
  'margin',
  'padding',
  'layout',
  'variant',
];

/**
 * Formatting props a node MAY accept, each paired with the catalog type its
 * values must come from. Asserted by test, so adding a free-string formatting
 * prop fails the suite rather than quietly reopening the design surface.
 */
export const BOUNDED_NODE_PROPS: Readonly<Record<string, string>> = {
  bold: 'boolean',
  align: 'FieldAlign',
  ink: 'InkId',
  /*
   * CONTENT, admitted under the same rule as the rest: a bounded value from the
   * domain, never a free string. `LinkTargetSchema` parses the URL and accepts
   * only `http`/`https`, so this cannot express "anything at all" — which is
   * what `FORBIDDEN_NODE_PROPS` exists to keep out. A URL is not a style, a
   * class, a colour or a dimension; it is a fact about where a word points, of
   * the same kind as the `links` array the résumé schema already carries.
   */
  href: 'LinkTarget',
};
