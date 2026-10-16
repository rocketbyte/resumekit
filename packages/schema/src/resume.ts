import { z } from 'zod';

/**
 * Contact details. EVERY field is optional on purpose: text extraction routinely
 * loses the email (it lives in a PDF header, a hyperlink, or a graphic). A
 * required field with no honest source would force the writer to invent one —
 * violating the product's defining constraint — or to fail validation on every
 * repair attempt at full model cost. Absent details are the renderer's problem,
 * not a reason to fabricate. See `llm-cost-optimization`.
 */
export const ContactSchema = z.object({
  email: z
    .string()
    .optional()
    .describe(
      'Email exactly as it appears in the source resume. Omit if the resume ' +
        'does not contain one — never invent or guess an address.',
    ),
  phone: z
    .string()
    .optional()
    .describe('Phone as written in the source resume.'),
  location: z
    .string()
    .optional()
    .describe("Location as written, e.g. 'Berlin, DE'."),
});
export type Contact = z.infer<typeof ContactSchema>;

export const LinkSchema = z.object({
  label: z.string().optional().describe("Display label, e.g. 'GitHub'."),
  url: z.string().min(1).describe('The URL as written in the source resume.'),
});
export type Link = z.infer<typeof LinkSchema>;

/**
 * The only schemes a document's link may use.
 *
 * A résumé is exported to PDF and HTML, mailed to strangers, and reopened in
 * readers this product does not control. A `javascript:` or `data:` target in
 * that document is a script-injection vector rather than a formatting mistake,
 * so the allowlist is a security boundary and lives in the domain where every
 * surface inherits it.
 */
const SAFE_LINK_SCHEMES: readonly string[] = ['http:', 'https:'];

/**
 * A ceiling on a stored target.
 *
 * Not a correctness rule — it is the de-facto address-bar limit, and it stops a
 * pasted megabyte of `data:` payload becoming part of a document that is
 * synced, versioned and re-parsed on every render.
 */
const MAX_LINK_LENGTH = 2048;

/**
 * Whether a string may be used as a link target in a document.
 *
 * PARSED, never prefix-matched. `startsWith('http')` is defeated by
 * `javascript:` with an embedded tab or newline (the URL parser strips those
 * before determining the scheme, so the string and the parsed scheme disagree),
 * by unusual casing, and by percent-encoding. Asking the parser what the scheme
 * actually is and then checking that against the allowlist has no such gap.
 *
 * A relative address (`github.com/me`) is REFUSED rather than silently promoted
 * to `https://`. Guessing the scheme is inventing intent, and the surface that
 * collected the value is the right place to say "start with https://".
 */
export function isSafeLinkTarget(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > MAX_LINK_LENGTH) return false;
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    // No scheme, or unparseable. Either way it is not something to link to.
    return false;
  }
  return SAFE_LINK_SCHEMES.includes(parsed.protocol);
}

/**
 * A validated link target.
 *
 * Refused loudly: a caller gets a parse error it can report, rather than a
 * quietly dropped value that leaves a word looking linked and doing nothing.
 */
export const LinkTargetSchema = z
  .string()
  .refine(isSafeLinkTarget, {
    message: 'A link must be an http:// or https:// address.',
  })
  .describe('An absolute http(s) address a field points at.');

/**
 * Who put a piece of the document there.
 *
 * An enum of one today, and deliberately an enum: the product's guarantee is
 * that the WRITER never states what it cannot ground, and that stays checkable
 * only while writer output and candidate typing remain distinguishable to every
 * later reader. Stored rather than inferred — see `editor-structural-authoring`,
 * decision 2.
 */
export const CONTENT_AUTHORS = ['candidate'] as const;
export const ContentAuthorSchema = z.enum(CONTENT_AUTHORS);
export type ContentAuthor = z.infer<typeof ContentAuthorSchema>;

