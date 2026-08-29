import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { Editor, Element, Frame } from '@craftjs/core';
import {
  applyPresentation,
  isHideEdit,
  isReorderEdit,
  type ResumeEdits,
  type ResumeObject,
} from '@cvgs/core';
import { TEMPLATE_RENDERERS } from '../registry.js';
import { DocumentPresentationProvider } from '../presentation-context.js';
import { DocumentAuthoringProvider } from './authoring-context.js';

/**
 * The collection layer, asserted through a real document.
 *
 * Deliberately not through the hooks in isolation: the claim this change makes
 * is that a template supplies markup and gets behaviour, so the thing worth
 * checking is what a candidate can do to a rendered résumé — and that removing
 * the authoring context removes every affordance without a template opting out.
 */

function resume(overrides: Partial<ResumeObject> = {}): ResumeObject {
  return {
    name: 'Ada Lovelace',
    contact: { email: 'ada@example.com' },
    links: [],
    custom_sections: [],
    summary: 'Engineer.',
    skills: [{ category: 'Backend', items: ['Node.js'] }],
    experience: [
      {
        company: 'Acme',
        title: 'Engineer',
        start: '2022-02',
        end: 'Present',
        bullets: ['Shipped a thing.'],
        tech: [],
      },
      {
        company: 'Beta',
        title: 'Junior',
        start: '2020-01',
        end: '2022-01',
        bullets: ['Learned a thing.'],
        tech: [],
      },
    ],
    education: [{ school: 'UTESA', degree: 'BSc', field: 'Software' }],
    certifications: [],
    ...overrides,
  };
}

/** Render Harvard, optionally authorable, capturing what the overlay becomes. */
function draw(
  base: ResumeObject,
  edits: ResumeEdits | null,
  onEditsChange: (next: ResumeEdits) => void = () => undefined,
) {
  const { Document, resolver } = TEMPLATE_RENDERERS.harvard;
  const presented = edits ? applyPresentation(base, edits) : base;
  const document = (
    <DocumentPresentationProvider>
      <Editor resolver={resolver}>
        <Frame>
          <Element is={Document} resume={presented} />
        </Frame>
      </Editor>
    </DocumentPresentationProvider>
  );
  return render(
    edits === null ? (
      document
    ) : (
      <DocumentAuthoringProvider value={{ base, edits, onEditsChange }}>
        {document}
      </DocumentAuthoringProvider>
    ),
  );
}

describe('a document that is only being read', () => {
  it('offers no control at all', () => {
    draw(resume(), null);
    expect(screen.queryByRole('button', { name: /add a role/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /hide role/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /move role/i })).toBeNull();
  });

  it('draws the same entries as an authorable one', () => {
    const { container: read } = draw(resume(), null);
    const { container: write } = draw(resume(), []);
    expect(read.querySelectorAll('.tpl-harvard__entry')).toHaveLength(
      write.querySelectorAll('.tpl-harvard__entry').length,
    );
  });
});

/**
 * Render an authorable document and select the entry under test.
 *
 * Two waits, and both are what a candidate experiences. The controls are behind
 * a dynamic import, so the entries appear before the editing chunk does; and the
 * overlay belongs to the SELECTED entry, so nothing offers an action until
 * something has been clicked.
 */
async function drawAuthored(
  base: ResumeObject,
  edits: ResumeEdits,
  onEditsChange: (next: ResumeEdits) => void = () => undefined,
  select = 0,
) {
  const result = draw(base, edits, onEditsChange);
  /* The document root is an <article> too, so entries are found by the marker
     every authored item carries rather than by their tag. */
  await waitFor(() =>
    expect(result.container.querySelector('[data-entry]')).not.toBeNull(),
  );
  const entry = result.container.querySelectorAll('[data-entry]')[select];
  if (entry) fireEvent.click(entry);
  await screen.findByRole('toolbar');
  return result;
}

