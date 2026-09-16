import { z } from 'zod';
import {
  COLLECTIONS,
  PresentedResumeSchema,
  TOP_LEVEL_COLLECTIONS,
  isUnfilled,
  type CollectionId,
  type PresentedResume,
} from './collections.js';
import {
  ContentAuthorSchema,
  LinkTargetSchema,
  CustomEntrySchema,
  type ResumeObject,
} from './resume.js';

/**
 * Resume templates — the renderers that turn a {@link ResumeObject} into a
 * document — plus the **presentation overlay** that records a candidate's own
 * corrections to one.
 *
 * Framework-free on purpose. A template is data here and a renderer in whichever
 * surface draws it, so the same catalog is readable by the API, the web app, and
 * any future render service, and switching template stays a data operation
 * costing zero LLM tokens.
 */

/**
 * The template catalog. Data — add an entry plus a renderer and a new template
 * exists; nothing about the editor changes.
 *
 * `ats` states what a template guarantees against the knowledge base's format
 * rules. It is not marketing copy: every line must be true of the rendered
 * document, because it is the reason a candidate can trust this output in a
 * screening system.
 *
 * `columns` states the same fact as a NUMBER, because the chooser draws a badge
 * from it and a badge cannot be produced by reading English. The `ats` lines are
 * sentences written for a candidate, and matching `/two columns/i` against one
 * would make the badge silently wrong the first time somebody reworded it — in
 * the one property a screening system reads differently. Structured here, and
 * `template.spec.ts` asserts the two AGREE rather than deriving one from the
 * other. See `editor-tabbed-rail` (#48), design decision 3.
 */
export const TEMPLATES = {
  harvard: {
    name: 'Harvard',
    description:
      'The classic single-column résumé: centred name block, rule-underlined ' +
      'section headings, and two-column experience entries.',
    page: 'letter',
    columns: 1,
    ats: [
      'Single column — no sidebar, no text boxes',
      'No tables, images, or icon fonts carrying meaning',
      'Real selectable text, standard system typefaces',
      'Reverse-chronological sections with YYYY-MM dates',
    ],
  },
  executive: {
    name: 'Executive',
    description:
      'A coloured header band with a monogram, small-capital section ' +
      'headings, and a two-column skills list.',
    page: 'letter',
    /*
     * ONE, and the description's "two-column skills list" is not a
     * contradiction: those are CSS `columns` over a single list, so the body is
     * one column and the extracted text is linear. This is the number a
     * screening system cares about, which is why it is not read off the prose.
     */
    columns: 1,
    /*
     * Deliberately NOT Harvard's list. This template's skills run in two
     * columns, so it must not claim a single one — the honest guarantee is that
     * the columns are visual: CSS columns over ONE list, leaving the text a
     * parser extracts in document order.
     */
    ats: [
      'Skills in visual columns over a single list — extracted text stays linear',
      'No tables, images, or icon fonts carrying meaning',
      'Real selectable text, standard system typefaces',
      'Header colour is forced to print, so white-on-navy never vanishes',
      'Reverse-chronological sections with YYYY-MM dates',
    ],
  },
  meridian: {
    name: 'Meridian',
    description:
      'A charcoal crown band with a rule-flanked monogram over a terracotta ' +
      'contact rule, and a body split by a full-height hairline into a main ' +
      'column and a keyword sidebar. Its headings are set in the template’s ' +
      'own serif; the typeface you choose sets everything else.',
    page: 'letter',
    columns: 2,
    /*
     * A DISCLOSURE, not a reassurance — and the difference is the whole reason
     * this list is separate from Executive's.
     *
     * Executive can say its extracted text stays linear because its columns are
     * CSS `columns` over ONE list: the DOM order and the read order are the same
     * order. These columns are grid tracks holding different sections, so that
     * property does not hold and borrowing the phrasing would put the product's
     * central claim behind a sentence somebody typed. What IS true is the
     * reading order, and `meridian.spec.tsx` holds the renderer to it.
     */
    ats: [
      'Two columns — the résumé is written first, so extracted text reads it through before the sidebar',
      'No tables, images, or icon fonts carrying meaning',
      'Real selectable text, standard system typefaces',
      'Both bands are forced to print, so white-on-charcoal never vanishes',
      'Reverse-chronological sections with YYYY-MM dates',
    ],
  },
  cobalt: {
    name: 'Cobalt',
    description:
      'A cobalt hexagonal crest beside the name in serif, section headings ' +
      'underlined across their own column, and a body of two columns with the ' +
      'keyword rail on the left. Its headings are set in the template’s own ' +
      'serif; the typeface you choose sets everything else.',
    page: 'letter',
    columns: 2,
    /*
     * Two guarantees here are this template's alone.
     *
     * The FIRST names sections rather than a column. "The main column is read
     * first" is what Meridian can say, because its main column is also its left
     * one; this template's rail is on the left, so the honest statement is the
     * order a parser actually gets — and a column name tells a candidate
     * nothing about their own résumé anyway.
     *
     * The FOURTH is the one no other template in this catalog can make. Both
     * Executive and Meridian force a background colour to print, which is a
     * promise about a browser setting: when it is declined, reversed type on an
     * unpainted band does not degrade, it disappears. This template draws no
     * band at all — every mark it makes is a glyph, a border, or a stroked
     * outline — so the claim is about paper rather than about a hint, and
     * `cobalt.spec.tsx` holds the stylesheet to it.
     */
    ats: [
      'Two columns, written in the order they are read — extracted text runs summary, skills and education, then the work history',
      'No tables, images, or icon fonts carrying meaning',
      'Real selectable text, standard system typefaces',
      'No printed band — every mark is foreground ink, so it prints complete with background graphics off',
      'Reverse-chronological sections with YYYY-MM dates',
    ],
  },
} as const;

export type TemplateId = keyof typeof TEMPLATES;
export type TemplateDetails = (typeof TEMPLATES)[TemplateId];

/**
 * Derived from the catalog keys rather than declared a second time: a template
 * that exists but cannot be requested (or the reverse) is exactly the drift this
 * avoids.
 */
export const TemplateIdSchema = z.enum(
  Object.keys(TEMPLATES) as [TemplateId, ...TemplateId[]],
);

/** What a resume is presented in when nobody has chosen. */
export const DEFAULT_TEMPLATE_ID: TemplateId = 'harvard';

export function templateDetails(id: TemplateId): TemplateDetails {
  return TEMPLATES[id];
}

/** The catalog paired with the ids that address it, in declaration order. */
export function orderedTemplates(): {
  id: TemplateId;
  details: TemplateDetails;
}[] {
  return (Object.keys(TEMPLATES) as TemplateId[]).map((id) => ({
    id,
    details: TEMPLATES[id],
  }));
}

/**
 * Operator configuration for one template.
 *
 * Deliberately NOT the whole catalog. Two kinds of fact get called "template
 * metadata" and they have opposite requirements:
 *
 *   - **Renderer-bound facts** — id, page size, ATS guarantees — describe what
 *     the code DOES. `harvard` is single-column at US Letter because
 *     `HarvardDocument` and `harvard.css` say so. In a database the two can
 *     disagree, and the product's central claim becomes a string somebody typed.
 *     They stay in {@link TEMPLATES}, where a test can hold them to it.
 *   - **Operator decisions** — offered or not, in what order, emphasised,
 *     badged — describe what the business wants this week and change without
 *     any code changing. Needing a deploy for those is the actual complaint.
 *
 * This is the second kind. Every field but the id is optional, so a document
 * that sets only `enabled` is valid configuration.
 */
export const TemplateConfigSchema = z.object({
  template_id: z.string(),
  enabled: z.boolean().optional(),
  order: z.number().optional(),
  featured: z.boolean().optional(),
  badge: z.string().max(24).optional(),
});
export type TemplateConfig = z.infer<typeof TemplateConfigSchema>;

