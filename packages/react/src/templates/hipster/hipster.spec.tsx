import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ResumeObject } from '@cvgs/core';
import { TEMPLATE_RENDERERS } from '../../registry.js';
import { DocumentPresentationProvider } from '../../presentation-context.js';

const css = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), 'hipster.css'),
  'utf8',
);

const RESUME: ResumeObject = {
  name: 'Jack Sparrow',
  headline: 'Captain',
  contact: { email: 'jack@example.org', location: 'Tortuga' },
  links: [],
  custom_sections: [],
  section_headings: {},
  achievements: [],
  courses: [],
  passions: [],
  languages: [],
  summary: 'Finally got the ship back.',
  skills: [{ category: 'Programming', items: ['Python', 'R'] }],
  experience: [
    {
      company: 'The Black Pearl',
      title: 'Captain',
      location: 'East Indies',
      start: '2018-01',
      end: '2021-12',
      bullets: ['Recovered the ship.'],
      tech: [],
    },
  ],
  education: [],
  certifications: [],
};

const { Document } = TEMPLATE_RENDERERS.hipster;

const draw = () =>
  render(
    <DocumentPresentationProvider>
      <Document resume={RESUME} />
    </DocumentPresentationProvider>,
  ).container;

describe('the Hipster document', () => {
  it('sets the name light then bold in a band that is forced to print', () => {
    const page = draw();
    expect(page.querySelector('.tpl-hipster__name-first')?.textContent).toBe(
      'Jack',
    );
    expect(page.querySelector('.tpl-hipster__name-last')?.textContent).toBe(
      'Sparrow',
    );
    expect(css).toMatch(
      /\.tpl-hipster__head \{[^}]*print-color-adjust: exact;/,
    );
  });

  it('writes the sidebar first, so the summary extracts before the work history', () => {
    const text = draw().querySelector('.tpl-hipster__body')?.textContent ?? '';
    expect(text.indexOf('Finally got the ship back.')).toBeGreaterThan(-1);
    expect(text.indexOf('Finally got the ship back.')).toBeLessThan(
      text.indexOf('The Black Pearl'),
    );
  });

  it('hangs a role off its dates on the spine, the dates on one line', () => {
    const entry = draw().querySelector(
      '.tpl-hipster__spine .tpl-hipster__entry',
    );
    expect(entry?.firstElementChild?.className).toBe('tpl-hipster__when');
    expect(entry?.textContent).toMatch(/^2018-01–2021-12Captain/);
    expect(css).toMatch(
      /\.tpl-hipster__spine \.tpl-hipster__event \{[^}]*border-left:/,
    );
    expect(css).toMatch(/\.tpl-hipster__when \* \{[^}]*white-space: nowrap;/);
  });

  it('boxes each skill on its own rather than running them together', () => {
    const skills = [
      ...draw().querySelectorAll('.tpl-keywords--tags .tpl-bullet'),
    ].map((li) => li.textContent);
    expect(skills).toEqual(['Python', 'R']);
  });
});