/**
 * One entry in a candidate-authored section.
 *
 * Deliberately the same shape as the entries the templates already draw — a
 * title, an optional qualifier line, and bullets — so a custom section renders
 * through each template's existing section machinery rather than needing a
 * layout of its own. A section carries content; it never carries a layout.
 */
export const CustomEntrySchema = z.object({
  title: z.string().min(1).describe('The entry’s headline, e.g. a project.'),
  detail: z
    .string()
    .optional()
    .describe('Qualifier line, e.g. an organisation or a date range.'),
  bullets: z.array(z.string().min(1)).default([]),
});
export type CustomEntry = z.infer<typeof CustomEntrySchema>;

/**
 * A section the schema has no concept of — Projects, Volunteering, Awards.
 *
 * `id` is minted when the section is created and is what the overlay addresses,
 * so the section survives the writer producing a different résumé underneath it.
 * `author` is what keeps the never-invent claim checkable once one document
 * contains both writer output and candidate typing.
 */
export const CustomSectionSchema = z.object({
  id: z.string().min(1),
  heading: z.string().min(1).describe("Section heading, e.g. 'Volunteering'."),
  entries: z.array(CustomEntrySchema).default([]),
  author: ContentAuthorSchema,
});
export type CustomSection = z.infer<typeof CustomSectionSchema>;

/**
 * A title with a short paragraph under it — an achievement, a course, a passion.
 *
 * The shape is taken from the references rather than guessed. Every one of the
 * thirteen sets an achievement as a bold or accented title with a paragraph
 * beneath it; not one sets it as bullets. `description` is therefore a single
 * `string` and not a `string[]`, so the record cannot express a list no template
 * draws — the same discipline {@link SkillGroupSchema} applies when it refuses
 * prose.
 *
 * ONE schema for three sections because they share a shape, and three FIELDS
 * rather than one tagged list because they do not share a place on the page: a
 * template resolves where a section sits from the field it is reading, not from
 * a discriminator it has to match. Keying behaviour off a string is the mistake
 * `isLanguages` made, and it is not repeated here.
 */
export const DescribedEntrySchema = z.object({
  title: z.string().min(1).describe('The entry’s headline, e.g. an award.'),
  description: z
    .string()
    .describe(
      'One short paragraph. Never a list — no template draws bullets here.',
    ),
});
export type DescribedEntry = z.infer<typeof DescribedEntrySchema>;

/**
 * How well the candidate speaks a language.
 *
 * FIVE values, because the meter five of the references draw has five steps.
 * That correspondence is the whole reason a meter is allowed to exist here at
 * all: `docs/template-contract.md` refuses a proficiency meter whose
 * proportions nothing recorded, and this one renders one step per stored enum
 * value rather than a percentage somebody chose. A sixth level would break the
 * correspondence and force that rule to be re-decided — stated here so it is
 * decided knowingly rather than discovered.
 *
 * There is no zero: a language the candidate does not speak is not on the
 * résumé.
 */
export const LANGUAGE_LEVELS = [
  'native',
  'fluent',
  'advanced',
  'intermediate',
  'beginner',
] as const;
export const LanguageLevelSchema = z.enum(LANGUAGE_LEVELS);
export type LanguageLevel = z.infer<typeof LanguageLevelSchema>;

export const LanguageSchema = z.object({
  name: z.string().min(1).describe("A language, e.g. 'Spanish'."),
  level: LanguageLevelSchema.describe('How well the candidate speaks it.'),
});
export type Language = z.infer<typeof LanguageSchema>;

/** A flat keyword list grouped by type (no rating bars / years-per-skill). */
export const SkillGroupSchema = z.object({
  category: z
    .string()
    .min(1)
    .describe("Group name, e.g. 'Languages', 'Cloud & Infra'."),
  items: z
    .array(z.string().min(1))
    .describe(
      'Flat keyword list. No rating bars, no years-per-skill, no prose.',
    ),
});
export type SkillGroup = z.infer<typeof SkillGroupSchema>;

