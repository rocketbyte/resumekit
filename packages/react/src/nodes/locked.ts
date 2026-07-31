/**
 * The rules every node in a template tree declares.
 *
 * Craft.js is a page-builder library and this is deliberately the opposite of a
 * page builder, so every movement predicate answers `false`. That is necessary
 * and not sufficient — rules are configuration, and configuration is one API
 * change away from meaning something else. The guarantee that actually holds is
 * structural, and it is asserted in `nodes.spec.tsx`:
 *
 *   - no node accepts a presentational prop, so there is nothing to restyle;
 *   - no node is a canvas, so there is no drop target to drop into;
 *   - `connectors.drag` is never called, so there is no handle to grab.
 *
 * See `design.md`, decision 3.
 */
export const LOCKED_RULES = {
  canDrag: () => false,
  canDrop: () => false,
  canMoveIn: () => false,
  canMoveOut: () => false,
} as const;

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
};