describe('what a candidate may do to a collection', () => {
  it('names the region and offers its actions when it is selected', async () => {
    await drawAuthored(resume(), []);
    const bar = screen.getByRole('toolbar');
    /* The label says WHAT was clicked, which is half of what the overlay is for. */
    expect(bar.getAttribute('aria-label')).toBe('Role 1 — editing actions');
    expect(
      within(bar).getByRole('button', { name: 'Add a role after 1' }),
    ).toBeTruthy();
    expect(
      within(bar).getByRole('button', { name: 'Move role 1 down' }),
    ).toBeTruthy();
    expect(
      within(bar).getByRole('button', { name: 'Hide role 1' }),
    ).toBeTruthy();
  });

  it('shows the actions for ONE region at a time', async () => {
    const { container } = await drawAuthored(resume(), []);
    expect(screen.getAllByRole('toolbar')).toHaveLength(1);
    /* Selecting a qualification puts the role's overlay away. */
    fireEvent.click(container.querySelectorAll('[data-entry]')[2]!);
    const bars = screen.getAllByRole('toolbar');
    expect(bars).toHaveLength(1);
    expect(bars[0]?.getAttribute('aria-label')).toBe(
      'Qualification 1 — editing actions',
    );
  });

  it('outlines every entry at rest, so the document reads as editable', async () => {
    const { container } = await drawAuthored(resume(), []);
    /* Two roles, one qualification, one skills group — every repeatable thing
       on the page is outlined, and exactly one of them is selected. */
    expect(container.querySelectorAll('[data-entry]')).toHaveLength(4);
    expect(
      container.querySelectorAll('[data-entry][data-selected]'),
    ).toHaveLength(1);
  });

  it('offers to start a section that has nothing in it yet', async () => {
    await drawAuthored(resume({ skills: [] }), []);
    expect(
      screen.getByRole('button', { name: /add skills group/i }),
    ).toBeTruthy();
  });

  it('offers NO add for the professional summary', async () => {
    /* Not because Harvard omits one — because the summary's arity is `one`. */
    await drawAuthored(resume(), []);
    expect(screen.queryByRole('button', { name: /add a summary/i })).toBeNull();
  });

  it('adds an entry as an addition, in place', async () => {
    let next: ResumeEdits = [];
    await drawAuthored(resume(), [], (e) => (next = e));

    fireEvent.click(screen.getByRole('button', { name: 'Add a role after 1' }));

    const append = next.find((e) => e.kind === 'append');
    expect(append).toMatchObject({
      section: 'experience',
      author: 'candidate',
    });
    // Minted empty: what a new entry carries is guidance, never content.
    expect(JSON.stringify((append as { entry: unknown }).entry)).not.toMatch(
      /Organisation|Role/,
    );
    // And placed where it was asked for, which needs the ordering in the same step.
    const order = next.find(isReorderEdit);
    expect(order?.order[1]).toHaveProperty('ref');
  });

  it('HIDES a writer-produced entry rather than deleting it', async () => {
    let next: ResumeEdits = [];
    const base = resume();
    await drawAuthored(base, [], (e) => (next = e));

    fireEvent.click(screen.getByRole('button', { name: 'Hide role 1' }));

    expect(next.filter(isHideEdit)).toEqual([
      { kind: 'hide', section: 'experience', base: 0 },
    ]);
    // The writer's own résumé is untouched, which is what the score is derived from.
    expect(base.experience).toHaveLength(2);
    expect(applyPresentation(base, next).experience).toHaveLength(1);
  });

  it('reorders without touching the text overlay', async () => {
    let next: ResumeEdits = [];
    const base = resume();
    const typed: ResumeEdits = [
      { kind: 'set', path: 'experience.1.title', value: 'Principal' },
    ];
    await drawAuthored(base, typed, (e) => (next = e), 1);

    fireEvent.click(screen.getByRole('button', { name: 'Move role 2 up' }));

    expect(next.filter((e) => e.kind === 'set')).toEqual(typed);
    const out = applyPresentation(base, next).experience;
    expect(out.map((r) => r.company)).toEqual(['Beta', 'Acme']);
    expect(out[0]?.title).toBe('Principal');
  });

  it('refuses to move past the ends, visibly rather than silently', async () => {
    await drawAuthored(resume(), []);
    expect(
      screen.getByRole('button', { name: 'Move role 1 up' }),
    ).toHaveProperty('disabled', true);
  });
});