export const ExperienceSchema = z.object({
  company: z
    .string()
    .min(1)
    .describe('Employer name exactly as in the resume.'),
  title: z.string().min(1).describe('Job title exactly as in the resume.'),
  /*
   * Where the job was, which the résumé had nowhere to put.
   *
   * The same gap `Education.location` closed, in the sibling entry: Harvard has
   * drawn an empty slot beside the employer since it was written, so every
   * résumé printed a blank there and no candidate could type into it. A real
   * résumé states it — `Doral Health & Wellness  New York, NY` — and a recruiter
   * filtering by place is reading exactly this line.
   *
   * Optional, because remote roles and plenty of résumés state none, and
   * inventing a city is worse than omitting one.
   */
  location: z
    .string()
    .optional()
    .describe("Where the job was, e.g. 'New York, NY'. Omit if not stated."),
  start: z
    .string()
    .min(1)
    .describe("Start date as 'YYYY-MM', e.g. '2021-03'. Never empty."),
  end: z
    .string()
    .min(1)
    .describe(
      "End date as 'YYYY-MM', or exactly 'Present' for a current role. Never empty.",
    ),
  bullets: z
    .array(z.string().min(1))
    .describe(
      'Each bullet: action verb + what you did + tool + quantified outcome. ' +
        "No 'responsible for'.",
    ),
  tech: z
    .array(z.string().min(1))
    .default([])
    .describe('Technologies used in this role, as ATS keyword strings.'),
});
export type Experience = z.infer<typeof ExperienceSchema>;

export const EducationSchema = z.object({
  school: z.string().min(1).describe('Institution name as in the resume.'),
  degree: z.string().optional().describe("e.g. 'BSc'."),
  field: z.string().optional().describe("e.g. 'Computer Science'."),
  /*
   * Where the institution is, which the résumé had nowhere to put.
   *
   * Every template draws a slot beside the school for it — Harvard has carried
   * an empty `__where` since it was written — and the record it was drawn from
   * could not hold one, so it printed blank on every résumé and no candidate
   * could type it in. Optional, because plenty of qualifications are stated
   * without a city and inventing one is worse than omitting it.
   */
  location: z
    .string()
    .optional()
    .describe("Where the institution is, e.g. 'Madrid, Spain'."),
  start: z.string().optional().describe("'YYYY' or 'YYYY-MM'."),
  end: z.string().optional().describe("'YYYY', 'YYYY-MM', or 'Present'."),
});
export type Education = z.infer<typeof EducationSchema>;

/**
 * The structured resume — NOT a text blob — so a template can render it without
 * re-parsing free text, and "same resume, different template" is a data operation.
 *
 * @pii This object is dense personal data. See {@link PersonalData} and README.
 */
