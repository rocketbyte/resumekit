import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { useState } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  applyPresentation,
  type ResumeEdits,
  type ResumeObject,
  type TemplateId,
} from '@cvgs/core';
import { TEMPLATE_RENDERERS } from '../registry.js';
import { DocumentPresentationProvider } from '../presentation-context.js';
import { FieldRegistryProvider } from '../fields/field-registry.js';
import { DocumentAuthoringProvider } from '../collections/authoring-context.js';

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

/**
 * `authoring` mounts the provider a collection needs before it offers to add.
 * Separate from `editing`, because they answer different questions: Craft's
 * `enabled` decides whether a field can be typed into, and the authoring
 * context decides whether the document's SHAPE can change. The read-only
 * document has neither, which is what keeps the preview and the export free of
 * chrome without either of them opting out.
 */
function renderIn(
  id: TemplateId,
  data: ResumeObject,
  editing: boolean,
  authoring = editing,
) {
  const { Document } = TEMPLATE_RENDERERS[id];
  const tree = (
    <DocumentPresentationProvider>
      <FieldRegistryProvider enabled={editing}>
        <Document resume={data} />
      </FieldRegistryProvider>
    </DocumentPresentationProvider>
  );
  return render(
    authoring ? (
      <DocumentAuthoringProvider
        value={{ base: data, edits: [], onEditsChange: () => undefined }}
      >
        {tree}
      </DocumentAuthoringProvider>
    ) : (
      tree
    ),
  );
}

/** The document, with every element the editor added stripped out. */
function withoutChrome(root: HTMLElement): string {
  const copy = root.cloneNode(true) as HTMLElement;
  for (const el of copy.querySelectorAll('[data-chrome]')) el.remove();
  /* `data-editing` says which field is open, which is a fact about the session
     rather than about the document. */
  for (const el of copy.querySelectorAll('*')) {
    el.removeAttribute('data-editing');
  }
  return copy.innerHTML;
}

/**
 * Press a link, once the editing chunk has arrived.
 *
 * `AuthoredItems` is loaded on demand, and until it does the read-only items
 * are the Suspense fallback — they carry no `onClick: select(id)`, so a press
 * that beats the chunk selects nothing. Waiting for `[data-entry]`, the marker
 * only an authored item writes, is what makes this about behaviour rather than
 * about which of the two renders won.
 */
async function pressLink(container: HTMLElement) {
  await waitFor(() =>
    expect(container.querySelector('[data-entry]')).not.toBeNull(),
  );
  fireEvent.click(container.querySelector('.tpl-link') as HTMLElement);
}

