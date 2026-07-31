import type { CSSProperties } from 'react';
import { INK_COLORS, type FieldAlign, type InkId } from '@cvgs/core';

/**
 * The formatting a node may carry.
 *
 * Bounded on purpose. A node accepts a boolean, a named alignment and a named
 * ink — never a style object, a class name or a raw colour — so the values a
 * caller can express are exactly the ones the catalog defines, and what they MEAN
 * is decided by the template's stylesheet. See `design.md`, decision 6.
 */
export interface FieldFormatting {
  bold?: boolean;
  align?: FieldAlign;
  ink?: InkId;
}

/** Class names the template stylesheet gives meaning to. */
export function formatClass(format: FieldFormatting, base: string): string {
  return [
    base,
    format.bold ? 'is-bold' : '',
    format.align ? `is-${format.align}` : '',
  ]
    .filter(Boolean)
    .join(' ');
}

/**
 * The one custom property a formatted node sets. Not a style prop: the value is
 * looked up from the catalog, so an arbitrary colour cannot be passed through it.
 */
export function formatInk(format: FieldFormatting): CSSProperties | undefined {
  if (!format.ink) return undefined;
  return { '--f-ink': INK_COLORS[format.ink].hex } as CSSProperties;
}

/** Marks the element as carrying its own ink, which the stylesheet keys off. */
export function inkAttr(format: FieldFormatting): string | undefined {
  return format.ink ? '' : undefined;
}
