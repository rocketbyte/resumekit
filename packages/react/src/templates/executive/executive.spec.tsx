import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { render, screen } from '@testing-library/react';
import {
  TEMPLATES,
  type DocumentStyle,
  type ResumeObject,
} from '@resumekit/schema';
import { documentStyle } from '../../kit/documentStyle.js';
import { TEMPLATE_RENDERERS } from '../../registry.js';
import { FieldRegistryProvider } from '../../fields/field-registry.js';
import { DocumentPresentationProvider } from '../../presentation-context.js';

/**
 * The Executive template.
 *
 * Asserted through the rendered document, like Harvard: what matters is that the
 * page carries the reference's sections, omits what it has no data for, and
 * stays parseable despite its two columns.
 */

const css = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), 'executive.css'),
  'utf8',
).replace(/\/\*[\s\S]*?\*\//g, '');

/** The custom properties the root rule declares. */
const ROOT: Record<string, string> = Object.fromEntries(
  [...css.matchAll(/(?:^|\})\s*\.tpl-exec\s*\{([^}]*)\}/g)].flatMap(
    ([, body]) =>
      [...body.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map(([, k, v]) => [
        k,
        v.trim(),
      ]),
  ),
);

/**
 * What `name` computes to on the root, with the inline properties a stored
 * style writes taking precedence — the cascade jsdom does not model.
 */
function resolve(name: string, inline: Record<string, string>): string {
  const value = inline[name] ?? ROOT[name];
  if (value === undefined) throw new Error(`${name} is not set`);
  return expand(value, inline);
}

function expand(value: string, inline: Record<string, string>): string {
  const at = value.indexOf('var(');
  if (at < 0) return value;
  let depth = 0;
  let end = at + 4;
  for (; end < value.length; end++) {
    if (value[end] === '(') depth++;
    else if (value[end] === ')' && depth-- === 0) break;
  }
  const [, name, fallback] = /^(--[\w-]+)\s*(?:,\s*([\s\S]*))?$/.exec(
    value.slice(at + 4, end).trim(),
  ) as RegExpExecArray;
  const own = inline[name] ?? ROOT[name];
  const inner =
    own !== undefined
      ? resolve(name, inline)
      : expand(fallback?.trim() ?? '', inline);
  return expand(value.slice(0, at) + inner + value.slice(end + 1), inline);
}

function contrastOnWhite(hex: string): number {
  const channel = (i: number) => {
    const c = parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const l = 0.2126 * channel(0) + 0.7152 * channel(1) + 0.0722 * channel(2);
  return 1.05 / (l + 0.05);
}

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

function renderExec(data: ResumeObject) {
  const { Document } = TEMPLATE_RENDERERS.executive;
  return render(
    <DocumentPresentationProvider>
      <FieldRegistryProvider enabled>
        <Document resume={data} />
      </FieldRegistryProvider>
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
    expect(columns?.textContent).not.toContain('English');
    // The level is a WORD, so the section means something without the meter.
    expect(container.textContent).toContain('English');
    expect(container.textContent).toContain('Native');
  });

  it('shows no Languages section when the resume names no languages', () => {
    // The résumé holds no languages. A skills group NAMED "Languages" no
    // longer makes one — that stopgap is retired.
    renderExec(resume({ languages: [] }));
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

describe('the Executive colours', () => {
  const base: DocumentStyle = { font: 'helvetica', ink: 'ink', scale: 1 };
  const inks = ['--tpl-described-title-ink', '--tpl-language-meter-ink'];

  it('reads titles and meter dots in navy, not in the hairline grey', () => {
    // The rule colour once inked achievement titles and language dots at
    // ~1.6:1 on the paper: present in the file, invisible on the page.
    const inline = documentStyle('e', base) as Record<string, string>;
    expect(resolve('--e-rule', inline)).toBe('#c9cdd6');
    for (const ink of inks) {
      expect(resolve(ink, inline), ink).toBe(resolve('--e-navy', inline));
      expect(contrastOnWhite(resolve(ink, inline)), ink).toBeGreaterThan(4.5);
    }
  });

  it('gives a chosen accent to the hairlines and to what the accent inks', () => {
    const inline = documentStyle('e', {
      ...base,
      accent: 'maroon',
    }) as Record<string, string>;
    expect(resolve('--e-rule', inline)).toBe(inline['--e-accent']);
    for (const ink of inks) {
      expect(resolve(ink, inline), ink).toBe(inline['--e-accent']);
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

  it('leaves the page white — the navy belongs to the header', () => {
    // The band is the only coloured thing; the sheet behind it is paper.
    const { container } = renderExec(resume());
    const band = container.querySelector('.tpl-exec__band');
    expect(band).toBeTruthy();
    expect(container.querySelector('.tpl-exec')?.className).not.toMatch(
      /border|frame/,
    );
  });
});
