import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import {
  applyPresentation,
  type ResumeEdits,
  type ResumeObject,
} from '@cvgs/core';
import { FieldRegistryProvider } from '../../fields/field-registry.js';
import { TEMPLATE_RENDERERS } from '../../registry.js';
import { DocumentPresentationProvider } from '../../presentation-context.js';
import { DocumentAuthoringProvider } from '../authoring-context.js';
import { TemplateLocaleProvider } from '../../i18n/index.js';

beforeAll(async () => {
  await import('../AuthoredItems.js');
  await import('../../nodes/AuthoredBullets.js');
});

const role = (
  company: string,
  title: string,
  start: string,
  bullets: string[],
) => ({ company, title, start, end: 'Present', bullets, tech: [] });

const base: ResumeObject = {
  name: 'Ada Lovelace',
  contact: { email: 'ada@example.com' },
  links: [],
  custom_sections: [],
  section_headings: {},
  achievements: [],
  courses: [],
  passions: [],
  languages: [],
  summary: 'Engineer.',
  skills: [],
  experience: [role('Acme', 'Engineer', '2022-02', ['Shipped the app.'])],
  education: [],
  certifications: [],
};

/* The same role with many more bullets, and a role the resume does not carry. */
const profile: ResumeObject = {
  ...base,
  experience: [
    role('Acme', 'Senior Engineer', '2022-02', [
      'Shipped the app.',
      'Cut deploy time with a new pipeline.',
      'Mentored three engineers.',
      'Ran the incident reviews.',
    ]),
    role('Globex', 'Tech Lead', '2019-01', [
      'Led a team of five.',
      'Ran the on-call rotation.',
    ]),
  ],
};

async function openPicker(
  library: ResumeObject | null,
  onEditsChange: (next: ResumeEdits) => void = () => undefined,
  languages: { editor?: string; document?: string } = {},
) {
  const { Document } = TEMPLATE_RENDERERS.harvard;
  const result = render(
    <TemplateLocaleProvider locale={languages.editor}>
      <DocumentAuthoringProvider
        value={{ base, edits: [], onEditsChange, library }}
      >
        <DocumentPresentationProvider language={languages.document}>
          <FieldRegistryProvider enabled>
            <Document resume={applyPresentation(base, [])} />
          </FieldRegistryProvider>
        </DocumentPresentationProvider>
      </DocumentAuthoringProvider>
    </TemplateLocaleProvider>,
  );
  await waitFor(() =>
    expect(result.container.querySelector('[data-entry]')).not.toBeNull(),
  );
  fireEvent.click(
    result.container.querySelectorAll('[data-entry]')[0] as Element,
  );
  const bar = await screen.findByRole('toolbar');
  const button = within(bar).queryByRole('button', {
    name: /from your career profile|desde tu perfil profesional/i,
  });
  if (button) fireEvent.click(button);
  return { result, bar };
}

const dialog = () =>
  screen.getByRole('dialog', { name: 'Bring in more of your experience' });

describe('adding to a role from the career profile', () => {
  it('offers the bullets the resume left out of a role it already has', async () => {
    const { result } = await openPicker(profile);
    const more = within(dialog()).getByRole('region', {
      name: 'More from this role',
    });
    // Already on the resume, so not offered again.
    expect(within(more).queryByText('Shipped the app.')).toBeNull();
    expect(within(more).getAllByRole('checkbox')).toHaveLength(3);

    fireEvent.click(within(more).getByRole('button', { name: 'Select all' }));
    fireEvent.click(within(more).getByLabelText('Mentored three engineers.'));
    expect(within(dialog()).getByText('2 selected')).toBeTruthy();
    fireEvent.click(
      within(dialog()).getByRole('button', { name: 'Add 2 bullets' }),
    );

    await waitFor(() => {
      const text = result.container.textContent ?? '';
      expect(text).toContain('Cut deploy time with a new pipeline.');
      expect(text).toContain('Ran the incident reviews.');
      expect(text).not.toContain('Mentored three engineers.');
    });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('adds another role with only the bullets kept, in the same step', async () => {
    const onEditsChange = vi.fn();
    await openPicker(profile, onEditsChange);
    const others = within(dialog()).getByRole('region', {
      name: 'Other roles you’ve held',
    });
    fireEvent.click(within(others).getByLabelText(/Tech Lead/));
    fireEvent.click(within(others).getByLabelText('Ran the on-call rotation.'));
    fireEvent.click(
      within(dialog()).getByRole('button', { name: 'Add 1 role' }),
    );

    expect(onEditsChange).toHaveBeenCalledTimes(1);
    const appended = (onEditsChange.mock.calls[0][0] as ResumeEdits).filter(
      (edit) => edit.kind === 'append',
    );
    expect(appended).toHaveLength(1);
    expect(appended[0]).toMatchObject({
      section: 'experience',
      author: 'candidate',
      entry: { company: 'Globex', bullets: ['Led a team of five.'] },
    });
  });

  it('says so when the profile has nothing the resume lacks', async () => {
    await openPicker({ ...base });
    expect(
      within(dialog()).getByText(/is already on this resume/i),
    ).toBeTruthy();
    expect(within(dialog()).queryByRole('checkbox')).toBeNull();
    fireEvent.click(within(dialog()).getByRole('button', { name: 'Done' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('is absent without a career profile', async () => {
    const { bar } = await openPicker(null);
    expect(
      within(bar).queryByRole('button', { name: /from your career profile/i }),
    ).toBeNull();
  });
});

describe('in another language', () => {
  it('speaks the editor’s language around a document printed in its own', async () => {
    const { result } = await openPicker(profile, undefined, {
      editor: 'es',
      document: 'en',
    });
    const dialog = screen.getByRole('dialog', {
      name: 'Suma más de tu experiencia',
    });
    const more = within(dialog).getByRole('region', {
      name: 'Más de este puesto',
    });
    fireEvent.click(
      within(more).getByRole('button', { name: 'Seleccionar todo' }),
    );
    fireEvent.click(within(dialog).getByLabelText(/Tech Lead/));
    expect(
      within(dialog).getByRole('button', {
        name: 'Añadir 3 puntos y 1 puesto',
      }),
    ).toBeTruthy();
    expect(within(result.container).getByText('Experience')).toBeTruthy();
  });

  it('prints its default headings in the document’s language', async () => {
    const { result } = await openPicker(null, undefined, { document: 'es' });
    expect(within(result.container).getByText('Experiencia')).toBeTruthy();
    expect(within(result.container).queryByText('Experience')).toBeNull();
  });
});