/** A template as offered to a candidate: catalog facts plus operator emphasis. */
export const OfferedTemplateSchema = z.object({
  id: TemplateIdSchema,
  name: z.string(),
  description: z.string(),
  page: z.string(),
  /** How many columns the body is. Drawn as the chooser's badge. */
  columns: z.number(),
  ats: z.array(z.string()),
  featured: z.boolean().optional(),
  badge: z.string().optional(),
});
export type OfferedTemplate = z.infer<typeof OfferedTemplateSchema>;

function isTemplateId(id: string): id is TemplateId {
  return Object.prototype.hasOwnProperty.call(TEMPLATES, id);
}

/**
 * The templates a candidate is offered: the catalog, layered with operator
 * configuration. Pure — no I/O, no model call.
 *
 * Configuration can hide a template, order it, and emphasise it. It can NEVER
 * introduce one: an id the catalog does not contain is ignored, because a
 * template without a renderer is a row that draws nothing.
 *
 * The result is never empty. If configuration would leave nothing offered — a
 * bad seed, a typo, a half-finished migration — the default is offered anyway.
 * An editor with no template to choose is not a degraded screen but a broken
 * one, and that failure would arrive through data, where no test would catch it.
 */
export function resolveTemplates(
  configs?: readonly TemplateConfig[],
): OfferedTemplate[] {
  const byId = new Map(
    (configs ?? [])
      .filter((c) => isTemplateId(c.template_id))
      .map((c) => [c.template_id as TemplateId, c]),
  );

  const offered = (Object.keys(TEMPLATES) as TemplateId[])
    .filter((id) => byId.get(id)?.enabled !== false)
    .map((id, index) => ({
      id,
      ...TEMPLATES[id],
      ats: [...TEMPLATES[id].ats],
      // Catalog order is the tiebreak, so an unordered template keeps its place
      // rather than jumping to the front on a zero default.
      _order: byId.get(id)?.order ?? index,
      featured: byId.get(id)?.featured,
      badge: byId.get(id)?.badge,
    }))
    .sort((a, b) => a._order - b._order)
    .map(({ _order: _drop, ...rest }) => rest);

  if (offered.length > 0) return offered;
  return [
    {
      id: DEFAULT_TEMPLATE_ID,
      ...TEMPLATES[DEFAULT_TEMPLATE_ID],
      ats: [...TEMPLATES[DEFAULT_TEMPLATE_ID].ats],
    },
  ];
}

/**
 * Segments that would climb out of the object being edited. Checked by name
 * rather than relying on the final schema parse, because assignment to
 * `__proto__` mutates a shared prototype *before* anything gets validated.
 */
const FORBIDDEN_SEGMENTS: readonly string[] = [
  '__proto__',
  'constructor',
  'prototype',
];

/** A field name (`summary`, `still_missing`) or an array index (`0`, `12`). */
const SEGMENT = /^(?:[a-z][a-z0-9_]*|\d+)$/;

/**
 * Whether a string addresses a location in a {@link ResumeObject} —
 * `summary`, `contact.email`, `experience.2.bullets`.
 *
 * Grammar only. Whether the path *resolves* against a particular resume is a
 * separate question, answered at apply time, because an overlay outlives the
 * resume it was written against.
 */
export function isResumeFieldPath(path: string): boolean {
  if (path.length === 0) return false;
  const segments = path.split('.');
  return segments.every(
    (s) => SEGMENT.test(s) && !FORBIDDEN_SEGMENTS.includes(s),
  );
}

export const ResumeFieldPathSchema = z
  .string()
  .refine(isResumeFieldPath, {
    message:
      'Not a resume field path (expected e.g. "summary" or "experience.0.bullets").',
  })
  .describe('A dotted path naming a location in the structured resume.');

/**
 * One edited value: a single field, or a whole list.
 *
 * A list is stored whole rather than as a patch. Resume bullets are bare
 * strings with no stable identity, so any per-item merge would need synthetic
 * ids invented purely to serve the editor — see `design.md`, decision 2.
 */
export const EditValueSchema = z.union([z.string(), z.array(z.string())]);
export type EditValue = z.infer<typeof EditValueSchema>;

/** One replaced field: where, and what it now says. */
export const SetEditSchema = z.object({
  kind: z.literal('set'),
  path: ResumeFieldPathSchema,
  value: EditValueSchema,
});
export type SetEdit = z.infer<typeof SetEditSchema>;

/**
 * A section that takes appended entries.
 *
 * An allowlist rather than any array path: appending is only meaningful for the
 * listed sections a template draws as repeated entries, and naming them keeps
 * `experience.0.bullets` — which has its own add/remove control — out of a
 * second, structural route to the same thing.
 */
export const APPENDABLE_SECTIONS = [
  'experience',
  'education',
  'skills',
  'certifications',
  'links',
] as const;

/**
 * The same set, derived from {@link COLLECTIONS}.
 *
 * `template.spec.ts` asserts the two agree, so a collection cannot be addable
 * here and unknown there — the check `registry.spec.ts` already performs for
 * templates and their renderers. A tuple is kept above because `z.enum` needs
 * one; the derivation is what makes it a projection rather than a second list.
 *
 * `custom_sections` is excluded: a section carries a heading, so declaring one
 * is a different act from appending an entry, and it has its own operation.
 */
export const APPENDABLE_FROM_COLLECTIONS: readonly CollectionId[] =
  TOP_LEVEL_COLLECTIONS.filter((id) => id !== 'custom_sections');
export type AppendableSection = (typeof APPENDABLE_SECTIONS)[number];
export const AppendableSectionSchema = z.enum(APPENDABLE_SECTIONS);

/**
 * An entry the candidate added to a listed section.
 *
 * `ref` is minted when the entry is created and is how a later `drop` names it.
 * NOT an index: an index is a claim about the base the overlay was written
 * against, and the base changes every time the writer runs again.
 *
 * `entry` is validated against the section's own schema at apply time, so an
 * appended role is the same shape as a written one and is edited through the
 * same locked nodes.
 */
export const AppendEditSchema = z.object({
  kind: z.literal('append'),
  ref: z.string().min(1),
  section: AppendableSectionSchema,
  entry: z.unknown(),
  author: ContentAuthorSchema,
});
export type AppendEdit = z.infer<typeof AppendEditSchema>;

/**
 * Removal of an addition THIS overlay made.
 *
 * There is deliberately no way to express the removal of writer-produced
 * content. The match score, the requirement audit and `still_missing[]` are all
 * derived against what the writer produced; a document that can silently lose a
 * grounded role is one those derivations no longer describe. Correcting such a
 * role is the `set` path, which already exists.
 */
export const DropEditSchema = z.object({
  kind: z.literal('drop'),
  ref: z.string().min(1),
});
export type DropEdit = z.infer<typeof DropEditSchema>;

/** A section the schema has no concept of, declared by the candidate. */
export const SectionEditSchema = z.object({
  kind: z.literal('section'),
  ref: z.string().min(1),
  heading: z.string().min(1),
  entries: z.array(CustomEntrySchema).default([]),
  author: ContentAuthorSchema,
});
export type SectionEdit = z.infer<typeof SectionEditSchema>;

/**
 * The schema an appended entry is validated against, per section.
 *
 * An appended role is the SAME shape as a written one — that is what lets it be
 * edited through the same locked nodes and rendered by the same template code.
 * A candidate fills fields; they never compose a layout.
 */
const APPEND_SCHEMAS = {
  experience: COLLECTIONS.experience.item,
  education: COLLECTIONS.education.item,
  skills: COLLECTIONS.skills.item,
  certifications: COLLECTIONS.certifications.item,
  links: COLLECTIONS.links.item,
} satisfies Record<AppendableSection, z.ZodTypeAny>;

/**
 * One position in a collection, named by WHAT it is rather than by where it sits.
 *
 * A base index names an entry the writer produced; a `ref` names an addition
 * this overlay made. Naming an addition by its ref rather than by its index is
 * what stops dropping one addition from silently re-pointing the slots after it,
 * which a bare list of numbers would.
 *
 * When `document-composition` (#37) mints server-side entry ids, both arms
 * collapse into `{ id }` and the resolution below loses its stale-index branch.
 */
