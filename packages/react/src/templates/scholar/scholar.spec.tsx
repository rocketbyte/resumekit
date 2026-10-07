import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ResumeObject } from '@cvgs/core';
import { TEMPLATE_RENDERERS } from '../../registry.js';
import { DocumentPresentationProvider } from '../../presentation-context.js';

const css = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), 'scholar.css'),
  'utf8',
);

const RESUME: ResumeObject = {
  name: 'Carl Johnson (CJ)',
  contact: {
    email: 'cj@example.com',
    phone: '+1-202-555-0100',
    location: '113, Groove Street',
  },
  links: [],
  custom_sections: [],
  section_headings: {},
  achievements: [],
  courses: [],
  passions: [],
  languages: [],
  summary: '',
  skills: [{ category: 'Programming', items: ['C', 'Java', 'Prolog'] }],
  experience: [
    {
      company: 'Dank Memes Inc.',
      title: 'Head of Department',
      location: 'Ariccia, Italy',
      start: '2019-09',
      end: '2021-09',
      bullets: ['Developed predictive models.'],
      tech: [],
    },
  ],
  education: [
    {
      school: 'Faber College',
      location: 'Faber, PA',
      degree: 'Master’s degree',
      field: 'Memeology',
      start: '2019-02',
      end: '2020-04',
    },
  ],
  certifications: [],
};

const { Document } = TEMPLATE_RENDERERS.scholar;

const draw = () =>
  render(
    <DocumentPresentationProvider>
      <Document resume={RESUME} />
    </DocumentPresentationProvider>,
  ).container;

const rows = (container: HTMLElement, entry: string) =>
  [...container.querySelectorAll(`${entry} .tpl-scholar__rows > *`)].map(
    (cell) => [cell.className, cell.textContent],
  );

describe('the Scholar document', () => {
  it('sets an employer over dates, then the role in italics over the place', () => {
    expect(rows(draw(), '.tpl-scholar__entry:has(.tpl-bullets)')).toEqual([
      ['tpl-scholar__title', 'Dank Memes Inc.'],
      ['tpl-scholar__title-aside', '2019-09 – 2021-09'],
      ['tpl-scholar__sub', 'Head of Department'],
      ['tpl-scholar__sub-aside', 'Ariccia, Italy'],
    ]);
  });

  it('sets a degree beside its school, then the place beside the dates', () => {
    expect(rows(draw(), '.tpl-scholar__entry:not(:has(.tpl-bullets))')).toEqual(
      [
        ['tpl-scholar__title', 'Master’s degree in Memeology'],
        ['tpl-scholar__title-aside', 'Faber College'],
        ['tpl-scholar__sub', 'Faber, PA'],
        ['tpl-scholar__sub-aside', '2019-02 – 2020-04'],
      ],
    );
  });

  it('draws the name and headings in bold italic blue, never upper case', () => {
    for (const cls of ['name', 'heading']) {
      expect(css).toMatch(
        new RegExp(
          `\\.tpl-scholar__${cls} \\{[^}]*font-style: italic;[^}]*font-weight: 700;[^}]*color: var\\(--sc-accent\\);`,
        ),
      );
    }
    expect(css).toMatch(/--sc-accent: #00367b;/);
    expect(css).toMatch(/--sc-font: 'Latin Modern Roman'/);
    expect(css).not.toMatch(/text-transform/);
  });

  /* ats: one column, centred plain contact text, one skill per extracted unit. */
  it('keeps its ats claims', () => {
    const container = draw();
    expect(container.querySelector('table, img, svg, aside')).toBeNull();
    const contact = [
      ...container.querySelectorAll('.tpl-scholar__contact'),
    ].map((line) => line.textContent);
    expect(contact).toEqual([
      '113, Groove Street',
      'cj@example.com+1-202-555-0100',
    ]);
    const skills = [
      ...container.querySelectorAll('.tpl-skill-grid__group .tpl-bullet'),
    ].map((li) => li.textContent);
    expect(skills).toEqual(['C', 'Java', 'Prolog']);
    expect(container.querySelector('.tpl-skill-grid__label')?.textContent).toBe(
      'Programming',
    );
  });
});
