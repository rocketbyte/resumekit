import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ResumeObject } from '@resumekit/schema';
import { TEMPLATE_RENDERERS } from '../../registry.js';
import { DocumentPresentationProvider } from '../../presentation-context.js';

const css = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), 'academic.css'),
  'utf8',
);

const RESUME: ResumeObject = {
  name: 'John Doe',
  headline: 'Research Engineer',
  contact: { email: 'john@doe.org', location: 'Geneva' },
  links: [],
  custom_sections: [],
  section_headings: {},
  achievements: [],
  courses: [],
  passions: [],
  languages: [{ name: 'French', level: 'advanced' }],
  summary: '',
  skills: [{ category: 'Languages', items: ['OCaml', 'Python', 'C'] }],
  experience: [
    {
      company: 'CERN',
      title: 'Software Engineer',
      location: 'Meyrin',
      start: '2019-03',
      end: 'Present',
      bullets: ['Rewrote the trigger pipeline.'],
      tech: [],
    },
  ],
  education: [
    {
      school: 'EPFL',
      degree: 'MSc',
      field: 'Physics',
      start: '2016',
      end: '2018',
    },
  ],
  certifications: [],
};

const { Document } = TEMPLATE_RENDERERS.academic;

const draw = () =>
  render(
    <DocumentPresentationProvider>
      <Document resume={RESUME} />
    </DocumentPresentationProvider>,
  ).container;

describe('the Academic document', () => {
  it('hangs an entry off its dates: bold role, italic organisation, place', () => {
    const entry = draw().querySelector(
      '.tpl-academic__entry:has(.tpl-bullets)',
    );
    expect(entry?.firstElementChild?.className).toBe('tpl-academic__when');
    expect(entry?.textContent).toMatch(
      /^2019-03–PresentSoftware Engineer, CERN, Meyrin/,
    );
    expect(entry?.querySelector('strong')?.textContent).toBe(
      'Software Engineer',
    );
    expect(entry?.querySelector('em')?.textContent).toBe('CERN');
  });

  it('draws the heading bar in the date margin and frames the initials', () => {
    expect(css).toMatch(
      /\.tpl-academic__heading::before \{[^}]*width: var\(--ac-dates\);/,
    );
    expect(css).toMatch(
      /\.tpl-academic__heading \{[^}]*padding-left: var\(--ac-hang\);/,
    );
    expect(draw().querySelector('.tpl-academic__avatar')?.textContent).toBe(
      'JD',
    );
    expect(css).toMatch(/--ac-font: 'Latin Modern Roman'/);
  });

  /* ats: the dates extract first, and each skill is its own unit. */
  it('keeps its ats claims', () => {
    const container = draw();
    expect(container.querySelector('table, img, aside')).toBeNull();
    const education = container.querySelector(
      '.tpl-academic__entry:not(:has(.tpl-bullets))',
    );
    expect(education?.textContent).toMatch(/^2016–2018MSc in Physics, EPFL/);
    const skills = [
      ...container.querySelectorAll('.tpl-skill-grid__group .tpl-bullet'),
    ].map((li) => li.textContent);
    expect(skills).toEqual(['OCaml', 'Python', 'C']);
    expect(container.querySelector('.tpl-skill-grid__label')?.textContent).toBe(
      'Languages',
    );
  });
});