export const SlotSchema = z.union([
  z.object({ base: z.number().int().nonnegative() }),
  z.object({ ref: z.string().min(1) }),
]);
export type Slot = z.infer<typeof SlotSchema>;

/** Stable text for a slot, so two slots can be compared without a type test. */
export const slotKey = (slot: Slot): string =>
  'base' in slot ? `b${slot.base}` : `r${slot.ref}`;

/**
 * The order the candidate put a collection in.
 *
 * Stored as an ORDERING rather than applied by renumbering the overlay's paths.
 * A renumbering is a claim about the base an overlay was written against, and
 * that base changes every time the writer runs again; an ordering is a claim
 * about nothing but itself. Applied last — see `applyPresentation` — so every
 * replacement has already landed on the position it was written against.
 */
export const ReorderEditSchema = z.object({
  kind: z.literal('reorder'),
  section: AppendableSectionSchema,
  order: z.array(SlotSchema),
});
export type ReorderEdit = z.infer<typeof ReorderEditSchema>;

/**
 * A writer-produced entry the candidate does not want on this document.
 *
 * HIDDEN, not deleted, and the distinction is not softness. `match_score`, the
 * requirement audit and `still_missing[]` are all derived against what the
 * writer produced; deleting a role would leave those figures describing a
 * document that no longer exists. A hidden entry is absent from the render and
 * from every export, restorable by the candidate, and still visible as a hidden
 * entry to anything that reads the overlay.
 */
export const HideEditSchema = z.object({
  kind: z.literal('hide'),
  section: AppendableSectionSchema,
  base: z.number().int().nonnegative(),
});
export type HideEdit = z.infer<typeof HideEditSchema>;

/**
 * One operation in the overlay.
 *
 * `kind` is INJECTED as `'set'` when absent, which is what makes this change
 * additive rather than a migration: every overlay stored before structural
 * operations existed is a list of bare `{path, value}` objects, and each one
 * parses here as the replacement it has always been, with exactly its previous
 * meaning.
 */
export const ResumeEditSchema = z.preprocess(
  (raw) =>
    raw && typeof raw === 'object' && !('kind' in raw)
      ? { ...(raw as Record<string, unknown>), kind: 'set' }
      : raw,
  z.discriminatedUnion('kind', [
    SetEditSchema,
    AppendEditSchema,
    DropEditSchema,
    SectionEditSchema,
    ReorderEditSchema,
    HideEditSchema,
  ]),
);
export type ResumeEdit = z.infer<typeof ResumeEditSchema>;

/**
 * Narrowing helpers, so callers never re-derive the discriminant by hand.
 *
 * `isSetEdit` treats a MISSING `kind` as a replacement, and that is not
 * belt-and-braces: the schema injects the default only for values that pass
 * through it, and an overlay read straight out of storage and handed to
 * `applyPresentation` never does. Without this, every edit written before
 * structural operations existed would be silently skipped — the whole document
 * reverting to the writer's wording with nothing reported. Backward
 * compatibility has to hold at runtime, not only at the parse boundary.
 */
export const isSetEdit = (edit: ResumeEdit): edit is SetEdit =>
  (edit as { kind?: unknown }).kind === undefined || edit.kind === 'set';
export const isAppendEdit = (edit: ResumeEdit): edit is AppendEdit =>
  edit.kind === 'append';
export const isDropEdit = (edit: ResumeEdit): edit is DropEdit =>
  edit.kind === 'drop';
export const isSectionEdit = (edit: ResumeEdit): edit is SectionEdit =>
  edit.kind === 'section';
export const isReorderEdit = (edit: ResumeEdit): edit is ReorderEdit =>
  edit.kind === 'reorder';
export const isHideEdit = (edit: ResumeEdit): edit is HideEdit =>
  edit.kind === 'hide';

/**
 * The overlay with additions nobody ever typed into taken out of it.
 *
 * An overlay records what the candidate DECIDED. An addition whose entry is
 * still entirely empty records no decision: there is nothing in it, `renderText`
 * already omits it from the text export, and the document being read draws no
 * item for it. What it does do is persist — so pressing add and walking away
 * leaves a permanent, invisible entry behind, and a control that appeared not to
 * work left one per press.
 *
 * Applied when a stored overlay is ADOPTED, and deliberately nowhere else. As a
 * filter on the projection it would delete the entry the candidate has this
 * second pressed add for, before they could type a character into it; as a rule
 * of the save it would race the typing. At load the question is unambiguous:
 * this addition survived a reload with nothing in it, so nothing is lost by
 * dropping it, and one press brings back an identical one.
 *
 * `drop` edits naming a removed addition go with it — there is nothing left to
 * drop — and the refs are taken out of any ordering, since a slot pointing at an
 * addition that no longer exists is a slot `collectionOrder` would skip anyway.
 *
 * Additions the candidate has typed into are untouched: `presentationEdits`
 * folds typed values INTO the addition's own entry, so an entry with a word in
 * it is not unfilled.
 */
export function withoutUnfilledAdditions(edits: ResumeEdits): ResumeEdits {
  const empty = new Set(
    edits
      .filter((edit) => isAppendEdit(edit) && isUnfilled(edit.entry))
      .map((edit) => (edit as AppendEdit).ref),
  );
  if (empty.size === 0) return edits;

  const kept: ResumeEdits = [];
  for (const edit of edits) {
    if (
      (isAppendEdit(edit) || isDropEdit(edit)) &&
      empty.has((edit as AppendEdit | DropEdit).ref)
    ) {
      continue;
    }
    if (isReorderEdit(edit)) {
      kept.push({
        ...edit,
        order: edit.order.filter(
          (slot) => !('ref' in slot && empty.has(slot.ref)),
        ),
      });
      continue;
    }
    kept.push(edit);
  }
  return kept;
}

/**
 * The overlay: only what actually changed.
 *
 * A **list**, not a `path → value` map, and the reason is the storage layer.
 * `RunStore.update` writes with Firestore's `set(…, { merge: true })`, which
 * DEEP-merges maps: a candidate who reverted a bullet to the writer's wording
 * would drop that key from the overlay and Firestore would faithfully keep the
 * old one, so the edit could never be undone. Merge replaces an array wholesale,
 * so the overlay says what it means. (It also sidesteps the question of dots in
 * Firestore map keys, which every path would have had.)
 *
 * Paths are unique — two replacements of one field is an ambiguity, not an
 * ordering question.
 */
export const ResumeEditsSchema = z
  .array(ResumeEditSchema)
  .refine(
    (edits) => {
      const paths = edits.filter(isSetEdit).map((e) => e.path);
      return new Set(paths).size === paths.length;
    },
    { message: 'Each resume field path may be edited at most once.' },
  )
  /*
   * Additions are identified by `ref`, so two additions sharing one is the same
   * ambiguity a duplicated path is — and it would make a `drop` name two things.
   */
  .refine(
    (edits) => {
      const refs = edits
        .filter((e) => isAppendEdit(e) || isSectionEdit(e))
        .map((e) => (e as AppendEdit | SectionEdit).ref);
      return new Set(refs).size === refs.length;
    },
    { message: 'Each added entry may be declared at most once.' },
  )
  /*
   * A `drop` may only name an addition this same overlay made. This is where
   * "the candidate may not remove what the writer produced" is actually
   * enforced — the operation is simply not expressible against anything else.
   */
  .refine(
    (edits) => {
      const added = new Set(
        edits
          .filter((e) => isAppendEdit(e) || isSectionEdit(e))
          .map((e) => (e as AppendEdit | SectionEdit).ref),
      );
      return edits.filter(isDropEdit).every((drop) => added.has(drop.ref));
    },
    {
      message:
        'A removal may only name an entry the same overlay added; writer-produced content cannot be removed.',
    },
  );
export type ResumeEdits = z.infer<typeof ResumeEditsSchema>;

