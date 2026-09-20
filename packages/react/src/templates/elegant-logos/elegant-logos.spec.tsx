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
 * The Elegant with Logos template.
 *
 * Elegant's rail, plus the claim this variant adds: the mark beside each
 * employer is its INITIALS, because a résumé stores no logos and the renderer
 * resolves no URLs.
 */

const css = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), 'elegant-logos.css'),
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
    ...overrides,
  };
}

const { Document } = TEMPLATE_RENDERERS['elegant-logos'];

const draw = (data: ResumeObject) =>
  render(
    <DocumentPresentationProvider>
      <FieldRegistryProvider enabled>
        <Document resume={data} />
      </FieldRegistryProvider>
    </DocumentPresentationProvider>,
  );

describe('the Elegant with Logos document', () => {
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

  /* Languages is read from the skills group that names them: it belongs with
     the résumé in the main column, not in the rail's chips. */
  it('keeps languages out of the chips, and in the résumé column', () => {
    const { container } = draw(resume());
    const chips = container.querySelector('.tpl-ell__chips');
    expect(chips?.textContent).toContain('Supply Chain Management');
    expect(chips?.textContent).not.toContain('English');
    expect(container.querySelector('.tpl-ell__main')?.textContent).toContain(
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
    expect(flows[0]?.className).toContain('tpl-ell__main');
    expect(flows[0]?.textContent).toContain('Supply Chain Analyst');
    expect(flows[1]?.className).toContain('tpl-ell__aside');
  });

  /* One line for the facts: employer, dates and place, with real characters
     between them so the extracted line reads as three things. */
  it('puts the employer, the dates and the place on one line', () => {
    const { container } = draw(resume());
    const meta = container.querySelector('.tpl-ell__entry .tpl-ell__meta');
    expect(meta?.textContent).toContain('Unilever');
    expect(meta?.textContent).toContain('2019-01');
    expect(meta?.textContent).toContain('London, UK');
    const sep = css.slice(css.indexOf('.tpl-ell__meta-item::before {'));
    expect(sep.slice(0, sep.indexOf('}'))).toMatch(/content: '[^']*·[^']*'/);
  });

  /*
   * Chips are appearance; the structure stays a list. A run of boxes built
   * from spans would extract as one joined word, which is the thing that makes
   * a keyword rail an ATS risk.
   */
  it('draws skills as chips that are still list items', () => {
    const { container } = draw(resume());
    const chips = container.querySelector('.tpl-ell__chips');
    expect(chips?.querySelectorAll('li').length).toBeGreaterThan(0);
    const chipRules = [
      ...css.matchAll(/\.tpl-ell__chips \.tpl-bullet \{([^}]*)\}/g),
    ].map(([, body]) => body);
    expect(chipRules.some((body) => /border:/.test(body))).toBe(true);
  });

  /*
   * A portrait is not stored and is not invented. The initials stand in its
   * slot, derived from the name printed beside them — and carry no text of
   * their own to extract, because the name is real text inches away and an
   * extracted "JT" between it and the headline would be noise.
   */
  it('marks each employer with its initials, and fetches nothing', () => {
    const { container } = draw(resume());
    const marks = container.querySelectorAll('.tpl-ell__mark');
    expect(marks[0]?.textContent).toBe('U');
    expect(marks[0]?.getAttribute('aria-hidden')).toBe('true');
    expect(container.innerHTML).not.toMatch(
      /https?:\/\/[^"]*\.(png|jpe?g|svg)/,
    );
  });

  it('draws initials where the reference shows a portrait, and no image', () => {
    const { container } = draw(resume());
    const avatar = container.querySelector('.tpl-avatar');
    expect(avatar?.textContent).toBe('JT');
    /* On the rail, where the reference puts a portrait. */
    expect(avatar?.closest('.tpl-ell__aside')).toBeTruthy();
    expect(avatar?.getAttribute('aria-hidden')).toBe('true');
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('svg image')).toBeNull();
  });

  /* The rail sits against the page's right edge, so its controls belong in the
     right margin rather than over the column beside them. */
  it('puts the rail’s controls in the right margin', () => {
    /* Any rule naming the aside may carry it; `min-width` has its own. */
    const rules = [...css.matchAll(/\.tpl-ell__aside \{([^}]*)\}/g)];
    expect(rules.some(([, body]) => /--tpl-rail-left:/.test(body))).toBe(true);
  });

  it('honours the guarantees its catalog entry makes', () => {
    const { container } = draw(resume());
    /* No tables, no images, and the column count the badge is drawn from. */
    expect(container.querySelector('table')).toBeNull();
    expect(container.querySelector('img')).toBeNull();
    expect(TEMPLATES['elegant-logos'].columns).toBe(2);
  });

  /*
   * The rail is a COLUMN with a background, not a panel given a height: a
   * panel measured against the page appears on page one and nowhere else,
   * where a grid item's background is repainted on every fragment.
   */
  it('paints the rail as a column, and forces it to print', () => {
    /* Every rule whose selector ENDS at the aside — `.tpl-ell__main,
       .tpl-ell__aside` carries its own, and matching by substring would
       read that one instead. */
    const rules = [...css.matchAll(/\.tpl-ell__aside \{([^}]*)\}/g)].map(
      ([, body]) => body,
    );
    expect(rules.some((b) => /background: var\(--ell-rail\)/.test(b))).toBe(
      true,
    );
    expect(rules.some((b) => /print-color-adjust: exact/.test(b))).toBe(true);
    expect(rules.every((b) => !/position: (absolute|fixed)/.test(b))).toBe(
      true,
    );
    expect(TEMPLATES['elegant-logos'].ats.join(' ')).toMatch(
      /forced to print/i,
    );
  });

  /* And it reaches the foot of a sheet the résumé does not fill. */
  it('runs the rail down the whole sheet', () => {
    const grid = css.slice(css.indexOf('.tpl-ell__body {'));
    expect(grid.slice(0, grid.indexOf('}'))).toMatch(/min-height: 11in/);
  });
});
