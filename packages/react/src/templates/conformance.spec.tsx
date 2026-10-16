import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  RESUME_SECTIONS,
  type ResumeObject,
  type TemplateId,
} from '@resumekit/schema';
import { TEMPLATE_RENDERERS } from '../registry.js';
import { DocumentPresentationProvider } from '../presentation-context.js';
import { FieldRegistryProvider } from '../fields/field-registry.js';
import { DocumentAuthoringProvider } from '../collections/authoring-context.js';
import { DocumentSpacingProvider } from '../spacing/spacing-context.js';

/**
 * What every template owes the editor, asserted over the registry so a new
 * template is held to it the moment it is registered.
 *
 * The editing capabilities are shared components (`kit/`, `collections/`,
 * `rail/`); a template decides only where they sit. These checks catch the
 * ways a template can quietly opt out: drawing a section without its rail,
 * or a stylesheet that never adds the recorded space, so the control moves
 * nothing.
 */
const IDS = Object.keys(TEMPLATE_RENDERERS) as TemplateId[];
const HERE = dirname(fileURLToPath(import.meta.url));

const FULL: ResumeObject = {
  name: 'Ada Lovelace',
  contact: {
    email: 'ada@example.com',
    phone: '+1 555 0100',
    location: 'London',
  },
  links: [{ label: 'GitHub', url: 'https://github.com/ada' }],
  custom_sections: [],
  section_headings: {},
  achievements: [{ title: 'Grant won', description: 'Secured £1.2M.' }],
  courses: [{ title: 'Advanced Excel', description: 'Run by the CFI.' }],
  passions: [{ title: 'Marathons', description: 'Five, so far.' }],
  languages: [
    { name: 'English', level: 'native' },
    { name: 'French', level: 'advanced' },
  ],
  headline: 'Engineer',
  summary: 'Builds engines.',
  skills: [
    { category: 'Backend', items: ['Node.js'] },
    { category: 'Languages', items: ['English'] },
  ],
  experience: [
    {
      company: 'Analytical Co',
      title: 'Engineer',
      start: '2020-01',
      end: 'Present',
      bullets: ['Built it.'],
      tech: [],
    },
  ],
  education: [{ school: 'University of London', degree: 'BSc' }],
  certifications: ['AWS Solutions Architect'],
};

/** The document as the editor mounts it, once its editing layer has loaded. */
async function author(id: TemplateId, resume: ResumeObject = FULL) {
  const { Document } = TEMPLATE_RENDERERS[id];
  const view = render(
    <DocumentAuthoringProvider
      value={{ base: resume, edits: [], onEditsChange: () => undefined }}
    >
      <DocumentSpacingProvider value={{ onChange: () => undefined }}>
        <DocumentPresentationProvider>
          <FieldRegistryProvider enabled>
            <Document resume={resume} />
          </FieldRegistryProvider>
        </DocumentPresentationProvider>
      </DocumentSpacingProvider>
    </DocumentAuthoringProvider>,
  );
  await waitFor(() =>
    expect(view.container.querySelector('[data-rail-key^="e:"]')).toBeTruthy(),
  );
  return view;
}

/** The template's stylesheet, comments stripped. */
function sheet(id: TemplateId): string {
  return readFileSync(join(HERE, id, `${id}.css`), 'utf8').replace(
    /\/\*[\s\S]*?\*\//g,
    '',
  );
}

/** Whether some rule naming `className` adds the recorded space to its margin. */
function addsSpace(css: string, className: string): boolean {
  const rules = css.matchAll(/([^{}]+)\{([^}]*)\}/g);
  return Array.from(rules).some(
    ([, selector, body]) =>
      new RegExp(`\\.${className}(?![\\w-])`).test(selector ?? '') &&
      /margin-top:[^;]*var\(--tpl-space-height/.test(body ?? ''),
  );
}

/*
 * A template's document must import ITS OWN stylesheet.
 *
 * TypeScript does not check a CSS import, so a template written from another
 * one's file keeps pointing at that one's styles and typechecks clean. It
 * fails at build time in the export bundle — which is a long way from where
 * the mistake was made, and only if somebody builds it.
 */
it.each(IDS)('%s imports its own stylesheet', (id) => {
  const dir = join(HERE, id);
  const document = readdirSync(dir).find((f) => /Document\.tsx$/.test(f));
  expect(document, `${id} has a document`).toBeTruthy();
  expect(readFileSync(join(dir, document as string), 'utf8')).toContain(
    `import './${id}.css'`,
  );
});

