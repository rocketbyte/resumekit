import { z } from 'zod';
import {
  CustomEntrySchema,
  CustomSectionSchema,
  EducationSchema,
  ExperienceSchema,
  LinkSchema,
  ResumeObjectSchema,
  SkillGroupSchema,
  type ResumeObject,
} from './resume.js';

/**
 * Every repeatable location in a résumé, declared as data.
 *
 * The table exists so that "may the candidate add one of these?" is answered in
 * ONE place, by a field, rather than by each surface remembering. A control that
 * has to know the professional summary is singular is a control that can forget;
 * `arity: 'one'` cannot.
 *
 * Framework-free, in the manner of `TEMPLATES` and `PLANS`: no component, no
 * React import, and no knowledge of which template draws it.
 */

/** How many items a location holds. `one` is what suppresses an add control. */
export type Arity = 'one' | 'many';

/**
 * What an item is drawn as, which is the only thing a template needs to supply.
 *
 * `entry` is a block with fields of its own; `bullet` is a line in a list;
 * `inline` is a comma-run inside a line; `field` is a single value with no list
 * around it; `section` is a heading with entries under it.
 */
export type CollectionShape =
  'field' | 'entry' | 'bullet' | 'inline' | 'section';

export interface CollectionDef {
  /**
   * Where the location lives, with `*` standing for an index the caller
   * supplies — `experience.*.bullets` is one collection, not one per role.
   */
  readonly path: string;
  readonly arity: Arity;
  readonly shape: CollectionShape;
  /** Whether the candidate may change the order of what is here. */
  readonly reorderable: boolean;
  /**
   * How few items may remain. Removing below it is refused and explained —
   * an experience entry with no bullets is a heading with nothing under it.
   */
  readonly min: number;
  /**
   * A blank item. NEVER a populated one: what a minted entry carries is
   * guidance, and guidance is not a value. See {@link PLACEHOLDERS}.
   */
  readonly mint: () => unknown;
  /** The item's own schema, for validating an addition before it is applied. */
  readonly item: z.ZodTypeAny;
  /**
   * What to call one of these to a candidate.
   *
   * Data rather than a prop at every call site, so "a bullet", "a role" and "a
   * skills group" are named once and every control, label and refusal reads the
   * same word — including the refusal for a minimum, which used to be a
   * bullet-specific constant in a bullet-specific component.
   */
  readonly noun: string;
}

/**
 * The guidance a minted item shows in each of its fields.
 *
 * Keyed by the field's own name so a template needs no table of its own. These
 * strings reach `EditableText`'s `placeholder` prop, which has been documented
 * as "never saved" since the editor was written — they are what the candidate
 * reads in an empty field, and they are never stored, exported or extractable.
 */
export const PLACEHOLDERS: Record<string, string> = {
  company: 'Employer',
  title: 'Your role',
  start: 'YYYY-MM',
  end: 'YYYY-MM or Present',
  school: 'Institution',
  degree: 'Degree',
  field: 'Field of study',
  category: 'Skill group, e.g. Languages',
  heading: 'Section heading',
  detail: 'Organisation or date range',
  bullet: 'What you did, and what changed because of it.',
  item: 'Keyword',
  certification: 'Certification name',
  label: 'Link text',
  url: 'https://',
};

/** A blank experience entry: every field empty, every field guided. */
const mintExperience = () => ({
  company: '',
  title: '',
  start: '',
  end: '',
  bullets: [''],
  tech: [],
});

const mintEducation = () => ({ school: '', degree: '', field: '' });

const mintSkillGroup = () => ({ category: '', items: [''] });

const mintCustomEntry = () => ({ title: '', bullets: [''] });

const mintCustomSection = () => ({ heading: '', entries: [mintCustomEntry()] });

const mintLink = () => ({ label: '', url: '' });

const mintString = () => '';

/**
 * Draft-tolerant item schemas.
 *
 * The writer's schemas require every text field to be non-empty, and that is
 * right for the writer: a role with no employer is a role the model failed to
 * ground. A MINTED entry is the opposite case — it is empty because the
 * candidate has not typed yet, and refusing it would mean an added entry could
 * not appear until it was already complete.
 *
 * `z.infer` of `z.string().min(1)` and of `z.string()` is the same type, so
 * these are structurally identical to the strict schemas and nothing downstream
 * changes shape. Only the runtime check differs.
 */