/**
 * Typefaces the document may use.
 *
 * A curated set, and the curation is the point: every entry is metrically
 * common and extracts cleanly in a screening system. That is what lets a
 * template keep advertising ATS safety while the candidate chooses — a free
 * font field could not.
 *
 * Each entry has two parts. `supplied` is the face the **product ships**, in
 * `libs/resume-templates/src/fonts`, and it leads `stack` so it is what the
 * document is actually drawn in; every supplied face is metrically compatible
 * with the typeface the entry names, wherever such a face exists. `stack` keeps
 * the system families behind it as the declared fallback, so a font file that
 * fails to load degrades to the previous behaviour rather than to nothing.
 *
 * Supplying the faces is what makes the document the same everywhere. A résumé
 * set in "Calibri" used to reach a Mac with no Calibri, Candara, Segoe or Optima
 * installed, fall through the whole stack, and be drawn in Arial — so no two
 * readers saw the same document and no server could match either of them.
 *
 * Data here rather than in the toolbar because two surfaces read it: the editor
 * and the PDF renderer. A font list maintained inside a React component is a
 * list the server renderer silently disagrees with.
 */
export const DOCUMENT_FONTS = {
  helvetica: {
    name: 'Helvetica',
    supplied: 'TeX Gyre Heros',
    stack:
      "'TeX Gyre Heros', 'Helvetica Neue', Helvetica, Arial, 'Liberation Sans', sans-serif",
  },
  arial: {
    name: 'Arial',
    supplied: 'Arimo',
    stack:
      "Arimo, Arial, 'Helvetica Neue', Helvetica, 'Liberation Sans', sans-serif",
  },
  calibri: {
    name: 'Calibri',
    supplied: 'Carlito',
    stack:
      "Carlito, Calibri, Candara, Segoe, 'Segoe UI', Optima, Arial, sans-serif",
  },
  georgia: {
    name: 'Georgia',
    supplied: 'Gelasio',
    stack: "Gelasio, Georgia, Cambria, 'Times New Roman', Times, serif",
  },
  garamond: {
    name: 'Garamond',
    supplied: 'EB Garamond',
    stack:
      "'EB Garamond', Garamond, Baskerville, 'Baskerville Old Face', 'Times New Roman', serif",
  },
  times: {
    name: 'Times',
    supplied: 'Tinos',
    stack: "Tinos, 'Times New Roman', Times, Georgia, serif",
  },
  /*
   * The four below are the product's OWN choices rather than stand-ins for a
   * typeface a reader might have installed.
   *
   * The six above answer "the candidate asked for Calibri": each is metrically
   * compatible with a named face, so a résumé keeps the line breaks that face
   * would have produced. These answer a different question — the six cover two
   * registers, a neo-grotesque sans and a transitional serif, three times each,
   * so "more fonts" was really "more than two ways for a résumé to look".
   *
   * `supplied` is the face's own name here, because there is nothing to stand
   * in for. Each still leads a stack that degrades to something of its own
   * register if the file fails to load.
   */
  lato: {
    name: 'Lato',
    supplied: 'Lato',
    stack: "Lato, 'Segoe UI', Candara, Optima, Calibri, sans-serif",
  },
  condensed: {
    name: 'Roboto Condensed',
    supplied: 'Roboto Condensed',
    stack:
      "'Roboto Condensed', 'Arial Narrow', 'Helvetica Neue Condensed', 'Liberation Sans Narrow', sans-serif",
  },
  ptserif: {
    name: 'PT Serif',
    supplied: 'PT Serif',
    stack: "'PT Serif', Charter, Cambria, Georgia, 'Times New Roman', serif",
  },
  bitter: {
    name: 'Bitter',
    supplied: 'Bitter',
    stack:
      "Bitter, 'Roboto Slab', Rockwell, 'Courier New', Cambria, Georgia, serif",
  },
} as const;

export type DocumentFontId = keyof typeof DOCUMENT_FONTS;
export const DocumentFontIdSchema = z.enum(
  Object.keys(DOCUMENT_FONTS) as [DocumentFontId, ...DocumentFontId[]],
);

/**
 * Inks a document (or one line of it) may be set in.
 *
 * Document colours, deliberately dark and low-chroma: a resume is read on paper
 * and in an ATS, and a palette is what keeps "readable when printed in
 * greyscale" true without asking the candidate to know that.
 */
export const INK_COLORS = {
  ink: { name: 'Ink', hex: '#111111' },
  slate: { name: 'Slate', hex: '#33414f' },
  navy: { name: 'Navy', hex: '#1c3a63' },
  maroon: { name: 'Maroon', hex: '#6b2434' },
  forest: { name: 'Forest', hex: '#1f4433' },
  grey: { name: 'Grey', hex: '#5a5a5a' },
} as const;

export type InkId = keyof typeof INK_COLORS;
export const InkIdSchema = z.enum(
  Object.keys(INK_COLORS) as [InkId, ...InkId[]],
);

/**
 * How open the document's vertical rhythm is — a MULTIPLIER on the template's
 * own spacing, for the same reason `scale` multiplies its type scale rather than
 * setting a point size.
 *
 * A template's spacing is a set of relationships: the gap under a section
 * heading is smaller than the gap between two sections, and that is a
 * typographic decision the template made. A multiplier preserves those
 * relationships; a set of measurements would let a candidate put more air
 * between a heading and its own body than between two sections.
 *
 * Named rather than continuous because the useful positions are three —
 * "tighter", "as designed", "more open" — and three named values are three test
 * cases in the guarantee suite.
 */
export const DENSITIES = {
  tight: { name: 'Tight', factor: 0.85 },
  normal: { name: 'Normal', factor: 1 },
  roomy: { name: 'Roomy', factor: 1.15 },
} as const;

export type DensityId = keyof typeof DENSITIES;
export const DensityIdSchema = z.enum(
  Object.keys(DENSITIES) as [DensityId, ...DensityId[]],
);

/** What a document is spaced at before anybody chooses. */
export const DENSITY_DEFAULT: DensityId = 'normal';

/**
 * Extra space above one section, or one field.
 *
 * The `steps` are counted in the template's OWN spacing unit, not in any
 * absolute measure — `s2` is two of whatever a section gap is in that template,
 * so Harvard's `s2` and Executive's `s2` are both "noticeably more air" in their
 * respective rhythms rather than the same number of millimetres in both.
 *
 * This is the control a candidate actually reaches for when a section feels
 * cramped. Without it the only way to close a gap is the type scale, which
 * makes every word smaller to fix a margin.
 *
 * A SCALE, not a set of presets, and that is a consequence of what the control
 * turned out to be. The catalog began as `sm` / `md` / `lg` — three names for a
 * picker in a panel. The control is the gap itself now, dragged where the space
 * will appear, and a drag with three stops reads as a switch: somebody closing
 * up a header is adjusting a distance, not choosing an adjective.
 *
 * So it is a fine scale with a ceiling: fifths of a unit, up to 200. Fine
 * enough that the drag tracks the hand and a gap can be nudged rather than
 * jumped, bounded so that the whole product of styling combinations is still
 * enumerable — which is what the ATS guarantee test walks, and the condition on
 * having a drag at all. Nothing here is a measurement: the number counts the
 * template's unit, and the template decides what that is.
 */
/** The finest adjustment the scale can express, in template units. */
export const SPACE_QUANTUM = 0.2;
/** The most space a gap can hold, in template units. */
export const SPACE_LIMIT = 200;

/**
 * Built rather than written out, because 1,000 named constants is a table
 * nobody reads and one that cannot drift from its own arithmetic. The id keeps
 * the number legible in a stored document — `s3_4` is three and two fifths of
 * the template's unit — and the tenths are underscored because a dot is a path
 * separator everywhere else in this file.
 */
export const SECTION_SPACES: Record<string, { name: string; steps: number }> =
  Object.fromEntries([
    ['none', { name: 'None', steps: 0 }],
    ...Array.from(
      { length: Math.round(SPACE_LIMIT / SPACE_QUANTUM) },
      (_, i) => {
        const steps = Number(((i + 1) * SPACE_QUANTUM).toFixed(1));
        const id = `s${String(steps).replace('.', '_')}`;
        return [id, { name: `${steps}`, steps }] as const;
      },
    ),
  ]);

