import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render } from '@testing-library/react';
import { TEMPLATES, type ResumeObject } from '@cvgs/core';
import { TEMPLATE_RENDERERS } from '../../registry.js';
import { FieldRegistryProvider } from '../../fields/field-registry.js';
import { DocumentPresentationProvider } from '../../presentation-context.js';

function resume(overrides: Partial<ResumeObject> = {}): ResumeObject {
  return {
    name: 'Starlin Gil Cruz',
    contact: {
      email: 'starlin.gil.cruz@gmail.com',
      phone: '+1 555 0100',
      location: 'Santo Domingo, Dominican Republic',
    },
    links: [{ label: 'LinkedIn', url: 'https://linkedin.com/in/example' }],
    custom_sections: [],
    section_headings: {},
    headline: 'Senior Software Engineer',
    summary: 'Ten years building backend platforms.',
    skills: [
      { category: 'Backend', items: ['Node.js', 'TypeScript', 'PostgreSQL'] },
      { category: 'Cloud', items: ['AWS', 'Terraform'] },
    ],
    experience: [
      {
        company: 'Doral Health & Wellness',
        title: 'Senior Software Engineer',
        start: '2024-01',
        end: 'Present',
        location: 'New York, NY',
        bullets: ['Designed NestJS microservices.'],
        tech: [],
      },
    ],
    education: [
      {
        school: 'UTESA',
        degree: 'Bachelor of Science',
        field: 'Software Engineering',
        start: '2013-01',
        end: '2017-06',
      },
    ],
    certifications: [],
    achievements: [
      { title: 'Team Lead', description: 'Cut the carbon footprint by 15%.' },
    ],
    courses: [],
    passions: [],
    languages: [
      { name: 'English', level: 'native' },
      { name: 'French', level: 'intermediate' },
    ],
    ...overrides,
  };
}

function renderAlta(data: ResumeObject, editing = true) {
  const { Document } = TEMPLATE_RENDERERS.alta;
  return render(
    <DocumentPresentationProvider>
      <FieldRegistryProvider enabled={editing}>
        <Document resume={data} />
      </FieldRegistryProvider>
    </DocumentPresentationProvider>,
  );
}

const css = readFileSync(resolve(__dirname, 'alta.css'), 'utf8');

describe('the Alta document', () => {
  it('sets an entry as title, organisation, then dates and place', () => {
    const { container } = renderAlta(resume());
    const entry = container.querySelector('.tpl-alta__main .tpl-alta__entry');
    expect(entry?.querySelector('.tpl-alta__title')?.textContent).toBe(
      'Senior Software Engineer',
    );
    expect(entry?.querySelector('.tpl-alta__org')?.textContent).toBe(
      'Doral Health & Wellness',
    );
    expect(entry?.querySelector('.tpl-alta__when')?.textContent).toBe(
      '2024-01 – Present',
    );
    expect(entry?.querySelector('.tpl-alta__where')?.textContent).toBe(
      'New York, NY',
    );
  });

  it('draws the initials in the disc beside the name', () => {
    const { container } = renderAlta(resume());
    const head = container.querySelector('.tpl-alta__head');
    const avatar = head?.querySelector('.tpl-alta__avatar');
    expect(avatar?.textContent).toBe('SC');
    expect(avatar?.getAttribute('aria-hidden')).toBe('true');
  });

  it('writes the work history first, as its first ats line claims', () => {
    expect(TEMPLATES.alta.ats[0]).toMatch(/work history is written first/);
    const { container } = renderAlta(resume());
    const body = container.querySelector('.tpl-alta__body');
    expect(body?.firstElementChild?.classList.contains('tpl-alta__main')).toBe(
      true,
    );
    const text = container.textContent ?? '';
    for (const [before, after] of [
      ['Doral Health', 'UTESA'],
      ['UTESA', 'Ten years building'],
      ['Ten years building', 'Team Lead'],
      ['Team Lead', 'Node.js'],
      ['Node.js', 'English'],
    ]) {
      expect(text.indexOf(before), `${before} < ${after}`).toBeLessThan(
        text.indexOf(after),
      );
    }
  });

  it('prints each strength as a tag of its own, never a comma run', () => {
    const { container } = renderAlta(resume());
    const items = [
      ...container.querySelectorAll('.tpl-skill-tags .tpl-bullet'),
    ].map((i) => i.textContent);
    expect(items).toEqual([
      'Node.js',
      'TypeScript',
      'PostgreSQL',
      'AWS',
      'Terraform',
    ]);
    expect(container.querySelector('.tpl-skill-tags')?.textContent).not.toMatch(
      /,/,
    );
  });

  it('prints a language level as its word beside the dots', () => {
    expect(TEMPLATES.alta.ats[1]).toMatch(/print as words/);
    const { container } = renderAlta(resume(), false);
    const french = container.querySelectorAll('.tpl-language')[1];
    expect(french?.querySelector('.tpl-language__level')?.textContent).toBe(
      'Intermediate',
    );
    expect(french?.querySelectorAll('.tpl-language__step--on').length).toBe(2);
  });

  it('draws its icons and dividers rather than printing them', () => {
    expect(TEMPLATES.alta.ats[2]).toMatch(/no text of their own/);
    // Every generated box is empty and painted, except the bullet glyph.
    const generated = [...css.matchAll(/content:\s*([^;]+);/g)].map(
      (m) => m[1],
    );
    expect(generated.filter((c) => c !== "''")).toEqual(["'•'"]);
  });
});
