import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render, screen } from '@testing-library/react';
import { Editor, Element, Frame } from '@craftjs/core';
import { TEMPLATES, type ResumeObject } from '@cvgs/core';
import { TEMPLATE_RENDERERS } from '../../registry.js';
import { DocumentPresentationProvider } from '../../presentation-context.js';

/**
 * The Cobalt template.
 *
 * Two of the assertions here are the template's **ATS claims** rather than its
 * appearance, and both are claims no other template makes:
 *
 *   - the columns are written in the order the page shows them, so the
 *     extracted text, the printed text layer and the keyboard's order are one
 *     order — and this rail carries the candidate's degrees, so that is not a
 *     formality;
 *   - the document makes no printed mark that needs a background colour, which
 *     is asserted against the stylesheet itself, because that is the only place
 *     it can stop being true.
 */

function resume(overrides: Partial<ResumeObject> = {}): ResumeObject {
  return {
    name: 'Starlin Gil Cruz',
    contact: {
      email: 'starlin.gil.cruz@gmail.com',
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
        items: ['English, Professional proficiency', 'Spanish, Native'],
      },
    ],
    experience: [
      {
        company: 'Doral Health & Wellness',
        title: 'Senior Software Engineer',
        start: '2024-01',
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

function renderCobalt(data: ResumeObject) {
  const { Document, resolver } = TEMPLATE_RENDERERS.cobalt;
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

describe('the Cobalt document', () => {
  it('renders every section the reference shows', () => {
    renderCobalt(resume());
    for (const heading of [
      'Professional Summary',
      'Technical Skills',
      'Education',
      'Experience',
      'Languages',
      'Personal Information',
      'Locations',
      'Websites, Portfolios, Profiles',
    ]) {
      expect(screen.getByText(heading), heading).toBeTruthy();
    }
  });

  it('omits a section it has no data for', () => {
    renderCobalt(
      resume({ links: [], education: [], headline: undefined, summary: '' }),
    );
    expect(screen.queryByText('Websites, Portfolios, Profiles')).toBeNull();
    expect(screen.queryByText('Education')).toBeNull();
    expect(screen.queryByText('Personal Information')).toBeNull();
    expect(screen.queryByText('Professional Summary')).toBeNull();
  });

  it('derives the crest’s initials from the name, and offers no way to edit them', () => {
    const { container } = renderCobalt(resume());
    const marks = container.querySelector('.tpl-cob__initials');
    expect(marks?.textContent).toBe('SC');
    // No path means no node means nothing to select: initials that could
    // disagree with the name beside them are a defect waiting to ship.
    expect(marks?.querySelector('[data-path]')).toBeNull();
  });

  it('draws the crest as an outline that adds nothing a parser reads', () => {
    const { container } = renderCobalt(resume());
    const crest = container.querySelector('.tpl-cob__crest-shape');
    expect(crest?.tagName.toLowerCase()).toBe('svg');
    expect(crest?.getAttribute('aria-hidden')).toBe('true');
    // No text of its own, and no accessible name: the initials over it are
    // real HTML text, and the shape itself says nothing.
    expect(crest?.textContent).toBe('');
    expect(crest?.querySelector('text')).toBeNull();
    expect(crest?.getAttribute('aria-label')).toBeNull();
    // Unfilled, so it is a stroke — which prints as foreground ink whether or
    // not the browser paints backgrounds.
    const shape = crest?.querySelector('polygon');
    expect(shape?.getAttribute('fill')).toBe('none');
    expect(shape?.getAttribute('stroke')).toBe('currentColor');
  });

  it('writes the rail before the wide column, because the rail is drawn first', () => {
    /*
     * The template's ATS guarantee, and the only thing that can make it true.
     * Document order IS the page's order here, which is what makes the
     * extracted text, the PDF text layer and the editor's Tab order agree. The
     * rail carries Education, so a parser reading only the wide column would
     * miss the candidate's degrees.
     */
    const { container } = renderCobalt(resume());
    const rail = container.querySelector('.tpl-cob__rail');
    const main = container.querySelector('.tpl-cob__main');
    expect(rail).toBeTruthy();
    expect(main).toBeTruthy();
    expect(
      rail!.compareDocumentPosition(main!) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    const text = container.textContent ?? '';
    for (const [before, after] of [
      ['Professional Summary', 'Technical Skills'],
      ['Technical Skills', 'Education'],
      ['Education', 'Experience'],
      ['Experience', 'Websites, Portfolios, Profiles'],
    ]) {
      expect(text.indexOf(before), `${before} < ${after}`).toBeLessThan(
        text.indexOf(after),
      );
    }
  });

  it('places the rail in the leading grid track, so nothing is reordered', () => {
    // Document order and visual order are the same order only if neither
    // column is moved: a `grid-column` or an `order` here would silently make
    // the guarantee false while every other assertion still passed.
    const { container } = renderCobalt(resume());
    const body = container.querySelector('.tpl-cob__body');
    expect(body?.firstElementChild?.classList.contains('tpl-cob__rail')).toBe(
      true,
    );
    for (const column of ['.tpl-cob__rail', '.tpl-cob__main']) {
      const el = container.querySelector(column) as HTMLElement;
      expect(el.style.gridColumn).toBe('');
      expect(el.style.order).toBe('');
    }
  });

  it('gives each column its own pagination flow', () => {
    // Without this the paginator applies one running offset across both, and a
    // break in one column walks the other off the sheet.
    const { container } = renderCobalt(resume());
    const flows = container.querySelectorAll('[data-flow]');
    expect(flows).toHaveLength(2);
    expect(flows[0].classList.contains('tpl-cob__rail')).toBe(true);
    expect(flows[1].classList.contains('tpl-cob__main')).toBe(true);
  });

  it('adds no pagination vocabulary of its own', () => {
    /*
     * The point of this template as a change: #45 generalised the paginator,
     * and if that generalisation was the right shape then the SECOND
     * two-column template needs nothing new. Any attribute here that #45 did
     * not define is evidence the model is wrong, so it fails here.
     */
    const { container } = renderCobalt(resume());
    /** Everything #45 defined, and nothing else. */
    const pagination = new Set([
      'data-block',
      'data-flow',
      'data-split',
      'data-keep-with-next',
    ]);
    /** The shared editable nodes' own attributes — not this template's. */
    const nodes = new Set([
      'data-path',
      'data-ink',
      'data-empty',
      'data-value',
      'data-editing',
    ]);

    const seen = new Set<string>();
    for (const el of container.querySelectorAll('*')) {
      for (const attr of el.getAttributeNames()) {
        if (attr.startsWith('data-')) seen.add(attr);
      }
    }
    expect(
      [...seen].filter((a) => !pagination.has(a) && !nodes.has(a)),
    ).toEqual([]);
  });

  it('lets the rail’s lists break between items, not as one block', () => {
    /*
     * A keyword rail is one field and therefore one list, and a real one runs
     * to fifty-odd items — taller than the paper. Left as a single block it can
     * be placed nowhere, and its heading is pushed off the page it belongs on.
     */
    const { container } = renderCobalt(resume());
    const split = container.querySelectorAll(
      '.tpl-cob__rail [data-block][data-split]',
    );
    expect(split.length).toBeGreaterThan(0);
    for (const block of split) {
      expect(block.querySelectorAll('li').length).toBeGreaterThan(0);
    }
    // An experience entry is NOT split: it belongs with its own bullets, which
    // is the rule every template shares.
    expect(
      container.querySelectorAll('.tpl-cob__entry[data-split]'),
    ).toHaveLength(0);
  });

  it('marks blocks for the paginator, headings kept with what follows', () => {
    const { container } = renderCobalt(resume());
    const headings = container.querySelectorAll('.tpl-cob__heading');
    expect(headings.length).toBeGreaterThan(0);
    for (const h of headings) {
      expect(h.hasAttribute('data-block')).toBe(true);
      expect(h.hasAttribute('data-keep-with-next')).toBe(true);
    }
  });

  it('puts languages in the wide column, out of the technical rail', () => {
    const { container } = renderCobalt(resume());
    const rail = container.querySelector('.tpl-cob__rail');
    expect(rail?.textContent).toContain('Node.js');
    expect(rail?.textContent).not.toContain('Spanish, Native');
    expect(container.querySelector('.tpl-cob__main')?.textContent).toContain(
      'Spanish, Native',
    );
  });

  it('shows no Languages section when the resume names no languages', () => {
    renderCobalt(
      resume({ skills: [{ category: 'Backend', items: ['Node.js'] }] }),
    );
    expect(screen.queryByText('Languages')).toBeNull();
  });

  it('renders one location, in two places, from one field', () => {
    // The reference prints the location in the header AND in a Locations
    // section. Two renderings of one field, never two values that can disagree.
    const { container } = renderCobalt(
      resume({ contact: { location: 'Santo Domingo, Dominican Republic' } }),
    );
    const shown = (container.textContent ?? '').split(
      'Santo Domingo, Dominican Republic',
    ).length;
    expect(shown).toBe(3); // two occurrences → three fragments
    expect(
      container.querySelectorAll('[data-path="contact.location"]'),
    ).toHaveLength(1);
  });

  it('is markup with no tables and no raster images', () => {
    const { container } = renderCobalt(resume());
    expect(container.querySelector('table')).toBeNull();
    expect(container.querySelector('img')).toBeNull();
  });

  it('edits the same domain paths Harvard does', () => {
    // This is what makes an overlay template-independent: every template
    // addresses `experience.0.bullets`, so an edit made under one applies to
    // the others without translation.
    const { container } = renderCobalt(resume());
    const paths = Array.from(container.querySelectorAll('[data-path]')).map(
      (el) => el.getAttribute('data-path'),
    );
    for (const path of [
      'name',
      'summary',
      'contact.email',
      'experience.0.title',
      'experience.0.company',
      'experience.0.bullets',
      'education.0.school',
      'skills.0.items',
      'links.0.url',
    ]) {
      expect(paths, path).toContain(path);
    }
  });

  it('leaves no empty contact line when a detail is missing', () => {
    const { container } = renderCobalt(
      resume({ contact: { email: 'me@example.com' } }),
    );
    expect(container.querySelectorAll('.tpl-cob__contact-item')).toHaveLength(
      1,
    );
  });

  it('omits the contact block entirely when there is nothing to put in it', () => {
    const { container } = renderCobalt(resume({ contact: {} }));
    expect(container.querySelector('.tpl-cob__contact')).toBeNull();
  });

  it('renders dates as stored, not in the reference’s own convention', () => {
    // The reference writes `01/2024 to Current`. The product writes what the
    // knowledge base requires, and one résumé must not say two things.
    const { container } = renderCobalt(resume());
    expect(container.textContent).toContain('2024-01');
    expect(container.textContent).toContain('Present');
    expect(container.textContent).not.toContain('01/2024');
  });
});

/**
 * The stylesheet as text.
 *
 * Read from disk rather than imported, because the assertion is about what the
 * FILE says: a bundler hands back a URL for a stylesheet, and `?raw` would need
 * Vite's ambient client types this project does not pull in. Resolved from the
 * working directory, which is the app root under `vitest` and the repo root
 * under `nx`.
 */
function cobaltStylesheet(): string {
  const rel = 'src/features/template/templates/cobalt/cobalt.css';
  for (const candidate of [rel, `apps/web/${rel}`]) {
    const path = resolve(process.cwd(), candidate);
    if (existsSync(path)) return readFileSync(path, 'utf8');
  }
  throw new Error(`cobalt.css not found from ${process.cwd()}`);
}

describe('the Cobalt stylesheet', () => {
  const css = cobaltStylesheet();

  it('paints no background, so the guarantee cannot quietly stop being true', () => {
    /*
     * The template's distinguishing ATS claim, asserted where it can break.
     * Every mark this template makes is a glyph, a border, or a stroked
     * outline — so a `background` appearing here later would falsify the
     * catalog entry without changing a single rendered test.
     *
     * Comments are stripped first: this file explains the rule at length, and
     * the word appearing in prose is not the same as the property being set.
     */
    const declarations = css.replace(/\/\*[\s\S]*?\*\//g, '');
    expect(declarations).not.toMatch(/background/);
  });

  it('forces no print colour, because it has none to force', () => {
    const declarations = css.replace(/\/\*[\s\S]*?\*\//g, '');
    expect(declarations).not.toMatch(/print-color-adjust/);
  });

  it('rules its headings and its header with borders, not drawn strips', () => {
    // A border is foreground and prints; a strip would be a background and
    // would not. This is how the rules survive the assertion above.
    expect(css).toMatch(/\.tpl-cob__heading[\s\S]*?border-bottom/);
    expect(css).toMatch(/\.tpl-cob__head\s*\{[\s\S]*?border-bottom/);
  });
});

describe('the Cobalt catalog entry', () => {
  it('states its own ATS guarantees, not another template’s', () => {
    for (const other of ['harvard', 'executive', 'meridian'] as const) {
      expect(TEMPLATES.cobalt.ats).not.toEqual(TEMPLATES[other].ats);
    }
  });

  it('names the sections its extracted text reaches first, and the renderer agrees', () => {
    /*
     * The catalog claim asserted against what the renderer DOES, not merely
     * against the other entries: the order the guarantee promises is the order
     * the document is written in.
     */
    const claims = TEMPLATES.cobalt.ats.join(' ').toLowerCase();
    expect(claims).toMatch(/two columns/);
    expect(claims).not.toMatch(/linear/);

    const { container } = renderCobalt(resume());
    const text = (container.textContent ?? '').toLowerCase();
    const promised = ['summary', 'skills', 'education', 'work history'].map(
      (s) => claims.indexOf(s),
    );
    expect([...promised].sort((a, b) => a - b)).toEqual(promised);

    // …and the document delivers that order.
    expect(text.indexOf('professional summary')).toBeLessThan(
      text.indexOf('technical skills'),
    );
    expect(text.indexOf('technical skills')).toBeLessThan(
      text.indexOf('education'),
    );
    expect(text.indexOf('education')).toBeLessThan(text.indexOf('experience'));
  });

  it('claims a background-free print, and the document has no band to betray it', () => {
    expect(TEMPLATES.cobalt.ats.join(' ').toLowerCase()).toMatch(
      /background graphics off/,
    );
    const { container } = renderCobalt(resume());
    // Nothing that the other coloured templates use to carry a band.
    expect(container.querySelector('.tpl-cob__crown')).toBeNull();
    expect(container.querySelector('.tpl-cob__band')).toBeNull();
  });
});