export type SectionSpaceId = keyof typeof SECTION_SPACES;
export const SectionSpaceIdSchema = z.enum(
  Object.keys(SECTION_SPACES) as [SectionSpaceId, ...SectionSpaceId[]],
);

/** The scale in order, shallowest first. `none` is the first step, not a gap. */
export const SPACE_SCALE = (
  Object.keys(SECTION_SPACES) as SectionSpaceId[]
).sort((a, b) => SECTION_SPACES[a].steps - SECTION_SPACES[b].steps);

/** The most steps this catalog can express. */
export const SPACE_MAX_STEPS = SPACE_LIMIT;

/**
 * How many steps a token is worth. `undefined` is none, which is what an
 * absent record means.
 */
export function spaceSteps(id: SectionSpaceId | undefined): number {
  return id ? SECTION_SPACES[id].steps : 0;
}

/**
 * The token for a number of steps, clamped to the scale.
 *
 * The one place a number becomes a token, so a drag — which is arithmetic on a
 * pointer — cannot express a value the catalog does not hold. Anything off the
 * scale lands on its nearest end rather than being refused: a candidate who
 * drags past the bottom has asked for no space, and a control that stopped
 * responding would read as broken.
 */
export function spaceAtStep(steps: number): SectionSpaceId {
  // Quantised first, so a pointer position lands on the scale rather than
  // between two of its values.
  const wanted = Number(
    (Math.round(steps / SPACE_QUANTUM) * SPACE_QUANTUM).toFixed(1),
  );
  if (wanted <= 0) return 'none' as SectionSpaceId;
  const found = SPACE_SCALE.find((id) => SECTION_SPACES[id]?.steps === wanted);
  return found ?? (SPACE_SCALE[SPACE_SCALE.length - 1] as SectionSpaceId);
}

/**
 * The sections spacing can be keyed by.
 *
 * A fixed enum of the sections a `ResumeObject` already has — deliberately NOT a
 * composition model. "Space above Experience" is answerable today, and making it
 * wait for sections to become addable, removable and orderable would hold a small
 * control hostage to a much larger change.
 */
export const RESUME_SECTIONS = [
  'summary',
  'skills',
  'experience',
  'education',
  'certifications',
] as const;

export type ResumeSectionId = (typeof RESUME_SECTIONS)[number];
export const ResumeSectionIdSchema = z.enum(RESUME_SECTIONS);

/**
 * The document size scale — a MULTIPLIER on the template's own type scale, not a
 * point size.
 *
 * The template's sizes are a set of relationships (name over heading over body);
 * a multiplier preserves them, whereas a point size would let a candidate set
 * body text larger than the headings above it. Bounded because the useful range
 * is "fit it on one page" / "fill the page", and everything past that is a worse
 * resume.
 */
export const SCALE_MIN = 0.85;
export const SCALE_MAX = 1.2;
export const SCALE_STEP = 0.05;
export const SCALE_DEFAULT = 1;

/** Round to the nearest representable scale, clamped to the bounds. */
export function normalizeScale(value: number): number {
  const stepped = Math.round(value / SCALE_STEP) * SCALE_STEP;
  const clamped = Math.min(SCALE_MAX, Math.max(SCALE_MIN, stepped));
  // Steps of 0.05 are not exact in binary; two decimals is the domain's precision.
  return Number(clamped.toFixed(2));
}

/**
 * How the whole document is set. Absent means the template's own defaults — a
 * resume nobody has styled renders exactly as the template defines it.
 */
export const DocumentStyleSchema = z.object({
  font: DocumentFontIdSchema,
  ink: InkIdSchema,
  scale: z
    .number()
    .min(SCALE_MIN)
    .max(SCALE_MAX)
    .describe('Multiplier on the template type scale.'),
  /*
   * The colour a template rules its headings, hairlines and header band with.
   *
   * Typed `InkIdSchema` on purpose: an accent IS a document colour, and the
   * product already has one vetted palette for those — low-chroma and dark
   * enough to survive greyscale printing. A second palette would be a second
   * answer to the same question and a second thing to keep honest.
   *
   * Optional, because absent means the template's own accent, which is what
   * every stored document has.
   */
  accent: InkIdSchema.optional(),
  /** Absent means the template's own rhythm — see {@link DENSITIES}. */
  density: DensityIdSchema.optional(),
});
export type DocumentStyle = z.infer<typeof DocumentStyleSchema>;

/** How one line is set, over and above the document's own style. */
export const FieldAlignSchema = z.enum(['left', 'center', 'right']);
export type FieldAlign = z.infer<typeof FieldAlignSchema>;

export const FieldFormatSchema = z.object({
  path: ResumeFieldPathSchema,
  bold: z.boolean().optional(),
  align: FieldAlignSchema.optional(),
  ink: InkIdSchema.optional(),
  /** Extra space above this field — the one place a section rule cannot reach. */
  space: SectionSpaceIdSchema.optional(),
  /*
   * Where this field points, if anywhere.
   *
   * CONTENT carried on the per-path record, not formatting — the distinction
   * that matters is `BOUNDED_NODE_PROPS`, which admits `href` as a validated
   * domain type rather than as a free string. It rides here because this is
   * already the per-path channel that travels the save path and is addressed by
   * the same paths the edits use; a second parallel map keyed the same way
   * would be a second thing to keep in step.
   *
   * Validated by `LinkTargetSchema`, so a `javascript:` target cannot reach a
   * stored document, let alone an exported one.
   */
  href: LinkTargetSchema.optional(),
});
export type FieldFormat = z.infer<typeof FieldFormatSchema>;

/** A format carrying no flags says nothing; it is dropped rather than stored. */
export function formatIsEmpty(format: FieldFormat): boolean {
  return (
    format.bold === undefined &&
    format.align === undefined &&
    format.ink === undefined &&
    format.href === undefined &&
    // `none` is the absence of space, not a spacing — storing it would leave a
    // record of a control being returned to where it started.
    (format.space === undefined || format.space === 'none')
  );
}

/**
 * Per-field formatting.
 *
 * A **list** for the same reason `edits` is one: `RunStore.update` writes through
 * Firestore's `set(…, { merge: true })`, which deep-merges maps, so formatting a
 * candidate cleared would survive its own clearing.
 */
export const ResumeFormatsSchema = z
  .array(FieldFormatSchema)
  .refine((f) => new Set(f.map((x) => x.path)).size === f.length, {
    message: 'Each resume field path may be formatted at most once.',
  })
  .refine((f) => f.every((x) => !formatIsEmpty(x)), {
    message: 'A format with no emphasis, alignment or ink is not stored.',
  });
export type ResumeFormats = z.infer<typeof ResumeFormatsSchema>;

/** The format for one path, or undefined when the field carries none. */
export function formatFor(
  formats: ResumeFormats | undefined,
  path: string,
): FieldFormat | undefined {
  return formats?.find((f) => f.path === path);
}

/**
 * Named presets over the document style.
 *
 * A theme is a STARTING POINT, not a mode: applying one writes concrete values
 * and nothing records that a theme was used. Storing a theme id instead would
 * make a saved document's appearance depend on a definition that can change
 * after it was saved — the same class of defect as an unversioned renderer,
 * reintroduced for no benefit. Concrete values keep rendering a pure function of
 * stored data, which is what a server-side render requires.
 *
 * The cost is that the editor cannot say "you are on Classic" afterwards. That
 * is a label, and it is not worth a second source of truth about how a document
 * looks.
 */
export const THEMES = {
  classic: {
    name: 'Classic',
    description: 'Serif and restrained',
    style: {
      font: 'times',
      ink: 'ink',
      accent: 'ink',
      density: 'normal',
    },
  },
  modern: {
    name: 'Modern',
    description: 'Open and current',
    style: {
      font: 'helvetica',
      ink: 'slate',
      accent: 'navy',
      density: 'roomy',
    },
  },
  compact: {
    name: 'Compact',
    description: 'Tight, fits more',
    style: {
      font: 'arial',
      ink: 'ink',
      accent: 'grey',
      density: 'tight',
    },
  },
  academic: {
    name: 'Academic',
    description: 'Formal and sober',
    style: {
      font: 'georgia',
      ink: 'ink',
      accent: 'maroon',
      density: 'normal',
    },
  },
} as const satisfies Record<
  string,
  {
    name: string;
    /** One line telling a candidate what it looks like, not what it sets. */
    description: string;
    style: {
      font: DocumentFontId;
      ink: InkId;
      accent: InkId;
      density: DensityId;
    };
  }
