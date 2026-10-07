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
    achievements: [],
    courses: [],
    passions: [],
    languages: [],
    ...overrides,
  };
}

function renderSplit(data: ResumeObject) {
  const { Document } = TEMPLATE_RENDERERS.split;
  return render(
    <DocumentPresentationProvider>
      <FieldRegistryProvider enabled>
        <Document resume={data} />
      </FieldRegistryProvider>
    </DocumentPresentationProvider>,
  );
}

const css = readFileSync(resolve(__dirname, 'split.css'), 'utf8');

describe('the Split document', () => {
  it('sets the organisation and the role on one line, the dates under them', () => {
    const { container } = renderSplit(resume());
    const entry = container.querySelector('.tpl-split__main .tpl-split__entry');
    const lead = entry?.querySelector('.tpl-split__lead');
    expect(lead?.querySelector('.tpl-split__org')?.textContent).toBe(
      'Doral Health & Wellness',
    );
    expect(lead?.querySelector('.tpl-split__role')?.textContent).toBe(
      'Senior Software Engineer',
    );
    expect(lead?.textContent).toBe(
      'Doral Health & Wellness | Senior Software Engineer',
    );
    expect(entry?.querySelector('.tpl-split__meta')?.textContent).toBe(
      '2024-01 – Present | New York, NY',
    );
  });

  it('writes the narrow column first, as its first ats line claims', () => {
    expect(TEMPLATES.split.ats[0]).toMatch(/narrow column is on the left/);
    const { container } = renderSplit(resume());
    const body = container.querySelector('.tpl-split__body');
    expect(
      body?.firstElementChild?.classList.contains('tpl-split__aside'),
    ).toBe(true);
    const text = container.textContent ?? '';
    for (const [before, after] of [
      ['UTESA', 'LinkedIn'],
      ['LinkedIn', 'Backend'],
      ['Backend', 'Doral Health'],
    ]) {
      expect(text.indexOf(before), `${before} < ${after}`).toBeLessThan(
        text.indexOf(after),
      );
    }
  });

  it('prints each skill as its own item under its category, never a comma run', () => {
    expect(TEMPLATES.split.ats[1]).toMatch(/never a comma run/);
    const { container } = renderSplit(resume());
    const labels = [
      ...container.querySelectorAll('.tpl-skill-tags__label'),
    ].map((l) => l.textContent);
    expect(labels).toEqual(['Backend', 'Cloud']);
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

  it('draws its separators rather than printing them', () => {
    // The contact pipes and the bullets' only generated text is the bullet
    // glyph: every other generated box is empty and painted.
    const generated = [...css.matchAll(/content:\s*([^;]+);/g)].map(
      (m) => m[1],
    );
    expect(generated.filter((c) => c !== "''")).toEqual(["'•'"]);
  });
});
