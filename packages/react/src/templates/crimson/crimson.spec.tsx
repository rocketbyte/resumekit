import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ResumeObject } from '@cvgs/core';
import { TEMPLATE_RENDERERS } from '../../registry.js';
import { DocumentPresentationProvider } from '../../presentation-context.js';

const css = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), 'crimson.css'),
  'utf8',
);

const RESUME: ResumeObject = {
  name: 'Byungjin Park',
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

const { Document } = TEMPLATE_RENDERERS.crimson;

const draw = () =>
  render(
    <DocumentPresentationProvider>
      <Document resume={RESUME} />
    </DocumentPresentationProvider>,
  ).container;

describe('the Crimson document', () => {
  it('sets an entry as employer and place over role and dates', () => {
    const head = draw().querySelector('.tpl-crimson__entry-head');
    const corners = [...(head?.children ?? [])].map((cell) => [
      cell.className,
      cell.textContent,
    ]);
    expect(corners).toEqual([
      ['tpl-crimson__org', 'Texas A&M University'],
      ['tpl-crimson__where', 'College Station, TX'],
      ['tpl-crimson__role', 'Research Assistant'],
      ['tpl-crimson__dates', '2020-06 - Present'],
    ]);
  });

  it('sets the name light then bold, and opens each heading in the accent', () => {
    const container = draw();
    expect(
      [
        ...container.querySelectorAll('h1 span[class^="tpl-crimson__name-"]'),
      ].map((s) => [s.className, s.textContent]),
    ).toEqual([
      ['tpl-crimson__name-first', 'Byungjin'],
      ['tpl-crimson__name-last', 'Park'],
    ]);
    expect(css).toMatch(/\.tpl-crimson__name-last \{[^}]*font-weight: 700;/);
    const leads = [
      ...container.querySelectorAll('.tpl-crimson__heading-lead'),
    ].map((s) => s.textContent);
    expect(leads).toContain('Exp');
    expect(leads).toContain('Pro');
    expect(css).toMatch(
      /\.tpl-crimson__heading-lead \{[^}]*color: var\(--crm-accent\);/,
    );
  });

  it('draws the contact separators and icons rather than typing them', () => {
    const contact = draw().querySelector('.tpl-crimson__contact');
    expect(contact?.classList.contains('tpl-contact-icons')).toBe(true);
    expect(contact?.textContent).not.toMatch(/\|/);
    expect(css).toMatch(
      /\.tpl-crimson__contact-item:has\(\+ \.tpl-crimson__contact-item\)::after,[^}]*content: '';/,
    );
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