describe.each(IDS)('%s meets the editing contract', (id) => {
  /*
   * What the four supporting sections owe every template, in ONE render.
   *
   * Together rather than three tests because each `author()` mounts the lazy
   * editing layer and waits for it; seventeen templates times three renders
   * made the suite slow and, under load, flaky. The assertions are independent
   * of each other, so one document answers all three questions.
   */
  it('draws the supporting sections the way the contract requires', async () => {
    const { container } = await author(id);

    /*
     * Prose, never bullets. Every reference sets these as a title over a
     * paragraph, which is why `description` is a single string — and sixty-eight
     * placements is exactly where a template would reach for a bullet list.
     */
    for (const section of ['achievements', 'courses', 'passions']) {
      const el = container.querySelector(
        `section[data-rail-key="s:${section}"]`,
      );
      expect(el, `${section} is drawn`).toBeTruthy();
      expect(
        el!.querySelector('.tpl-bullets'),
        `${section} draws no bullet list`,
      ).toBeNull();
    }

    /*
     * A level is a WORD before it is a meter. This is the condition on which
     * `docs/template-contract.md` allows the meter at all: the dots are
     * decoration, and the section still means something to a parser, to a
     * reader, and on a printer that drops them.
     */
    const languages = container.querySelector(
      'section[data-rail-key="s:languages"]',
    );
    expect(languages, 'languages is drawn').toBeTruthy();
    expect(languages!.textContent).toContain('English');
    expect(languages!.textContent).toContain('Native');
    expect(languages!.textContent).toContain('Advanced');

    /* The meter carries nothing a reader has to be told about. */
    for (const meter of container.querySelectorAll('.tpl-language__meter')) {
      expect(meter.getAttribute('aria-hidden')).toBe('true');
    }

    /*
     * A heading class the stylesheet never names renders as a bare `<h2>`:
     * no rule, no case, no spacing. Harvard shipped exactly that for these
     * four, and nothing but looking at the page caught it.
     */
    const css = sheet(id);
    for (const section of [
      'achievements',
      'courses',
      'passions',
      'languages',
    ]) {
      const heading = container.querySelector(
        `section[data-rail-key="s:${section}"] h2`,
      );
      for (const c of Array.from(heading?.classList ?? [])) {
        expect(
          new RegExp(`\\.${c}(?![\\w-])`).test(css),
          `${section}'s heading class .${c} is styled`,
        ).toBe(true);
      }
    }
  });

  /*
   * Every section is renameable, in every template.
   *
   * The heading is an `EditableText` at `section_headings.<id>`, so a rename is
   * an ordinary `set` edit. Asserted over the registry because a template that
   * drew its own `<h2>` text instead of using `DocumentSection` would look
   * identical and silently refuse the caret.
   */
  it('lets the candidate rename every section', async () => {
    const { container } = await author(id);
    for (const section of RESUME_SECTIONS) {
      const heading = container.querySelector(
        `section[data-rail-key="s:${section}"] h2 [data-path]`,
      );
      expect(heading, `${section}'s heading is a field`).toBeTruthy();
      expect(heading!.getAttribute('data-path')).toBe(
        `section_headings.${section}`,
      );
    }
  });

  /* A renamed section prints the candidate's word, not the template's. */
  it('prints the name the candidate gave a section', async () => {
    const { container } = await author(id, {
      ...FULL,
      section_headings: { passions: 'Interests' },
    });
    const el = container.querySelector('section[data-rail-key="s:passions"]');
    expect(el!.querySelector('h2')!.textContent).toBe('Interests');
  });

  it('gives every named section its own rail', async () => {
    const { container } = await author(id);
    for (const section of RESUME_SECTIONS) {
      expect(
        container.querySelector(`section[data-rail-key="s:${section}"]`),
        `${section} is a DocumentSection`,
      ).toBeTruthy();
    }
  });

  /*
   * One rail per section. A template that drew a second section under a name
   * already taken — Languages under the skills gap, say — would give one
   * stored gap two controls, and pointing at either would light up both.
   */
  it('gives each named section exactly one rail', async () => {
    const { container } = await author(id);
    for (const section of RESUME_SECTIONS) {
      expect(
        container.querySelectorAll(`[data-rail-key="s:${section}"]`),
        section,
      ).toHaveLength(1);
    }
  });

  it('offers the space control when a section is pointed at', async () => {
    const { container } = await author(id);
    const experience = container.querySelector(
      '[data-rail-key="s:experience"]',
    );
    fireEvent.pointerOver(experience as Element);
    expect(screen.getByLabelText('Space above Experience')).toBeTruthy();
  });

  /*
   * The skills themselves, not the groups they are stored in. A template that
   * prints the category (Harvard) draws a group as a container; one that
   * prints a flat list does not, because an unlabelled box down the section
   * matches nothing on the page. Either way, a skill is editable.
   */
  it('makes every skill editable', async () => {
    const { container } = await author(id);
    expect(
      container.querySelector('[data-path^="skills.0.items"]'),
    ).toBeTruthy();
  });

  it('offers every contact field while the document is being written', async () => {
    const { container } = await author(id, { ...FULL, contact: {} });
    for (const field of ['email', 'phone', 'location']) {
      expect(
        container.querySelector(`[data-path="contact.${field}"]`),
        `contact.${field}`,
      ).toBeTruthy();
    }
  });

  it('adds recorded space to the margins of its sections and entries', async () => {
    const { container } = await author(id);
    const css = sheet(id);
    expect(css).toMatch(/--tpl-space-unit:/);
    const hosts = [
      container.querySelector('[data-rail-key="s:experience"]'),
      container.querySelector(
        '[data-rail-key="s:experience"] [data-rail-key^="e:"]',
      ),
    ];
    for (const host of hosts) {
      const own = Array.from(host?.classList ?? []).filter((c) =>
        c.startsWith('tpl-'),
      );
      expect(
        own.some((c) => addsSpace(css, c)),
        `${own.join(' ')} adds --tpl-space-height to margin-top`,
      ).toBe(true);
    }
  });
});
