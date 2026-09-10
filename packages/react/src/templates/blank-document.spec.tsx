import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import {
  PLACEHOLDERS,
  applyPresentation,
  asResumeObject,
  blankTailoredResume,
  type ResumeEdits,
  type ResumeObject,
  type TemplateId,
} from '@cvgs/core';
import { TEMPLATE_RENDERERS } from '../registry.js';
import { DocumentPresentationProvider } from '../presentation-context.js';
import { FieldRegistryProvider } from '../fields/field-registry.js';
import { DocumentAuthoringProvider } from '../collections/authoring-context.js';

/**
 * A résumé started from scratch has to be fillable.
 *
 * It was not. A template omits a section it has no data for — which is right for
 * a document being read, and on a document whose entire purpose is to be typed
 * into it meant a blank page: Harvard requires a professional summary, an empty
 * `summary` rendered no heading and no field, and there was nowhere to click to
 * put one there. The candidate could see that something was missing and had no
 * way to supply it.
 *
 * So every section renders while the document is being AUTHORED, empty or not,
 * and each empty field says what belongs in it.
 */
const TEMPLATE_IDS = Object.keys(TEMPLATE_RENDERERS) as TemplateId[];

/* The résumé the writer would have produced, widened — `asResumeObject` takes
   the résumé itself, not the tailoring result that carries it. */
const blank = () =>
  asResumeObject(blankTailoredResume('Ada Lovelace').resume_object);

function draw(id: TemplateId, authoring: boolean) {
  const { Document } = TEMPLATE_RENDERERS[id];
  const resume = blank();
  const tree = (
    <DocumentPresentationProvider>
      <FieldRegistryProvider enabled={authoring}>
        <Document resume={resume} />
      </FieldRegistryProvider>
    </DocumentPresentationProvider>
  );
  return render(
    authoring ? (
      <DocumentAuthoringProvider
        value={{ base: resume, edits: [], onEditsChange: () => undefined }}
      >
        {tree}
      </DocumentAuthoringProvider>
    ) : (
      tree
    ),
  );
}

describe('a resume started from scratch can be filled in', () => {
  it.each(TEMPLATE_IDS)('%s: offers the summary field', (id) => {
    /*
     * The reported defect, exactly. Harvard requires a professional summary;
     * `{resume.summary && …}` meant a blank document had no such section, and a
     * field that is not rendered is a field that cannot be typed into.
     */
    const { container } = draw(id, true);
    const summary = container.querySelector('[data-path="summary"]');
    expect(summary, 'there is a summary field to type into').toBeTruthy();
    expect(summary?.getAttribute('data-empty')).toBe('true');
  });

  it.each(TEMPLATE_IDS)('%s: offers the headline field', (id) => {
    const { container } = draw(id, true);
    expect(container.querySelector('[data-path="headline"]')).toBeTruthy();
  });

  it.each(TEMPLATE_IDS)(
    '%s: says what belongs in each, not what to say',
    (id) => {
      /*
       * Guidance, never an EXAMPLE. A specimen sentence is something a candidate
       * edits around rather than replaces, and the half they leave behind is a
       * claim about their career that they never made.
       */
      const { container } = draw(id, true);
      expect(
        container
          .querySelector('[data-path="summary"]')
          ?.getAttribute('data-placeholder'),
      ).toBe(PLACEHOLDERS['summary']);
      expect(
        container
          .querySelector('[data-path="headline"]')
          ?.getAttribute('data-placeholder'),
      ).toBe(PLACEHOLDERS['headline']);
    },
  );

  it.each(TEMPLATE_IDS)('%s: reaches every repeatable section', (id) => {
    // Experience, education and skills are empty on a blank document, so the
    // only way in is the collection's own add control.
    const { container } = draw(id, true);
    const adds = container.querySelectorAll(
      '.tpl-collection__add, .tpl-collection__add-inline',
    );
    expect(
      adds.length,
      'a blank document offers somewhere to add each section',
    ).toBeGreaterThan(0);
  });

  it.each(TEMPLATE_IDS)('%s: keeps the guidance out of the document', (id) => {
    /*
     * None of it is TEXT. The placeholders are drawn by CSS from
     * `data-placeholder`, so nothing here can be copied out of the page, read
     * by anything parsing it, or printed into the exported file — the rule the
     * placeholders have followed since they replaced real text nodes.
     */
    const { container } = draw(id, true);
    for (const guidance of Object.values(PLACEHOLDERS)) {
      expect(container.textContent).not.toContain(guidance);
    }
  });

  it.each(TEMPLATE_IDS)('%s: is still empty in a document being read', (id) => {
    /*
     * The preview and the export are unchanged. An empty section renders for
     * the candidate who is filling it in and for nobody else — a résumé sent to
     * an employer with an empty "Professional Summary" heading is worse than
     * one without the heading.
     */
    const { container } = draw(id, false);
    expect(container.querySelector('[data-path="summary"]')).toBeNull();
    expect(container.querySelector('[data-path="headline"]')).toBeNull();
  });
});