>;

export type ThemeId = keyof typeof THEMES;

/**
 * Apply a theme, preserving what the theme does not speak to.
 *
 * The size scale survives: it is how a candidate fits their resume on one page,
 * which is a decision about THEIR document rather than about its styling, and
 * silently resetting it would undo work a theme has no opinion about.
 */
export function applyTheme(style: DocumentStyle, id: ThemeId): DocumentStyle {
  return { ...style, ...THEMES[id].style };
}

/** Extra space above one named section. */
export const SectionSpacingSchema = z.object({
  section: ResumeSectionIdSchema,
  space: SectionSpaceIdSchema,
});
export type SectionSpacing = z.infer<typeof SectionSpacingSchema>;

/**
 * Space above the document's sections.
 *
 * A **list**, for exactly the reason `edits` and `formats` are lists:
 * `RunStore.update` writes through Firestore's `set(…, { merge: true })`, which
 * deep-merges maps — so a spacing the candidate cleared would survive its own
 * clearing if this were keyed.
 *
 * `none` is refused rather than stored for the same reason `formatIsEmpty`
 * drops an empty format: returning a control to where it started should leave no
 * trace, so an untouched document stores nothing.
 */
export const ResumeSectionSpacingSchema = z
  .array(SectionSpacingSchema)
  .refine((s) => new Set(s.map((x) => x.section)).size === s.length, {
    message: 'Each section may be spaced at most once.',
  })
  .refine((s) => s.every((x) => x.space !== 'none'), {
    message: 'A section spaced by nothing is not stored.',
  });
export type ResumeSectionSpacing = z.infer<typeof ResumeSectionSpacingSchema>;

/** The spacing for one section, or undefined when it carries none. */
export function spacingFor(
  spacing: ResumeSectionSpacing | undefined,
  section: string,
): SectionSpacing | undefined {
  return spacing?.find((s) => s.section === section);
}

/**
 * How a run's resume is presented: which template, and the candidate's own
 * corrections on top of what the writer produced.
 *
 * Deliberately NOT the editor's serialized node tree. The tree is
 * template-shaped and library-shaped; this is neither, so switching template
 * loses nothing, `ResumeObjectSchema` still governs the result, and renaming a
 * React component cannot invalidate a stored document.
 *
 * @pii `edits` holds resume text. It lives on the run record beside the result
 * it corrects, so it shares that run's owner scope, retention, and deletion.
 */
export const ResumePresentationSchema = z.object({
  template_id: TemplateIdSchema,
  edits: ResumeEditsSchema.default([]),
  /** Absent means the template's own typography (`resume-document-formatting`). */
  style: DocumentStyleSchema.optional(),
  /** Absent means no line carries formatting of its own. */
  formats: ResumeFormatsSchema.optional(),
  /** Absent means every section sits where the template puts it. */
  section_spacing: ResumeSectionSpacingSchema.optional(),
  updated_at: z.string(),
});
export type ResumePresentation = z.infer<typeof ResumePresentationSchema>;

/** `PUT /runs/:id/presentation` request. The server owns `updated_at`. */
export const PutPresentationRequestSchema = z.object({
  template_id: TemplateIdSchema,
  edits: ResumeEditsSchema.default([]),
  style: DocumentStyleSchema.optional(),
  formats: ResumeFormatsSchema.optional(),
  section_spacing: ResumeSectionSpacingSchema.optional(),
});
export type PutPresentationRequest = z.infer<
  typeof PutPresentationRequestSchema
>;

type Container = Record<string, unknown> | unknown[];

function isContainer(value: unknown): value is Container {
  return typeof value === 'object' && value !== null;
}

/** Walk to the container that holds `path`'s last segment, or `undefined`. */
function resolveParent(
  root: Container,
  segments: string[],
): Container | undefined {
  let node: unknown = root;
  for (const segment of segments) {
    if (!isContainer(node)) return undefined;
    node = Array.isArray(node)
      ? node[Number(segment)]
      : (node as Record<string, unknown>)[segment];
  }
  return isContainer(node) ? node : undefined;
}

/** The value a path addresses, or `undefined` when it does not resolve. */
export function readAtPath(resume: ResumeObject, path: string): unknown {
  if (!isResumeFieldPath(path)) return undefined;
  const segments = path.split('.');
  const leaf = segments.pop() as string;
  const parent = resolveParent(resume as unknown as Container, segments);
  if (parent === undefined) return undefined;
  return Array.isArray(parent)
    ? parent[Number(leaf)]
    : (parent as Record<string, unknown>)[leaf];
}

/**
 * The order a collection is actually drawn in, as slots.
 *
 * THE single definition of "which entries exist here, and in what order" —
 * `applyPresentation` builds the rendered array from it and the editor builds
 * its field paths from it, so the document and the paths into it can never
 * disagree. The same reasoning `appendedEntryRefs` records: a renderer that
 * recomputed this would be a second definition, free to drift.
 *
 * Total by construction. A slot that does not resolve is dropped, an entry no
 * slot names keeps its natural order after the ones that are named, and a
 * duplicated slot keeps its first occurrence — so an ordering written against a
 * résumé the writer has since replaced degrades to the writer's own order
 * rather than to a document that will not open.
 */
export function collectionOrder(
  base: ResumeObject,
  edits: ResumeEdits,
  section: AppendableSection,
): Slot[] {
  const hidden = new Set(
    edits
      .filter(isHideEdit)
      .filter((e) => e.section === section)
      .map((e) => e.base),
  );
  const dropped = new Set(edits.filter(isDropEdit).map((e) => e.ref));

  const natural: Slot[] = [];
  const baseLength = (base[section] as unknown[] | undefined)?.length ?? 0;
  for (let i = 0; i < baseLength; i += 1) {
    if (!hidden.has(i)) natural.push({ base: i });
  }
  for (const edit of edits) {
    if (!isAppendEdit(edit) || edit.section !== section) continue;
    if (dropped.has(edit.ref)) continue;
    if (!APPEND_SCHEMAS[section].safeParse(edit.entry).success) continue;
    natural.push({ ref: edit.ref });
  }

  // The last ordering wins: two orderings of one collection is not an
  // ambiguity to resolve, it is a stale one and a current one.
  const reorder = edits
    .filter(isReorderEdit)
    .filter((e) => e.section === section)
    .at(-1);
  if (!reorder) return natural;

  const available = new Map(natural.map((slot) => [slotKey(slot), slot]));
  const ordered: Slot[] = [];
  for (const slot of reorder.order) {
    const key = slotKey(slot);
    const found = available.get(key);
    if (!found) continue;
    available.delete(key);
    ordered.push(found);
  }
  ordered.push(...available.values());
  return ordered;
}

/**
 * Apply a presentation's edits to the writer's resume and validate the result.
 *
 * Pure: no I/O, no model call, and the input is never mutated — the run's
 * `result.resume_object` stays exactly what the model produced, so an edit is
 * reversible by dropping the overlay and the grounding record survives.
 *
 * A path that does not resolve is **skipped**, not thrown. A stored overlay is
 * data at rest that outlives the code that wrote it; a retired field must
 * degrade to a dropped edit, never to a resume that will not open.
 *
 * @throws if the edits would produce a resume the schema refuses.
 */
