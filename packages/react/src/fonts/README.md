# The supplied typefaces

Every entry in `DOCUMENT_FONTS` is drawn in a font file bundled here. The same
bytes are served to the browser and installed into the render container, so a
résumé's appearance is a property of the résumé rather than of the machine
displaying it.

## What ships, and why that face

| Catalog entry | Supplied face  | Metric compatibility                          | Licence                       |
| ------------- | -------------- | --------------------------------------------- | ----------------------------- |
| `helvetica`   | TeX Gyre Heros | Helvetica-metric                              | GUST Font License (LPPL 1.3c) |
| `arial`       | Arimo          | Arial-metric                                  | SIL OFL 1.1                   |
| `calibri`     | Carlito        | Calibri-metric                                | SIL OFL 1.1                   |
| `georgia`     | Gelasio        | Georgia-metric                                | SIL OFL 1.1                   |
| `garamond`    | EB Garamond    | none — no metric standard for Garamond exists | SIL OFL 1.1                   |
| `times`       | Tinos          | Times New Roman-metric                        | SIL OFL 1.1                   |

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

Each family's licence, with its copyright notice, is in `licenses/`.

## What was changed

The files are **subsets**, not the originals: reduced to Google Fonts' `latin`
and `latin-ext` ranges unioned, hinting dropped, converted to WOFF2. Layout
features are limited to `kern, liga, clig, calt, ccmp, locl, mark, mkmk, rlig`.
No outline, no metric and no family name was altered. Four styles per family —
400, 400 italic, 700, 700 italic — which is what the templates set.

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
