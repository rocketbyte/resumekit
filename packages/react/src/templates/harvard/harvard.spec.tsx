import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { render, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ResumeObject } from '@resumekit/schema';
import { TEMPLATE_RENDERERS } from '../../registry.js';
import { FieldRegistryProvider } from '../../fields/field-registry.js';
import { DocumentPresentationProvider } from '../../presentation-context.js';
import { DocumentAuthoringProvider } from '../../collections/authoring-context.js';

const css = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), 'harvard.css'),
  'utf8',
);

const RESUME: ResumeObject = {
  name: 'Ada Lovelace',
  contact: { email: 'ada@example.com' },
  links: [],
  custom_sections: [],
  section_headings: {},
  achievements: [],
  courses: [],
  passions: [{ title: 'Marathons', description: 'Five, so far.' }],
  languages: [
    { name: 'English', level: 'native' },
    { name: 'French', level: 'advanced' },
  ],
  summary: '',
  skills: [{ category: 'Backend', items: ['Node.js'] }],
  experience: [],
  education: [],
  certifications: [],
};

const { Document } = TEMPLATE_RENDERERS.harvard;

/** The section a heading reading `title` stands over. */
const section = (root: HTMLElement, title: string) =>
  [...root.querySelectorAll('.tpl-harvard__section-title')]
    .find((heading) => heading.textContent === title)
    ?.closest('section');

describe('the Harvard document', () => {
  /* They once ran in under the skills as "Languages: …" lines, with no heading
     of their own, and read as part of the skills section. */
  it('heads languages and interests like every other section', () => {
    const { container } = render(
      <DocumentPresentationProvider>
        <Document resume={RESUME} />
      </DocumentPresentationProvider>,
    );
    const interests = section(container, 'Interests');
    expect(interests?.className).toBe('tpl-described tpl-harvard__section');
    expect(interests?.textContent).toContain('Marathons');
    const language = section(container, 'Languages')?.querySelector(
      '.tpl-language',
    );
    expect(language?.textContent).toContain('English');
    expect(language?.textContent).toContain('Native');
    expect(css).toMatch(
      /\.tpl-harvard__languages \.tpl-language__meter \{\s*display: none;/,
    );
  });

  it('offers an empty Interests section under its own heading', async () => {
    const resume = { ...RESUME, passions: [] };
    const { container } = render(
      <DocumentAuthoringProvider
        value={{ base: resume, edits: [], onEditsChange: () => undefined }}
      >
        <DocumentPresentationProvider>
          <FieldRegistryProvider enabled>
            <Document resume={resume} />
          </FieldRegistryProvider>
        </DocumentPresentationProvider>
      </DocumentAuthoringProvider>,
    );
    await waitFor(() => {
      expect(section(container, 'Interests')?.textContent).toMatch(
        /add interest/i,
      );
    });
  });
});
