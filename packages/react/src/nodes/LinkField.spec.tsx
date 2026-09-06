import { render } from '@testing-library/react';
import { Editor, Element, Frame } from '@craftjs/core';
import { describe, expect, it } from 'vitest';
import type { ResumeObject, TemplateId } from '@cvgs/core';
import { TEMPLATE_RENDERERS } from '../registry.js';
import { DocumentPresentationProvider } from '../presentation-context.js';

/**
 * A link is one field in every template, and its chrome costs the document
 * nothing.
 *
 * The second half is the requirement that is easy to satisfy loosely: an
 * editing control that occupies the flow is present in the editor and absent
 * from the preview, so the same résumé sits differently on screen than in the
 * file it produces. Harvard's `+ Add link` did exactly that — in the flow of the
 * contact paragraph, between the phone number and the end of the line.
 *
 * jsdom lays nothing out, so there is no box here to measure and no honest way
 * to write this as "the line is the same length". What IS checkable is the
 * property that produces it: everything the editor adds around a link is marked
 * chrome, and chrome is absolutely positioned and hidden in print. So the two
 * DOMs are compared with the chrome removed, and they must be identical.
 */
const TEMPLATE_IDS = Object.keys(TEMPLATE_RENDERERS) as TemplateId[];

function resume(overrides: Partial<ResumeObject> = {}): ResumeObject {
  return {
    name: 'Starlin Gil Cruz',
    contact: { email: 'starlin@example.com' },
    links: [{ label: 'LinkedIn', url: 'https://linkedin.com/in/example' }],
    custom_sections: [],
    headline: 'Senior Software Engineer',
    summary: 'Ten years building backend platforms.',
    skills: [{ category: 'Backend', items: ['Node.js'] }],
    experience: [
      {
        company: 'Doral',
        title: 'Senior Software Engineer',
        start: '2024-01',
        end: 'Present',
        bullets: ['Designed NestJS microservices.'],
        tech: [],
      },
    ],
    education: [{ school: 'UTESA', degree: 'BSc', field: 'Software' }],
    certifications: [],
    ...overrides,
  };
}

function renderIn(id: TemplateId, data: ResumeObject, editing: boolean) {
  const { Document, resolver } = TEMPLATE_RENDERERS[id];
  return render(
    <DocumentPresentationProvider>
      <Editor resolver={resolver} enabled={editing}>
        <Frame>
          <Element is={Document} resume={data} />
        </Frame>
      </Editor>
    </DocumentPresentationProvider>,
  );
}

/** The document, with every element the editor added stripped out. */
function withoutChrome(root: HTMLElement): string {
  const copy = root.cloneNode(true) as HTMLElement;
  for (const el of copy.querySelectorAll('[data-chrome]')) el.remove();
  /*
   * Craft marks the nodes it manages; the read-only tree marks them too but the
   * ids differ per mount, so they are not part of what is being compared.
   */
  for (const el of copy.querySelectorAll('*')) {
    el.removeAttribute('data-editing');
  }
  return copy.innerHTML;
}

describe('a link is the same document, edited or read', () => {
  it.each(TEMPLATE_IDS)(
    '%s: the editing DOM differs from the reading DOM only by chrome',
    (id) => {
      const data = resume();
      const editing = renderIn(id, data, true);
      const reading = renderIn(id, data, false);

      expect(withoutChrome(editing.container)).toBe(
        withoutChrome(reading.container),
      );
    },
  );

  it.each(TEMPLATE_IDS)(
    '%s: shows a link by its text, not its address',
    (id) => {
      /*
       * Three of the four templates bound the field to `link.url`, so the URL was
       * the visible text and a résumé lost its labels the moment it changed
       * template. A printed address is also worse on a document read in six
       * seconds than the word it stands for.
       */
      const { container } = renderIn(id, resume(), false);
      expect(container.textContent).toContain('LinkedIn');
      expect(container.textContent).not.toContain('linkedin.com/in/example');
    },
  );

  it.each(TEMPLATE_IDS)('%s: falls back to the address with no text', (id) => {
    // Nothing renders blank: a link with an address and no label shows it.
    const { container } = renderIn(
      id,
      resume({ links: [{ url: 'https://example.com/cv' }] }),
      false,
    );
    expect(container.textContent).toContain('https://example.com/cv');
  });

  it.each(TEMPLATE_IDS)('%s: keeps the address followable', (id) => {
    const { container } = renderIn(id, resume(), false);
    const anchor = container.querySelector(
      'a[href="https://linkedin.com/in/example"]',
    );
    expect(
      anchor,
      'the export reads this anchor, not a click handler',
    ).toBeTruthy();
  });
});
