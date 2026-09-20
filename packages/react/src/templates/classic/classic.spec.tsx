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
 * The Classic template.
 *
 * Its own claims: an entry that leads with the role over the employer in the
 * accent, headings with no rule at all, and the candidate's own sections set
 * two to a row. The editing capabilities belong to `conformance.spec.tsx`.
 */

const css = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), 'classic.css'),
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
    achievements: [
      {
        title: 'Team Lead for Sustainability Project',
        description: 'Targeted a 15% carbon footprint reduction.',
      },
    ],
    courses: [
      { title: 'Advanced Excel', description: 'Corporate Finance Institute.' },
    ],
    passions: [
      { title: 'Marathon Running', description: 'Five national marathons.' },
    ],
    languages: [
      { name: 'English', level: 'native' },
      { name: 'French', level: 'advanced' },
    ],
    custom_sections: [
      {
        id: 'ach',
        heading: 'Volunteering',
        author: 'candidate',
        entries: [
          {
            title: 'Team Lead for Sustainability Project',
            detail: 'Targeted a 15% carbon footprint reduction.',
            bullets: [],
          },
        ],
      },
    ],
    section_headings: {},
    ...overrides,
  };
}

const draw = (data: ResumeObject) =>
  render(
    <DocumentPresentationProvider>
      <FieldRegistryProvider enabled>
        <TEMPLATE_RENDERERS.classic.Document resume={data} />
      </FieldRegistryProvider>
    </DocumentPresentationProvider>,
  );

describe('the Classic document', () => {
  it('renders every section the resume holds, including the candidate’s own', () => {
    draw(resume());
    for (const heading of [
      'Summary',
      'Experience',
      'Education',
      'Skills',
      'Languages',
      'Certifications',
      'Volunteering',
    ]) {
      expect(screen.getByText(heading), heading).toBeTruthy();
    }
  });

  it('omits a section it has no data for', () => {
    draw(
      resume({
        summary: '',
        certifications: [],
        custom_sections: [],
        section_headings: {},
        achievements: [],
        courses: [],
        passions: [],
        languages: [],
      }),
    );
    expect(screen.queryByText('Summary')).toBeNull();
    expect(screen.queryByText('Certifications')).toBeNull();
    expect(screen.queryByText('Achievements')).toBeNull();
    expect(screen.queryByText('Courses')).toBeNull();
    expect(screen.queryByText('Languages')).toBeNull();
  });

  /* Languages is `resume.languages` — its own section, with a level per
     language, and never a keyword in the skills run. */
  it('keeps languages out of the keyword run', () => {
    const { container } = draw(resume());
    const keywords = container.querySelectorAll('.tpl-classic__keywords');
    expect(keywords[0]?.textContent).toContain('Supply Chain Management');
    expect(keywords[0]?.textContent).not.toContain('English');

    const languages = container.querySelector('.tpl-languages');
    expect(languages?.textContent).toContain('English');
    // The level is a WORD, so the section survives a page with no meter.
    expect(languages?.textContent).toContain('Native');
  });

  /* The role leads and the employer carries the accent — the reference's one
     piece of colour, and the thing that tells this page from Ivy League's. */
  it('leads with the role over the employer, and accents the employer', () => {
    const { container } = draw(resume());
    const head = container.querySelector(
      '.tpl-classic__entry .tpl-classic__head',
    );
    expect(head?.querySelector('.tpl-classic__lead')?.textContent).toBe(
      'Supply Chain Analyst',
    );
    expect(head?.querySelector('.tpl-classic__support')?.textContent).toBe(
      'Unilever',
    );
    expect(head?.querySelector('.tpl-classic__place')?.textContent).toBe(
      'London, UK',
    );
    const support = css.slice(css.indexOf('.tpl-classic__support {'));
    expect(support.slice(0, support.indexOf('}'))).toMatch(
      /var\(--cl-accent\)/,
    );
  });

  /*
   * The candidate's own sections are set two to a row — as a GRID, because a
   * note is an editable container and a container that spans a CSS column
   * break is fragmented, which leaves it unable to hold its own rail.
   */
  it('sets the candidate’s own sections two to a row, without fragmenting one', () => {
    const notes = css.slice(
      css.indexOf('.tpl-classic__section:has(> .tpl-classic__note) {'),
    );
    expect(notes.slice(0, notes.indexOf('}'))).toMatch(/display: grid/);
    /* `columns` on its own, not the `grid-template-columns` above. */
    expect(css).not.toMatch(/(^|[\s;{])columns:/m);
  });

  it('honours the guarantees its catalog entry makes', () => {
    const { container } = draw(resume());
    /* Single column, no tables, no images: the claims a screening system
       actually reads, asserted against the rendered document. */
    expect(TEMPLATES.classic.columns).toBe(1);
    expect(container.querySelector('table')).toBeNull();
    expect(container.querySelector('img')).toBeNull();
    /*
     * One column of DOCUMENT: a two-column template marks each column
     * `data-flow` for the paginator, and this page has none. The notes grid
     * inside a section is two columns of one section, not of the resume.
     */
    expect(container.querySelector('[data-flow]')).toBeNull();
  });

  /* No rules, no bands: the page is type and space, which is the claim its
     catalog entry makes to a screening system. */
  it('draws its headings as plain uppercase text', () => {
    const heading = css.slice(css.indexOf('.tpl-classic__heading {'));
    const body = heading.slice(0, heading.indexOf('}'));
    expect(body).toMatch(/text-transform: uppercase/);
    expect(body).not.toMatch(/border|background/);
  });
});
