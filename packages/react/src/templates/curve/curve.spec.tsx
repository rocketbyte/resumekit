import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ResumeObject } from '@cvgs/core';
import { TEMPLATE_RENDERERS } from '../../registry.js';
import { DocumentPresentationProvider } from '../../presentation-context.js';

const css = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), 'curve.css'),
  'utf8',
);

const RESUME: ResumeObject = {
  name: 'Lim Tien Tien',
  headline: '',
  contact: { email: 'lim@example.org' },
  links: [],
  custom_sections: [
    {
      id: 'articles',
      author: 'candidate',
      heading: 'Journal Articles',
      entries: [
        { title: 'Lexicon+TX', detail: 'Language Resources', bullets: [] },
        { title: 'Low cost lexicons', detail: 'Polibits', bullets: [] },
      ],
    },
  ],
  section_headings: {},
  achievements: [],
  courses: [],
  passions: [],
  languages: [],
  summary: '',
  skills: [{ category: 'Languages', items: ['Python', 'Prolog'] }],
  experience: [
    {
      company: 'XYZ College',
      title: 'Lecturer',
      location: 'Penang',
      start: '2018-01',
      end: 'Present',
      bullets: ['Taught compilers.'],
      tech: [],
    },
  ],
  education: [
    {
      school: 'Unseen University',
      degree: 'PhD',
      field: 'Magic',
      start: '2009',
      end: '2013',
    },
  ],
  certifications: [],
};

const { Document } = TEMPLATE_RENDERERS.curve;

const draw = () =>
  render(
    <DocumentPresentationProvider>
      <Document resume={RESUME} />
    </DocumentPresentationProvider>,
  ).container;

describe('the Curve document', () => {
  it('hangs an entry off its dates beside a bookmark, the role in bold', () => {
    const entry = draw().querySelector('.tpl-curve__entry');
    expect(entry?.firstElementChild?.className).toBe('tpl-curve__when');
    expect(entry?.textContent).toMatch(
      /^2018-01 – PresentLecturer, XYZ College, Penang/,
    );
    expect(entry?.querySelector('strong')?.textContent).toBe('Lecturer');
    expect(css).toMatch(/\.tpl-curve__when \{[^}]*white-space: nowrap;/);
    expect(css).toMatch(/clip-path: polygon\(/);
  });

  it('numbers the entries of a custom section in discs', () => {
    const entries = draw().querySelectorAll('.tpl-curve__entry--numbered');
    expect(entries).toHaveLength(2);
    expect(css).toMatch(/content: counter\(cv-item\);/);
  });

  it('sets the name and headings in Cabin over a fading rule', () => {
    expect(css).toMatch(/--cv-sans: 'Cabin'/);
    expect(css).toMatch(/--cv-font: 'Cochineal'/);
    expect(css).toMatch(/--cv-mono: 'Inconsolata'/);
    expect(css).toMatch(
      /linear-gradient\(to right, var\(--cv-rule\), transparent\)/,
    );
    expect(draw().querySelector('.tpl-curve__avatar')?.textContent).toBe('LT');
  });

  /* ats: one column, dates first, markers drawn, one skill per unit. */
  it('keeps its ats claims', () => {
    const container = draw();
    expect(container.querySelector('table, img, aside')).toBeNull();
    expect(css).not.toMatch(/content: '[^']+';[^}]*clip-path/);
    const education = container.querySelectorAll('.tpl-curve__entry')[1];
    expect(education?.textContent).toMatch(
      /^2009 – 2013PhD in Magic, Unseen University/,
    );
    const skills = [
      ...container.querySelectorAll('.tpl-skill-grid__group .tpl-bullet'),
    ].map((li) => li.textContent);
    expect(skills).toEqual(['Python', 'Prolog']);
  });
});
