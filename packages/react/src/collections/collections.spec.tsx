import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { FieldRegistryProvider } from '../fields/field-registry.js';
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
import {
  DocumentAutosaveProvider,
  type AutosaveContextValue,
} from '../autosave-context.js';

/**
 * The collection layer, asserted through a real document.
 *
 * Deliberately not through the hooks in isolation: the claim this change makes
 * is that a template supplies markup and gets behaviour, so the thing worth
 * checking is what a candidate can do to a rendered résumé — and that removing
 * the authoring context removes every affordance without a template opting out.
 */

/*
 * Load the editing layer before any test needs it.
 *
 * The controls are behind a dynamic import — `template-rendering` requires the
 * read-only document not to carry them — and a `React.lazy` boundary resolves on
 * whatever schedule the module loader gives it. Under a full parallel run that
 * was slower than the waits below allowed, so the suite failed on machine load
 * rather than on anything about the code. Importing here puts the module in the
 * cache, and every `lazy` after it settles on the next microtask.
 */
beforeAll(async () => {
  await import('./AuthoredItems.js');
  await import('../nodes/AuthoredBullets.js');
});

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

/**
 * A surface that records what the document asked it to store.
 *
 * The order and the URGENCY are both the assertion: which of the two verbs a
 * component reaches for is the whole of what it decides about saving.
 */
function recorder() {
  const asked: ('now' | 'soon')[] = [];
  const autosave: AutosaveContextValue = {
    saveNow: () => asked.push('now'),
    saveSoon: () => asked.push('soon'),
  };
  return { asked, autosave };
}

