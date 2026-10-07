import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ResumeObject } from '@cvgs/core';
import { TEMPLATE_RENDERERS } from '../../registry.js';
import { DocumentPresentationProvider } from '../../presentation-context.js';

const css = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), 'portrait.css'),
  'utf8',
);

const RESUME: ResumeObject = {
  name: 'Alice Liddell',
  headline: 'Adventurer',
  contact: { email: 'alice@example.org', location: 'United Kingdom' },
  links: [],
  custom_sections: [],
  section_headings: {},
  achievements: [],
  courses: [],
  passions: [],
  languages: [{ name: 'English', level: 'native' }],
  summary: 'A sensible girl from a wealthy English family.',
  skills: [{ category: 'Manners', items: ['Curtsying', 'Tea'] }],
  experience: [
    {
      company: 'Wonderland',
      title: 'Explorer',
      location: 'Underground',
      start: '1865-07',
      end: 'Present',
      bullets: ['Followed a rabbit.'],
      tech: [],
    },
  ],
  education: [],
  certifications: [],
};

const { Document } = TEMPLATE_RENDERERS.portrait;

const draw = () =>
  render(
    <DocumentPresentationProvider>
      <Document resume={RESUME} />
    </DocumentPresentationProvider>,
  ).container;

describe('the Portrait document', () => {
  it('writes the sidebar first: name, contact and skills before the work history', () => {
    const text = draw().textContent ?? '';
    expect(text.indexOf('Alice Liddell')).toBeLessThan(text.indexOf('Tea'));
    expect(text.indexOf('Tea')).toBeLessThan(text.indexOf('Wonderland'));
  });

  it('paints the sidebar as a column that prints, not a box text is placed in', () => {
    const aside = draw().querySelector('.tpl-portrait__aside');
    expect(aside?.closest('.tpl-portrait__body')).not.toBeNull();
    expect(css).toMatch(
      /\.tpl-portrait__aside \{[^}]*print-color-adjust: exact;/,
    );
  });

  it('sets the opening letters of a body heading in a printed tab, the heading still one word', () => {
    const heading = [...draw().querySelectorAll('.tpl-portrait__main h2')].find(
      (h) => /experience/i.test(h.textContent ?? ''),
    );
    expect(
      heading?.querySelector('.tpl-portrait__heading-lead')?.textContent,
    ).toHaveLength(3);
    expect(heading?.textContent).toMatch(/^experience$/i);
    expect(css).toMatch(
      /\.tpl-portrait__main \.tpl-portrait__heading-lead \{[^}]*print-color-adjust: exact;/,
    );
  });
});
