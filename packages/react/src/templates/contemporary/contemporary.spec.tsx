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

  /* A tinted badge beside the word, not a rule: the reference rules nothing,
     and the badge is drawn rather than set in an icon font, so it extracts as
     nothing. */
  it('marks each heading with a drawn badge rather than a rule', () => {
    const heading = css.slice(css.indexOf('.tpl-contemporary__heading {'));
    const body = heading.slice(0, heading.indexOf('}'));
    expect(body).toMatch(/text-transform: uppercase/);
    expect(body).not.toMatch(/border-bottom/);
    const badge = css.slice(
      css.indexOf('.tpl-contemporary__heading::before {'),
    );
    expect(badge.slice(0, badge.indexOf('}'))).toMatch(
      /background: var\(--cn-wash\)/,
    );
    expect(css).not.toMatch(/__heading::(before|after) \{[^}]*content: '[^']/);
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
