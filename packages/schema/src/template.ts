import { z } from 'zod';
import { ResumeObjectSchema, type ResumeObject } from './resume.js';

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
 */
export const TEMPLATES = {
  harvard: {
    name: 'Harvard',
    description:
      'The classic single-column résumé: centred name block, rule-underlined ' +
      'section headings, and two-column experience entries.',
    page: 'letter',
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
export const ResumeEditSchema = z.object({
  path: ResumeFieldPathSchema,
  value: EditValueSchema,
});
export type ResumeEdit = z.infer<typeof ResumeEditSchema>;

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
  .refine((edits) => new Set(edits.map((e) => e.path)).size === edits.length, {
    message: 'Each resume field path may be edited at most once.',
  });
export type ResumeEdits = z.infer<typeof ResumeEditsSchema>;

/**
 * Typefaces the document may use.
 *
 * A curated set, and the curation is the point: every entry is a **system stack**
 * that needs no download, is metrically common, and extracts cleanly in a
 * screening system. That is what lets a template keep advertising ATS safety
 * while the candidate chooses — a free font field could not.
 *
 * Data here rather than in the toolbar because two surfaces read it: the editor
 * today and the PDF renderer next. A font list maintained inside a React
 * component is a list the server renderer silently disagrees with.
 */
export const DOCUMENT_FONTS = {
  helvetica: {
    name: 'Helvetica',
    stack: "'Helvetica Neue', Helvetica, Arial, 'Liberation Sans', sans-serif",
  },
  arial: {
    name: 'Arial',
    stack: "Arial, 'Helvetica Neue', Helvetica, 'Liberation Sans', sans-serif",
  },
  calibri: {
    name: 'Calibri',
    stack: "Calibri, Candara, Segoe, 'Segoe UI', Optima, Arial, sans-serif",
  },
  georgia: {
    name: 'Georgia',
    stack: "Georgia, Cambria, 'Times New Roman', Times, serif",
  },
  garamond: {
    name: 'Garamond',
    stack:
      "Garamond, Baskerville, 'Baskerville Old Face', 'Times New Roman', serif",
  },
  times: {
    name: 'Times',
    stack: "'Times New Roman', Times, Georgia, serif",
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
 * absolute measure — `md` is two of whatever a section gap is in that template,
 * so Harvard's `md` and Executive's `md` are both "noticeably more air" in their
 * respective rhythms rather than the same number of millimetres in both.
 *
 * This is the control a candidate actually reaches for when a section feels
 * cramped. Without it the only way to change that gap is the type scale, which
 * makes every word smaller to fix a margin.
 */
export const SECTION_SPACES = {
  none: { name: 'None', steps: 0 },
  sm: { name: 'Small', steps: 1 },
  md: { name: 'Medium', steps: 2 },
  lg: { name: 'Large', steps: 3 },
} as const;

export type SectionSpaceId = keyof typeof SECTION_SPACES;
export const SectionSpaceIdSchema = z.enum(
  Object.keys(SECTION_SPACES) as [SectionSpaceId, ...SectionSpaceId[]],
);

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
});
export type FieldFormat = z.infer<typeof FieldFormatSchema>;

/** A format carrying no flags says nothing; it is dropped rather than stored. */
export function formatIsEmpty(format: FieldFormat): boolean {
  return (
    format.bold === undefined &&
    format.align === undefined &&
    format.ink === undefined &&
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
    style: {
      font: 'times',
      ink: 'ink',
      accent: 'ink',
      density: 'normal',
    },
  },
  modern: {
    name: 'Modern',
    style: {
      font: 'helvetica',
      ink: 'slate',
      accent: 'navy',
      density: 'roomy',
    },
  },
  compact: {
    name: 'Compact',
    style: {
      font: 'arial',
      ink: 'ink',
      accent: 'grey',
      density: 'tight',
    },
  },
  academic: {
    name: 'Academic',
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
): ResumeObject {
  const draft = structuredClone(resume) as unknown as Container;

  for (const { path, value } of edits) {
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

  return ResumeObjectSchema.parse(draft);
}

function sameValue(a: unknown, b: EditValue): boolean {
  if (Array.isArray(b)) {
    return (
      Array.isArray(a) && a.length === b.length && a.every((x, i) => x === b[i])
    );
  }
  return a === b;
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
): ResumeEdits {
  return Object.entries(values)
    .filter(
      ([path, value]) =>
        isResumeFieldPath(path) && !sameValue(readAtPath(base, path), value),
    )
    .map(([path, value]) => ({ path, value }))
    .sort((a, b) => a.path.localeCompare(b.path));
}
