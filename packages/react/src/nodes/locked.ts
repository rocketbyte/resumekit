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
 * Prop names a template node may never accept. Presentation belongs to the
 * template's stylesheet; a node carries content and the domain path it edits.
 *
 * Enforced by test rather than by types alone, because a component's prop
 * surface is easy to widen and hard to notice widening.
 */
export const FORBIDDEN_NODE_PROPS: readonly string[] = [
  'style',
  'className',
  'class',
  'color',
  'background',
  'font',
  'fontSize',
  'size',
  'width',
  'height',
  'margin',
  'padding',
  'align',
  'layout',
  'variant',
];
