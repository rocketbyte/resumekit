import { z } from 'zod';

export const ContactSchema = z.object({
  email: z.string().min(1),
  phone: z.string().optional(),
  location: z.string().optional(),
});
export type Contact = z.infer<typeof ContactSchema>;

export const LinkSchema = z.object({
  label: z.string().optional(),
  url: z.string().min(1),
});
export type Link = z.infer<typeof LinkSchema>;

/** A flat keyword list grouped by type (no rating bars / years-per-skill). */
export const SkillGroupSchema = z.object({
  category: z.string().min(1),
  items: z.array(z.string().min(1)),
});
export type SkillGroup = z.infer<typeof SkillGroupSchema>;

export const ExperienceSchema = z.object({
  company: z.string().min(1),
  title: z.string().min(1),
  /** display string, e.g. `2021-03` */
  start: z.string().min(1),
  /** display string, e.g. `2024-01` or `Present` */
  end: z.string().min(1),
  bullets: z.array(z.string().min(1)),
  tech: z.array(z.string().min(1)).default([]),
});
export type Experience = z.infer<typeof ExperienceSchema>;

export const EducationSchema = z.object({
  school: z.string().min(1),
  degree: z.string().optional(),
  field: z.string().optional(),
  start: z.string().optional(),
  end: z.string().optional(),
});
export type Education = z.infer<typeof EducationSchema>;

/**
 * The structured resume — NOT a text blob — so a template can render it without
 * re-parsing free text, and "same resume, different template" is a data operation.
 *
 * @pii This object is dense personal data. See {@link PersonalData} and README.
 */
export const ResumeObjectSchema = z.object({
  name: z.string().min(1),
  contact: ContactSchema,
  links: z.array(LinkSchema).default([]),
  headline: z.string().optional(),
  summary: z.string(),
  skills: z.array(SkillGroupSchema).default([]),
  experience: z.array(ExperienceSchema),
  education: z.array(EducationSchema).default([]),
  certifications: z.array(z.string().min(1)).default([]),
});
export type ResumeObject = z.infer<typeof ResumeObjectSchema>;