export function applyPresentation(
  resume: ResumeObject,
  edits: ResumeEdits,
): PresentedResume {
  const draft = structuredClone(resume) as unknown as Container;

  /*
   * Structural operations run FIRST, and replacements second.
   *
   * The order is load-bearing: an appended entry becomes an ordinary member of
   * its section, so a `set` naming `experience.4.title` can address it. Running
   * replacements first would make an edit to an added entry depend on whether
   * the entry happened to exist yet, which is exactly the ordering ambiguity
   * the unique-path rule exists to avoid.
   */
  const dropped = new Set(edits.filter(isDropEdit).map((e) => e.ref));

  for (const edit of edits) {
    if (isAppendEdit(edit)) {
      if (dropped.has(edit.ref)) continue;
      const target = (draft as Record<string, unknown>)[edit.section];
      if (!Array.isArray(target)) continue;
      /*
       * Parsed against the section's own schema. An entry that does not fit is
       * skipped rather than thrown, for the same reason a stale path is: a
       * stored overlay outlives the code that wrote it, and a résumé that will
       * not open is a worse failure than an addition that does not show.
       */
      const schema = APPEND_SCHEMAS[edit.section];
      const parsed = schema.safeParse(edit.entry);
      if (!parsed.success) continue;
      /*
       * No `ref` is written into the résumé. The entry keeps its section's own
       * shape, so `ResumeObject` stays exactly what a template already renders
       * and the writer's entry schemas gain nothing. Which entries a candidate
       * added is DERIVED instead — appends land after the base entries in
       * overlay order, so the boundary is `base[section].length`. See
       * `appendedRefs` below.
       */
      target.push(parsed.data);
      continue;
    }

    if (isSectionEdit(edit)) {
      if (dropped.has(edit.ref)) continue;
      const sections = (draft as Record<string, unknown>)['custom_sections'];
      if (!Array.isArray(sections)) continue;
      sections.push({
        id: edit.ref,
        heading: edit.heading,
        entries: edit.entries,
        author: edit.author,
      });
    }
  }

  for (const edit of edits) {
    if (!isSetEdit(edit)) continue;
    const { path, value } = edit;
    if (!isResumeFieldPath(path)) continue;
    const segments = path.split('.');
    const leaf = segments.pop() as string;
    const parent = resolveParent(draft, segments);
    if (parent === undefined) continue;

    if (Array.isArray(parent)) {
      const index = Number(leaf);
      // Replacing past the end would leave holes the schema then rejects; an
      // out-of-range edit is a stale path, which is the skip case.
      if (!Number.isInteger(index) || index < 0 || index >= parent.length)
        continue;
      parent[index] = value;
    } else {
      // An unknown key is left to `ResumeObjectSchema`, which strips it.
      (parent as Record<string, unknown>)[leaf] = value;
    }
  }

  /*
   * Hides and orderings LAST, once every replacement has landed.
   *
   * This is what lets an ordering coexist with positional paths: at the moment
   * a `set` is applied nothing has moved, so `experience.1.title` addresses the
   * entry it addressed when it was written. Only then is the array permuted.
   */
  for (const section of APPENDABLE_SECTIONS) {
    const touched = edits.some(
      (edit) =>
        (isReorderEdit(edit) || isHideEdit(edit)) && edit.section === section,
    );
    if (!touched) continue;
    const current = (draft as Record<string, unknown>)[section];
    if (!Array.isArray(current)) continue;

    // Where each slot sits in the draft right now: base entries kept their
    // indices, and appends landed after them in overlay order.
    const refIndex = new Map(
      [...appendedEntryRefs(resume, edits, section)].map(([i, ref]) => [
        ref,
        i,
      ]),
    );
    (draft as Record<string, unknown>)[section] = collectionOrder(
      resume,
      edits,
      section,
    )
      .map((slot) =>
        'base' in slot
          ? current[slot.base]
          : current[refIndex.get(slot.ref) ?? -1],
      )
      .filter((entry) => entry !== undefined);
  }

  /*
   * Parsed as a PRESENTED résumé, not as the writer's.
   *
   * The difference is exactly one thing: an entry the candidate has added and
   * not yet filled in has empty fields, and the writer's schema refuses those —
   * correctly, for the writer. Refusing them here would mean an added entry
   * could not appear on the page until it was already complete.
   */
  return PresentedResumeSchema.parse(draft) as PresentedResume;
}

function sameValue(a: unknown, b: EditValue): boolean {
  if (Array.isArray(b)) {
    return (
      Array.isArray(a) && a.length === b.length && a.every((x, i) => x === b[i])
    );
  }
  /*
   * Nothing where there was nothing.
   *
   * A field the writer's résumé never carried, still blank, is not an edit —
   * it is the absence it always was. This matters because a template may OFFER
   * a field the résumé has no value for: the header's phone number is drawn
   * whether or not there is one, so the candidate has somewhere to type it.
   * Without this, `undefined !== ''` and merely opening the editor wrote an
   * overlay full of empty strings — a document nobody had touched was dirty,
   * and autosave stored it.
   *
   * Clearing a field that DID have a value is still an edit, and still records
   * the empty string: `a` is the old text, not nothing.
   */
  if (b === '' && (a === undefined || a === null)) return true;
  return a === b;
}

/**
 * Where each addition's fields are ADDRESSED, as a path prefix.
 *
 * Past the end of the writer's own array, never among it: an addition to a
 * section of two roles is `experience.2`, whatever position it is drawn in.
 * That is where `applyPresentation` actually puts it — appends are pushed onto
 * the end of the section — so the prefix names the entry in the presented
 * résumé, and it is the scheme `custom_sections` has always used.
 *
 * It used to be the RENDER index, which collided. A candidate who added a role
 * above their second one gave the addition `experience.1`, which is also the
 * writer's second role's own address: the editor built two fields claiming to
 * edit the same path, Craft.js resolved both to one node, and the writer's role
 * was blanked off the page. The `claimed` filter below then swallowed its text
 * as belonging to the addition. Ordering is expressed by a `reorder` edit and
 * by nothing else; an address must not move when a document is rearranged.
 *
 * Used three times, which is the point: to fold an addition's own text into it,
 * to keep those paths out of the replacements, and — through `additionPaths` —
 * by the editor that emits them, so there is one definition rather than two
 * free to drift.
 */
function additionSlots(
  base: ResumeObject,
  structural: ResumeEdits,
): Map<string, string> {
  const slots = new Map<string, string>();
  const dropped = new Set(structural.filter(isDropEdit).map((e) => e.ref));

  for (const section of APPENDABLE_SECTIONS) {
    const written = (base[section] as unknown[] | undefined)?.length ?? 0;
    let ordinal = 0;
    for (const edit of structural) {
      if (!isAppendEdit(edit) || edit.section !== section) continue;
      if (dropped.has(edit.ref)) continue;
      // The same admission test `applyPresentation` applies, so the ordinal
      // counts exactly the entries that reach the résumé.
      if (!APPEND_SCHEMAS[section].safeParse(edit.entry).success) continue;
      slots.set(edit.ref, `${section}.${written + ordinal}`);
      ordinal += 1;
    }
  }

  const written = (base.custom_sections ?? []).length;
  structural
    .filter(isSectionEdit)
    .filter((edit) => !dropped.has(edit.ref))
    .forEach((edit, i) => {
      slots.set(edit.ref, `custom_sections.${written + i}`);
    });
  return slots;
}

/**
 * Where each addition's fields are addressed, for the editor that draws them.
 *
 * Exported so the document emits the paths this module reads back, from this
 * module's own arithmetic. The two were computed separately and disagreed —
 * see `additionSlots` — which is the kind of bug that only shows up as text
 * appearing in the wrong job.
 */
export function additionPaths(
  base: ResumeObject,
  edits: ResumeEdits,
): Map<string, string> {
  return additionSlots(
    base,
    edits.filter((edit) => !isSetEdit(edit)),
  );
}

/**
 * What decides which FIELDS the document has, as opposed to what they say.
 *
 * The editor rebuilds its node tree when this changes, and must not when only
 * the text does. An addition's words live inside its own `append` edit — that
 * is what `foldAdditions` is for — so serializing the overlay whole made every
 * character typed into a newly added role look like a structural change: the
 * tree was rebuilt mid-word and the field the candidate was typing in was
 * unmounted from under them. What a `ref` SAYS is not part of the document's
 * shape; that it exists, and where it sits, is.
 *
 * A custom section's entry COUNT is shape — one more entry is one more set of
 * fields — while its heading and its entries' text are not.
 */
