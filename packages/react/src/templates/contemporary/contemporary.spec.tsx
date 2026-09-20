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
 * The Contemporary template.
 *
 * Its own claims: the contact details as a SECTION of the left rail rather
 * than a line under the name, a headline set in a tinted pill whose words stay
 * ordinary text, and the rail written first because it is drawn first.
 */

const css = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), 'contemporary.css'),
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
        <TEMPLATE_RENDERERS.contemporary.Document resume={data} />
      </FieldRegistryProvider>
    </DocumentPresentationProvider>,
  );

describe('the Contemporary document', () => {
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
    const chips = container.querySelector('.tpl-contemporary__chips');
    expect(chips?.textContent).toContain('Supply Chain Management');
    expect(chips?.textContent).not.toContain('English');
    expect(
      container.querySelector('.tpl-contemporary__main')?.textContent,
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
    expect(flows[0]?.className).toContain('tpl-contemporary__aside');
    expect(flows[0]?.textContent).toContain('Contacts');
    expect(flows[1]?.className).toContain('tpl-contemporary__main');
    expect(flows[1]?.textContent).toContain('Supply Chain Analyst');
  });

  /* One line for the facts: employer, dates and place, with real characters
     between them so the extracted line reads as three things. */
  it('puts the employer, the dates and the place on one line', () => {
    const { container } = draw(resume());
    const meta = container.querySelector(
      '.tpl-contemporary__entry .tpl-contemporary__meta',
    );
    expect(meta?.textContent).toContain('Unilever');
    expect(meta?.textContent).toContain('2019-01');
    expect(meta?.textContent).toContain('London, UK');
    const sep = css.slice(
      css.indexOf('.tpl-contemporary__meta-item::before {'),
    );
    expect(sep.slice(0, sep.indexOf('}'))).toMatch(/content: '[^']*·[^']*'/);
  });

  /*
   * Chips are appearance; the structure stays a list. A run of boxes built
   * from spans would extract as one joined word, which is the thing that makes
   * a keyword rail an ATS risk.
   */
  it('draws skills as chips that are still list items', () => {
    const { container } = draw(resume());
    const chips = container.querySelector('.tpl-contemporary__chips');
    expect(chips?.querySelectorAll('li').length).toBeGreaterThan(0);
    const chip = css.slice(
      css.indexOf('.tpl-contemporary__chips .tpl-bullet {'),
    );
    expect(chip.slice(0, chip.indexOf('}'))).toMatch(/border:/);
  });

  /*
   * A portrait is not stored and is not invented. The initials stand in its
   * slot, derived from the name printed beside them — and carry no text of
   * their own to extract, because the name is real text inches away and an
   * extracted "JT" between it and the headline would be noise.
   */
  /* The contact details are a section of the rail — the thing that gives the
     top of this page its air. */
  it('puts the contact details in the rail, not under the name', () => {
    const { container } = draw(resume());
    const rail = container.querySelector('.tpl-contemporary__aside');
    expect(rail?.textContent).toContain('Contacts');
    expect(rail?.textContent).toContain('jack@example.com');
    expect(
      container.querySelector('.tpl-contemporary__head-block')?.textContent,
    ).not.toContain('jack@example.com');
  });

  /* The pill is a background behind ordinary text: when it is not printed the
     words are still there, which is what makes it safe to use at all. */
  it('sets the headline in a pill without making it a picture', () => {
    const { container } = draw(resume());
    expect(
      container.querySelector('.tpl-contemporary__headline')?.textContent,
    ).toContain('Experienced Business Analyst');
    const pill = css.slice(css.indexOf('.tpl-contemporary__headline {'));
    expect(pill.slice(0, pill.indexOf('}'))).toMatch(
      /background: var\(--cn-tint\)/,
    );
  });

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
    const rules = [...css.matchAll(/\.tpl-contemporary__main \{([^}]*)\}/g)];
    expect(rules.some(([, body]) => /--tpl-rail-left:/.test(body))).toBe(true);
  });

  it('honours the guarantees its catalog entry makes', () => {
    const { container } = draw(resume());
    /* No tables, no images, and the column count the badge is drawn from. */
    expect(container.querySelector('table')).toBeNull();
    expect(container.querySelector('img')).toBeNull();
    expect(TEMPLATES.contemporary.columns).toBe(2);
  });

  /* A short accent rule under the word, not a line across the column: at this
     weight a full rule would be the loudest thing on a page made of air. */
  it('marks each heading with a short rule rather than ruling the column', () => {
    const heading = css.slice(css.indexOf('.tpl-contemporary__heading {'));
    const body = heading.slice(0, heading.indexOf('}'));
    expect(body).toMatch(/text-transform: uppercase/);
    expect(body).not.toMatch(/border-bottom/);
    const mark = css.slice(css.indexOf('.tpl-contemporary__heading::after {'));
    const markBody = mark.slice(0, mark.indexOf('}'));
    expect(markBody).toMatch(/background: var\(--cn-accent\)/);
    expect(markBody).toMatch(/width: calc\(/);
  });

  /* The MAIN column is the one against the page's right edge here, so it is
     the one whose controls move to the right margin. */
  it('puts the right-hand column’s controls in the right margin', () => {
    const rules = [...css.matchAll(/\.tpl-contemporary__main \{([^}]*)\}/g)];
    expect(rules.some(([, body]) => /--tpl-rail-left:/.test(body))).toBe(true);
  });

  it('honours the guarantees its catalog entry makes', () => {
    const { container } = draw(resume());
    /* No tables, no images, and the column count the badge is drawn from. */
    expect(container.querySelector('table')).toBeNull();
    expect(container.querySelector('img')).toBeNull();
    expect(TEMPLATES.contemporary.columns).toBe(2);
  });
});
