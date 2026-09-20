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
 * The Elegant template.
 *
 * Its own claims: a painted rail that runs the full height of every sheet and
 * is forced to print — reversed type on an unpainted ground is absent, not
 * faint — with the work history written first beside it.
 */

const css = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), 'elegant.css'),
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

const draw = (data: ResumeObject) =>
  render(
    <DocumentPresentationProvider>
      <FieldRegistryProvider enabled>
        <TEMPLATE_RENDERERS.elegant.Document resume={data} />
      </FieldRegistryProvider>
    </DocumentPresentationProvider>,
  );

describe('the Elegant document', () => {
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

  /*
   * Skills are ONE RUN of keywords in this template, which is how its
   * reference sets them — and a field per stored group, so the separators a
   * parser extracts are real characters.
   */
  it('prints skills as one run of keywords', () => {
    const { container } = draw(resume());
    const run = container.querySelector('.tpl-elegant__keywords');
    expect(run?.textContent).toContain('Supply Chain Management');
    expect(container.querySelector('.tpl-keywords')).toBeNull();
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
    /* On the rail, where the reference puts a portrait. */
    expect(avatar?.closest('.tpl-elegant__aside')).toBeTruthy();
    expect(avatar?.getAttribute('aria-hidden')).toBe('true');
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('svg image')).toBeNull();
  });

  /* The rail sits against the page's right edge, so its controls belong in the
     right margin rather than over the column beside them. */
  it('puts the rail’s controls in the right margin', () => {
    /* Any rule naming the aside may carry it; `min-width` has its own. */
    const rules = [...css.matchAll(/\.tpl-elegant__aside \{([^}]*)\}/g)];
    expect(rules.some(([, body]) => /--tpl-rail-left:/.test(body))).toBe(true);
  });

  it('honours the guarantees its catalog entry makes', () => {
    const { container } = draw(resume());
    /* No tables, no images, and the column count the badge is drawn from. */
    expect(container.querySelector('table')).toBeNull();
    expect(container.querySelector('img')).toBeNull();
    expect(TEMPLATES.elegant.columns).toBe(2);
  });

  /*
   * The rail is a COLUMN with a background, not a panel given a height: a
   * panel measured against the page appears on page one and nowhere else,
   * where a grid item's background is repainted on every fragment.
   */
  it('paints the rail as a column, and forces it to print', () => {
    /* Every rule whose selector ENDS at the aside — `.tpl-elegant__main,
       .tpl-elegant__aside` carries its own, and matching by substring would
       read that one instead. */
    const rules = [...css.matchAll(/\.tpl-elegant__aside \{([^}]*)\}/g)].map(
      ([, body]) => body,
    );
    expect(rules.some((b) => /background: var\(--el-rail\)/.test(b))).toBe(
      true,
    );
    expect(rules.some((b) => /print-color-adjust: exact/.test(b))).toBe(true);
    expect(rules.every((b) => !/position: (absolute|fixed)/.test(b))).toBe(
      true,
    );
    expect(TEMPLATES.elegant.ats.join(' ')).toMatch(/forced to print/i);
  });

  /*
   * And it covers every sheet the document runs to. The height comes from
   * `kit/panel.css`, which reads the page count the flow publishes — a résumé
   * that spills four lines onto a second page would otherwise paint a stub of
   * colour at the top of it and white underneath.
   */
  it('covers every sheet the document runs to', () => {
    const { container } = draw(resume());
    expect(container.querySelector('.tpl-elegant__body')?.className).toContain(
      'tpl-sheet-tall',
    );
  });
});
