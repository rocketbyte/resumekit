import { render, screen } from '@testing-library/react';
import { TEMPLATES, type ResumeObject } from '@resumekit/schema';
import { TEMPLATE_RENDERERS } from '../../registry.js';
import { FieldRegistryProvider } from '../../fields/field-registry.js';
import { DocumentPresentationProvider } from '../../presentation-context.js';

/**
 * The Meridian template.
 *
 * Asserted through the rendered document, like Harvard and Executive. What is
 * different here is that one of the assertions is the template's **ATS claim**:
 * the catalog entry says the main column is read first, and the only thing that
 * can make that true is the document order this file checks.
 */

function resume(overrides: Partial<ResumeObject> = {}): ResumeObject {
  return {
    name: 'Starlin Gil Cruz',
    contact: {
      email: 'me@example.com',
      phone: '+1 555 0100',
      location: 'Santo Domingo, Dominican Republic',
    },
    links: [{ label: 'LinkedIn', url: 'https://linkedin.com/in/example' }],
    custom_sections: [],
    section_headings: {},
    headline: 'Senior Software Engineer',
    summary: 'Ten years building backend platforms.',
    skills: [{ category: 'Backend', items: ['Node.js', 'TypeScript'] }],
    experience: [
      {
        company: 'Doral Health & Wellness',
        title: 'Senior Software Engineer',
        start: '2024-02',
        end: 'Present',
        bullets: ['Designed NestJS microservices.'],
        tech: [],
      },
    ],
    education: [
      {
        school: 'UTESA',
        degree: 'Bachelor of Science',
        field: 'Software Engineering',
        start: '2013-01',
        end: '2017-06',
      },
    ],
    certifications: [],
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
    ...overrides,
  };
}

function renderMeridian(data: ResumeObject) {
  const { Document } = TEMPLATE_RENDERERS.meridian;
  return render(
    <DocumentPresentationProvider>
      <FieldRegistryProvider enabled>
        <Document resume={data} />
      </FieldRegistryProvider>
    </DocumentPresentationProvider>,
  );
}