export const DraftExperienceSchema = ExperienceSchema.extend({
  company: z.string(),
  title: z.string(),
  start: z.string(),
  end: z.string(),
  bullets: z.array(z.string()),
  tech: z.array(z.string()).default([]),
});

export const DraftEducationSchema = EducationSchema.extend({
  school: z.string(),
});

export const DraftSkillGroupSchema = SkillGroupSchema.extend({
  category: z.string(),
  items: z.array(z.string()),
});

export const DraftCustomEntrySchema = CustomEntrySchema.extend({
  title: z.string(),
  bullets: z.array(z.string()).default([]),
});

export const DraftCustomSectionSchema = CustomSectionSchema.extend({
  heading: z.string(),
  entries: z.array(DraftCustomEntrySchema).default([]),
});

/**
 * The résumé AS DRAWN: the writer's shape, tolerating the empty fields of an
 * entry the candidate has added and not yet filled in.
 *
 * Distinct from `ResumeObjectSchema`, which stays exactly as strict as it was —
 * it is embedded in `TailoredResumeSchema` and is therefore the writer's
 * contract. Relaxing that to make room for a draft would let the model's own
 * output degrade silently, which is the opposite of what this is for.
 */
export const PresentedResumeSchema = ResumeObjectSchema.extend({
  experience: z.array(DraftExperienceSchema),
  education: z.array(DraftEducationSchema).default([]),
  skills: z.array(DraftSkillGroupSchema).default([]),
  certifications: z.array(z.string()).default([]),
  custom_sections: z.array(DraftCustomSectionSchema).default([]),
});

/**
 * The résumé a document draws.
 *
 * Structurally identical to {@link ResumeObject} — `.min(1)` constrains values,
 * not types — so every template, serializer and renderer takes it unchanged.
 * The alias exists to name the runtime difference at the places that care.
 */
export type PresentedResume = ResumeObject;

export const COLLECTIONS = {
  summary: {
    path: 'summary',
    noun: 'summary',
    arity: 'one',
    shape: 'field',
    reorderable: false,
    min: 1,
    mint: mintString,
    item: z.string(),
  },
  links: {
    path: 'links',
    noun: 'link',
    arity: 'many',
    shape: 'inline',
    reorderable: true,
    min: 0,
    mint: mintLink,
    item: LinkSchema,
  },
  experience: {
    path: 'experience',
    noun: 'role',
    arity: 'many',
    shape: 'entry',
    reorderable: true,
    min: 0,
    mint: mintExperience,
    item: DraftExperienceSchema,
  },
  experience_bullets: {
    path: 'experience.*.bullets',
    noun: 'bullet',
    arity: 'many',
    shape: 'bullet',
    reorderable: true,
    // An entry with no bullets is a heading with nothing under it — the rule
    // #29 wrote into `EditableBulletList`, now stated where every list reads it.
    min: 1,
    mint: mintString,
    item: z.string(),
  },
  education: {
    path: 'education',
    noun: 'qualification',
    arity: 'many',
    shape: 'entry',
    reorderable: true,
    min: 0,
    mint: mintEducation,
    item: DraftEducationSchema,
  },
  skills: {
    path: 'skills',
    noun: 'skills group',
    arity: 'many',
    shape: 'entry',
    reorderable: true,
    min: 0,
    mint: mintSkillGroup,
    item: DraftSkillGroupSchema,
  },
  skill_items: {
    path: 'skills.*.items',
    noun: 'skill',
    arity: 'many',
    shape: 'inline',
    reorderable: true,
    min: 1,
    mint: mintString,
    item: z.string(),
  },
  certifications: {
    path: 'certifications',
    noun: 'certification',
    arity: 'many',
    shape: 'inline',
    reorderable: true,
    min: 0,
    mint: mintString,
    item: z.string(),
  },
  custom_sections: {
    path: 'custom_sections',
    noun: 'section',
    arity: 'many',
    shape: 'section',
    reorderable: true,
    min: 0,
    mint: mintCustomSection,
    item: DraftCustomSectionSchema,
  },
  custom_entries: {
    path: 'custom_sections.*.entries',
    noun: 'entry',
    arity: 'many',
    shape: 'entry',
    reorderable: true,
    min: 1,
    mint: mintCustomEntry,
    item: DraftCustomEntrySchema,
  },
  custom_bullets: {
    path: 'custom_sections.*.entries.*.bullets',
    noun: 'bullet',
    arity: 'many',
    shape: 'bullet',
    reorderable: true,
    min: 0,
    mint: mintString,
    item: z.string(),
  },
} as const satisfies Record<string, CollectionDef>;

