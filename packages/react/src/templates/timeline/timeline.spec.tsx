import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TEMPLATES, type ResumeObject } from '@resumekit/schema';
import { TEMPLATE_RENDERERS } from '../../registry.js';
import { FieldRegistryProvider } from '../../fields/field-registry.js';
import { DocumentPresentationProvider } from '../../presentation-context.js';

/**
 * The Timeline template.
 *
 * Its own claims: an entry hung off a dated spine, that spine drawn as a
 * border so it cannot drift from the entries it marks, and skills as chips
 * that remain a list. The editing capabilities belong to
 * `conformance.spec.tsx`.
 */

const css = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), 'timeline.css'),
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
        <TEMPLATE_RENDERERS.timeline.Document resume={data} />
      </FieldRegistryProvider>
    </DocumentPresentationProvider>,
  );

describe('the Timeline document', () => {
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

  /* Languages is read from the skills group that names them, and is printed
     as its own section rather than among the skill chips. */
  it('keeps languages out of the chips', () => {
    const { container } = draw(resume());
    const chips = container.querySelector('.tpl-keywords');
    expect(chips?.textContent).toContain('Supply Chain Management');
    expect(chips?.textContent).not.toContain('English');
    expect(container.textContent).toContain('English');
  });

  /* Dates and place at the left, then the work: the order an entry extracts
     in, and the shape the design is named for. */
  it('hangs each entry off its dates', () => {
    const { container } = draw(resume());
    const entry = container.querySelector('.tpl-timeline__entry');
    expect(entry?.querySelector('.tpl-timeline__dates')?.textContent).toContain(
      '2019-01',
    );
    expect(entry?.querySelector('.tpl-timeline__place')?.textContent).toBe(
      'London, UK',
    );
    expect(entry?.querySelector('.tpl-timeline__role')?.textContent).toBe(
      'Supply Chain Analyst',
    );
    expect(entry?.querySelector('.tpl-timeline__org')?.textContent).toBe(
      'Unilever',
    );
  });

  /*
   * The spine is a BORDER on the entry's own column and the dot is a filled
   * shape — both foreground ink, so the page prints complete with background
   * graphics switched off, and neither can drift from the entries it marks.
   */
  it('draws the spine as ink on the entry, not as a background', () => {
    const spine = css.slice(css.indexOf('.tpl-timeline__spine {'));
    expect(spine.slice(0, spine.indexOf('}'))).toMatch(/border-left:/);
    const dot = css.slice(css.indexOf('.tpl-timeline__spine::before {'));
    expect(dot.slice(0, dot.indexOf('}'))).toMatch(/border-radius: 50%/);
    expect(css).not.toMatch(/background-image:/);
  });

  /*
   * Skills are keywords over a RULE, one to a line — the shape every
   * reference in this catalog sets them in — and still list items, so a
   * parser reads one skill per line rather than a run of joined words.
   */
  it('draws skills as keywords over a rule, and keeps them a list', () => {
    const { container } = draw(resume());
    const keywords = container.querySelector('.tpl-keywords');
    expect(keywords?.querySelectorAll('li').length).toBeGreaterThan(0);
    expect(keywords?.querySelector('[class*="__chips"]')).toBeNull();
  });

  it('honours the guarantees its catalog entry makes', () => {
    const { container } = draw(resume());
    /* Single column, no tables, no images: the claims a screening system
       actually reads, asserted against the rendered document. */
    expect(TEMPLATES.timeline.columns).toBe(1);
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
    const heading = css.slice(css.indexOf('.tpl-timeline__heading {'));
    const body = heading.slice(0, heading.indexOf('}'));
    expect(body).toMatch(/text-transform: uppercase/);
    expect(body).not.toMatch(/border|background/);
  });
});
