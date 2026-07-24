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
  phone: z.string().optional().describe('Phone as written in the source resume.'),
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
  company: z.string().min(1).describe('Employer name exactly as in the resume.'),
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
});
export type ResumeObject = z.infer<typeof ResumeObjectSchema>;
