import { fireEvent, render, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ResumeObject } from '@resumekit/schema';
import { TEMPLATE_RENDERERS } from '../registry.js';
import { DocumentAuthoringProvider } from '../collections/authoring-context.js';
import { DocumentSpacingProvider } from '../spacing/spacing-context.js';
import { DocumentPresentationProvider } from '../presentation-context.js';
import { FieldRegistryProvider } from '../fields/field-registry.js';

const RESUME: ResumeObject = {
  name: 'Byungjin  Park',
  contact: {},
  links: [],
  summary: 'Seasoned SRE.',
  skills: [],
  experience: [],
  education: [],
  certifications: [],
  achievements: [],
  courses: [],
  passions: [],
  languages: [],
  custom_sections: [
    { id: 'talks', heading: 'Talks', author: 'candidate', entries: [] },
  ],
  section_headings: { summary: 'Résumé' },
};

/* Crimson splits its name and accents three letters of every heading. */
const { Document } = TEMPLATE_RENDERERS.crimson;

const read = (resume: ResumeObject = RESUME) =>
  render(
    <DocumentPresentationProvider>
      <FieldRegistryProvider enabled={false}>
        <Document resume={resume} />
      </FieldRegistryProvider>
    </DocumentPresentationProvider>,
  ).container;

async function author() {
  const { container } = render(
    <DocumentAuthoringProvider
      value={{ base: RESUME, edits: [], onEditsChange: () => undefined }}
    >
      <DocumentSpacingProvider value={{ onChange: () => undefined }}>
        <DocumentPresentationProvider>
          <FieldRegistryProvider enabled>
            <Document resume={RESUME} />
          </FieldRegistryProvider>
        </DocumentPresentationProvider>
      </DocumentSpacingProvider>
    </DocumentAuthoringProvider>,
  );
  await waitFor(() =>
    expect(container.querySelector('[data-rail-key]')).toBeTruthy(),
  );
  return container;
}

const parts = (el: Element | null) =>
  [...(el?.querySelectorAll('span[class]:not(.tpl-text)') ?? [])].map((s) => [
    s.className,
    s.textContent,
  ]);

const name = (c: Element) =>
  c.querySelector('[data-path="name"], h1 .tpl-text');
const heading = (c: Element, path: string) =>
  c.querySelector(`[data-path="${path}"]`);

describe('a split name', () => {
  it('reads as given names and surname, and extracts as typed', () => {
    const el = name(read());
    expect(parts(el)).toEqual([
      ['tpl-crimson__name-first', 'Byungjin'],
      ['tpl-crimson__name-last', 'Park'],
    ]);
    expect(el?.textContent).toBe('Byungjin  Park');
  });

  it('draws one word as one span', () => {
    const el = name(read({ ...RESUME, name: 'Cher' }));
    expect(parts(el)).toEqual([['tpl-crimson__name-last', 'Cher']]);
  });

  it('is drawn the same in the editor, and typed into as one field', async () => {
    const c = await author();
    const el = name(c) as Element;
    expect(parts(el)).toEqual(parts(name(read())));
    fireEvent.mouseDown(el);
    const field = await waitFor(() => {
      const f = c.querySelector('[data-path="name"] [contenteditable]');
      expect(f).toBeTruthy();
      return f as Element;
    });
    expect(field.textContent).toBe('Byungjin  Park');
    expect(field.querySelector('span')).toBeNull();
  });
});

describe('a heading accent', () => {
  it('sets apart the first letters and extracts the heading whole', () => {
    const c = read();
    const summary = heading(c, 'section_headings.summary');
    expect(parts(summary)).toEqual([['tpl-crimson__heading-lead', 'Rés']]);
    expect(summary?.textContent).toBe('Résumé');
    const talks = heading(c, 'custom_sections.0.heading');
    expect(parts(talks)).toEqual([['tpl-crimson__heading-lead', 'Tal']]);
    expect(talks?.textContent).toBe('Talks');
  });

  it('keeps the heading one renameable field in the editor', async () => {
    const c = await author();
    const el = heading(c, 'section_headings.summary') as Element;
    expect(parts(el)).toEqual([['tpl-crimson__heading-lead', 'Rés']]);
    fireEvent.mouseDown(el);
    const field = await waitFor(() => {
      const f = el.ownerDocument.querySelector(
        '[data-path="section_headings.summary"] [contenteditable]',
      );
      expect(f).toBeTruthy();
      return f as Element;
    });
    expect(field.textContent).toBe('Résumé');
  });
});
