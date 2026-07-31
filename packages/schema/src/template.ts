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
  updated_at: z.string(),
});
export type ResumePresentation = z.infer<typeof ResumePresentationSchema>;

/** `PUT /runs/:id/presentation` request. The server owns `updated_at`. */
export const PutPresentationRequestSchema = z.object({
  template_id: TemplateIdSchema,
  edits: ResumeEditsSchema.default([]),
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
