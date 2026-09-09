# The supplied typefaces

Every entry in `DOCUMENT_FONTS` is drawn in a font file bundled here. The same
bytes are served to the browser and installed into the render container, so a
résumé's appearance is a property of the résumé rather than of the machine
displaying it.

## What ships, and why that face

### The stand-ins

Each answers "the candidate asked for Calibri", and is metrically compatible
with that face wherever such a standard exists.

| Catalog entry | Supplied face  | Metric compatibility                          | Licence                       |
| ------------- | -------------- | --------------------------------------------- | ----------------------------- |
| `helvetica`   | TeX Gyre Heros | Helvetica-metric                              | GUST Font License (LPPL 1.3c) |
| `arial`       | Arimo          | Arial-metric                                  | SIL OFL 1.1                   |
| `calibri`     | Carlito        | Calibri-metric                                | SIL OFL 1.1                   |
| `georgia`     | Gelasio        | Georgia-metric                                | SIL OFL 1.1                   |
| `garamond`    | EB Garamond    | none — no metric standard for Garamond exists | SIL OFL 1.1                   |
| `times`       | Tinos          | Times New Roman-metric                        | SIL OFL 1.1                   |

### The product's own

The six above are a neo-grotesque sans and a transitional serif three times
each, so a candidate could change the typeface's NAME without much changing how
the document reads. These four each cover a register none of the six reaches,
stand in for nothing, and carry no metric obligation.

| Catalog entry | Supplied face    | Register it adds                           | Licence     |
| ------------- | ---------------- | ------------------------------------------ | ----------- |
| `lato`        | Lato             | humanist sans — warmer than the grotesques | SIL OFL 1.1 |
| `condensed`   | Roboto Condensed | condensed sans — fits more on the page     | SIL OFL 1.1 |
| `ptserif`     | PT Serif         | screen serif — sturdier than Georgia       | SIL OFL 1.1 |
| `bitter`      | Bitter           | slab serif — the one non-book voice        | SIL OFL 1.1 |

**Merriweather was measured and rejected.** It fills the same "screen serif"
slot as PT Serif and cuts to 184KB a family against PT Serif's 61KB — 99KB of
that is `GPOS` alone, a kern table three times the size of any other family's
whole file. Pruning it would mean shipping a Merriweather that does not kern
like Merriweather. Do not re-propose it without new numbers.

**Roboto Slab was named for the slab slot and is not shipped.** It has no true
italic, and every entry here ships 400, 400 italic, 700 and 700 italic because
that is what the templates set. Bitter is the same register with real italics.

`design.md` decision 4 named **Nimbus Sans** for `helvetica`. It is not shipped.
Nimbus Sans is distributed under the AGPL v3 with an exception that covers
including the font "in a Postscript or PDF file" — the PDF path only. Serving it
to a browser as a webfont distributes the font program itself, which the
exception does not reach. **TeX Gyre Heros** is GUST's derivative of that same
Nimbus Sans under the LaTeX Project Public License 1.3c, which permits
redistribution: the same true-Helvetica design and the same Helvetica metrics,
without the licence conflict. Choosing it over the obvious OFL alternative
(Liberation Sans) keeps `helvetica` visually distinct from `arial`, since
Liberation Sans and Arimo are the same Arial design.

## Provenance

- Arimo, Carlito, Gelasio, EB Garamond, Tinos — Google Fonts, upstream TTFs.
- TeX Gyre Heros — CTAN, `fonts/tex-gyre/opentype`, version 2.004.
- Lato, PT Serif — Google Fonts, upstream static TTFs.
- Bitter, Roboto Condensed — Google Fonts, upstream VARIABLE TTFs, instanced to
  400 and 700 before subsetting, so what ships is a static face rather than a
  variable font pinned at render time. Instanced with `updateFontNames`, without
  which the instance inherits the variable font's default name — `Bitter Thin`
  on a file that is a 400 — and the render container installs it under that.

Each family's licence, with its copyright notice, is in `licenses/`.

## What was changed

The files are **subsets**, not the originals: reduced to Google Fonts' `latin`
range, hinting dropped, converted to WOFF2.

> This line used to say "`latin` and `latin-ext` ranges unioned". It was wrong,
> and measurably so: `arimo-400.woff2` carries 230 codepoints — 193 of Latin-1,
> 18 of General Punctuation, and the three strays (`ı`, `Œ`, `œ`) that are in
> Google's `latin` range — and none at all from `U+0100-017F`, `U+1E00-1EFF` or
> `U+A720-A7FF`. The four added later are cut to match what actually shipped,
> not to what this file claimed. A character outside the range falls through to
> the next family in the stack by the browser's own per-glyph fallback, which is
> what `fonts.css` already says.

Layout features are limited to `kern, liga, clig, calt, ccmp, locl, mark, mkmk,
rlig`. No outline, no metric and no family name was altered. Four styles per
family — 400, 400 italic, 700, 700 italic — which is what the templates set, and
what `fonts.spec.ts` refuses to let an entry ship without.

## The shift this causes

Measured as the total advance width of a sample résumé line, comparing what a
**macOS** reader was shown before against the supplied face, in each of the four
styles the templates set:

| Entry       | Was drawn in                        |     400 |    400i |     700 |    700i |
| ----------- | ----------------------------------- | ------: | ------: | ------: | ------: |
| `helvetica` | Helvetica Neue                      |  −0.59% |  −0.19% |  −0.37% |  −0.45% |
| `arial`     | Arial                               |   0.00% |   0.00% |   0.00% |   0.00% |
| `calibri`   | Arial — the stack fell through      | −10.10% | −10.67% | −13.29% | −13.57% |
| `georgia`   | Georgia                             |   0.00% |   0.00% |   0.00% |   0.00% |
| `garamond`  | Baskerville — no Garamond installed |  −6.23% |  +5.62% | −10.49% |  −8.38% |
| `times`     | Times New Roman                     |   0.00% |   0.00% |   0.00% |   0.00% |

Three entries do not move at all, in any style: where the reader already had the
named typeface, the supplied face is metric-identical to it. `helvetica` moves
by less than a percent — TeX Gyre Heros carries Helvetica's metrics, and macOS
was resolving Helvetica _Neue_, which differs slightly.

The two that move are the two where macOS was never showing the named typeface.
So the shift is a **correction**, not a regression: `calibri` now sets Calibri's
true width rather than Arial's, and `garamond` a Garamond rather than a
Baskerville. A saved résumé set in those two can gain or lose a line, which is
the price decision 4 named up front.

### The one place text gets wider

`garamond` italic is up to 5.62% wider than the Baskerville italic it used to
fall back to — the only widening anywhere in the table. Italic is set in three
places: Cobalt's role-and-dates meta line, which wraps freely in the main
column; Meridian's employer, which is italic _700_ and therefore narrower, not
wider; and Executive's date cell, which sits in a `1fr auto` grid, so a wider
date takes its width from the title beside it rather than overflowing.

Nothing overflows. In absolute terms EB Garamond Italic is in fact the narrowest
of the six supplied faces — Executive's `March 2019 - Present` at 8.5pt sets
69.5pt in it against 81.8pt in Gelasio — so the widening is a fact about
Baskerville being unusually narrow, not about EB Garamond being wide. The cost
is bounded at a wrapped line.

Page-by-page visual comparison of the rendered document belongs with the render
service, where there is something to compare against; it is task 9.3.
