import type { CSSProperties } from 'react';
import {
  DENSITIES,
  DOCUMENT_FONTS,
  INK_COLORS,
  type DocumentStyle,
} from '@resumekit/schema';

/**
 * The candidate's document style as custom properties on a template's root,
 * named with the template's own prefix (`--h-font`, `--c-ink`, …) so its
 * stylesheet stays the only definition of how it looks.
 *
 * Accent and density are written only when chosen: `document-styling` (#36)
 * requires a document that sets neither to render as the template defines it.
 */
export function documentStyle(
  prefix: string,
  style: DocumentStyle | undefined,
): CSSProperties {
  if (!style) return {};
  return {
    [`--${prefix}-font`]: DOCUMENT_FONTS[style.font].stack,
    [`--${prefix}-ink`]: INK_COLORS[style.ink].hex,
    [`--${prefix}-scale`]: String(style.scale),
    ...(style.accent
      ? { [`--${prefix}-accent`]: INK_COLORS[style.accent].hex }
      : {}),
    ...(style.density
      ? { [`--${prefix}-density`]: String(DENSITIES[style.density].factor) }
      : {}),
  } as CSSProperties;
}
