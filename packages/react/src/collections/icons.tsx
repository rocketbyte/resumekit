/**
 * The editing controls' glyphs, drawn rather than typed.
 *
 * `+`, `↑` and `↓` are typographic characters: they inherit a text font's
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
export const ArrowUpIcon = () => <Glyph d="M8 12V4M4.5 7.5L8 4l3.5 3.5" />;
export const ArrowDownIcon = () => <Glyph d="M8 4v8M4.5 8.5L8 12l3.5-3.5" />;

/**
 * Removal, drawn as the bin rather than as a dismissal.
 *
 * An `×` is the glyph for closing something, not for discarding it, and sitting
 * a few pixels from the `+` it reads as that plus's undo — the pair saying
 * "added / not added" about a control that in fact throws away a line the
 * candidate wrote. A bin names the destination, and names it before the button
 * is aimed at: the red only arrives on hover, so until then the shape is the
 * whole warning.
 *
 * Silhouette only — lid, handle, can — with no ribs inside the body. At 13px a
 * pair of hairlines in there closes up into a smudge, and what survives the
 * size is the outline.
 */
export const TrashIcon = () => (
  <Glyph d="M3.25 4.5h9.5M6.25 4.5V3.25h3.5V4.5M4.75 4.5v7a1.25 1.25 0 0 0 1.25 1.25h4a1.25 1.25 0 0 0 1.25-1.25v-7" />
);

/**
 * The drag handle — dots, and the reason it is drawn is the reason it moved.
 *
 * It used to be `⠿` (U+283F), and a braille cell is the one character here that
 * could not be centred by centring its box: the cell reserves room at the
 * bottom for dots 7 and 8, and no system font ships it — it comes from whatever
 * fallback the platform picks, with its own advance width and its own side
 * bearings. The dots therefore sat high and left of the middle of a glyph that
 * was itself sitting in the middle of the gutter, and the handle read as offset
 * from the `•` it stands in for.
 *
 * Six dots on a symmetric grid have no such opinion: the drawing is centred on
 * the viewBox, so the box's centre and the ink's centre are the same point, in
 * every browser.
 *
 * Filled rather than stroked — dots are the shape, not an outline of it — so
 * this one sets its own `fill` instead of taking the stroke the other glyphs do.
 */
export const GripIcon = () => (
  <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
    {/*
     * Spread nearly to the edges, and drawn at 1.75 rather than a hairline.
     * The dots ARE the icon's size — a tight cluster in the middle of a 16-unit
     * box renders as something much smaller than the box it was given, and the
     * only way to read it as bigger is to make it wider, not to scale up the
     * padding around it.
     *
     * Quarters, so every pair sums to the box exactly in binary and the
     * symmetry the handle depends on survives being asserted.
     */}
    {[5.25, 10.75].map((cx) =>
      [3.25, 8, 12.75].map((cy) => (
        <circle key={`${cx}:${cy}`} cx={cx} cy={cy} r="1.75" />
      )),
    )}
  </svg>
);