/**
 * A section added to a blank résumé is something you can write in.
 *
 * `mintExperience` gives a role one bullet, so there is somewhere to type the
 * first thing the candidate did — but that bullet rendered as a span with no
 * text and therefore no width. Everything that types into a bullet, adds
 * another or removes it hangs off the ROW, so a candidate saw a marker with
 * nothing beside it and had nothing to aim at. The role looked like a heading
 * with an empty space under it and no way in.
 */
describe('a section added to a blank resume can be written in', () => {
  const { Document } = TEMPLATE_RENDERERS.harvard;

  function Editable({ base }: { base: ResumeObject }) {
    const [edits, setEdits] = useState<ResumeEdits>([]);
    return (
      <DocumentAuthoringProvider
        value={{ base, edits, onEditsChange: setEdits }}
      >
        <DocumentPresentationProvider>
          <FieldRegistryProvider enabled>
            <Document resume={applyPresentation(base, edits)} />
          </FieldRegistryProvider>
        </DocumentPresentationProvider>
      </DocumentAuthoringProvider>
    );
  }

  const addARole = async () => {
    const view = render(<Editable base={blank()} />);
    fireEvent.click(
      await screen.findByRole('button', { name: /add (a )?role/i }),
    );
    await waitFor(() =>
      expect(
        view.container.querySelector('[data-path="experience.0.bullets"]'),
      ).toBeTruthy(),
    );
    return view;
  };

  it('arrives with a bullet that says what belongs in it', async () => {
    const { container } = await addARole();
    const bullet = container.querySelector('.tpl-bullet .tpl-text');
    expect(bullet?.getAttribute('data-empty')).toBe('true');
    expect(bullet?.getAttribute('data-placeholder')).toBe(
      PLACEHOLDERS['bullet'],
    );
  });

  it('keeps the guidance when the bullet is typed into', async () => {
    /*
     * Clicking an empty bullet to find out what goes in it must not remove the
     * only thing that said. The drawn placeholder is replaced by a control, so
     * the control carries the same sentence — a textarea's own `placeholder`,
     * painted by the browser and never part of the value.
     */
    const { container } = await addARole();
    fireEvent.mouseDown(
      container.querySelector(
        '[data-path="experience.0.bullets"]',
      ) as HTMLElement,
    );
    await waitFor(() =>
      expect(container.querySelector('textarea')).toBeTruthy(),
    );
    expect(
      container.querySelector('textarea')?.getAttribute('placeholder'),
    ).toBe(PLACEHOLDERS['bullet']);
  });

  it('offers to add another bullet and to remove one', async () => {
    const { container } = await addARole();
    fireEvent.mouseDown(
      container.querySelector(
        '[data-path="experience.0.bullets"]',
      ) as HTMLElement,
    );
    await waitFor(() =>
      expect(container.querySelector('.tpl-bullet__tools')).toBeTruthy(),
    );
    expect(
      screen.getByRole('button', { name: /add a bullet after 1/i }),
    ).toBeTruthy();
    expect(
      screen.getByRole('button', { name: /remove bullet 1/i }),
    ).toBeTruthy();
  });
});
