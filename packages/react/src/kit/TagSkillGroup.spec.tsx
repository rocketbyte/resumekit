import { render, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ResumeObject } from '@cvgs/core';
import { TEMPLATE_RENDERERS } from '../registry.js';
import { DocumentAuthoringProvider } from '../collections/authoring-context.js';
import { DocumentSpacingProvider } from '../spacing/spacing-context.js';
import { DocumentPresentationProvider } from '../presentation-context.js';
import { FieldRegistryProvider } from '../fields/field-registry.js';

const RESUME: ResumeObject = {
  name: 'Ada Lovelace',
  contact: {},
  links: [],
  summary: '',
  skills: [
    { category: 'Marketing', items: ['PPC Campaign Management', 'SEO'] },
    { category: '', items: ['Microsoft Excel'] },
  ],
  experience: [],
  education: [],
  certifications: [],
  achievements: [],
  courses: [],
  passions: [],
  languages: [],
  custom_sections: [],
  section_headings: {},
};

const { Document } = TEMPLATE_RENDERERS.stylish;

const read = () =>
  render(
    <DocumentPresentationProvider>
      <FieldRegistryProvider enabled>
        <Document resume={RESUME} />
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
    expect(container.querySelector('[data-rail-key^="e:skills"]')).toBeTruthy(),
  );
  return container;
}

describe('labelled tags', () => {
  it('prints each skill as its own list item, and no comma', () => {
    const tags = read().querySelector('.tpl-skill-tags');
    expect(
      [...(tags?.querySelectorAll('li') ?? [])].map((li) => li.textContent),
    ).toEqual(['PPC Campaign Management', 'SEO', 'Microsoft Excel']);
    expect(tags?.textContent).not.toContain(',');
  });

  it('prints a category only where the group has one', () => {
    const labels = read().querySelectorAll('.tpl-skill-tags__label');
    expect([...labels].map((l) => l.textContent)).toEqual(['Marketing']);
  });

  it('makes each group an entry, and offers the missing category', async () => {
    const container = await author();
    const groups = container.querySelectorAll('.tpl-skill-tags__group');
    expect(groups).toHaveLength(2);
    for (const group of groups)
      expect(group.hasAttribute('data-entry')).toBe(true);
    expect(
      container.querySelector('[data-path="skills.1.category"]'),
    ).toBeTruthy();
    expect(
      container.querySelector('[data-path="skills.0.items"]'),
    ).toBeTruthy();
  });
});