export type CollectionId = keyof typeof COLLECTIONS;
export const CollectionIdSchema = z.enum(
  Object.keys(COLLECTIONS) as [CollectionId, ...CollectionId[]],
);

/** Whether anything can be added here. The one place the question is answered. */
export function canAddTo(id: CollectionId): boolean {
  return COLLECTIONS[id].arity === 'many';
}

/**
 * The collections that live at the résumé's top level, which are the ones an
 * `append` edit can name.
 *
 * A nested collection (`experience.*.bullets`, a custom section's entries) is
 * reached through the entry that owns it, and its content is stored with that
 * entry — so appending to one is not a separate operation on the overlay.
 */
export const TOP_LEVEL_COLLECTIONS = Object.entries(COLLECTIONS)
  .filter(([, def]) => def.arity === 'many' && !def.path.includes('*'))
  .map(([id]) => id as CollectionId);

/**
 * Resolve a collection's path for a particular set of indices.
 *
 * `experience.*.bullets` with `[2]` is `experience.2.bullets`. Supplying the
 * wrong number of indices is a programming error, not a data one, so it throws.
 */
export function collectionPath(
  id: CollectionId,
  indices: readonly number[] = [],
): string {
  const template = COLLECTIONS[id].path;
  let used = 0;
  const resolved = template
    .split('.')
    .map((segment) => {
      if (segment !== '*') return segment;
      const index = indices[used++];
      if (index === undefined) {
        throw new Error(
          `${id} needs ${template.split('*').length - 1} indices`,
        );
      }
      return String(index);
    })
    .join('.');
  if (used !== indices.length) {
    throw new Error(`${id} takes ${used} indices, given ${indices.length}`);
  }
  return resolved;
}

/**
 * Whether an item holds nothing the candidate typed.
 *
 * This is what makes a placeholder an absence rather than a value: an entry
 * every field of which is still empty has no content, so it is omitted from the
 * export rather than shipped as guidance somebody will read as a claim.
 *
 * Recursive over arrays and objects, and blind to which collection it is
 * looking at, because "unfilled" is the same question everywhere.
 */
export function isUnfilled(value: unknown): boolean {
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.every(isUnfilled);
  if (value !== null && typeof value === 'object') {
    return (
      Object.entries(value as Record<string, unknown>)
        // `id` and `author` are bookkeeping the candidate never types.
        .filter(([key]) => key !== 'id' && key !== 'author')
        .every(([, v]) => isUnfilled(v))
    );
  }
  // A number or a boolean is a value; nothing in a résumé is either today.
  return value === undefined || value === null;
}

/**
 * Which experience entries are out of reverse-chronological order.
 *
 * The knowledge base requires reverse chronological, so a free reorder lets a
 * candidate produce a résumé the product's own rulebook calls wrong. Returning
 * the offending positions rather than a boolean is deliberate: this is shown to
 * the candidate as a cost, never used to refuse the ordering.
 *
 * `Present` sorts above every date. An unparseable date is not an offence —
 * the candidate is mid-typing, and a warning about a half-typed date is noise.
 */
export function chronologyWarnings(resume: PresentedResume): number[] {
  const rank = (end: string): number | null => {
    const value = end.trim();
    if (value.length === 0) return null;
    if (/^present$/i.test(value)) return Number.POSITIVE_INFINITY;
    const match = /^(\d{4})(?:-(\d{2}))?/.exec(value);
    if (!match) return null;
    return Number(match[1]) * 12 + (match[2] ? Number(match[2]) : 0);
  };

  const out: number[] = [];
  let previous: number | null = null;
  resume.experience.forEach((role, index) => {
    const current = rank(role.end);
    if (current === null) return;
    if (previous !== null && current > previous) out.push(index);
    previous = current;
  });
  return out;
}
