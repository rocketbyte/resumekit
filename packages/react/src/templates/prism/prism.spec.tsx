import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ResumeObject } from '@resumekit/schema';
import { TEMPLATE_RENDERERS } from '../../registry.js';
import { DocumentPresentationProvider } from '../../presentation-context.js';

const css = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), 'prism.css'),
  'utf8',
);

const RESUME: ResumeObject = {
  name: 'Adrien Friggeri',
  headline: 'Social network analyst',
  contact: { email: 'adrien@example.org', location: 'Lyon' },
  links: [],
  custom_sections: [],
  section_headings: {},
  achievements: [],
  courses: [],
  passions: [],
  languages: [],
  summary: 'Complex networks and community detection.',
  skills: [{ category: 'Programming', items: ['OCaml', 'Python'] }],
  experience: [
    {
      company: 'LIP6/CNRS',
      title: 'Research intern',
      location: 'Paris',
      start: '2009-02',
      end: '2009-07',
      bullets: ['Visualization of complex networks.'],
      tech: [],
    },
  ],
  education: [],
  certifications: [],
};

const { Document } = TEMPLATE_RENDERERS.prism;

const draw = () =>
  render(
    <DocumentPresentationProvider>
      <Document resume={RESUME} />
    </DocumentPresentationProvider>,
  ).container;

describe('the Prism document', () => {
  it('sets the name light then bold in a band that is forced to print', () => {
    const page = draw();
    expect(page.querySelector('.tpl-prism__name-first')?.textContent).toBe(
      'Adrien',
    );
    expect(page.querySelector('.tpl-prism__name-last')?.textContent).toBe(
      'Friggeri',
    );
    expect(page.querySelector('.tpl-prism__name')?.textContent).toBe(
      'Adrien Friggeri',
    );
    expect(css).toMatch(/\.tpl-prism__head \{[^}]*print-color-adjust: exact;/);
  });

  it('writes the label column before the work history', () => {
    const text = draw().querySelector('.tpl-prism__body')?.textContent ?? '';
    expect(text.indexOf('OCaml')).toBeGreaterThan(-1);
    expect(text.indexOf('OCaml')).toBeLessThan(text.indexOf('LIP6/CNRS'));
  });

  it('colours the opening letters of each heading without splitting its text', () => {
    const headings = [
      ...draw().querySelectorAll('.tpl-prism__main h2'),
    ] as HTMLElement[];
    const experience = headings.find((h) =>
      /experience/i.test(h.textContent ?? ''),
    );
    expect(
      experience?.querySelector('.tpl-prism__heading-lead')?.textContent,
    ).toHaveLength(3);
    expect(experience?.textContent).toMatch(/^experience$/i);
    expect(experience?.className).toMatch(/hue-red/);
  });
});
