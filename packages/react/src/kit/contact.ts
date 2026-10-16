import type { ResumeObject } from '@resumekit/schema';
import { useEditorText } from '../i18n/index.js';

export type ContactField = keyof ResumeObject['contact'] &
  ('email' | 'phone' | 'location');

export interface ContactLine {
  field: ContactField;
  path: `contact.${ContactField}`;
  value: string;
  placeholder: string;
}

/**
 * The contact details a template prints, in the template's own order.
 *
 * While authoring every field is offered, filled or not — an absent field is
 * one a candidate cannot add. On paper only what was filled in survives.
 */
export function useContactLines(
  contact: ResumeObject['contact'],
  order: readonly ContactField[],
  authoring: boolean,
): ContactLine[] {
  const { placeholder } = useEditorText();
  return order
    .filter((field) => authoring || contact[field])
    .map((field) => ({
      field,
      path: `contact.${field}` as const,
      value: String(contact[field] ?? ''),
      placeholder: placeholder(field),
    }));
}