describe('selecting a region does not move the document', () => {
  it('leaves every block exactly where it was', async () => {
    /*
     * The claim the whole affordance rests on. An outline takes no space and an
     * absolutely positioned bar takes none either — so the page breaks in the
     * same place selected or not, which is what lets the export render against
     * what the candidate saw.
     */
    const { container } = draw(resume(), []);
    await waitFor(() =>
      expect(container.querySelector('[data-entry]')).not.toBeNull(),
    );
    const before = [...container.querySelectorAll('[data-block]')].map(
      (el) => el.className,
    );

    fireEvent.click(container.querySelectorAll('[data-entry]')[0]!);
    await screen.findByRole('toolbar');

    const after = [...container.querySelectorAll('[data-block]')].map(
      (el) => el.className,
    );
    expect(after).toEqual(before);
  });

  it('puts the actions away on Escape', async () => {
    await drawAuthored(resume(), []);
    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('toolbar')).toBeNull());
  });
});

describe('the read-only path carries no editor', () => {
  it('reaches the drag-and-drop library only through a dynamic import', () => {
    /*
     * The requirement is about the BUNDLE, not the render: a component that is
     * never rendered still ships if it is imported at the top of a file the
     * read-only document reaches. So the check is on the import graph.
     */
    const dir = join(__dirname);
    for (const file of readdirSync(dir).filter(
      (f) => f.endsWith('.tsx') || f.endsWith('.ts'),
    )) {
      if (file.endsWith('.spec.tsx')) continue;
      // The two modules that ARE the editing layer are allowed to import it.
      if (file === 'SortableItems.tsx' || file === 'AuthoredItems.tsx')
        continue;
      const source = readFileSync(join(dir, file), 'utf8');
      expect(source, `${file} imports the drag library`).not.toMatch(
        /from '@dnd-kit/,
      );
      expect(
        source,
        `${file} imports the editing layer statically`,
      ).not.toMatch(/^import .*from '\.\/(SortableItems|AuthoredItems)\.js'/m);
    }
  });

  it('renders a readable document with the editing chunk absent', () => {
    /*
     * The read-only render never suspends, so a document is on screen without
     * the editing chunk ever being requested.
     */
    const { container } = draw(resume(), null);
    expect(container.querySelectorAll('.tpl-harvard__entry')).toHaveLength(3);
    expect(container.querySelector('.tpl-entry-overlay')).toBeNull();
    /* And no region marker either — a résumé nobody can edit shows no regions. */
    expect(container.querySelector('[data-entry]')).toBeNull();
  });
});

