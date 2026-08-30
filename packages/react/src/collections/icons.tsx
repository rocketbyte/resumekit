/**
 * The editing controls' glyphs, drawn rather than typed.
 *
 * `+`, `×`, `↑` and `↓` are typographic characters: they inherit a text font's
 * weight and terminals, so at 11px they come out thin, sharp, and slightly
 * different in every browser — and on a résumé they read as something somebody
 * left in the document. Two strokes with round caps are the same shape
 * everywhere, sit on the pixel grid, and read as a control.
 *
 * Shared, because the same action must not be drawn two ways: adding a bullet
 * and adding a role are one idea, and their controls sit a line apart.
 *
 * Every one is `aria-hidden`. The button around it carries the label — the icon
 * is how the action looks, never how it is named.
 */

function Glyph({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path d={d} />
    </svg>
  );
}

export const PlusIcon = () => <Glyph d="M8 4v8M4 8h8" />;
export const CloseIcon = () => <Glyph d="M5 5l6 6M11 5l-6 6" />;
export const ArrowUpIcon = () => <Glyph d="M8 12V4M4.5 7.5L8 4l3.5 3.5" />;
export const ArrowDownIcon = () => <Glyph d="M8 4v8M4.5 8.5L8 12l3.5-3.5" />;
