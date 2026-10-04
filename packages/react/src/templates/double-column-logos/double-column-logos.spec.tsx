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
 * The Double Column with Logos template.
 *
 * Its own claim is the MARK beside each employer: a résumé stores no logos and
 * the renderer resolves no URLs, so the mark is the employer's initials, and
 * this file holds it to that.
 */

const css = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), 'double-column-logos.css'),
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

const { Document } = TEMPLATE_RENDERERS['double-column-logos'];

const draw = (data: ResumeObject) =>
  render(
    <DocumentPresentationProvider>
      <FieldRegistryProvider enabled>
        <Document resume={data} />
      </FieldRegistryProvider>
    </DocumentPresentationProvider>,
  );

describe('the Double Column with Logos document', () => {
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
    expect(container.querySelector('.tpl-dcl__main')?.textContent).toContain(
      'English',
    );
  });

  /*
   * The résumé is written before the rail. This is the template's one ATS
   * claim, so it is asserted against the DOM order rather than against a
   * column width nobody extracts.
   */
  it('writes the résumé before the rail', () => {
    const { container } = draw(resume());
    const flows = Array.from(container.querySelectorAll('[data-flow]'));
    expect(flows).toHaveLength(2);
    expect(flows[0]?.className).toContain('tpl-dcl__main');
    expect(flows[0]?.textContent).toContain('Supply Chain Analyst');
    expect(flows[1]?.className).toContain('tpl-dcl__aside');
  });

  /* The employer on a line of its own under the role, as the reference sets
     it, then the dates and the place joined by a real space: the icons
     between them are drawn, and extract as nothing. */
  it('puts the employer under the role, then the dates and the place', () => {
    const { container } = draw(resume());
    const entry = container.querySelector('.tpl-dcl__entry');
    expect(entry?.querySelector('.tpl-dcl__org')?.textContent).toBe('Unilever');
    const meta = entry?.querySelector('.tpl-dcl__meta');
    expect(meta?.textContent).toMatch(/2019-01 - 2022-12\s+London, UK/);
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
   * A logo would mean a URL, and the renderer resolves none — that is what
   * stops a crafted résumé steering it at an internal address. So the mark is
   * the employer's own initials, derived from the name printed beside it.
   */
  it('marks each employer with its initials, and fetches nothing', () => {
    const { container } = draw(resume());
    const marks = container.querySelectorAll('.tpl-dcl__mark');
    expect(marks[0]?.textContent).toBe('U');
    expect(marks[0]?.getAttribute('aria-hidden')).toBe('true');
    expect(container.querySelector('img')).toBeNull();
    expect(container.innerHTML).not.toMatch(
      /https?:\/\/[^"]*\.(png|jpe?g|svg)/,
    );
  });

  /* The reference has no portrait, so none is drawn — not even initials. */
  it('draws no portrait', () => {
    const { container } = draw(resume());
    expect(container.querySelector('.tpl-avatar')).toBeNull();
    expect(container.querySelector('img')).toBeNull();
  });

  /* The rail sits against the page's right edge, so its controls belong in the
     right margin rather than over the column beside them. */
  it('puts the rail’s controls in the right margin', () => {
    /* Any rule naming the aside may carry it; `min-width` has its own. */
    const rules = [...css.matchAll(/\.tpl-dcl__aside \{([^}]*)\}/g)];
    expect(rules.some(([, body]) => /--tpl-rail-left:/.test(body))).toBe(true);
  });

  it('honours the guarantees its catalog entry makes', () => {
    const { container } = draw(resume());
    /* No tables, no images, and the column count the badge is drawn from. */
    expect(container.querySelector('table')).toBeNull();
    expect(container.querySelector('img')).toBeNull();
    expect(TEMPLATES['double-column-logos'].columns).toBe(2);
  });

  /* Large, heavy headings over a heavy rule: the eye finds a section before
     it finds a word, which is this page's whole idea. */
  it('sets its headings large and heavy over a heavy rule', () => {
    const heading = css.slice(css.indexOf('.tpl-dcl__heading {'));
    const body = heading.slice(0, heading.indexOf('}'));
    expect(body).toMatch(/font-size: calc\(15pt/);
    expect(body).toMatch(/font-weight: 700/);
    expect(body).toMatch(/border-bottom: 2pt solid/);
  });

  /* One highlight is divided from the next by a rule, not by space. */
  it('divides the rail’s highlights with a dotted rule', () => {
    const note = css.slice(css.indexOf('.tpl-dcl__note + .tpl-dcl__note {'));
    expect(note.slice(0, note.indexOf('}'))).toMatch(/border-top: [^;]*dotted/);
  });
});