export function documentShapeKey(edits: ResumeEdits): string {
  const shape = edits.flatMap((edit) => {
    if (isAppendEdit(edit)) return [`a:${edit.section}:${edit.ref}`];
    if (isDropEdit(edit)) return [`d:${edit.ref}`];
    if (isHideEdit(edit)) return [`h:${edit.section}:${edit.base}`];
    if (isReorderEdit(edit)) {
      return [`o:${edit.section}:${edit.order.map(slotKey).join(',')}`];
    }
    if (isSectionEdit(edit)) return [`s:${edit.ref}:${edit.entries.length}`];
    return [];
  });
  return shape.join('|');
}

/** Write `value` at `segments` inside `target`, creating nothing that is absent. */
function writeInto(
  target: Record<string, unknown>,
  segments: string[],
  value: EditValue,
): void {
  let node: unknown = target;
  for (const segment of segments.slice(0, -1)) {
    if (!isContainer(node)) return;
    node = Array.isArray(node)
      ? node[Number(segment)]
      : (node as Record<string, unknown>)[segment];
  }
  if (!isContainer(node)) return;
  const leaf = segments[segments.length - 1] as string;
  if (Array.isArray(node)) {
    const index = Number(leaf);
    if (!Number.isInteger(index) || index < 0 || index >= node.length) return;
    node[index] = value;
  } else {
    (node as Record<string, unknown>)[leaf] = value;
  }
}

/**
 * Fold the text a candidate typed into an entry THEY added back into that
 * addition.
 *
 * This is the branch that was missing beside `addressesBase`. An appended entry
 * lives at an index past the end of the writer's array, so every field of it
 * fails that test and is refused as a replacement — correctly, because an
 * out-of-range `set` would retarget the next time the writer produced a résumé
 * of a different length. What was never written was where the value goes
 * instead. It goes here: into the addition that owns it, addressed by `ref`,
 * where no change to the base can move it.
 *
 * Without this, a candidate who adds a role and types into it saves the
 * placeholder the entry was minted with, and exports it.
 */
function foldAdditions(
  base: ResumeObject,
  values: Record<string, EditValue>,
  structural: ResumeEdits,
): ResumeEdits {
  const slotOf = additionSlots(base, structural);

  return structural.map((edit) => {
    if (!isAppendEdit(edit) && !isSectionEdit(edit)) return edit;
    const prefix = slotOf.get(edit.ref);
    if (prefix === undefined) return edit;

    const patch = Object.entries(values).filter(([path]) =>
      path.startsWith(`${prefix}.`),
    );
    if (patch.length === 0) return edit;

    if (isSectionEdit(edit)) {
      const draft = {
        heading: edit.heading,
        entries: structuredClone(edit.entries),
      };
      for (const [path, value] of patch) {
        writeInto(
          draft as unknown as Record<string, unknown>,
          path.slice(prefix.length + 1).split('.'),
          value,
        );
      }
      return { ...edit, heading: draft.heading, entries: draft.entries };
    }

    const entry = structuredClone(edit.entry);
    if (!isContainer(entry)) return edit;
    for (const [path, value] of patch) {
      writeInto(
        entry as Record<string, unknown>,
        path.slice(prefix.length + 1).split('.'),
        value,
      );
    }
    return { ...edit, entry };
  });
}

/**
 * The inverse projection: given the values a surface currently holds, keep only
 * those that differ from the writer's resume.
 *
 * This is what makes an untouched document store nothing, and what keeps the
 * overlay a record of the candidate's corrections rather than a second copy of
 * the whole resume.
 *
 * Sorted by path so that saving the same document twice produces the same
 * overlay — a diff of two saves should show what the candidate changed, not what
 * order a node tree happened to be walked in.
 */
export function presentationEdits(
  base: ResumeObject,
  values: Record<string, EditValue>,
  /*
   * The structural operations the document already carries, passed through
   * untouched.
   *
   * They are not derivable from `values`: an append is a decision the candidate
   * made, not a difference between two texts, and diffing cannot recover it.
   * Defaulted so every existing caller keeps its current behaviour.
   */
  structural: ResumeEdits = [],
): ResumeEdits {
  /*
   * The positions an addition occupies. Any value under one of these belongs to
   * the addition and is folded into it below; emitting it as a replacement as
   * well would write the candidate's new entry over whatever the writer's
   * résumé happens to hold at the same index.
   */
  const claimed = [
    ...additionSlots(
      base,
      structural.filter((edit) => !isSetEdit(edit)),
    ).values(),
  ];

  const sets = Object.entries(values)
    .filter(
      ([path, value]) =>
        isResumeFieldPath(path) &&
        !claimed.some(
          (prefix) => path === prefix || path.startsWith(`${prefix}.`),
        ) &&
        /*
         * Only paths that ADDRESS the writer's résumé become replacements.
         *
         * Without this, the fields of an appended entry — which live at indices
         * past the end of the base array — would each be emitted as a `set` on
         * an out-of-range path. They would even apply, since appends run first,
         * and then silently retarget the wrong entry the next time the writer
         * produced a résumé of a different length. An addition's text belongs to
         * the addition, addressed by `ref`; only the base's own fields are
         * addressed by path.
         */
        addressesBase(base, path) &&
        !sameValue(readAtPath(base, path), value),
    )
    .map(([path, value]) => ({ kind: 'set' as const, path, value }))
    .sort((a, b) => a.path.localeCompare(b.path));

  /*
   * Structural first, then replacements sorted by path — the same order
   * `applyPresentation` resolves them in, so a saved overlay reads in the order
   * it is applied and saving twice produces the same bytes.
   */
  const additions = foldAdditions(
    base,
    values,
    structural.filter((edit) => !isSetEdit(edit)),
  );
  return [...additions, ...sets];
}

/**
 * Whether a path addresses a location in the WRITER's résumé.
 *
 * Distinguishes an out-of-range array index (not addressable — that entry does
 * not exist in the base) from an absent optional field (addressable — a résumé
 * with no `headline` can still have one typed into it). `readAtPath` returns
 * `undefined` for both, which is why this cannot be expressed as a null check.
 */
function addressesBase(base: ResumeObject, path: string): boolean {
  let node: unknown = base;
  for (const segment of path.split('.')) {
    if (Array.isArray(node)) {
      const index = Number(segment);
      if (!Number.isInteger(index) || index < 0 || index >= node.length) {
        return false;
      }
      node = node[index];
    } else if (node !== null && typeof node === 'object') {
      node = (node as Record<string, unknown>)[segment];
    } else {
      // A leaf was reached before the path was consumed.
      return false;
    }
  }
  return true;
}

/**
 * Which entries of a section the candidate added, by their index in the
 * PRESENTED résumé, paired with the `ref` that names them.
 *
 * Derived rather than stored in the document: appends land after the base
 * entries in overlay order, so the boundary is `base[section].length` and the
 * order is the overlay's. That is what lets `ResumeObject` stay exactly the
 * shape a template already renders, with no editor bookkeeping written into it.
 *
 * This is the one place the derivation lives — an editor that recomputed it
 * would be a second definition of "which of these did I add", free to disagree.
 */
export function appendedEntryRefs(
  base: ResumeObject,
  edits: ResumeEdits,
  section: AppendableSection,
): Map<number, string> {
  const dropped = new Set(edits.filter(isDropEdit).map((e) => e.ref));
  const baseLength = (base[section] as unknown[]).length;
  const refs = new Map<number, string>();

  let index = baseLength;
  for (const edit of edits) {
    if (!isAppendEdit(edit) || edit.section !== section) continue;
    if (dropped.has(edit.ref)) continue;
    // Only entries the schema accepts are appended, so only those take a slot.
    if (!APPEND_SCHEMAS[section].safeParse(edit.entry).success) continue;
    refs.set(index, edit.ref);
    index += 1;
  }
  return refs;
}
