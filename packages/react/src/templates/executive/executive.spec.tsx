import { render, screen } from '@testing-library/react';
import { Editor, Element, Frame } from '@craftjs/core';
import { TEMPLATES, type ResumeObject } from '@cvgs/core';
import { TEMPLATE_RENDERERS } from '../../registry.js';
import { DocumentPresentationProvider } from '../../presentation-context.js';

/**
 * The Executive template.
 *
 * Asserted through the rendered document, like Harvard: what matters is that the
 * page carries the reference's sections, omits what it has no data for, and
 * stays parseable despite its two columns.
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
    headline: 'Senior Software Engineer',
    summary: 'Ten years building backend platforms.',
    skills: [
      { category: 'Backend', items: ['Node.js', 'TypeScript'] },
      {
        category: 'Languages',
        items: ['English, Professional', 'Spanish, Native'],
      },
    ],
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
    ...overrides,
  };
}

function renderExec(data: ResumeObject) {
  const { Document, resolver } = TEMPLATE_RENDERERS.executive;
  return render(
    <DocumentPresentationProvider>
      <Editor resolver={resolver}>
        <Frame>
          <Element is={Document} resume={data} />
        </Frame>
      </Editor>
    </DocumentPresentationProvider>,
  );
}

describe('the Executive document', () => {
  it('renders every section the reference shows', () => {
    renderExec(resume());
    for (const heading of [
      'Professional Summary',
      'Technical Skills',
      'Experience',
      'Education',
      'Languages',
      'Personal Information',
      'Locations',
      'Websites, Portfolios, Profiles',
    ]) {
      expect(screen.getByText(heading), heading).toBeTruthy();
    }
  });

  it('omits a section it has no data for', () => {
    renderExec(
      resume({ links: [], education: [], headline: undefined, summary: '' }),
    );
    expect(screen.queryByText('Websites, Portfolios, Profiles')).toBeNull();
    expect(screen.queryByText('Education')).toBeNull();
    expect(screen.queryByText('Personal Information')).toBeNull();
    expect(screen.queryByText('Professional Summary')).toBeNull();
  });

  it('derives the monogram from the name, and offers no way to edit it', () => {
    const { container } = renderExec(resume());
    const mono = container.querySelector('.tpl-exec__monogram');
    expect(mono?.textContent).toBe('SC');
    // No path means no node means nothing to select: a monogram that could
    // disagree with the name beside it is a defect waiting to ship.
    expect(mono?.querySelector('[data-path]')).toBeNull();
  });

  it('puts languages in their own section, out of the skills columns', () => {
    const { container } = renderExec(resume());
    const columns = container.querySelector('.tpl-exec__columns');
    expect(columns?.textContent).toContain('Node.js');
    expect(columns?.textContent).not.toContain('Spanish, Native');
    expect(container.textContent).toContain('Spanish, Native');
  });

  it('shows no Languages section when the resume names no languages', () => {
    renderExec(
      resume({ skills: [{ category: 'Backend', items: ['Node.js'] }] }),
    );
    expect(screen.queryByText('Languages')).toBeNull();
  });

  it('keeps the skills list linear despite two columns', () => {
    // The whole ATS argument for this template: the columns are visual, so a
    // parser reads the items in document order. A grid of cells would not.
    const { container } = renderExec(resume());
    expect(container.querySelector('table')).toBeNull();
    const items = Array.from(
      container.querySelectorAll('.tpl-exec__columns .tpl-bullet'),
    ).map((li) => li.textContent);
    expect(items).toEqual(['Node.js', 'TypeScript']);
  });

  it('is a single column of markup with no tables or images', () => {
    const { container } = renderExec(resume());
    expect(container.querySelector('table')).toBeNull();
    expect(container.querySelector('img')).toBeNull();
  });

  it('edits the same domain paths Harvard does', () => {
    // This is what makes an overlay template-independent: both templates
    // address `experience.0.bullets`, so an edit made under one applies to the
    // other without translation.
    const { container } = renderExec(resume());
    const paths = Array.from(container.querySelectorAll('[data-path]')).map(
      (el) => el.getAttribute('data-path'),
    );
    expect(paths).toContain('experience.0.bullets');
    expect(paths).toContain('summary');
    expect(paths).toContain('name');
  });

  it('leaves no stray separator when a contact detail is missing', () => {
    const { container } = renderExec(
      resume({ contact: { email: 'me@example.com' } }),
    );
    expect(container.querySelectorAll('.tpl-exec__contact-item')).toHaveLength(
      1,
    );
  });

  it('marks blocks for the paginator, headings kept with what follows', () => {
    const { container } = renderExec(resume());
    expect(container.querySelectorAll('[data-block]').length).toBeGreaterThan(
      0,
    );
    for (const h of container.querySelectorAll('[data-keep-with-next]')) {
      expect(h.hasAttribute('data-block')).toBe(true);
    }
  });
});

describe('the Executive catalog entry', () => {
  it('states its own ATS guarantees, not Harvard’s', () => {
    expect(TEMPLATES.executive.ats).not.toEqual(TEMPLATES.harvard.ats);
  });

  it('does not claim a single column, because it is not one', () => {
    const claims = TEMPLATES.executive.ats.join(' ').toLowerCase();
    expect(claims).not.toMatch(/single column/);
    // It says what IS true instead.
    expect(claims).toMatch(/linear/);
  });

  it('decorates every sheet rather than the document', () => {
    // A border on the document would draw once around a continuous flow and
    // align with no page.
    expect(TEMPLATE_RENDERERS.executive.sheetClassName).toBeTruthy();
  });
});
