import { fireEvent, render, screen } from '@testing-library/react';
import { Editor, Element, Frame } from '@craftjs/core';
import { describe, expect, it } from 'vitest';
import type { ResumeObject, TemplateId } from '@cvgs/core';
import { TEMPLATE_RENDERERS } from '../registry.js';
import { DocumentPresentationProvider } from '../presentation-context.js';
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
  const { Document, resolver } = TEMPLATE_RENDERERS[id];
  const tree = (
    <DocumentPresentationProvider>
      <Editor resolver={resolver} enabled={editing}>
        <Frame>
          <Element is={Document} resume={data} />
        </Frame>
      </Editor>
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

  it('offers the text and the address together', () => {
    // Two places for one fact was the thing this replaced: a label on the page
    // and its address in a panel on the other side of the screen.
    openPopover(resume());
    expect(screen.getByDisplayValue('LinkedIn')).toBeTruthy();
    expect(
      screen.getByDisplayValue('https://linkedin.com/in/example'),
    ).toBeTruthy();
  });

  it('writes the text to the node the document renders', () => {
    const { container } = openPopover(resume());
    fireEvent.change(screen.getByDisplayValue('LinkedIn'), {
      target: { value: 'My profile' },
    });

    // The node in the FLOW updated, which is both what prints and what is
    // collected when the document saves.
    const shown = container.querySelector('[data-path="links.0.label"]');
    expect(shown?.textContent).toBe('My profile');
  });

  it('writes the address, and the document links to it', () => {
    const { container } = openPopover(resume());
    fireEvent.change(
      screen.getByDisplayValue('https://linkedin.com/in/example'),
      { target: { value: 'https://example.com/cv' } },
    );

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
  it('opens the two fields for a link that was just minted', () => {
    /*
     * Sound because it cannot be confused with a stored link: `LinkSchema`
     * requires a non-empty `url`, so a saved résumé never carries a blank one.
     * Only `collection.add()` produces `{ label: '', url: '' }`.
     */
    renderIn('harvard', resume({ links: [{ label: '', url: '' }] }), true);
    expect(screen.getByRole('button', { name: /edit/i })).toHaveProperty(
      'ariaExpanded',
      'true',
    );
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

  it('offers to add another once a link says something', async () => {
    renderIn('harvard', resume(), true);
    expect(
      await screen.findByRole('button', { name: /add another link/i }),
    ).toBeTruthy();
  });

  it('offers no add beside a link that is still blank', () => {
    // A row of empty links is not what pressing add was for.
    renderIn('harvard', resume({ links: [{ label: '', url: '' }] }), true);
    expect(
      screen.queryByRole('button', { name: /add another link/i }),
    ).toBeNull();
  });

  it('offers neither control in a document being read', () => {
    renderIn('harvard', resume(), false);
    expect(
      screen.queryByRole('button', { name: /add another link/i }),
    ).toBeNull();
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

  it('adds another without opening the one it was pressed from', async () => {
    const { container } = renderIn('harvard', resume(), true);
    const add = await screen.findByRole('button', {
      name: /add another link/i,
    });
    fireEvent.mouseDown(add);
    fireEvent.click(add);
    // The press belonged to the add control, not to the link under it.
    expect(isOpen(container)).toBe(false);
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