/** Render Harvard, optionally authorable, capturing what the overlay becomes. */
function draw(
  base: ResumeObject,
  edits: ResumeEdits | null,
  onEditsChange: (next: ResumeEdits) => void = () => undefined,
  autosave?: AutosaveContextValue,
) {
  const { Document } = TEMPLATE_RENDERERS.harvard;
  const presented = edits ? applyPresentation(base, edits) : base;
  const inner = (
    <DocumentPresentationProvider>
      <FieldRegistryProvider enabled>
        <Document resume={presented} />
      </FieldRegistryProvider>
    </DocumentPresentationProvider>
  );
  const document = autosave ? (
    <DocumentAutosaveProvider value={autosave}>
      {inner}
    </DocumentAutosaveProvider>
  ) : (
    inner
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
  autosave?: AutosaveContextValue,
) {
  const result = draw(base, edits, onEditsChange, autosave);
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
    /*
     * The label says WHERE and WHAT was clicked, which is half of what the
     * overlay is for: a candidate with six sections and eleven bullets needs to
     * know which document they are in before which item.
     */
    expect(bar.getAttribute('aria-label')).toBe(
      'Experience · Role 1 — editing actions',
    );
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
      'Education · Qualification 1 — editing actions',
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
      expect(
        result.container.querySelector('.tpl-bullet__grip'),
      ).not.toBeNull(),
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

      /*
       * Hidden by OPACITY, not by `visibility`.
       *
       * A `visibility: hidden` control is out of the tab order, and these are
       * the only way to reorder or remove a bullet without a pointer. Paired
       * with `pointer-events: none` so an invisible control cannot swallow a
       * click aimed at the text it floats over.
       */
      expect(body, `${rule} is hidden out of the tab order`).toMatch(
        /opacity:\s*0/,
      );
      expect(body, `${rule} is invisible but still clickable`).toMatch(
        /pointer-events:\s*none/,
      );

      /*
       * And ON the paper, not beside it.
       *
       * `left: 100%` put the controls in the page's right margin, which is
       * outside the sheet: on a narrow canvas the pill was clipped by the
       * viewport and could not be clicked at all. Anything a candidate has to
       * reach has to be within the page's own box.
       */
      /* Line-anchored: `margin-left: -2px` nudges within the box and is fine. */
      expect(body, `${rule} is positioned outside the page`).not.toMatch(
        /^\s*(left|right):\s*(100%|-)/m,
      );
    }
    /* One bullet per role in the fixture, and both rows drawn the same way. */
    expect(container.querySelectorAll('.tpl-bullet')).toHaveLength(2);
  });

  it('gets out of the way while the sentence is being edited', () => {
    /*
     * Typing is the one moment a candidate is reading their own words closely,
     * and a handle plus two buttons beside the line are three things competing
     * with it. So the controls answer the POINTER, and focus only where focus
     * has landed on a control itself — never where it has landed in the text.
     */
    const css = readFileSync(
      join(__dirname, '..', 'nodes', 'template-node.css'),
      'utf8',
    );
    const reveals = css
      .split('}')
      .filter((rule) => /opacity:\s*1/.test(rule.slice(rule.indexOf('{'))))
      .map((rule) => rule.slice(0, rule.indexOf('{')));

    expect(reveals.length).toBeGreaterThan(0);
    for (const selector of reveals) {
      /*
       * Hover alone is not enough, and that is the whole point: clicking into a
       * bullet leaves the pointer on the row it just opened, so a bare `:hover`
       * kept the controls up for exactly the moment they were meant to leave.
       * A hover reveal must therefore exclude the field having focus.
       */
      if (/:hover/.test(selector)) {
        expect(
          selector,
          `a control is revealed by hovering while editing: ${selector.trim()}`,
        ).toMatch(/:not\(:has\(\.tpl-input:focus\)\)/);
      }
      expect(
        selector,
        `a control is revealed by editing: ${selector.trim()}`,
      ).not.toMatch(/\.tpl-bullet:focus-within/);
    }
  });

  it('stands where the bullet marker stands', () => {
    /*
     * Centred in the marker column, whose width only the template knows — so
     * the shared stylesheet reads it and each template states it beside the
     * `grid-template-columns` that decides it. A template that added a bullet
     * list without stating one would put the handle at a guessed width, which
     * is what the fallback makes survivable and this makes visible.
     */
    const css = readFileSync(
      join(__dirname, '..', 'nodes', 'template-node.css'),
      'utf8',
    );
    const grip = css.slice(css.indexOf('.tpl-bullet__grip {'));
    /*
     * Positioned FROM the marker column rather than stretched across it: the
     * handle is larger than the tightest template's gutter, so it is centred on
     * that column's midpoint and allowed to overhang. Reading the width is
     * still the point — a template that added a bullet list without stating one
     * would put the handle at a guessed offset.
     */
    expect(grip.slice(0, grip.indexOf('}'))).toMatch(/var\(--tpl-marker/);

    const dir = join(__dirname, '..', 'templates');
    for (const template of readdirSync(dir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)) {
      const file = readdirSync(join(dir, template)).find((f) =>
        f.endsWith('.css'),
      );
      expect(
        readFileSync(join(dir, template, file!), 'utf8'),
        `${template} states its marker column`,
      ).toMatch(/--tpl-marker:/);
    }
  });

  it('arrives softly, and not at all for a reader who asked for stillness', () => {
    const css = readFileSync(
      join(__dirname, '..', 'nodes', 'template-node.css'),
      'utf8',
    );

    for (const rule of ['.tpl-bullet__grip {', '.tpl-bullet__tools {']) {
      const block = css.slice(css.indexOf(rule));
      const body = block.slice(0, block.indexOf('}'));
      /*
       * Both ends of the row on ONE duration token. They answer the same
       * question inches apart, and a handle that faded in faster than the
       * buttons beside it would read as two things reacting rather than as the
       * row waking up.
       */
      expect(body, `${rule} eases its reveal`).toMatch(
        /transition:[^;]*opacity var\(--tpl-reveal-ms\)/,
      );
      expect(body, `${rule} eases its arrival`).toMatch(
        /transition:[^;]*transform var\(--tpl-reveal-ms\)/,
      );
    }

    /* Declared once, where the rest of the document's design tokens live. */
    expect(readFileSync(join(__dirname, '..', 'document.css'), 'utf8')).toMatch(
      /--tpl-reveal-ms:/,
    );

    /*
     * And the marker fades on the same token: it is being REPLACED by the
     * handle, so cutting it instantly would leave the gutter empty for the
     * length of the fade — which reads as a flicker, not as a swap.
     */
    const marker = css.slice(css.indexOf('.tpl-bullet[data-authored]::before'));
    expect(marker.slice(0, marker.indexOf('}'))).toMatch(
      /transition:\s*opacity var\(--tpl-reveal-ms\)/,
    );

    /*
     * Motion is the part a reduced-motion reader opted out of — the controls
     * themselves are not, since the handle is the only way to reorder a bullet
     * without a pointer.
     */
    const start = css.lastIndexOf('@media (prefers-reduced-motion');
    const reduced = css.slice(start, css.indexOf('@media print', start));
    for (const selector of ['.tpl-bullet__grip', '.tpl-bullet__tools']) {
      expect(reduced, `${selector} stops moving`).toContain(selector);
    }
    expect(reduced).toMatch(/transition:\s*none/);
    expect(reduced, 'the controls are not withdrawn').not.toMatch(
      /opacity:\s*0|display:\s*none/,
    );
  });

  it('draws the handle rather than typing it, so centring it works', async () => {
    const { container } = await drawBullets();
    const grip = container.querySelector('.tpl-bullet__grip');

    /*
     * The handle was `⠿`, and a braille cell is the one glyph here that centring
     * its box cannot centre: it comes from a platform fallback font, with its
     * own advance and its own bearings, and its dots sit high and left inside
     * them. Drawn on a symmetric viewBox, the box's centre and the ink's centre
     * are the same point — which is the whole reason the rule below works.
     */
    expect(grip?.textContent).toBe('');
    const dots = grip?.querySelectorAll('svg circle') ?? [];
    expect(dots).toHaveLength(6);

    const xs = [...dots].map((d) => Number(d.getAttribute('cx')));
    const ys = [...dots].map((d) => Number(d.getAttribute('cy')));
    /* Symmetric about the centre of the 16-unit viewBox, on both axes. */
    expect(Math.min(...xs) + Math.max(...xs)).toBe(16);
    expect(Math.min(...ys) + Math.max(...ys)).toBe(16);

    const css = readFileSync(
      join(__dirname, '..', 'nodes', 'template-node.css'),
      'utf8',
    );
    const rule = css.slice(css.indexOf('.tpl-bullet__grip svg {'));
    expect(rule.slice(0, rule.indexOf('}'))).toMatch(/fill:\s*currentcolor/);
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
  it('says which section it is acting in, not only which item', () => {
    /*
     * "Role 1" is ambiguous on a résumé with a Role 1 under Experience and a
     * Qualification 1 under Education — and it is the same ambiguity a
     * screen-reader user hits, which is why it is asserted on the label rather
     * than on what is drawn.
     */
    const dir = join(__dirname, '..', '..', '..', 'core', 'src', 'lib');
    const table = readFileSync(join(dir, 'collections.ts'), 'utf8');
    for (const id of ['experience', 'education', 'skills']) {
      const entry = table.slice(table.indexOf(`\n  ${id}: {`));
      expect(entry.slice(0, entry.indexOf('},')), id).toMatch(/label: '/);
    }
  });

  it('is asserted absent from print', () => {
    const css = readFileSync(join(__dirname, 'collection.css'), 'utf8');
    const print = css.slice(css.indexOf('@media print'));
    expect(print).toMatch(/\.tpl-entry-overlay/);
    expect(print).toMatch(/\.tpl-collection__add/);
    expect(print).toMatch(/display:\s*none/);
    /* The ring goes too — an entry on paper is an entry, not a region. */
    expect(print).toMatch(/\[data-entry\]::after/);
    expect(print).toMatch(/display:\s*none/);
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

  /**
   * Every rule in `collection.css` that SETS the ring's width, by its selector.
   *
   * Declarations only — the `::after` that draws the ring and the overlay that
   * hangs off it both read `var(--tpl-ring-x)`, and neither of them decides
   * anything.
   */
  function ringRules() {
    const css = readFileSync(join(__dirname, 'collection.css'), 'utf8');
    return [...css.matchAll(/([^{}]+)\{([^}]*)\}/g)]
      .filter(([, , body]) => /--tpl-ring-x:/.test(body ?? ''))
      .map(([, selector, body]) => ({
        // The capture runs back to the previous rule, so it carries whatever
        // comment introduced this one.
        selector: (selector ?? '').replace(/\/\*[\s\S]*?\*\//g, '').trim(),
        body: body ?? '',
      }));
  }

  it('never changes size, so nothing moves under the pointer', () => {
    /*
     * The ring opened as a candidate engaged with a region — close at rest,
     * wider on hover, wider still on click — and both halves of that were
     * wrong. The click moved the region at the moment of committing to it, so
     * the thing being aimed at shifted under the cursor; and once the sizes
     * were worth having, a ring that inflated as the pointer crossed the page
     * read as the document breathing at you.
     *
     * Engagement is carried by WEIGHT now — the dashes darken, then close into
     * a line with a shadow under them. What is asserted is that there is
     * nowhere for a second size to come back from: exactly one rule states the
     * geometry, and no state rule may state one of its own.
     */
    const sized = ringRules();
    expect(sized).toHaveLength(1);
    expect(sized[0]?.selector).toBe('[data-entry]');

    /*
     * And the ring never animates a dimension. A transition on `inset` is the
     * shape the resizing version took, and it would be the first thing added
     * back by someone reintroducing it.
     */
    const css = readFileSync(join(__dirname, 'collection.css'), 'utf8');
    const after = css.slice(css.indexOf('[data-entry]::after {'));
    const body = after.slice(0, after.indexOf('}'));
    const transition = /transition:([^;]*);/.exec(body)?.[1] ?? '';
    for (const property of [
      'inset',
      'top',
      'right',
      'bottom',
      'left',
      'width',
      'height',
    ]) {
      expect(
        transition,
        `the ring animates ${property}, so it changes size somewhere`,
      ).not.toMatch(new RegExp(`\\b${property}\\b`));
    }
  });

  it('is close enough top and bottom that eight of them fit down a page', () => {
    /*
     * Every entry wears this ring at once, so its VERTICAL reach has to fit the
     * tightest spacing any template puts between two entries — Harvard's 7pt,
     * about 9.3px. Two rings meet in the middle, so each may have less than
     * half, or a résumé at rest is a stack of touching boxes. Sideways there is
     * a page margin to spend, which is why the box is much wider than it is
     * tall.
     */
    const rest = ringRules()[0]?.body ?? '';
    const y = Number(/--tpl-ring-y:\s*(\d+)px/.exec(rest)?.[1]);
    expect(y * 2).toBeLessThan(7 * 1.333);
  });

  it('lets a template say how much room it has beside an entry', () => {
    /*
     * The ring opens SIDEWAYS, and what is beside an entry is not the same in
     * every layout: Harvard has half an inch of paper margin, Meridian has a
     * 22pt gutter with the aside's rule down the far side of it — under 25px at
     * the smallest scale, where a selected region's edge would land on top of
     * the divider.
     *
     * So the width is one variable and the states are MULTIPLES of it. That is
     * what makes the override safe: a template narrows the room and every state
     * narrows with it, where three separate figures could be narrowed two at a
     * time and leave the third overhanging.
     */
    for (const { selector, body } of ringRules()) {
      expect(
        body,
        `${selector} sets its width without --tpl-ring-room`,
      ).toMatch(/--tpl-ring-x:[^;]*var\(--tpl-ring-room\)/);
    }

    /*
     * And the templates that cannot afford the default say so, each for its own
     * reason: Meridian's main column ends at the aside's rule, Cobalt has
     * entries facing each other across a gutter, Executive has the narrowest
     * paper margin of the four. Harvard is the one with room to spare, and is
     * what the default is sized for.
     */
    for (const template of ['meridian', 'cobalt', 'executive']) {
      const sheet = readFileSync(
        join(__dirname, '..', 'templates', template, `${template}.css`),
        'utf8',
      );
      expect(sheet, `${template} takes the default ring width`).toMatch(
        /--tpl-ring-room:/,
      );
    }
  });

  it('hangs the overlay off the ring rather than off its own numbers', () => {
    /*
     * The bar sits on the ring's top-left corner. It used to say `-10px`
     * because the ring did, which meant the two agreed only for as long as
     * nobody touched either — and the ring now MOVES between states, so a
     * literal here would leave the bar stranded inside an opened ring.
     */
    const css = readFileSync(join(__dirname, 'collection.css'), 'utf8');
    const rule = css.slice(css.indexOf('.tpl-entry-overlay {'));
    const body = rule.slice(0, rule.indexOf('}'));
    expect(body).toMatch(/bottom:[^;]*--tpl-ring-y/);
    expect(body).toMatch(/left:[^;]*--tpl-ring-x/);
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

describe('the editing palette follows the app', () => {
  const stylesheets = [
    join(__dirname, 'collection.css'),
    join(__dirname, '..', 'nodes', 'template-node.css'),
  ];

  it('states no colour of its own', () => {
    /*
     * The check that keeps a rebrand to one file. Every accent in the editing
     * chrome has to resolve from `--color-accent`, so a literal here is a value
     * that would survive changing the brand — and be found months later, wrong.
     *
     * Neutrals are exempt: black at 5% is a shadow, not a colour, and a shadow
     * that took the brand hue would tint the paper it falls on. The paper's own
     * fixed inks are named in `document.css` — including the one colour that
     * deliberately does not follow the theme.
     */
    for (const file of stylesheets) {
      const source = readFileSync(file, 'utf8');
      const literals = source
        .split('\n')
        .filter((line) => !line.trim().startsWith('*'))
        .filter((line) => /#[0-9a-f]{3,8}\b|oklch\(|\brgb\(\s*\d/i.test(line))
        .filter((line) => !line.includes('--tpl-chrome-line'))
        .filter((line) => !/#fff\b|#ffffff\b/i.test(line));
      expect(literals, `${file} states a colour of its own`).toEqual([]);
    }
  });

  it('derives every step from the one token', () => {
    const source = readFileSync(join(__dirname, '..', 'document.css'), 'utf8');
    // The brand comes in exactly once, with a fallback for surfaces that carry
    // no token layer — the export renderer among them.
    expect(source).toMatch(/--tpl-accent:\s*var\(--color-accent,/);
    // And the alphas are mixed from it rather than restated.
    expect(
      source.match(/color-mix\(in oklab, var\(--tpl-accent\)/g)?.length,
    ).toBeGreaterThan(4);
  });
});

describe('one edge on the page, and it is the outer one', () => {
  /*
   * The screenshot that prompted this had four rectangles at once: the hovered
   * field's ring, the bullet list's ring, a tinted band on every field in the
   * entry, and the entry's own ring outside all of them. The line the caret was
   * in was the hardest of the four to find.
   *
   * Asserted on the stylesheets rather than on a render, because what matters
   * is that the rules do not EXIST — a rule that draws an inner edge under some
   * state a test did not think to enter is the same defect.
   */
  const inner = readFileSync(
    join(__dirname, '..', 'nodes', 'template-node.css'),
    'utf8',
  );

  it('draws no ring around a field', () => {
    /* A hover or focus treatment may fill and may bar; it may not box. */
    const rules = inner.split('}').filter((r) => /\.tpl-text[:[]/.test(r));
    expect(rules.length).toBeGreaterThan(0);
    for (const rule of rules) {
      const body = rule.slice(rule.indexOf('{'));
      // An INSET shadow is the left accent bar and is allowed; an outset one is
      // a ring around four sides and is not.
      const shadows = (body.match(/box-shadow:[^;]*/g) ?? []).filter(
        // `none` is the print reset taking a shadow away, not drawing one.
        (shadow) => !/:\s*none/.test(shadow),
      );
      for (const shadow of shadows) {
        expect(shadow, `a field is boxed by: ${shadow}`).toMatch(/inset/);
      }
      expect(body, `a field is bordered by: ${rule}`).not.toMatch(
        /^\s*border:|border-width:/m,
      );
    }
  });

  it('draws no ring around the bullet list', () => {
    expect(inner).not.toMatch(/\.tpl-bullets\[data-editing\]/);
  });

  it('keeps the region ring while a field inside it has focus', () => {
    const outer = readFileSync(join(__dirname, 'collection.css'), 'utf8');
    // Nothing may switch the ring off for the state the candidate is in most.
    expect(outer).not.toMatch(/\[data-entry\][^{]*:focus-within[^{]*::after/);
  });
});

/**
 * How a document stores itself, now that nothing asks a candidate to.
 *
 * There is no save control anywhere in the product any more, so the question
 * "was my work kept" is answered entirely by these calls. Which verb a
 * component reaches for is its own decision and the only one it makes — the
 * host owns what each verb costs — so that decision is what is asserted here,
 * rather than any request reaching any server.
 */
describe('a collection stores itself', () => {
  it('asks immediately when an entry is added', async () => {
    const { asked, autosave } = recorder();
    await drawAuthored(resume(), [], () => undefined, 0, autosave);

    fireEvent.click(screen.getByRole('button', { name: 'Add a role after 1' }));
    // `now`, not `soon`: an added role is finished the instant it exists, and
    // waiting on it would only mean looking at an unsaved document.
    expect(asked).toEqual(['now']);
  });

  it('asks immediately when an entry is removed', async () => {
    const { asked, autosave } = recorder();
    await drawAuthored(resume(), [], () => undefined, 0, autosave);

    fireEvent.click(screen.getByRole('button', { name: 'Hide role 1' }));
    expect(asked).toEqual(['now']);
  });

  it('asks immediately when an entry is moved', async () => {
    const { asked, autosave } = recorder();
    await drawAuthored(resume(), [], () => undefined, 0, autosave);

    fireEvent.click(screen.getByRole('button', { name: 'Move role 1 down' }));
    expect(asked).toEqual(['now']);
  });

  it('asks for nothing when the rules refuse the removal', async () => {
    /*
     * A bullet list at its minimum. The refusal is stated on the control rather
     * than hiding it — #29's rule — so the control is there to be pressed, and
     * pressing it must store nothing: a document the candidate was told they
     * could not change, written every time they press the control to find out
     * why, is the worst of both.
     */
    const { asked, autosave } = recorder();
    const { container } = await drawAuthored(
      resume(),
      [],
      () => undefined,
      0,
      autosave,
    );
    await waitFor(() =>
      expect(container.querySelector('.tpl-bullet__grip')).not.toBeNull(),
    );
    const role = within(container.querySelector('[data-entry]') as HTMLElement);

    const remove = role.getByRole('button', { name: 'Remove bullet 1' });
    expect(remove).toHaveProperty('disabled', true);
    fireEvent.click(remove);
    expect(asked).toEqual([]);
  });

  it('opens a line as an editable span, and stores what is typed into it', async () => {
    /*
     * The whole path, through a real document: select a field, type, and see
     * the value reach the overlay. Worth doing end to end because the field is
     * a `contenteditable` — it has no `value`, it is written to once and read
     * back from the DOM, and every one of those is a place the wiring can be
     * right in the source and wrong in the tree.
     */
    const { asked, autosave } = recorder();
    const seen: ResumeEdits[] = [];
    await drawAuthored(resume(), [], (next) => seen.push(next), 0, autosave);

    const field = await waitFor(() => {
      fireEvent.mouseDown(screen.getByText('Engineer', { selector: '*' }));
      return screen.getByLabelText('experience.0.title');
    });

    // An editable span, not a control: only a span can break across lines
    // where the static text did.
    expect(field.tagName).toBe('SPAN');
    expect(field.getAttribute('contenteditable')).toBe('plaintext-only');
    expect(field.textContent).toBe('Engineer');

    field.textContent = 'Staff Engineer';
    fireEvent.input(field);

    // Typing is deferred, never immediate — one write per sentence.
    expect(asked).toEqual(['soon']);
  });

  it('defers when a bullet is typed into', async () => {
    const { asked, autosave } = recorder();
    await drawAuthored(resume(), [], () => undefined, 0, autosave);

    /*
     * Select the LIST, not the entry — a bullet becomes a field only while its
     * list is the thing being edited. Retried for the reason the editor's own
     * suite retries: an inline `ref` callback re-attaches Craft's handlers on
     * every render, and a synthetic event dispatched into that window is lost.
     */
    const field = await waitFor(() => {
      fireEvent.mouseDown(screen.getByText('Shipped a thing.'));
      return screen.getByLabelText(
        'experience.0.bullets.0',
      ) as HTMLTextAreaElement;
    });

    fireEvent.change(field, { target: { value: 'Shipped two things.' } });

    // `soon`: there is more of this sentence coming, and one write per letter
    // is not a save, it is a stutter.
    expect(asked).toEqual(['soon']);
  });

  it('asks for nothing at all when the document is only being read', () => {
    const { asked, autosave } = recorder();
    draw(resume(), null, () => undefined, autosave);

    // Nothing to press, so nothing to store. The provider is mounted here on
    // purpose: the guarantee is about the document, not about the wiring.
    expect(screen.queryByRole('toolbar')).toBeNull();
    expect(asked).toEqual([]);
  });
});
