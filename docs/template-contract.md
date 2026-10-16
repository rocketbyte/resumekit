# The resume template contract

Every resume template offers the same editing capabilities: section rails with adjustable space,
entries that can be added, moved, removed and spaced, editable skills groups, and contact fields
offered while editing. The capabilities are **shared components**. A template decides only where
they sit and how they look.

`packages/react/src/templates/conformance.spec.tsx` runs over every template in
`TEMPLATE_RENDERERS` and fails if a template opts out. Registering a template enrols it.

## Wiring a new template

1. **Catalog**: `packages/schema/src/template.ts` → an entry in `TEMPLATES` with `name`,
   `description`, `page`, `columns` and `ats`. Every `ats` line must be true of the rendered
   document.
2. **Renderer**: `packages/react/src/templates/<id>/`:
   - `<Id>Document.tsx`;
   - `entries.tsx` (experience, education and custom entries);
   - `<id>.css`;
   - `<id>.spec.tsx` for the template's own appearance and ATS claims.
3. **Registry**: `packages/react/src/registry.ts`, plus the stylesheet `@import` in
   `packages/react/src/document.css`.
4. **Reference**: the image of the design the template is built from and checked against. The
   maintainers keep references privately — not every design's image may be redistributed — so
   attach yours to the pull request.

An application that offers templates in a chooser (thumbnails, a landing page gallery) wires
those itself, after it upgrades to the release that adds the template.

## Declarative templates

Every template is **described**, not hand-written: `<id>.template.yaml` says which of the kit's
editable pieces it uses and how they are arranged, and the template compiler (`src/compiler/`)
generates its `<Id>Document.tsx` and `entries.tsx`. The design stays in `<id>.css`, written by
hand. Every template in the catalog is described; read one close to what you want first.

- **Write** the description and the CSS. Class names in the description are relative to `prefix`:
  `org` becomes `tpl-harvard__org`.
- **Generate** with the package's `generate-templates` script, or keep `watch-templates` running
  and preview in the gallery (`pnpm gallery`, port 4400): a saved description is
  on screen a moment later. An invalid description names the file and the field and leaves the
  last good output in place.
- **Commit** the description, the CSS and the generated `.tsx` together. Generated files say so
  in their header; never edit one. `check-templates` (run in CI) fails on any difference.

### The layout

`layout` is the page, top to bottom.

- **Containers:** `row` puts its children side by side (any number of columns), `stack` top to
  bottom; both nest to any depth. Options:
  - `tag`, `class`, `kit` (`tpl-sheet-tall`), `block` (kept on one page), `decorative`
    (`aria-hidden`);
  - `span` (share of a row), `width` (fixed), `gap`, `vars` (custom properties);
  - `heading` (a panel key from `doc.t.panels`: `contacts`, `personalInformation`, `locations`,
    `websites`) + `headingClass`, and `when` (`headline` |
    `location` | `links` | `contact`: shown only when the resume has it).
- **Parts:** `name`, `headline` (`prefix`: a `doc.t.labels` key), `avatar`, `monogram`, `contact` (fields, `links`, `tag`,
  `item`, `itemTag`, `icons`; several lines may each take different fields), `links` (as a list,
  `icons`), `location` (plain text) and `{ text: … }`. Every contact detail carries its field's
  class, `tpl-contact--phone | email | location | link` (on its item, or on a line of one bare
  field), which the picture render keeps. `icons: true` draws an icon before each detail
  (`kit/contact-icons.css`: a mask over generated content, forced to print, no extractable
  text), tuned by `--tpl-contact-icon-ink` / `-size` / `-gap` / `-shift` and replaced per field
  with `--tpl-contact-icon-phone` / `-email` / `-location` / `-link`.
- **A two-weight name:** `{ name: name, split: true }` draws the name as
  `<prefix>__name-first` (every word but the last) and `<prefix>__name-last` (the last word), with
  the typed space between them, so a design can set a light given name and a bold surname (Awesome
  CV, Deedy, Friggeri). One word is drawn as `__name-last` alone. The name stays one field at
  `name`: the spans are drawn in the editor exactly as on the page, and while the candidate types
  the field is one plain run in the `__name` style. Nothing is added to the text, so it extracts
  as typed.
