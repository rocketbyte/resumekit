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
 * A writer résumé widened to a full {@link ResumeObject}.
 *
 * `TailoredResumeSchema` omits `custom_sections` so the model cannot express a
 * section it did not ground. Everything that RENDERS a résumé takes the full
 * object, so the two meet here: a writer résumé has no custom sections, and
 * saying that once beats each caller spreading an empty array and hoping it
 * stays the right default.
 */
export function asResumeObject(
  written: Omit<ResumeObject, 'custom_sections'>,
): ResumeObject {
  return { ...written, custom_sections: [] };
}
