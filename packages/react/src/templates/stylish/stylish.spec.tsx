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
 * The Stylish template.
 *
 * Its own claim is the ORDER: the rail is on the left, so it is written first
 * and a parser receives the highlights and skills before the work history.
 * Saying otherwise would put the product's central claim behind a sentence
 * somebody typed. The editing capabilities belong to `conformance.spec.tsx`.
 */

const css = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), 'stylish.css'),
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
        <TEMPLATE_RENDERERS.stylish.Document resume={data} />
      </FieldRegistryProvider>
    </DocumentPresentationProvider>,
  );

describe('the Stylish document', () => {
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

  /* Languages is read from the skills group that names them: it belongs with
     the résumé in the main column, not in the rail's chips. */
  it('keeps languages out of the chips, and in the résumé column', () => {
    const { container } = draw(resume());
    const chips = container.querySelector('.tpl-keywords');
    expect(chips?.textContent).toContain('Supply Chain Management');
    expect(chips?.textContent).not.toContain('English');
    expect(
      container.querySelector('.tpl-stylish__main')?.textContent,
    ).toContain('English');
  });

  /*
   * The rail is DRAWN first and so is WRITTEN first: document order is the
   * page's order, which is what makes the extracted text, the printed text
   * layer and the keyboard's path one order rather than three.
   */
  it('writes the rail first, because the rail is on the left', () => {
    const { container } = draw(resume());
    const flows = Array.from(container.querySelectorAll('[data-flow]'));
    expect(flows).toHaveLength(2);
    expect(flows[0]?.className).toContain('tpl-stylish__aside');
    expect(flows[0]?.textContent).toContain('Achievements');
    expect(flows[1]?.className).toContain('tpl-stylish__main');
    expect(flows[1]?.textContent).toContain('Supply Chain Analyst');
  });

  /* One line for the facts: employer, dates and place. The dates and the
     place are each marked by a glyph drawn over a real character, so the
     extracted line still reads as three things. */
  it('puts the employer, the dates and the place on one line', () => {
    const { container } = draw(resume());
    const meta = container.querySelector(
      '.tpl-stylish__entry .tpl-stylish__meta',
    );
    expect(meta?.textContent).toContain('Unilever');
    expect(meta?.querySelector('.tpl-stylish__dates')?.textContent).toContain(
      '2019-01',
    );
    expect(meta?.querySelector('.tpl-stylish__place')?.textContent).toBe(
      'London, UK',
    );
    const mark = css.slice(css.indexOf('.tpl-stylish__place::before {'));
    expect(mark.slice(0, mark.indexOf('}'))).toMatch(/content: '\\00a0'/);
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

  /*
   * A portrait is not stored and is not invented. The initials stand in its
   * slot, derived from the name printed beside them — and carry no text of
   * their own to extract, because the name is real text inches away and an
   * extracted "JT" between it and the headline would be noise.
   */
  it('draws initials where the reference shows a portrait, and no image', () => {
    const { container } = draw(resume());
    const avatar = container.querySelector('.tpl-avatar');
    expect(avatar?.textContent).toBe('JT');
    expect(avatar?.getAttribute('aria-hidden')).toBe('true');
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('svg image')).toBeNull();
  });

  /* The rail sits against the page's right edge, so its controls belong in the
     right margin rather than over the column beside them. */
  /* The MAIN column is the one against the page's right edge here, so it is
     the one whose controls move to the right margin. */
  it('puts the right-hand column’s controls in the right margin', () => {
    const rules = [...css.matchAll(/\.tpl-stylish__main \{([^}]*)\}/g)];
    expect(rules.some(([, body]) => /--tpl-rail-left:/.test(body))).toBe(true);
  });

  it('honours the guarantees its catalog entry makes', () => {
    const { container } = draw(resume());
    /* No tables, no images, and the column count the badge is drawn from. */
    expect(container.querySelector('table')).toBeNull();
    expect(container.querySelector('img')).toBeNull();
    expect(TEMPLATES.stylish.columns).toBe(2);
  });

  /* The rule under each heading is what separates the two columns — there is
     no divider between them, which is what keeps the page from reading as a
     form. */
  it('rules each heading across its own column, and draws no divider', () => {
    const heading = css.slice(css.indexOf('.tpl-stylish__heading {'));
    const body = heading.slice(0, heading.indexOf('}'));
    expect(body).toMatch(/text-transform: uppercase/);
    expect(body).toMatch(/border-bottom: [^;]+solid/);
    const aside = css.slice(css.indexOf('.tpl-stylish__aside {'));
    expect(aside.slice(0, aside.indexOf('}'))).not.toMatch(/border-left/);
  });
});