- **A heading accent:** `headingAccent: <n>` at the top of the description puts the first `n`
  letters (whitespace not counted) of every heading — sections, custom sections and panel
  headings — in a `<prefix>__heading-lead` span, for the stylesheet to colour (Awesome CV,
  Friggeri) or box (Twenty Seconds). Like the name, the heading stays one renameable field and is
  drawn the same while editing, and the span adds no characters: "Experience" extracts as
  "Experience". A heading that must not look accented — a sidebar's, say — simply leaves the span
  unstyled there. Keep the span inline and the gap after it small: a box whose padding or margin
  opens a visible gap inside the word can make a PDF reader extract a space there, so draw a tab
  with a background (and a pseudo-element for any overhang) rather than with margins.
- **Sections**, named by their resume field; a bare word takes the defaults:
  - `skills`: `entry`, or `groups: grid | tags | bullets | inline` with an optional `wrapper`
    (`kit` keyword classes, `split`). `grid` is the kit's invisible table (`kit/skill-grid.css`): one
    row per group, the category in a label column, one skill per cell in auto-fitting columns,
    stacked under its category in a column narrower than 240pt. Each group is an entry with its
    own rail; its wrapper takes no `block` or `split`. A template tunes it only through
    `--tpl-skill-grid-label` (label column), `--tpl-skill-grid-column` (minimum skill column),
    `--tpl-skill-grid-gutter` (label to skills), `--tpl-skill-grid-gap` (between skill columns),
    `--tpl-skill-grid-lead` (between skill lines), `--tpl-skill-grid-rhythm` (between groups) and
    `--tpl-skill-grid-label-ink` / `-weight` / `-size`. Prefer it to `inline`: a comma run loses
    the categories and reads as one jumble. **Underlined tags** — each skill a word on a grey rule
    of its own width, several to a row — are `tpl-keywords--tags` (`kit/keywords.css`): with
    `groups: bullets` and `wrapper.kit: [tpl-keywords, tpl-keywords--tags]` every group's skills
    join one run with no category; `groups: tags` prints each group as an entry, its category a
    subheading over its own run (`kit/skill-tags.css`). The tag is tuned by
    `--tpl-keyword-size` / `-weight` / `-ink`, `--tpl-keyword-line` / `-rule` (rule colour and
    thickness), `--tpl-keyword-pad` (either side), `--tpl-keyword-top` / `-lead` (above the word,
    word to rule), `--tpl-keyword-span` (between tags) and `--tpl-keyword-gap` (between rows); the
    labelled groups by `--tpl-skill-tags-label-ink` / `-size` / `-weight`,
    `--tpl-skill-tags-label-gap` and `--tpl-skill-tags-rhythm`;
  - `certifications`: `as: bullets | inline` (prefer `bullets`: one per line), `whenEmpty`;
  - `achievements` / `courses` / `passions`: `kit` modifiers;
  - every section: `title`, `sectionClass`, `headingClass`.
- **`component`:** `{ component: CobaltCrest, from: ./crest.js }` renders a small hand-written
  component that lives beside the description and receives `resume`. Use it for the one piece the
  format cannot say, such as Cobalt's SVG crest, and keep the rest described.

### Entries

Element trees of tags, classes, fields, text, separators (literal, or a localized `word`), bullets,
inline lists and logo `chip`s. Any node can take:

- `when` (all of these fields) or `whenAny` (one of them);
- `fragment` (to group nodes under one condition);
- `decorative`;
- `placeholder: <key>` or `placeholder: false`. Never literal text: everything a template prints
  or guides with is a catalog key, so it translates.

### CSS decides the look

Sizes and gaps become custom properties (`--tpl-grow`, `--tpl-basis`, `--tpl-gap`), applied by
`kit/layout.css` under `:where()` — zero specificity, so anything the template's stylesheet says
wins. A row is flex by default; say `display: grid` in its class for a grid. A stack is plain
block flow unless it asks for a gap.

### What the schema refuses

