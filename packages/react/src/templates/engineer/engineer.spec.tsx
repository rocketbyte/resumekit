import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ResumeObject } from '@cvgs/core';
import { TEMPLATE_RENDERERS } from '../../registry.js';
import { DocumentPresentationProvider } from '../../presentation-context.js';

const css = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), 'engineer.css'),
  'utf8',
);

const RESUME: ResumeObject = {
  name: 'Jake Ryan',
  contact: { email: 'jake@example.com', phone: '123-456-7890' },
  links: [{ label: 'GitHub', url: 'https://github.com/jake' }],
  custom_sections: [
    {
      id: 'projects',
      heading: 'Projects',
      author: 'candidate',
      entries: [
        {
          title: 'Gitlytics',
          detail: 'Python, Flask, React',
          bullets: ['Built a REST API.'],
        },
      ],
    },
  ],
  section_headings: {},
  achievements: [],
  courses: [],
  passions: [],
  languages: [],
  summary: '',
  skills: [{ category: 'Languages', items: ['Java', 'Python', 'C++'] }],
  experience: [
    {
      company: 'Texas A&M University',
      title: 'Research Assistant',
      location: 'College Station, TX',
      start: '2020-06',
      end: 'Present',
      bullets: ['Developed a REST API.'],
      tech: [],
    },
  ],
  education: [
    {
      school: 'Southwestern University',
      location: 'Georgetown, TX',
      degree: 'Bachelor of Arts',
      field: 'Computer Science',
      start: '2018-08',
      end: '2021-05',
    },
  ],
  certifications: [],
};

const { Document } = TEMPLATE_RENDERERS.engineer;

const draw = () =>
  render(
    <DocumentPresentationProvider>
      <Document resume={RESUME} />
    </DocumentPresentationProvider>,
  ).container;

describe('the Engineer document', () => {
  it('sets an entry as four corners: role and dates over employer and place', () => {
    const corners = [
      ...draw().querySelectorAll(
        '.tpl-engineer__entry:has(.tpl-bullets) .tpl-engineer__corners > *',
      ),
    ].map((cell) => [cell.className, cell.textContent]);
    expect(corners).toEqual([
      ['tpl-engineer__title', 'Research Assistant'],
      ['tpl-engineer__dates', '2020-06 – Present'],
      ['tpl-engineer__org', 'Texas A&M University'],
      ['tpl-engineer__place', 'College Station, TX'],
    ]);
  });

  it('runs a project’s stack after its name, as Jake’s projects do', () => {
    const project = draw().querySelector('.tpl-engineer__project');
    expect(project?.textContent).toBe('Gitlytics | Python, Flask, React');
    expect(project?.querySelector('.tpl-engineer__stack')?.textContent).toBe(
      'Python, Flask, React',
    );
  });

  it('heads sections in true small capitals, not upper case', () => {
    expect(css).toMatch(
      /\.tpl-engineer__heading \{[^}]*font-family: var\(--eng-caps\);[^}]*font-variant: normal;/,
    );
    expect(css).toMatch(/--eng-caps: 'Latin Modern Roman Caps'/);
    expect(css).not.toMatch(/text-transform: uppercase/);
  });

  /* ats: one column, and each skill its own extracted unit under its category. */
  it('keeps its ats claims', () => {
    const container = draw();
    expect(container.querySelector('table, img, aside')).toBeNull();
    const skills = [
      ...container.querySelectorAll('.tpl-skill-grid__group .tpl-bullet'),
    ].map((li) => li.textContent);
    expect(skills).toEqual(['Java', 'Python', 'C++']);
    expect(container.querySelector('.tpl-skill-grid__label')?.textContent).toBe(
      'Languages',
    );
  });
});
