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
 * The Polished template.
 *
 * Its own claims: the rail is on the LEFT and carries the NAME, so it is
 * written first — the name is the first thing a reader and a parser should
 * both meet — and it is forced to print, because reversed type on an
 * unpainted ground is absent rather than faint.
 */

const css = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), 'polished.css'),
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
        <TEMPLATE_RENDERERS.polished.Document resume={data} />
      </FieldRegistryProvider>
    </DocumentPresentationProvider>,
  );

describe('the Polished document', () => {
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

  /* Skills are the kit's invisible table — one skill per cell, no comma. */
  it('prints skills as a grid, a skill to a list item', () => {
    const { container } = draw(resume());
    const grid = container.querySelector('.tpl-skill-grid');
    const skills = [...(grid?.querySelectorAll('li') ?? [])];
    expect(skills.map((li) => li.textContent)).toContain(
      'Supply Chain Management',
    );
    expect(grid?.textContent).not.toContain(',');
  });

  /*
   * This reference shows no portrait at all — the rail carries the NAME — so
   * the template draws neither an image nor initials in its place.
   */
  it('draws no portrait and no initials, because its reference has none', () => {
    const { container } = draw(resume());
    expect(container.querySelector('.tpl-avatar')).toBeNull();
    expect(container.querySelector('img')).toBeNull();
    expect(
      container.querySelector('.tpl-polished__aside')?.textContent,
    ).toContain('Jack Taylor');
  });

  /* The rail sits against the page's right edge, so its controls belong in the
     right margin rather than over the column beside them. */
  /* The MAIN column is the one against the page's right edge here. */
  it('puts the right-hand column’s controls in the right margin', () => {
    const rules = [...css.matchAll(/\.tpl-polished__main \{([^}]*)\}/g)];
    expect(rules.some(([, body]) => /--tpl-rail-left:/.test(body))).toBe(true);
  });

  it('honours the guarantees its catalog entry makes', () => {
    const { container } = draw(resume());
    /* No tables, no images, and the column count the badge is drawn from. */
    expect(container.querySelector('table')).toBeNull();
    expect(container.querySelector('img')).toBeNull();
    expect(TEMPLATES.polished.columns).toBe(2);
  });

  /*
   * The rail is a COLUMN with a background, not a panel given a height: a
   * panel measured against the page appears on page one and nowhere else,
   * where a grid item's background is repainted on every fragment.
   */
  it('paints the rail as a column, and forces it to print', () => {
    /* Every rule whose selector ENDS at the aside — `.tpl-polished__main,
       .tpl-polished__aside` carries its own, and matching by substring would
       read that one instead. */
    const rules = [...css.matchAll(/\.tpl-polished__aside \{([^}]*)\}/g)].map(
      ([, body]) => body,
    );
    expect(rules.some((b) => /background: var\(--po-rail\)/.test(b))).toBe(
      true,
    );
    expect(rules.some((b) => /print-color-adjust: exact/.test(b))).toBe(true);
    expect(rules.every((b) => !/position: (absolute|fixed)/.test(b))).toBe(
      true,
    );
    expect(TEMPLATES.polished.ats.join(' ')).toMatch(/forced to print/i);
  });

  /*
   * And it covers every sheet the document runs to. The height comes from
   * `kit/panel.css`, which reads the page count the flow publishes — a résumé
   * that spills four lines onto a second page would otherwise paint a stub of
   * colour at the top of it and white underneath.
   */
  it('covers every sheet the document runs to', () => {
    const { container } = draw(resume());
    expect(container.querySelector('.tpl-polished__body')?.className).toContain(
      'tpl-sheet-tall',
    );
  });
});