Anything that cannot be paginated:

- a row holding sections makes each of its columns a flow, must be the last thing holding sections
  in its parent, and holds its sections in columns;
- a `block` never holds sections.

A design that needs more than a `component` slot can still be written by hand — no
`.template.yaml`, its `.tsx` edited directly — and is held to the same registry, kit and
conformance suite. An option joins the format only when two or more templates need it.

## The document: use the kit

`packages/react/src/kit/` holds everything a document would otherwise copy.
**The type is the template's**: the kit states structure — margins, the shape of a
meter — and inherits font, size and leading, exactly as each template's own
`__prose` class does. A size named in the kit would make the supporting sections
the only text on the page set by the kit, and they would read as a foreign block
in every template at once. Where a template must differ it sets a variable.

| Need                                                                     | Use                                                                           |
| ------------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| A named section (summary, skills, experience, education, certifications) | `<DocumentSection id title heading className headingClassName>`               |
| Style variables on the root                                              | `style={documentStyle('<prefix>', useDocumentStyle())}`                       |
| Contact details                                                          | `contactLines(resume.contact, [order], authoring)`, each with its placeholder |
| Initials                                                                 | `monogram(resume.name)`                                                       |
| A skills group printed as bullets only                                   | `BulletSkillGroup` inside `<Collection section="skills" gap={false}>`         |
| Achievements, Courses or Passions — a title over a paragraph             | `<DescribedEntries id title items className headingClassName entryClassName>` |
| Languages — a name, a level word and its meter                           | `<LanguageList items className headingClassName rowClassName>`                |
| Skills groups as an invisible table, category beside its skills          | `groups: grid` → `GridSkillGroup` inside `<div className="tpl-skill-grid">`   |
| Skills groups as labelled underlined tags, category over its skills      | `groups: tags` → `TagSkillGroup` inside `<div className="tpl-skill-tags">`    |

Beyond the kit:

- **The heading is a FIELD, and `DocumentSection` owns it.** Every section is
  renameable where it is printed: the heading is an `EditableText` at
  `section_headings.<id>`, so a rename is an ordinary `set` edit and is saved,
  undone, exported and carried between templates for free. A template passes the
  stored heading (`resume.section_headings?.<id>`) beside its own default
  `title`, and never draws heading text of its own — an `<h2>` with a literal
  string in it silently refuses the caret while looking identical.
  `conformance.spec.tsx` asserts this over the registry.
- **A template's own word is a `defaultValue`, not a placeholder.** The two are
  different and the difference matters: a placeholder is never stored, exported
  or extractable, while a default PRINTS. Declaring it is also what stops merely
  opening a document reading as one edit per section —
  `presentationEdits` refuses a value equal to its default, so an untouched
  document is clean and renaming a section back to its own name leaves no trace.
- **Repeatable content goes through `Collection`**: experience, education, skills, links. Custom
  sections go through `CustomSections`, with the template's own entry component.
- **Entry components** spread `itemProps` onto their root element and render `chrome` inside it.
  They receive no mutators.
- **Fields are `EditableText` / `EditableBulletList` / `EditableInlineList`**, with the item's
  own `path` and its guidance from `useEditorText().placeholder('<key>')` — the key is core's
  `PLACEHOLDERS` key.
- **Two fields on one line are joined by `Separator`** (`kit/Separator.tsx`) — `text=", "` for
  punctuation, `word="degreeField"` for a word, which prints in the document's language. It is
  always drawn while authoring, so two empty fields' guidance never runs together, and printed
  only when both sides have a value. `blank-document.spec.tsx` fails when two empty fields touch.
- **A template writes no literal text** (`template-i18n`). Section titles come from
  `useDocumentText().t.sections` and print in the document's language (`presentation.language`);
  the root takes `aria-label={doc.t.resume}` and `lang={doc.locale}`. Guidance, accessible names
  and controls come from `useEditorText()` and follow the editor's language. A title a template
  needs that the catalog lacks is added to `src/i18n/locales/en.json` and `es.json` in the same
  change; `i18n/catalog.spec.ts` fails until both agree.