export const ResumeObjectSchema = z.object({
  name: z.string().min(1).describe("The candidate's full name."),
  contact: ContactSchema,
  links: z.array(LinkSchema).default([]),
  headline: z
    .string()
    .optional()
    .describe('One line mirroring the target job title.'),
  summary: z
    .string()
    .describe(
      'Short paragraph proving the target title. Grounded only in the source ' +
        "resume and the candidate's answers.",
    ),
  skills: z.array(SkillGroupSchema).default([]),
  experience: z
    .array(ExperienceSchema)
    .describe('Reverse chronological — most recent role first.'),
  education: z.array(EducationSchema).default([]),
  certifications: z.array(z.string().min(1)).default([]),
  /*
   * The four sections every reference draws and the record could not hold.
   *
   * Achievements is in all thirteen references, usually directly under the
   * summary or at the top of the rail; Courses is in ten, Passions in six,
   * Languages in five. Until they existed here, seventeen templates each had
   * four holes a stylesheet could not fill, because there was nowhere for a
   * candidate to type the content.
   *
   * DEFAULTED EMPTY, so every résumé stored before these fields existed parses
   * unchanged and nothing is migrated.
   *
   * DELIBERATELY ABSENT from `TailoredResumeSchema`, on the same terms as
   * `custom_sections` below: a section the pipeline cannot express is a section
   * the pipeline cannot invent, so every entry here is known to be the
   * candidate's own. It also keeps the JSON Schema sent to the provider
   * byte-identical, so the fields cost no tokens.
   */
  achievements: z.array(DescribedEntrySchema).default([]),
  courses: z.array(DescribedEntrySchema).default([]),
  passions: z.array(DescribedEntrySchema).default([]),
  /*
   * Read from here rather than from whichever skills group a candidate happened
   * to name "Languages", which is how every template found them before this
   * field existed. That stopgap had no level, so no meter; no section id, so no
   * adjustable gap; and it rendered nothing at all for the candidate who had not
   * guessed the magic category name.
   */
  languages: z.array(LanguageSchema).default([]),
  /*
   * What each section is CALLED, where the candidate renamed it.
   *
   * Keyed by `ResumeSectionId`, and absent for every section the candidate left
   * alone — so the template's own heading is the default and nothing is stored
   * until somebody types. A custom section has carried an editable `heading`
   * since it was introduced; this is the same capability for the sections the
   * schema names, which a candidate could read on the page and not change.
   *
   * The VALUE type is a loose `Record<string, string>` rather than a record
   * keyed by the enum, deliberately. A rename arrives as an ordinary `set` edit
   * on `section_headings.<id>`, and an overlay is data at rest that outlives the
   * code that wrote it — so an edit naming a section this build no longer has
   * would make the whole résumé fail to parse, and `presentedResume` would fall
   * back to the writer's copy and silently discard every OTHER edit with it. A
   * key nothing reads costs nothing; a résumé that will not open costs the
   * candidate their work. The same reasoning `applyPresentation` gives for
   * skipping a stale path rather than throwing.
   */
  section_headings: z.record(z.string(), z.string()).default({}),
  /*
   * Sections the candidate added, which this schema has no other concept of.
   *
   * Defaulted empty, so every résumé written before this field existed parses
   * unchanged and nothing is migrated. Rendered after the sections a template
   * knows, in declaration order.
   *
   * DELIBERATELY ABSENT from the schema the writer produces (`TailoredResume`):
   * a section the pipeline cannot express is a section the pipeline cannot
   * invent, so a custom section can only ever have come from a candidate.
   */
  custom_sections: z.array(CustomSectionSchema).default([]),
});
export type ResumeObject = z.infer<typeof ResumeObjectSchema>;

/**
 * The résumé fields the writer cannot express.
 *
 * One list, used by `TailoredResumeSchema` to omit them and by
 * {@link asResumeObject} to put them back, so the two can never disagree about
 * which fields are candidate-only.
 */
export const CANDIDATE_ONLY_FIELDS = [
  'custom_sections',
  'section_headings',
  'achievements',
  'courses',
  'passions',
  'languages',
] as const;
export type CandidateOnlyField = (typeof CANDIDATE_ONLY_FIELDS)[number];

/**
 * A writer résumé widened to a full {@link ResumeObject}.
 *
 * `TailoredResumeSchema` omits every {@link CANDIDATE_ONLY_FIELDS} member so the
 * model cannot express a section it did not ground. Everything that RENDERS a
 * résumé takes the full object, so the two meet here: a writer résumé has none
 * of them, and saying that once beats each caller spreading five empty arrays
 * and hoping they stay the right defaults.
 *
 * The parameter is typed by the same list, so a sixth candidate-only field is a
 * type error here until it is handled rather than a silently missing default.
 */
export function asResumeObject(
  written: Omit<ResumeObject, CandidateOnlyField>,
): ResumeObject {
  return {
    ...written,
    custom_sections: [],
    section_headings: {},
    achievements: [],
    courses: [],
    passions: [],
    languages: [],
  };
}
