import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TEMPLATES, type ResumeObject } from '@cvgs/core';
import { TEMPLATE_RENDERERS } from '../../registry.js';
import { FieldRegistryProvider } from '../../fields/field-registry.js';
import { DocumentPresentationProvider } from '../../presentation-context.js';

/**
 * The Ivy League template.
 *
 * What is asserted here is what is ITS own: the centred academic structure of
 * its reference, and the guarantees its catalog entry makes to a candidate.
 * The editing capabilities belong to `conformance.spec.tsx`, which holds every
 * registered template to them.
 */

const css = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), 'ivy.css'),
  'utf8',
);

function resume(overrides: Partial<ResumeObject> = {}): ResumeObject {
  return {
    name: 'Jack Taylor',
    headline: 'Experienced Business Analyst',
    contact: {
      email: 'jack@example.com',
      phone: '+44 20 7123 4567',
      location: 'Birmingham',
    },
    links: [{ label: 'linkedin.com', url: 'https://linkedin.com/in/jack' }],
    summary: 'Nine years in business analysis and logistics.',
    skills: [
      { category: 'Core', items: ['Supply Chain Management', 'Data Analysis'] },
      { category: 'Languages', items: ['English, Native'] },
    ],
    experience: [
      {
        company: 'Unilever',
        title: 'Supply Chain Analyst',
        location: 'London, UK',
        start: '2019-01',
        end: '2022-12',
        bullets: ['Cut supply chain costs by 15%.'],
        tech: [],
      },
    ],
    education: [
      {
        school: 'University of Warwick',
        degree: 'MSc',
        field: 'Supply Chain and Logistics Management',
        location: 'Coventry, UK',
        start: '2011-01',
        end: '2012-01',
      },
    ],
    certifications: ['Certified Supply Chain Professional'],
    custom_sections: [
      {
        id: 'ach',
        heading: 'Achievements',
        entries: [
          {
            id: 'a1',
            title: 'Team Lead for Sustainability Project',
            detail: 'Targeted a 15% carbon footprint reduction.',
            bullets: [],
          },
        ],
      },
    ],
    ...overrides,
  };
}

const draw = (data: ResumeObject) =>
  render(
    <DocumentPresentationProvider>
      <FieldRegistryProvider enabled>
        <TEMPLATE_RENDERERS.ivy.Document resume={data} />
      </FieldRegistryProvider>
    </DocumentPresentationProvider>,
  );

describe('the Ivy League document', () => {
  it('renders every section the resume holds, including the candidate’s own', () => {
    draw(resume());
    for (const heading of [
      'Summary',
      'Experience',
      'Education',
      'Skills',
      'Languages',
      'Certifications',
      'Achievements',
    ]) {
      expect(screen.getByText(heading), heading).toBeTruthy();
    }
  });

  it('omits a section it has no data for', () => {
    draw(resume({ summary: '', certifications: [], custom_sections: [] }));
    expect(screen.queryByText('Summary')).toBeNull();
    expect(screen.queryByText('Certifications')).toBeNull();
    expect(screen.queryByText('Achievements')).toBeNull();
  });

  /* Languages is read from the skills group that names them, and is printed
     as its own section rather than inside the keyword run. */
  it('keeps languages out of the keyword run', () => {
    const { container } = draw(resume());
    const keywords = container.querySelectorAll('.tpl-ivy__keywords');
    expect(keywords[0]?.textContent).toContain('Supply Chain Management');
    expect(keywords[0]?.textContent).not.toContain('English');
    expect(keywords[1]?.textContent).toContain('English');
  });

  /* Four corners on two lines: organisation and place over role and dates. */
  it('sets each entry as four corners', () => {
    const { container } = draw(resume());
    const head = container.querySelector('.tpl-ivy__entry .tpl-ivy__head');
    expect(head?.querySelector('.tpl-ivy__org')?.textContent).toBe('Unilever');
    expect(head?.querySelector('.tpl-ivy__where')?.textContent).toBe(
      'London, UK',
    );
    expect(head?.querySelector('.tpl-ivy__role')?.textContent).toBe(
      'Supply Chain Analyst',
    );
    expect(head?.querySelector('.tpl-ivy__dates')?.textContent).toContain(
      '2019-01',
    );
  });

  it('honours the guarantees its catalog entry makes', () => {
    const { container } = draw(resume());
    /* Single column, no tables, no images: the claims a screening system
       actually reads, asserted against the rendered document. */
    expect(TEMPLATES.ivy.columns).toBe(1);
    expect(container.querySelector('table')).toBeNull();
    expect(container.querySelector('img')).toBeNull();
    expect(css).not.toMatch(/grid-template-columns:[^;]*(1fr[^;]*){2,}/);
  });

  it('centres its headings over a full-width rule', () => {
    const heading = css.slice(css.indexOf('.tpl-ivy__heading {'));
    expect(heading).toMatch(/text-align: center/);
    expect(heading).toMatch(/border-bottom: [^;]+solid/);
  });
});