- **An empty section** is omitted when read and offered when authoring:
  `(resume.x.length > 0 || authoring) && …`, where `authoring = useAuthoring() !== null`.
  `DescribedEntries` and `LanguageList` apply this rule THEMSELVES and are called
  with no guard — one rule in one place rather than sixty-eight copies of it, and
  a template that got a guard subtly wrong would print an empty heading on
  somebody's exported PDF. They also tolerate the field being `undefined`, for
  the reason `CustomSections` states: a résumé that never went through the schema
  genuinely lacks it.
- **Pagination attributes:** `data-block` on each unit that moves whole to the next page,
  `data-keep-with-next` on headings (`DocumentSection` does this), `data-split` on a keyword
  list, and `data-flow` on each structural column.
- **Document order is reading order.** In two columns, the column that is read first is written
  first.

## The stylesheet

On the template root:

```css
.tpl-<id> {
  --tpl-space-unit: calc(<rhythm>pt * var(--<p>-scale) * var(--<p>-density));
  --tpl-space-margin: <the page's side margin>;
}
```

- **Add the recorded space** to the `margin-top` that sets the rhythm of sections and entries:
  `calc(<rhythm> + var(--tpl-space-height, 0px))`. Never replace the margin.
- **Where margins collapse**, restate the neighbour's margin before adding the space. A first
  entry under a heading uses `calc(<heading margin-bottom> + var(--tpl-space-height, 0px))`.
  Otherwise the gap is lost inside the heading's margin.
  The kit's achievements, courses, passions and languages read the heading's margin from
  `--tpl-heading-gap`, which every template declares on its root.
- **Space sections with a top margin between them** (`section + section`). A bottom margin
  collapses with the recorded top margin.
- **A column against the page's right edge** sets
  `--tpl-rail-right: auto; --tpl-rail-left: calc(100% + var(--tpl-space-margin) + 12px);`
  so that its rails stand in the right margin.
- **Colours and fonts come from variables** on the root: `--<p>-font`, `--<p>-ink`, `--<p>-scale`,
  `--<p>-accent` and `--<p>-density`, with defaults declared in the stylesheet.

## What a design asks for and the resume does not hold

A template never invents content. Where a reference shows a **portrait** draw
`InitialsAvatar`, where it shows a **logo** draw `InitialsChip`, and where it
shows a **chart** draw nothing: no stored value backs one, and a chart of
invented proportions is something a candidate would be sending to an employer.

A **proficiency meter** may be drawn only where **every step it shows is
rendered from a value the résumé holds**, and never otherwise. The rule was
"draw nothing" while nothing backed one; `languages[].level` now does, as a
closed enum of five whose length is the meter's five steps — so the meter is a
rendering of the record rather than a proportion somebody chose. Two conditions
come with it, and both are asserted in `conformance.spec.tsx`:

- **The level is printed as its word wherever the meter is drawn.** The word is
  the content and the dots are decoration, so the section survives a parser, a
  screen reader and a printer that drops the marks. A meter is never the only
  expression of a level.
- **The meter is `aria-hidden`.** The word beside it is already the accessible
  content; five announced circles are noise.

A **skills rating bar** is still drawn as nothing — `SkillGroupSchema` says in
its own description that there are no rating bars and no years-per-skill — and
so is `double-column`'s "My Time" donut, whose proportions the résumé does not
hold.

## Two shapes that keep biting

- **Never put an editable container inside CSS `columns`.** A box that spans a
  column break is fragmented, and a fragment can hold neither its outline nor
  its rail — the pill lands inside the page. Use a grid, or move the columns
  inside the item.
- **A painted rail is a COLUMN with a background**, not a panel given a height:
  a panel measured against the page appears on page one and nowhere else,
  where a grid item's background is repainted on every fragment. Force it with
  `print-color-adjust: exact`, and say so in the `ats` lines.

## Verifying

```sh
pnpm check-templates && pnpm typecheck && pnpm lint && pnpm build && pnpm test
```

Also check the template in a browser:

- point at each section and at an entry, and drag the space control;
- with no recorded space, the document should look exactly as designed.
