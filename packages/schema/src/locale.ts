import { z } from 'zod';

/**
 * The languages a document can be drawn in. A closed set: adding a language is
 * adding it here and a catalog in `@resumekit/react`.
 */
export const LocaleSchema = z.enum(['en', 'es']);
export type Locale = z.infer<typeof LocaleSchema>;