describe('a bullet', () => {
  /** Select the first entry, then wait for the bullet layer under it. */
  async function drawBullets() {
    const result = await drawAuthored(resume(), []);
    await waitFor(() =>
      expect(result.container.querySelector('.tpl-bullet__grip')).not.toBeNull(),
    );
    return result;
  }

  it('offers the handle where the marker stands', async () => {
    const { container } = await drawBullets();
    const bullet = container.querySelector('.tpl-bullet[data-authored]');
    const grip = bullet?.querySelector('.tpl-bullet__grip');
    /*
     * The grip is the FIRST child, so it lands in the marker's own column, and
     * the marker is a `::before` the stylesheet hides on hover — the row never
     * grows and nothing to the right of it moves.
     */
    expect(bullet?.firstElementChild).toBe(grip);
    expect(grip?.getAttribute('aria-label')).toBe('Move bullet 1');
  });

  it('offers add and remove on the bullet itself', async () => {
    const { container } = await drawBullets();
    /* Scoped to one role: the fixture has two, and each has its own bullet 1. */
    const role = within(container.querySelector('[data-entry]') as HTMLElement);
    expect(
      role.getByRole('button', { name: 'Add a bullet after 1' }),
    ).toBeTruthy();
    expect(role.getByRole('button', { name: 'Remove bullet 1' })).toBeTruthy();
  });

  it('keeps the controls out of the flow, so hovering moves nothing', async () => {
    const { container } = await drawBullets();
    const css = readFileSync(
      join(__dirname, '..', 'nodes', 'template-node.css'),
      'utf8',
    );
    /* Both clusters are absolutely positioned and hidden by visibility, which
       keeps their boxes — and their tab stops — without taking flow space. */
    for (const rule of ['.tpl-bullet__grip {', '.tpl-bullet__tools {']) {
      const block = css.slice(css.indexOf(rule));
      const body = block.slice(0, block.indexOf('}'));
      expect(body, rule).toMatch(/position:\s*absolute/);
      expect(body, rule).toMatch(/visibility:\s*hidden/);
    }
    /* One bullet per role in the fixture, and both rows drawn the same way. */
    expect(container.querySelectorAll('.tpl-bullet')).toHaveLength(2);
  });

  it('refuses to remove the last one, and says why', async () => {
    const { container } = await drawBullets();
    const role = within(container.querySelector('[data-entry]') as HTMLElement);
    const remove = role.getByRole('button', { name: 'Remove bullet 1' });
    expect(remove).toHaveProperty('disabled', true);
    expect(remove.getAttribute('title')).toMatch(/at least one bullet/i);
  });

  it('shows none of it on a document that is only being read', () => {
    const { container } = draw(resume(), null);
    expect(container.querySelector('.tpl-bullet__grip')).toBeNull();
    expect(container.querySelector('.tpl-bullet__tools')).toBeNull();
    expect(container.querySelectorAll('.tpl-bullet')).toHaveLength(2);
  });
});

describe('the chrome is chrome', () => {
  it('is asserted absent from print', () => {
    const css = readFileSync(join(__dirname, 'collection.css'), 'utf8');
    const print = css.slice(css.indexOf('@media print'));
    expect(print).toMatch(/\.tpl-entry-overlay/);
    expect(print).toMatch(/\.tpl-collection__add/);
    expect(print).toMatch(/display:\s*none/);
    /* The outline goes too — an entry on paper is an entry, not a region. */
    expect(print).toMatch(/\[data-entry\]/);
    expect(print).toMatch(/outline:\s*none/);
  });

  it('adds no element of its own to the document', async () => {
    /*
     * The controls go INSIDE the template's own element rather than into a
     * wrapper around it, so a stylesheet written against a section's direct
     * children keeps matching and the paginator keeps measuring the same blocks.
     */
    const { container } = await drawAuthored(resume(), []);
    /* Two roles and one qualification — Harvard draws all three as entries. */
    const entries = container.querySelectorAll('.tpl-harvard__entry');
    expect(entries).toHaveLength(3);
    for (const entry of entries) {
      expect(entry.parentElement?.className).toContain('tpl-harvard__section');
    }
    /* And the overlay sits INSIDE the entry it acts on, not in a wrapper. */
    const selected = container.querySelector('[data-selected]');
    expect(selected?.querySelector('.tpl-entry-overlay')).not.toBeNull();
  });

  it('is drawn against the entry, and no template has to know that', () => {
    /*
     * The overlay is absolutely positioned, so an entry that is not a
     * containing block would throw it to the corner of the page. Stated ONCE,
     * against the marker every authored item carries — a new template cannot
     * forget a rule it never had to write.
     */
    const css = readFileSync(join(__dirname, 'collection.css'), 'utf8');
    const rule = css.slice(css.indexOf('[data-entry] {'));
    expect(rule.slice(0, rule.indexOf('}'))).toMatch(/position:\s*relative/);
  });
});
