import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  RESUME_SECTIONS,
  type ResumeObject,
  type TemplateId,
} from '@cvgs/core';
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

describe.each(IDS)('%s meets the editing contract', (id) => {
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