describe('a link is the same document, edited or read', () => {
  it.each(TEMPLATE_IDS)(
    '%s: the editing DOM differs from the reading DOM only by chrome',
    (id) => {
      const data = resume();
      /*
       * `authoring: false` on the editing side, and that is a LIMIT of this
       * assertion rather than a convenience. It covers everything Craft's
       * `enabled` state adds — which is what a link's popover and trigger are —
       * and not what the authoring CONTEXT adds. The `todo` below names what is
       * still outstanding there.
       */
      const editing = renderIn(id, data, true, false);
      const reading = renderIn(id, data, false);

      expect(withoutChrome(editing.container)).toBe(
        withoutChrome(reading.container),
      );
    },
  );

  /*
   * The same comparison with the authoring context mounted, which is the state
   * a candidate actually edits in. It does not pass yet, and the reason is not
   * links: Harvard builds its contact row as
   * `CONTACT_FIELDS.filter((f) => authoring || resume.contact[f])`, so the
   * editor renders empty `location` and `phone` fields the preview does not —
   * three items in that line against one. Every template does something of this
   * shape.
   *
   * The same defect as the add control, one level up, and bigger: fixing it
   * means an empty optional field renders in BOTH states and is drawn as a
   * placeholder only in the editor — which is already how `education.location`
   * behaves, so the pattern exists and the contact row does not follow it.
   */
  it.todo(
    'the editing DOM differs only by chrome with the authoring context mounted',
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

/**
 * The empty state does not add a line the document does not have.
 *
 * The defect these exist for, which the equivalence test above could not see:
 * an empty links collection drew `.tpl-collection__add` — a `<div>` holding a
 * dashed "+ Add link" button — inside Harvard's contact `<p>`. It was marked
 * `data-chrome`, so the comparison stripped it and passed, while the editor
 * showed a second line under the contact row that the preview and the file do
 * not have.
 *
 * Two things were wrong and both are asserted here. Chrome that sits in the
 * FLOW still moves the document, so marking it is not enough. And a `<div>`
 * inside a `<p>` is invalid nesting a browser resolves by closing the
 * paragraph — which is why it appeared below the line rather than in it.
 */
describe('an empty collection inside a line keeps the line', () => {
  const noLinks = () => resume({ links: [] });

  it('offers a field, not a block button', () => {
    const { container } = renderIn('harvard', noLinks(), true);
    expect(container.querySelector('.tpl-collection__add-inline')).toBeTruthy();
    expect(container.querySelector('.tpl-collection__add')).toBeNull();
  });

  it('puts no block element inside the contact paragraph', () => {
    // Invalid nesting, and the mechanism by which the control escaped the line.
    const { container } = renderIn('harvard', noLinks(), true);
    const contact = container.querySelector('.tpl-harvard__contact');
    expect(contact, 'the contact line is rendered').toBeTruthy();
    expect(contact!.querySelector('div')).toBeNull();
  });

  it('says what it adds without putting a word in the resume', () => {
    /*
     * A text node here would ride along with a candidate's copy-and-paste and
     * be read back by anything parsing the page — the rule the placeholders
     * already follow. The name is accessible; the label is an attribute CSS
     * draws.
     */
    const { container } = renderIn('harvard', noLinks(), true);
    const add = container.querySelector('.tpl-collection__add-inline');
    expect(add?.textContent).toBe('');
    expect(add?.getAttribute('data-placeholder')).toMatch(/link/i);
    expect(add?.getAttribute('aria-label')).toMatch(/link/i);
  });

  it('offers nothing at all in a document being read', () => {
    const { container } = renderIn('harvard', noLinks(), false);
    expect(container.querySelector('.tpl-collection__add-inline')).toBeNull();
    expect(container.querySelector('.tpl-collection__add')).toBeNull();
  });
});

/**
 * The popover carries both halves of a link, and both survive a save.
 *
 * "Survive a save" is the part worth asserting rather than assuming. The save
 * rebuilds the overlay from the Craft nodes that carry a `path` — anything
 * stored another way shows on screen and is gone on the next write — so what is
 * checked here is that typing reaches those NODES, not merely that an input
 * holds a character.
 */
describe('a link is edited in its popover', () => {
  const openPopover = (data: ResumeObject) => {
    const view = renderIn('harvard', data, true);
    fireEvent.click(screen.getByRole('button', { name: /edit/i }));
    return view;
  };

  /** Type into one of the panel's two fields, without setting anything yet. */
  const type = (current: string, next: string) =>
    fireEvent.change(screen.getByDisplayValue(current), {
      target: { value: next },
    });

  const ok = () => fireEvent.click(screen.getByRole('button', { name: 'Ok' }));

  it('puts the caret in the panel it just opened', () => {
    // The field on the page refuses the caret, so a press with no follow-up
    // would leave the keyboard pointing at nothing.
    openPopover(resume());
    expect(document.activeElement).toBe(screen.getByDisplayValue('LinkedIn'));
  });

  it('offers the text and the address together', () => {
    // Two places for one fact was the thing this replaced: a label on the page
    // and its address in a panel on the other side of the screen.
    openPopover(resume());
    expect(screen.getByDisplayValue('LinkedIn')).toBeTruthy();
    expect(
      screen.getByDisplayValue('https://linkedin.com/in/example'),
    ).toBeTruthy();
  });

  it('writes the text to the field the document renders', () => {
    const { container } = openPopover(resume());
    type('LinkedIn', 'My profile');
    ok();

    // The field in the FLOW updated, which is both what prints and what is
    // collected when the document saves.
    const shown = container.querySelector('[data-path="links.0.label"]');
    expect(shown?.textContent).toBe('My profile');
  });

  it('writes the address, and the document links to it', () => {
    const { container } = openPopover(resume());
    type('https://linkedin.com/in/example', 'https://example.com/cv');
    ok();

    const anchor = container.querySelector('[data-path="links.0.label"] a');
    expect(anchor?.getAttribute('href')).toBe('https://example.com/cv');
  });

  it('writes nothing until Ok is pressed', () => {
    /*
     * The inputs hold a DRAFT. Half a typed address is not a link, and every
     * keystroke of one used to reach the document and — at the end of the
     * debounce — storage.
     */
    const { container } = openPopover(resume());
    type('https://linkedin.com/in/example', 'https://exa');

    const anchor = container.querySelector('[data-path="links.0.label"] a');
    expect(anchor?.getAttribute('href')).toBe(
      'https://linkedin.com/in/example',
    );
  });

  it('discards the draft when the panel is dismissed', () => {
    // Backing out of a link leaves the document exactly as it was, which is
    // what makes typing into the panel safe.
    const { container } = openPopover(resume());
    type('LinkedIn', 'Half a thought');
    fireEvent.mouseDown(document.body);

    const shown = container.querySelector('[data-path="links.0.label"]');
    expect(shown?.textContent).toBe('LinkedIn');
  });

  it('sets both halves in one press', () => {
    const { container } = openPopover(resume());
    type('LinkedIn', 'My profile');
    type('https://linkedin.com/in/example', 'https://example.com/cv');
    ok();

    const shown = container.querySelector('[data-path="links.0.label"]');
    expect(shown?.textContent).toBe('My profile');
    expect(shown?.querySelector('a')?.getAttribute('href')).toBe(
      'https://example.com/cv',
    );
    expect(
      document.body.querySelector('.tpl-link__pop'),
      'a link that has been set is a link, not an open panel',
    ).toBeNull();
  });

  it('refuses to set a link with nothing in it', () => {
    // A press that would write two empty strings is a press that says nothing.
    openPopover(resume({ links: [{ label: '', url: '' }] }));
    expect(
      screen.getByRole('button', { name: 'Ok' }).hasAttribute('disabled'),
    ).toBe(true);
  });

  it('trims what it is given', () => {
    /*
     * An address is pasted far more often than it is typed, and a leading space
     * is enough for `isSafeLinkTarget` to refuse it — a link that silently
     * stops being followable in the exported file.
     */
    const { container } = openPopover(resume());
    type('https://linkedin.com/in/example', '  https://example.com/cv  ');
    ok();

    const anchor = container.querySelector('[data-path="links.0.label"] a');
    expect(anchor?.getAttribute('href')).toBe('https://example.com/cv');
  });

  it('keeps the address mounted while the popover is shut', () => {
    /*
     * It is the store, not the control. A node outside the tree is not
     * collected when the document saves, so closing the popover would lose the
     * address if this were rendered only while open.
     */
    const { container } = renderIn('harvard', resume(), true);
    expect(screen.queryByRole('button', { name: /edit/i })).toBeTruthy();
    expect(container.querySelector('[data-path="links.0.url"]')).toBeTruthy();
  });

  it('offers no popover in a document being read', () => {
    renderIn('harvard', resume(), false);
    expect(screen.queryByRole('button', { name: /edit/i })).toBeNull();
  });
});

/**
 * Adding a link, and adding another.
 *
 * The empty state used to mint an entry and stop there, leaving a blank word in
 * the contact line that the candidate then had to find and press a second time.
 * And once a résumé had one link there was no way to add a second at all: the
 * collection offers its control only while it is empty, and a block control
 * below a contact line is a line the preview does not have.
 */
describe('adding links', () => {
  it('leaves a blank link the candidate did not just add shut', () => {
    /*
     * The panel opens on an ACT, never on the contents. Keyed off "this link is
     * blank" it opened for every empty link in the document at every render, so
     * a résumé that had acquired a hundred of them drew a hundred panels
     * stacked over the page. `adding a link…` below covers the act itself.
     */
    renderIn('harvard', resume({ links: [{ label: '', url: '' }] }), true);
    expect(
      screen
        .getByRole('button', { name: /edit/i })
        .getAttribute('aria-expanded'),
    ).toBe('false');
    expect(document.body.querySelector('.tpl-link__pop')).toBeNull();
  });

  it('opens no panel at all for a page of blank links', () => {
    const blanks = Array.from({ length: 5 }, () => ({ label: '', url: '' }));
    renderIn('harvard', resume({ links: blanks }), true);
    expect(document.body.querySelectorAll('.tpl-link__pop')).toHaveLength(0);
  });

  it('leaves a stored link shut', () => {
    // The document opens as a document, not as a page of open popovers.
    renderIn('harvard', resume(), true);
    expect(
      screen
        .getByRole('button', { name: /edit/i })
        .getAttribute('aria-expanded'),
    ).toBe('false');
  });

  it('renders no add control of its own beside a link', async () => {
    /*
     * A `+` used to sit past the end of every link, because a collection inside
     * a line was said to have nowhere else to put one. It had: the entry
     * toolbar, which every other collection uses for add, remove and reorder —
     * unreachable on a link only because the press that would have selected it
     * was being swallowed. One link is one component; the collection owns what
     * can be done to the list of them.
     */
    const { container } = renderIn('harvard', resume(), true);
    expect(container.querySelector('.tpl-link__add')).toBeNull();

    await pressLink(container);
    await screen.findByRole('toolbar');
    expect(
      screen.getByRole('button', { name: /add a link after/i }),
      'the collection offers it, on the entry toolbar',
    ).toBeTruthy();
  });

  it('offers exactly one add control for a resume with no links', () => {
    // One button, in the one place a candidate looks for it.
    const { container } = renderIn('harvard', resume({ links: [] }), true);
    expect(
      container.querySelectorAll('.tpl-collection__add-inline'),
    ).toHaveLength(1);
  });

  it('offers no control at all in a document being read', () => {
    const { container } = renderIn('harvard', resume(), false);
    expect(container.querySelector('.tpl-collection__add-inline')).toBeNull();
    expect(screen.queryByRole('button', { name: /edit/i })).toBeNull();
  });

  it('says "Add links" where a resume has none', () => {
    const { container } = renderIn('harvard', resume({ links: [] }), true);
    const add = container.querySelector('.tpl-collection__add-inline');
    expect(add?.getAttribute('data-placeholder')).toBe('Add links');
  });
});

/**
 * Pressing the link is what opens it.
 *
 * The mechanism this replaced was a transparent button drawn across the text
 * with `position: absolute; inset: 0`, inside an inline `<span>`. jsdom has no
 * layout, so a test could click that button and prove the handler ran while
 * saying nothing about whether a real pointer could ever reach it — which is
 * the only question that mattered.
 *
 * A handler on the wrapper has no box to get wrong. These assert the parts
 * jsdom CAN see: which element carries the press, that the press is refused
 * before it reaches the text, and that presses inside the popover do not close
 * it again.
 */
describe('pressing a link opens its fields', () => {
  const linkEl = (container: HTMLElement) =>
    container.querySelector('.tpl-link') as HTMLElement;
  /*
   * Whether the popover is SHOWING, not whether its fields exist. They always
   * exist: the address is a Craft node and a node outside the tree is not
   * collected when the document saves, so closing hides it rather than
   * unmounting it.
   */
  const isOpen = (_container?: HTMLElement) =>
    document.body.querySelector('.tpl-link__pop') !== null;

  it('opens from a press on the link itself, not on a control over it', () => {
    const { container } = renderIn('harvard', resume(), true);
    expect(isOpen(container)).toBe(false);

    fireEvent.click(linkEl(container));
    expect(isOpen(container)).toBe(true);
  });

  it('refuses the press before it becomes a caret', () => {
    /*
     * `mousedown`, not `click`: by click time the browser has placed a caret in
     * the text and Craft has selected the field, so the popover would open on
     * top of something that had just become editable and the two would fight
     * over the keyboard.
     */
    const { container } = renderIn('harvard', resume(), true);
    const down = fireEvent.mouseDown(linkEl(container));
    expect(down, 'the press is cancelled').toBe(false);
  });

  it('stays open while its own fields are being used', () => {
    // The popover is inside the wrapper, so without stopping propagation every
    // press in it would bubble into the toggle and shut it.
    const { container } = renderIn('harvard', resume(), true);
    fireEvent.click(linkEl(container));
    expect(isOpen(container)).toBe(true);

    fireEvent.mouseDown(screen.getByDisplayValue('LinkedIn'));
    fireEvent.click(screen.getByDisplayValue('LinkedIn'));
    expect(isOpen(container)).toBe(true);
  });

  it('presses nothing in a document being read', () => {
    const { container } = renderIn('harvard', resume(), false);
    fireEvent.click(linkEl(container));
    expect(document.body.querySelector('.tpl-link__pop')).toBeNull();
  });
});

/**
 * The panel is drawn outside the document, and that is the fix rather than a
 * detail.
 *
 * Inside `.tpl-link` it was `position: absolute` in an INLINE span — a
 * containing block resolved from the bounding box of the inline's fragments —
 * and `paged.css` masks `.tpl-pages__flow` on a multi-page document, which
 * clips everything within it. A panel hanging below a link was therefore placed
 * against a box that may be degenerate, inside an ancestor that may cut it off
 * at a page edge. Both look identical from the outside: nothing appears.
 *
 * jsdom cannot see either hazard — no layout, no masks. What it CAN see is
 * where the element is mounted, which is the property that makes both
 * impossible.
 */
describe('the popover is drawn outside the document', () => {
  it('mounts in the body, not inside the résumé', () => {
    const { container } = renderIn('harvard', resume(), true);
    fireEvent.click(container.querySelector('.tpl-link') as HTMLElement);

    expect(document.body.querySelector('.tpl-link__pop')).toBeTruthy();
    expect(
      container.querySelector('.tpl-link__pop'),
      'inside the document it can be clipped by the page mask',
    ).toBeNull();
  });

  it('keeps the address in the document tree, where the save reads it', () => {
    /*
     * The panel travels; the NODE does not. A Craft node outside the React tree
     * is not collected when the résumé saves, and it must be mounted whether or
     * not the popover is open.
     */
    const { container } = renderIn('harvard', resume(), true);
    expect(container.querySelector('[data-path="links.0.url"]')).toBeTruthy();
    expect(document.body.querySelector('.tpl-link__pop')).toBeNull();
  });

  it('closes on a press outside both the link and the panel', () => {
    const { container } = renderIn('harvard', resume(), true);
    fireEvent.click(container.querySelector('.tpl-link') as HTMLElement);
    expect(document.body.querySelector('.tpl-link__pop')).toBeTruthy();

    // "Outside" has to mean outside BOTH, now that they are not nested.
    fireEvent.mouseDown(document.body);
    expect(document.body.querySelector('.tpl-link__pop')).toBeNull();
  });
});

/**
 * The field on the page is a way IN, not a place to type.
 *
 * A link is one thing with two parts and only one of them is on the page, so
 * the visible text is a field the candidate can SEE — the document's own
 * typography, the collection's guidance while it is blank — and cannot type
 * into. What it does instead is open the panel that holds both halves.
 *
 * Before this, one press did two things: `EditableText` selected the field and
 * turned it into a `contenteditable`, and `LinkField` opened a popover over it.
 * Two live editors for one value, and a candidate could still write a label
 * with no way to see or reach what it pointed at.
 */
describe('the link text is a field, not an input', () => {
  const linkEl = (container: HTMLElement) =>
    container.querySelector('.tpl-link') as HTMLElement;

  it('takes no caret when it is pressed', () => {
    const { container } = renderIn('harvard', resume(), true);
    fireEvent.mouseDown(linkEl(container));
    fireEvent.click(linkEl(container));

    expect(
      container.querySelector('.tpl-link .tpl-input'),
      'a caret here would fight the panel for the keyboard',
    ).toBeNull();
  });

  it('says what belongs in it while it is blank', () => {
    /*
     * A DRAWN placeholder, never a text node — the rule every field follows, so
     * that guidance cannot be exported, extracted or copied out of the résumé.
     * Three templates passed none at all and rendered an empty inline span: no
     * text, no width, and nothing on the page to press.
     */
    const { container } = renderIn(
      'harvard',
      resume({ links: [{ label: '', url: '' }] }),
      true,
    );
    const field = container.querySelector('[data-path="links.0.label"]');
    expect(field?.textContent).toBe('');
    expect(field?.getAttribute('data-empty')).toBe('true');
    expect(field?.getAttribute('data-placeholder')).toMatch(/link/i);
  });

  it.each(TEMPLATE_IDS)('%s: guides a blank link in every template', (id) => {
    const { container } = renderIn(
      id,
      resume({ links: [{ label: '', url: '' }] }),
      true,
    );
    expect(
      container
        .querySelector('[data-path="links.0.label"]')
        ?.getAttribute('data-placeholder'),
    ).toMatch(/link/i);
  });
});

/**
 * Pressing "Add links" adds a link.
 *
 * It did not. `COLLECTIONS.links.item` was the writer's `LinkSchema`, whose
 * `url` is `.min(1)`, so the blank link `mint()` produces was refused by the
 * schema every reader validates an addition against — and both readers SKIP
 * what does not parse rather than throwing, deliberately, so that an overlay
 * outliving its code cannot stop a résumé opening. The append edit was written,
 * stored, and drawn by nothing. The candidate pressed the control and the
 * document did not change.
 *
 * Every other collection already had a draft-tolerant schema for exactly this.
 * `collections.spec.ts` in `libs/core` now asserts the rule; this asserts what
 * a candidate sees.
 *
 * Drawn through a REAL overlay rather than through résumé data with a link
 * already in it, because the defect lived entirely in the round trip: the
 * fixtures above pass an array of links straight to the template and never
 * touch the schema that refused them.
 */
describe('adding a link to a resume that has none', () => {
  const { Document: Harvard } = TEMPLATE_RENDERERS.harvard;

  function Editable({ base }: { base: ResumeObject }) {
    const [edits, setEdits] = useState<ResumeEdits>([]);
    return (
      <DocumentAuthoringProvider
        value={{ base, edits, onEditsChange: setEdits }}
      >
        <DocumentPresentationProvider>
          <FieldRegistryProvider enabled>
            <Harvard resume={applyPresentation(base, edits)} />
          </FieldRegistryProvider>
        </DocumentPresentationProvider>
      </DocumentAuthoringProvider>
    );
  }

  const drawEditable = () => render(<Editable base={resume({ links: [] })} />);

  it('puts a link field in the document', async () => {
    const { container } = drawEditable();
    fireEvent.click(
      container.querySelector('.tpl-collection__add-inline') as HTMLElement,
    );

    await waitFor(() =>
      expect(
        container.querySelector('[data-path="links.0.label"]'),
        'the append was written and nothing drew it',
      ).toBeTruthy(),
    );
  });

  it('opens the two fields on the link it just made', async () => {
    const { container } = drawEditable();
    fireEvent.click(
      container.querySelector('.tpl-collection__add-inline') as HTMLElement,
    );

    // The first thing to do with a new link is say where it goes, so the panel
    // is already open rather than waiting for a second press.
    await waitFor(() =>
      expect(document.body.querySelector('.tpl-link__pop')).toBeTruthy(),
    );
    expect(screen.getByRole('button', { name: 'Ok' })).toBeTruthy();
  });

  it('keeps the link once it has been set', async () => {
    const { container } = drawEditable();
    fireEvent.click(
      container.querySelector('.tpl-collection__add-inline') as HTMLElement,
    );
    await screen.findByRole('button', { name: 'Ok' });

    const [text, address] = screen.getAllByRole('textbox');
    fireEvent.change(text as HTMLInputElement, {
      target: { value: 'GitHub' },
    });
    fireEvent.change(address as HTMLInputElement, {
      target: { value: 'https://github.com/example' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Ok' }));

    const shown = container.querySelector('[data-path="links.0.label"]');
    expect(shown?.textContent).toBe('GitHub');
    expect(shown?.querySelector('a')?.getAttribute('href')).toBe(
      'https://github.com/example',
    );
  });
});

/**
 * A link nobody wants can be got rid of.
 *
 * It could not be. An item's root carries `onClick: select(id)` — the way every
 * collection reveals the entry toolbar that holds remove and reorder — and the
 * link swallowed the press before it got there, so a link was the one entry in
 * the document that could never be selected. A control that adds without a
 * matching remove is how a résumé ends up with a contact line of empty bars.
 */
describe('a link can be selected, and so removed', () => {
  it('reveals the entry toolbar when it is pressed', async () => {
    const { container } = renderIn('harvard', resume(), true);
    await pressLink(container);

    // The panel edits the link; the toolbar acts on the entry. Neither has to
    // win — the same division a job title already makes.
    expect(await screen.findByRole('toolbar')).toBeTruthy();
    expect(document.body.querySelector('.tpl-link__pop')).toBeTruthy();
  });

  it('offers to remove it', async () => {
    const { container } = renderIn('harvard', resume(), true);
    await pressLink(container);
    await screen.findByRole('toolbar');

    expect(
      screen.getByRole('button', { name: /remove link|hide link/i }),
    ).toBeTruthy();
  });
});

/**
 * An unfilled entry is an absence in a document being READ.
 *
 * `renderText` already omits one from the text export and reports it as
 * omitted; this is the same rule for the rendered page. It matters most for a
 * collection inside a line, because a blank item is not invisible: Harvard
 * draws the separator between contact items with an adjacent-sibling
 * `::before`, so a résumé carrying blank links printed a run of bare `|` bars
 * with nothing between them — in the preview, on paper, and in the exported
 * file.
 */
describe('a blank link is nothing at all in a document being read', () => {
  const blank = () =>
    resume({
      links: [
        { label: '', url: '' },
        { label: 'LinkedIn', url: 'https://linkedin.com/in/example' },
        { label: '', url: '' },
      ],
    });

  it('draws no item for it, so no separator either', () => {
    const { container } = renderIn('harvard', blank(), false);
    const items = container.querySelectorAll('.tpl-harvard__contact-item');
    const links = [...items].filter((el) => el.querySelector('.tpl-link'));
    expect(links).toHaveLength(1);
  });

  it.each(TEMPLATE_IDS)('%s: draws only the links that say something', (id) => {
    const { container } = renderIn(id, blank(), false);
    expect(container.querySelectorAll('.tpl-link')).toHaveLength(1);
  });

  it('still draws it in the editor, where it is about to be filled in', () => {
    // Guidance for a candidate looking at an editor. Removing it there would
    // leave them a link they could neither see nor delete.
    const { container } = renderIn('harvard', blank(), true);
    expect(container.querySelectorAll('.tpl-link')).toHaveLength(3);
  });
});

/**
 * The contact line survives having links in it.
 *
 * `<div>` inside `<p>` is invalid nesting a browser resolves by CLOSING the
 * paragraph — which is why the empty state's dashed add button appeared on a
 * line of its own below the contact row rather than in it. That was fixed for
 * the add control and reintroduced from underneath by the drag layer: a
 * collection of two or more items mounts `DndContext`, which rendered a marker
 * `<div>` of its own plus two hidden `<div>`s of the library's, all as children
 * — inside the paragraph. On screen the line came apart.
 *
 * jsdom lays nothing out, so the assertion is the property rather than the
 * appearance: nothing inside the contact paragraph is a block element, in every
 * state the editor can be in.
 */
describe('nothing block-level gets into the contact line', () => {
  const threeLinks = () =>
    resume({
      links: [
        { label: 'LinkedIn', url: 'https://linkedin.com/in/example' },
        { label: 'GitHub', url: 'https://github.com/example' },
        { label: 'Site', url: 'https://example.com' },
      ],
    });

  const contactOf = (container: HTMLElement) => {
    const contact = container.querySelector('.tpl-harvard__contact');
    expect(contact, 'the contact line is rendered').toBeTruthy();
    return contact as HTMLElement;
  };

  it('with several links, which is what mounts the drag context', () => {
    const { container } = renderIn('harvard', threeLinks(), true);
    expect(contactOf(container).querySelector('div, p, ul, ol, li')).toBeNull();
  });

  it('with one of them selected, which is what draws its toolbar', async () => {
    const { container } = renderIn('harvard', threeLinks(), true);
    await pressLink(container);
    await screen.findByRole('toolbar');

    expect(contactOf(container).querySelector('div, p, ul, ol, li')).toBeNull();
  });

  it('and in a document being read', () => {
    const { container } = renderIn('harvard', threeLinks(), false);
    expect(contactOf(container).querySelector('div, p, ul, ol, li')).toBeNull();
  });
});

/**
 * The ring around a link does not reach over its neighbours.
 *
 * `[data-entry]` gives every authored item a dashed outline inset 24px each
 * side, on the stated reasoning that "sideways there is a page margin to spend
 * and nothing to collide with". True of a role; false of a link, which has the
 * phone number on its left and the next link on its right — the ring crossed
 * the separator and drew over both.
 *
 * jsdom applies no stylesheet, so the assertion is the mechanism: the item
 * names its collection's SHAPE, and `collection.css` narrows the ring for an
 * inline one. What the ring is worth in pixels is a stylesheet's business; what
 * is checkable here is that the fact reaches it at all, from the domain rather
 * than from a template's guess.
 */
describe('an inline item says it is inline', () => {
  it('marks a link with its collection shape', async () => {
    const { container } = renderIn('harvard', resume(), true);
    await waitFor(() =>
      expect(container.querySelector('[data-entry]')).not.toBeNull(),
    );
    const link = container.querySelector('.tpl-link')?.closest('[data-entry]');
    expect(link?.getAttribute('data-entry')).toBe('inline');
  });

  it('leaves a block entry saying it is one', async () => {
    // The default room is right for an entry with a page margin beside it, so
    // the narrowing must not reach it.
    const { container } = renderIn('harvard', resume(), true);
    await waitFor(() =>
      expect(container.querySelector('[data-entry]')).not.toBeNull(),
    );
    const shapes = [...container.querySelectorAll('[data-entry]')].map((el) =>
      el.getAttribute('data-entry'),
    );
    expect(shapes).toContain('entry');
  });

  it('rings the link, not the separator that divides it from its neighbour', async () => {
    /*
     * Harvard draws the bar between contact details with
     * `.tpl-harvard__contact-item + …::before`, which puts it INSIDE the item's
     * box at its leading edge. With the ring on that same element it enclosed
     * the bar and reached back over the phone number.
     *
     * jsdom has no layout, so what is checked is the containment that produces
     * it: the ringed element is a descendant of the one the separator is drawn
     * on, never the same element.
     */
    const { container } = renderIn('harvard', resume(), true);
    await waitFor(() =>
      expect(container.querySelector('[data-entry]')).not.toBeNull(),
    );
    const ringed = container
      .querySelector('.tpl-link')
      ?.closest('[data-entry]') as HTMLElement;
    expect(ringed.classList.contains('tpl-harvard__contact-item')).toBe(false);
    expect(ringed.closest('.tpl-harvard__contact-item')).toBeTruthy();
  });

  it('narrows the ring for an inline item, and only there', () => {
    const css = readFileSync(
      join(__dirname, '..', 'collections', 'collection.css'),
      'utf8',
    );
    const rule = css.slice(css.indexOf("[data-entry='inline'] {"));
    const body = rule.slice(0, rule.indexOf('}'));
    expect(body).toMatch(/--tpl-ring-room:\s*\d/);
    /* The geometry still comes from the one rule that states it: a shape may
       choose its room, never its own inset. */
    expect(body).not.toMatch(/--tpl-ring-x:/);
  });
});

/**
 * The invitation to add the first link belongs to the LINE it sits in.
 *
 * It was the one blue, underlined thing in a row of italic grey placeholders —
 * it read as a link somebody had pasted into the résumé rather than as the next
 * empty field in the row. And it carried no separator, so it sat flush against
 * the detail before it: "Phone numberAdd links".
 */
describe('the empty state reads as part of the contact line', () => {
  const read = (name: string) =>
    readFileSync(join(__dirname, '..', name), 'utf8');

  it('is drawn in the same register as the empty fields beside it', () => {
    /*
     * jsdom applies no stylesheet, so the register is asserted against the
     * source: the same two declarations `template-node.css` gives an empty
     * field, because the two are the same thing to a candidate — somewhere with
     * nothing in it yet.
     */
    const css = read('collections/collection.css');
    const rule = css.slice(css.indexOf('.tpl-collection__add-inline::after {'));
    const body = rule.slice(0, rule.indexOf('}'));
    expect(body).toMatch(/color:\s*var\(--tpl-paper-muted\)/);
    expect(body).toMatch(/font-style:\s*italic/);
    /* Not a link. The accent and the rule under it belong to the hover state,
       where the pointer has already asked what this is. */
    expect(body).not.toMatch(/--tpl-accent-ink/);
    expect(body).not.toMatch(/border-bottom/);
  });

  it('takes the separator its siblings take', () => {
    /*
     * The collection emits this control and cannot know what a template calls
     * the things in its own contact row, so the rule that OWNS the separator
     * names it rather than the collection learning a Harvard class.
     */
    const css = read('templates/harvard/harvard.css');
    expect(css).toMatch(
      /\.tpl-harvard__contact-item \+ \.tpl-collection__add-inline::before/,
    );
  });

  it('still puts no word into the résumé', () => {
    // Drawn from `data-placeholder`, never a text node — it would otherwise
    // ride along with a copy-and-paste and be read back by anything parsing it.
    const { container } = renderIn('harvard', resume({ links: [] }), true);
    const add = container.querySelector('.tpl-collection__add-inline');
    expect(add?.textContent).toBe('');
    expect(add?.getAttribute('data-placeholder')).toBe('Add links');
  });
});