describe('the Meridian document', () => {
  it('renders every section the reference shows', () => {
    renderMeridian(resume());
    for (const heading of [
      'Professional Summary',
      'Experience',
      'Education',
      'Languages',
      'Personal Information',
      'Locations',
      'Technical Skills',
      'Websites, Portfolios, Profiles',
    ]) {
      expect(screen.getByText(heading), heading).toBeTruthy();
    }
  });

  it('omits a section it has no data for', () => {
    renderMeridian(
      resume({ links: [], education: [], headline: undefined, summary: '' }),
    );
    expect(screen.queryByText('Websites, Portfolios, Profiles')).toBeNull();
    expect(screen.queryByText('Education')).toBeNull();
    expect(screen.queryByText('Personal Information')).toBeNull();
    expect(screen.queryByText('Professional Summary')).toBeNull();
  });

  it('derives the monogram from the name, and offers no way to edit it', () => {
    const { container } = renderMeridian(resume());
    const mono = container.querySelector('.tpl-mer__monogram');
    expect(mono?.textContent).toBe('SC');
    // No path means no node means nothing to select: a monogram that could
    // disagree with the name beside it is a defect waiting to ship.
    expect(mono?.querySelector('[data-path]')).toBeNull();
  });

  it('puts languages in the main column, out of the technical rail', () => {
    const { container } = renderMeridian(resume());
    const aside = container.querySelector('.tpl-mer__aside');
    expect(aside?.textContent).toContain('Node.js');
    expect(aside?.textContent).not.toContain('English');
    const main = container.querySelector('.tpl-mer__main')?.textContent;
    expect(main).toContain('English');
    // The level is a WORD, so the section means something without the meter.
    expect(main).toContain('Native');
  });

  it('shows no Languages section when the resume names no languages', () => {
    // The résumé holds no languages. A skills group NAMED "Languages" no
    // longer makes one — that stopgap is retired.
    renderMeridian(resume({ languages: [] }));
    expect(screen.queryByText('Languages')).toBeNull();
  });

  it('writes the main column before the sidebar', () => {
    /*
     * The template's ONE ATS guarantee, and the only thing that can make it
     * true. If the columns are ever reordered for a visual reason, the catalog
     * entry becomes a false claim — so it fails here first.
     */
    const { container } = renderMeridian(resume());
    const main = container.querySelector('.tpl-mer__main');
    const aside = container.querySelector('.tpl-mer__aside');
    expect(main).toBeTruthy();
    expect(aside).toBeTruthy();
    expect(
      main!.compareDocumentPosition(aside!) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    const text = container.textContent ?? '';
    expect(text.indexOf('Professional Summary')).toBeLessThan(
      text.indexOf('Technical Skills'),
    );
  });

  it('gives each column its own pagination flow', () => {
    // Without this the paginator applies one running offset across both, and a
    // break in the main column walks the sidebar off the sheet.
    const { container } = renderMeridian(resume());
    const flows = container.querySelectorAll('[data-flow]');
    expect(flows).toHaveLength(2);
    expect(flows[0].classList.contains('tpl-mer__main')).toBe(true);
    expect(flows[1].classList.contains('tpl-mer__aside')).toBe(true);
  });

  it('lets the rail’s lists break between items, not as one block', () => {
    /*
     * A keyword rail is one field and therefore one list, and a real one runs to
     * fifty-odd items — taller than the paper. Left as a single block it can be
     * placed nowhere, and its heading is pushed off the page it belongs on.
     */
    const { container } = renderMeridian(resume());
    const split = container.querySelectorAll(
      '.tpl-mer__aside [data-block][data-split]',
    );
    expect(split).toHaveLength(2);
    for (const block of split) {
      expect(block.querySelectorAll('li').length).toBeGreaterThan(0);
    }
    // The main column's entries are NOT split: an entry belongs with its own
    // bullets, which is the rule every template shares.
    expect(
      container.querySelectorAll('.tpl-mer__main [data-split]'),
    ).toHaveLength(0);
  });

  it('marks each sidebar heading for the divider dot', () => {
    const { container } = renderMeridian(resume());
    const marked = container.querySelectorAll('.tpl-mer__heading--marked');
    expect(marked).toHaveLength(2);
    for (const heading of marked) {
      expect(heading.closest('.tpl-mer__aside')).toBeTruthy();
    }
  });

  it('is markup with no tables or images', () => {
    const { container } = renderMeridian(resume());
    expect(container.querySelector('table')).toBeNull();
    expect(container.querySelector('img')).toBeNull();
  });

  it('edits the same domain paths Harvard does', () => {
    // This is what makes an overlay template-independent: all three templates
    // address `experience.0.bullets`, so an edit made under one applies to the
    // others without translation.
    const { container } = renderMeridian(resume());
    const paths = Array.from(container.querySelectorAll('[data-path]')).map(
      (el) => el.getAttribute('data-path'),
    );
    expect(paths).toContain('experience.0.bullets');
    expect(paths).toContain('summary');
    expect(paths).toContain('name');
  });

  it('leaves no stray separator when a contact detail is missing', () => {
    const { container } = renderMeridian(
      resume({ contact: { email: 'me@example.com' } }),
    );
    expect(container.querySelectorAll('.tpl-mer__contact-item')).toHaveLength(
      1,
    );
  });

  it('omits the contact rule entirely when there is nothing to put in it', () => {
    const { container } = renderMeridian(resume({ contact: {} }));
    expect(container.querySelector('.tpl-mer__contact')).toBeNull();
  });

  it('renders dates as stored, not in the reference’s own convention', () => {
    // The reference writes `01/2024 - Current`. The product writes what the
    // knowledge base requires, and one résumé must not say two things.
    const { container } = renderMeridian(resume());
    expect(container.textContent).toContain('2024-02');
    expect(container.textContent).toContain('Present');
  });

  it('marks blocks for the paginator, headings kept with what follows', () => {
    const { container } = renderMeridian(resume());
    expect(container.querySelectorAll('[data-block]').length).toBeGreaterThan(
      0,
    );
    for (const h of container.querySelectorAll('[data-keep-with-next]')) {
      expect(h.hasAttribute('data-block')).toBe(true);
    }
  });
});

describe('the Meridian catalog entry', () => {
  it('states its own ATS guarantees, not another template’s', () => {
    expect(TEMPLATES.meridian.ats).not.toEqual(TEMPLATES.harvard.ats);
    expect(TEMPLATES.meridian.ats).not.toEqual(TEMPLATES.executive.ats);
  });

  it('discloses two columns and which one is read first', () => {
    const claims = TEMPLATES.meridian.ats.join(' ').toLowerCase();
    expect(claims).toMatch(/two columns/);
    expect(claims).toMatch(/first/);
    // Executive's phrasing does not carry over: its columns are visual, these
    // are structural, and the property that makes those safe does not hold.
    expect(claims).not.toMatch(/linear/);
    expect(claims).not.toMatch(/single column/);
  });

  it('leaves the page white — the colour belongs to the two bands', () => {
    const { container } = renderMeridian(resume());
    expect(container.querySelector('.tpl-mer__crown')).toBeTruthy();
    expect(container.querySelector('.tpl-mer__contact')).toBeTruthy();
    expect(container.querySelector('.tpl-mer')?.className).not.toMatch(
      /border|frame/,
    );
  });
});
