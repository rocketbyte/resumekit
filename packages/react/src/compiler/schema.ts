import { z } from 'zod';

/**
 * The template description format (`<id>.template.yaml`), validated before
 * anything is generated — see `openspec/changes/declarative-templates`.
 *
 * Deliberately small. A description says WHICH of the kit's editable pieces a
 * template uses and in what arrangement; the design stays in the template's
 * CSS. A design this format cannot express stays a hand-written component — an
 * option is added only when two or more templates need it.
 *
 * Class names are written relative to the template's prefix: `org` in the
 * Harvard description is `tpl-harvard__org` in the output.
 */

const Ident = z.string().regex(/^[a-z][A-Za-z0-9]*$/, 'a camelCase field name');
const ClassName = z
  .string()
  .regex(/^[a-z][a-z0-9-]*$/, 'a kebab-case class name');
const Tag = z.enum(['article', 'div', 'span', 'li', 'p', 'ul', 'section']);

/** One node of an entry's markup. */
export type EntryNode =
  | {
      tag: z.infer<typeof Tag>;
      class?: string;
      block?: boolean;
      children?: EntryNode[];
    }
  | { field: string; optional?: boolean; placeholder?: string }
  | { text: string }
  | { separator: string; between: [string, string] }
  | { bullets: string }
  | { inlineList: string; placeholder?: string };

export const EntryNodeSchema: z.ZodType<EntryNode> = z.lazy(() =>
  z.union([
    z
      .object({
        tag: Tag,
        class: ClassName.optional(),
        block: z.boolean().optional(),
        children: z.array(EntryNodeSchema).optional(),
      })
      .strict(),
    z
      .object({
        field: Ident,
        optional: z.boolean().optional(),
        placeholder: Ident.optional(),
      })
      .strict(),
    z.object({ text: z.string() }).strict(),
    z
      .object({ separator: z.string(), between: z.tuple([Ident, Ident]) })
      .strict(),
    z.object({ bullets: Ident }).strict(),
    z.object({ inlineList: Ident, placeholder: Ident.optional() }).strict(),
  ]),
);

/** The item types an entry can render, from `@cvgs/core`. */
const EntryType = z.enum([
  'Experience',
  'Education',
  'SkillGroup',
  'CustomEntry',
]);

export const EntrySchema = z
  .object({
    /** The exported component name, after the template's own: `SkillGroup`. */
    name: z.string().regex(/^[A-Z][A-Za-z0-9]*$/),
    type: EntryType,
    /** The item's root element; it carries the collection's item props and chrome. */
    root: z
      .object({
        tag: Tag,
        class: ClassName,
        block: z.boolean().optional(),
      })
      .strict(),
    children: z.array(EntryNodeSchema),
  })
  .strict();
export type Entry = z.infer<typeof EntrySchema>;

/** The `doc.t.sections` keys a section may be titled by. */
const SectionTitle = z.enum([
  'professionalSummary',
  'experience',
  'education',
  'achievements',
  'technicalSkills',
  'courses',
  'certifications',
  'passions',
]);

/** The resume fields a section can be drawn from. */
const ResumeSection = z.enum([
  'summary',
  'experience',
  'education',
  'achievements',
  'skills',
  'courses',
  'certifications',
  'passions',
]);

export const SectionSchema = z.discriminatedUnion('kind', [
  /** One editable paragraph. */
  z
    .object({
      kind: z.literal('text'),
      section: ResumeSection,
      title: SectionTitle,
      class: ClassName,
      multiline: z.boolean().optional(),
    })
    .strict(),
  /** A collection of items drawn by one of the template's entries. */
  z
    .object({
      kind: z.literal('entries'),
      section: ResumeSection,
      title: SectionTitle,
      entry: Ident,
      /** An element around the collection, e.g. a `ul` for skill groups. */
      wrapper: z
        .object({ tag: Tag, class: ClassName, block: z.boolean().optional() })
        .strict()
        .optional(),
      /** `false` draws the items with no gap between them. */
      gap: z.boolean().optional(),
    })
    .strict(),
  /** Titled entries with a description (achievements, courses, passions). */
  z
    .object({
      kind: z.literal('described'),
      section: ResumeSection,
      title: SectionTitle,
    })
    .strict(),
  /** One editable comma list. */
  z
    .object({
      kind: z.literal('inline-list'),
      section: ResumeSection,
      title: SectionTitle,
      class: ClassName,
      /** Offer the section empty while authoring; certifications do not. */
      offerWhenEmpty: z.boolean().optional(),
    })
    .strict(),
  z.object({ kind: z.literal('languages'), rowClass: ClassName }).strict(),
  /** The candidate's own sections, after every section the template knows. */
  z.object({ kind: z.literal('custom'), entry: Ident }).strict(),
]);
export type Section = z.infer<typeof SectionSchema>;

const ContactField = z.enum(['location', 'email', 'phone']);

export const TemplateDescriptionSchema = z
  .object({
    id: z.string().regex(/^[a-z][a-z0-9-]*$/),
    /** The component name prefix: `Harvard` → `HarvardDocument`. */
    component: z.string().regex(/^[A-Z][A-Za-z0-9]*$/),
    /** The root class; every other class is `<prefix>__<name>`. */
    prefix: ClassName,
    /** The key `documentStyle` reads the presentation under. */
    styleKey: z.string().min(1),
    header: z
      .object({
        contact: z.array(ContactField).min(1),
        links: z.boolean(),
      })
      .strict(),
    /** Classes shared by every section. */
    classes: z
      .object({
        section: ClassName,
        sectionTitle: ClassName,
        described: ClassName,
      })
      .strict(),
    sections: z.array(SectionSchema).min(1),
    entries: z.record(Ident, EntrySchema),
  })
  .strict()
  .superRefine((d, ctx) => {
    const entryRefs = d.sections.flatMap((s) =>
      s.kind === 'entries' || s.kind === 'custom' ? [s.entry] : [],
    );
    for (const ref of entryRefs) {
      if (!(ref in d.entries)) {
        ctx.addIssue({
          code: 'custom',
          path: ['sections'],
          message: `section uses entry "${ref}", which is not in entries`,
        });
      }
    }
  });
export type TemplateDescription = z.infer<typeof TemplateDescriptionSchema>;
