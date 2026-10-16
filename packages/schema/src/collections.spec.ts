import { describe, expect, it } from 'vitest';
import {
  COLLECTIONS,
  PLACEHOLDERS,
  canAddTo,
  chronologyWarnings,
  collectionPath,
  isUnfilled,
  type CollectionId,
} from './collections.js';
import {
  CANDIDATE_ONLY_FIELDS,
  ResumeObjectSchema,
  type ResumeObject,
} from './resume.js';
import {
  APPENDABLE_FROM_COLLECTIONS,
  APPENDABLE_SECTIONS,
  applyPresentation,
  collectionOrder,
  presentationEdits,
  withoutUnfilledAdditions,
  type ResumeEdits,
} from './template.js';
import { renderText } from './resume-text.js';

const base: ResumeObject = ResumeObjectSchema.parse({
  name: 'Ada Lovelace',
  contact: { email: 'ada@example.com' },
  summary: 'Engineer.',
  experience: [
    {
      company: 'Acme',
      title: 'Engineer',
      start: '2022-02',
      end: 'Present',
      bullets: ['Shipped a thing.'],
    },
    {
      company: 'Beta',
      title: 'Junior',
      start: '2020-01',
      end: '2022-01',
      bullets: ['Learned a thing.'],
    },
  ],
});

const appended = (ref: string, entry: unknown): ResumeEdits => [
  { kind: 'append', ref, section: 'experience', author: 'candidate', entry },
];

describe('the collections table', () => {
  it('declares every repeatable location in the resume schema', () => {
    const declared = new Set(
      Object.values(COLLECTIONS)
        .map((c) => c.path)
        .filter((p) => !p.includes('*')),
    );
    const arrays = Object.entries(ResumeObjectSchema.shape)
      .filter(([, schema]) => schema.def.type === 'array')
      .map(([key]) => key);
    for (const key of arrays) expect(declared).toContain(key);
  });

  it('answers whether anything can be added, from arity alone', () => {
    // The summary is singular, so no surface has to remember the exception.
    expect(canAddTo('summary')).toBe(false);
    expect(canAddTo('experience')).toBe(true);
  });

  it('keeps the appendable sections a projection, not a second list', () => {
    expect([...APPENDABLE_SECTIONS].sort()).toEqual(
      [...APPENDABLE_FROM_COLLECTIONS].sort(),
    );
  });

  it('resolves a nested collection path against its indices', () => {
    expect(collectionPath('experience_bullets', [2])).toBe(
      'experience.2.bullets',
    );
    expect(() => collectionPath('experience_bullets', [])).toThrow();
  });

  it('mints guidance, never content', () => {
    for (const id of Object.keys(COLLECTIONS) as CollectionId[]) {
      expect(isUnfilled(COLLECTIONS[id].mint())).toBe(true);
    }
    // The guidance itself lives apart from the minted value, which is what
    // keeps it out of everything that reads the value.
    expect(Object.values(PLACEHOLDERS).every((p) => p.length > 0)).toBe(true);
  });

  it('mints a parent with one of every collection inside it', () => {
    /*
     * A minted entry carries one of each repeatable thing it contains — a role
     * arrives with one bullet, a skills group with one skill.
     *
     * Without it, adding a role would give a heading with nothing under it and
     * no way to put anything there: the controls that type a bullet, add
     * another and remove it all hang off a bullet ROW, so a list with no rows
     * offers nothing to press. "Add one, then add its first child" is two acts
     * for what a candidate means as one.
     *
     * Derived from the paths rather than listed: a nested collection declares
     * itself with a `*` — `experience.*.bullets` is the bullets inside an
     * experience entry — so the table already says which parent owns which
     * child, and this reads it rather than repeating it.
     */
    for (const child of Object.values(COLLECTIONS)) {
      const [parentPath, , field] = child.path.split('.');
      if (!field) continue; // not nested; nothing to be inside.

      const parent = Object.values(COLLECTIONS).find(
        (c) => c.path === parentPath,
      );
      if (!parent) continue;

      const minted = parent.mint() as Record<string, unknown>;
      const seeded = minted[field];
      expect(
        Array.isArray(seeded) && seeded.length > 0,
        `a minted ${parent.noun} carries no ${child.noun} to write in`,
      ).toBe(true);
    }
  });

  it('mints an item its own schema accepts', () => {
    /*
     * The invariant that ties `mint` to `item`, and it did not hold.
     *
     * `links` carried the writer's `LinkSchema`, whose `url` is `.min(1)`, so
     * the blank link `mint()` produces was refused by the schema every reader
     * validates an addition against — `collectionOrder` and `applyEdits` both
     * SKIP what does not parse, deliberately, so that a stored overlay
     * outliving its code cannot stop a résumé opening. Here that leniency hid a
     * defect: pressing "Add links" wrote an append edit that nothing would ever
     * draw, and the candidate pressed a control and watched nothing happen.
     *
     * Asserted for the whole set rather than for links, because the next
     * collection to gain a required field would fail the same way and just as
     * quietly.
     *
     * Scoped to the APPENDABLE sections, which is exactly where a minted item
     * meets a schema: `APPEND_SCHEMAS` is that same table, read at apply time.
     * `custom_sections` is deliberately outside it — a candidate's section is
     * DECLARED by a `section` edit that carries its own `ref` and author, so
     * nothing ever appends one and its `mint` is not on this path.
     */
    for (const section of APPENDABLE_SECTIONS) {
      const minted = COLLECTIONS[section].mint();
      expect(
        COLLECTIONS[section].item.safeParse(minted).success,
        `${section} mints an item its own schema refuses, so adding one does nothing`,
      ).toBe(true);
    }
  });
});

describe('an addition keeps what the candidate types into it', () => {
  it('folds typed values into the addition rather than discarding them', () => {
    const structural = appended('add-1', COLLECTIONS.experience.mint());
    const saved = presentationEdits(
      base,
      {
        'experience.2.company': 'Real Employer Ltd',
        'experience.2.title': 'Staff Engineer',
        'experience.2.start': '2024-03',
        'experience.2.end': 'Present',
        'experience.2.bullets': ['Shipped the thing that mattered.'],
      },
      structural,
    );

    const rendered = applyPresentation(base, saved).experience[2];
    expect(rendered?.company).toBe('Real Employer Ltd');
    expect(rendered?.bullets).toEqual(['Shipped the thing that mattered.']);
  });

  it('still refuses to store a replacement the base cannot address', () => {
    const saved = presentationEdits(
      base,
      { 'experience.2.company': 'Real Employer Ltd' },
      appended('add-1', COLLECTIONS.experience.mint()),
    );
    expect(saved.filter((e) => e.kind === 'set')).toHaveLength(0);
  });

  it('is addressed past the writer\u2019s entries, wherever it is drawn', () => {
    /*
     * An addition's address does NOT follow it around the page.
     *
     * Drawing order is what a `reorder` edit says, and nothing else. An address
     * that moved with it would land inside the writer's own range — an addition
     * pulled to the top would claim `experience.0`, which is already the
     * writer's first role — and then two fields on one document would claim to
     * edit the same thing. In the editor that is not a near miss: Craft.js
     * resolves one id to one node, so the writer's role rendered blank and its
     * text was swallowed as belonging to the addition.
     *
     * So it stays at `experience.2`, which is where applying the overlay puts
     * it, reordered or not.
     */
    const structural: ResumeEdits = [
      ...appended('add-1', COLLECTIONS.experience.mint()),
      {
        kind: 'reorder',
        section: 'experience',
        order: [{ ref: 'add-1' }, { base: 0 }, { base: 1 }],
      },
    ];
    const saved = presentationEdits(
      base,
      {
        'experience.2.company': 'Real Employer Ltd',
        // The writer's own first role, edited in the same pass. It keeps its
        // own address even though the addition is drawn above it.
        'experience.0.title': 'Principal',
      },
      structural,
    );
    const out = applyPresentation(base, saved).experience;
    expect(out.map((e) => e.company)).toEqual([
      'Real Employer Ltd',
      'Acme',
      'Beta',
    ]);
    expect(out.map((e) => e.title)).toEqual([
      COLLECTIONS.experience.mint().title,
      'Principal',
      'Junior',
    ]);
  });

  it('leaves the writer\u2019s entries alone when one is inserted above them', () => {
    /*
     * The report this exists for: adding a role above the second one blanked
     * that role off the page. The addition claimed `experience.1` — the render
     * index it happened to occupy — which is the writer's second role's own
     * address, so the editor built two fields for one path and the role's text
     * was filtered out of the overlay as "claimed" by the addition.
     */
    const structural: ResumeEdits = [
      ...appended('add-1', COLLECTIONS.experience.mint()),
      {
        kind: 'reorder',
        section: 'experience',
        order: [{ base: 0 }, { ref: 'add-1' }, { base: 1 }],
      },
    ];
    const saved = presentationEdits(
      base,
      {
        'experience.0.company': 'Acme',
        'experience.1.company': 'Beta',
        'experience.2.company': 'Real Employer Ltd',
      },
      structural,
    );
    expect(
      applyPresentation(base, saved).experience.map((e) => e.company),
    ).toEqual(['Acme', 'Real Employer Ltd', 'Beta']);
  });

  it('round-trips: what the candidate left in the field is what reloads', () => {
    const structural = appended('add-1', COLLECTIONS.experience.mint());
    const values = {
      'experience.2.company': 'Real Employer Ltd',
      'experience.2.title': 'Staff Engineer',
      'experience.2.start': '2024-03',
      'experience.2.end': 'Present',
      'experience.2.bullets': ['One.'],
    };
    const once = presentationEdits(base, values, structural);
    const twice = presentationEdits(base, values, once);
    expect(twice).toEqual(once);
  });
});

describe('an ordering is stored, not applied by renumbering', () => {
  it('keeps a replacement on the entry it was written against', () => {
    const edits: ResumeEdits = [
      { kind: 'set', path: 'experience.1.title', value: 'Principal' },
      {
        kind: 'reorder',
        section: 'experience',
        order: [{ base: 1 }, { base: 0 }],
      },
    ];
    const out = applyPresentation(base, edits).experience;
    expect(out.map((e) => e.company)).toEqual(['Beta', 'Acme']);
    expect(out[0]?.title).toBe('Principal');
  });

  it('degrades to the natural order when a slot no longer resolves', () => {
    const out = applyPresentation(base, [
      {
        kind: 'reorder',
        section: 'experience',
        order: [{ base: 9 }, { ref: 'never-added' }, { base: 1 }],
      },
    ]).experience;
    // Slot 9 and the unknown ref drop; base 1 is named, base 0 follows.
    expect(out.map((e) => e.company)).toEqual(['Beta', 'Acme']);
  });

  it('keeps the first occurrence of a duplicated slot', () => {
    const order = collectionOrder(
      base,
      [
        {
          kind: 'reorder',
          section: 'experience',
          order: [{ base: 1 }, { base: 1 }, { base: 0 }],
        },
      ],
      'experience',
    );
    expect(order).toEqual([{ base: 1 }, { base: 0 }]);
  });

  it('survives an addition being dropped', () => {
    const edits: ResumeEdits = [
      ...appended('add-1', COLLECTIONS.experience.mint()),
      { kind: 'drop', ref: 'add-1' },
      {
        kind: 'reorder',
        section: 'experience',
        order: [{ ref: 'add-1' }, { base: 1 }, { base: 0 }],
      },
    ];
    expect(
      applyPresentation(base, edits).experience.map((e) => e.company),
    ).toEqual(['Beta', 'Acme']);
  });

  it('never leaves the resume unrenderable', () => {
    expect(() =>
      applyPresentation(base, [
        { kind: 'reorder', section: 'experience', order: [] },
      ]),
    ).not.toThrow();
  });
});

describe('a writer-produced entry is hidden, never deleted', () => {
  it('removes it from the document', () => {
    expect(
      applyPresentation(base, [
        { kind: 'hide', section: 'experience', base: 0 },
      ]).experience.map((e) => e.company),
    ).toEqual(['Beta']);
  });

  it('is reversible — the writer output is untouched', () => {
    applyPresentation(base, [{ kind: 'hide', section: 'experience', base: 0 }]);
    expect(base.experience).toHaveLength(2);
    expect(applyPresentation(base, []).experience).toHaveLength(2);
  });
});

describe('a placeholder is an absence', () => {
  it('omits an unfilled entry from the text export and reports it', () => {
    const withDraft = applyPresentation(
      base,
      appended('add-1', COLLECTIONS.experience.mint()),
    );
    const { text, omitted } = renderText(withDraft);
    for (const guidance of Object.values(PLACEHOLDERS)) {
      expect(text).not.toContain(guidance);
    }
    expect(omitted).toContain('1 unfilled experience entry');
  });

  it('keeps an entry the moment one field is filled', () => {
    const edits = presentationEdits(
      base,
      { 'experience.2.company': 'Real Employer Ltd' },
      appended('add-1', COLLECTIONS.experience.mint()),
    );
    expect(renderText(applyPresentation(base, edits)).text).toContain(
      'Real Employer Ltd',
    );
  });
});

describe('reordering can contradict the rulebook, and says so', () => {
  it('reports nothing for a reverse-chronological resume', () => {
    expect(chronologyWarnings(base)).toEqual([]);
  });

  it('reports the entry that breaks the order', () => {
    const out = applyPresentation(base, [
      {
        kind: 'reorder',
        section: 'experience',
        order: [{ base: 1 }, { base: 0 }],
      },
    ]);
    expect(chronologyWarnings(out)).toEqual([1]);
  });

  it('says nothing about a half-typed date', () => {
    const drafting = applyPresentation(
      base,
      appended('add-1', COLLECTIONS.experience.mint()),
    );
    expect(chronologyWarnings(drafting)).toEqual([]);
  });
});

/**
 * An addition nobody typed into does not survive a reload.
 *
 * An overlay records what the candidate DECIDED, and an entry with nothing in
 * it records none. It also persists, which is how a control that appeared not to
 * work — the links add, whose entries every reader silently skipped — left one
 * invisible entry per press, and a résumé came to carry a hundred blank links
 * that only became visible when the schema was fixed.
 */
describe('adopting a stored overlay', () => {
  const blankLink = (ref: string): ResumeEdits => [
    {
      kind: 'append',
      ref,
      section: 'links',
      author: 'candidate',
      entry: { label: '', url: '' },
    },
  ];

  it('drops an addition with nothing in it', () => {
    expect(withoutUnfilledAdditions(blankLink('add-1'))).toEqual([]);
  });

  it('keeps one the candidate has typed into', () => {
    /*
     * `presentationEdits` folds typed values into the addition's own entry, so
     * an entry with a word in it is not unfilled — which is what makes this
     * safe to apply to a whole overlay rather than to blank links alone.
     */
    const typed: ResumeEdits = [
      {
        kind: 'append',
        ref: 'add-1',
        section: 'links',
        author: 'candidate',
        entry: { label: 'GitHub', url: 'https://github.com/example' },
      },
    ];
    expect(withoutUnfilledAdditions(typed)).toEqual(typed);
  });

  it('takes the dropped refs out of the ordering with them', () => {
    // A slot pointing at an addition that no longer exists is one
    // `collectionOrder` would skip anyway; leaving it is leaving litter.
    const edits: ResumeEdits = [
      ...blankLink('add-1'),
      {
        kind: 'reorder',
        section: 'links',
        order: [{ base: 0 }, { ref: 'add-1' }],
      },
    ];
    const kept = withoutUnfilledAdditions(edits);
    expect(kept).toHaveLength(1);
    expect(kept[0]).toEqual({
      kind: 'reorder',
      section: 'links',
      order: [{ base: 0 }],
    });
  });

  it('drops a `drop` that named one, since there is nothing left to drop', () => {
    const edits: ResumeEdits = [
      ...blankLink('add-1'),
      { kind: 'drop', ref: 'add-1' },
    ];
    expect(withoutUnfilledAdditions(edits)).toEqual([]);
  });

  it('leaves an overlay with nothing to prune identical', () => {
    // Same reference, not merely equal: adopting a clean overlay must not look
    // to the editor like an unsaved change.
    const edits: ResumeEdits = [
      { kind: 'hide', section: 'experience', base: 0 },
    ];
    expect(withoutUnfilledAdditions(edits)).toBe(edits);
  });

  it('clears a page of them, and the document with it', () => {
    const many = Array.from({ length: 100 }, (_, i) =>
      blankLink(`add-${i}`),
    ).flat();
    const kept = withoutUnfilledAdditions(many);
    expect(kept).toEqual([]);
    expect(applyPresentation(base, kept).links).toEqual(base.links);
  });
});

/**
 * Renaming a section.
 *
 * The heading a template prints is a FIELD, addressed at
 * `section_headings.<id>`, so a rename is an ordinary `set` edit and rides the
 * save, undo and export path the rest of the document's text already uses.
 */
describe('a section can be renamed', () => {
  const renamed = (path: string, value: string) =>
    applyPresentation(base, [{ kind: 'set', path, value }]);

  it('stores the candidate’s word for a section', () => {
    const out = renamed('section_headings.passions', 'Interests');
    expect(out.section_headings['passions']).toBe('Interests');
  });

  it('leaves every other section alone', () => {
    const out = renamed('section_headings.passions', 'Interests');
    expect(out.section_headings['experience']).toBeUndefined();
  });

  it('renames a resume stored before headings could be renamed', () => {
    /*
     * The field was added after résumés were already stored, and the schema
     * only defaults it when the résumé is parsed — which happens after the
     * replacements. Without the seed in `applyPresentation` the rename resolves
     * no parent, is skipped as a stale path, and the candidate's heading
     * quietly stops saving.
     */
    const { section_headings: _dropped, ...older } = base;
    const out = applyPresentation(older as typeof base, [
      { kind: 'set', path: 'section_headings.skills', value: 'Core Skills' },
    ]);
    expect(out.section_headings['skills']).toBe('Core Skills');
  });

  it('keeps a rename out of the writer’s reach', () => {
    expect(CANDIDATE_ONLY_FIELDS).toContain('section_headings');
  });

  /*
   * A heading the candidate has not touched is not an edit.
   *
   * The field's value is the template's own word — "Experience" is on the page
   * of a résumé nobody renamed — so without the defaults the diff sees a value
   * where the base has none, and merely OPENING a document reported one edit
   * per section and marked it dirty. The same rule `sameValue` already applies
   * to a blank field the writer never carried.
   */
  it('records nothing for a heading the candidate never touched', () => {
    const values = { 'section_headings.experience': 'Experience' };
    const defaults = { 'section_headings.experience': 'Experience' };
    expect(presentationEdits(base, values, [], defaults)).toEqual([]);
  });

  it('records the heading once the candidate changes it', () => {
    const values = { 'section_headings.experience': 'Work History' };
    const defaults = { 'section_headings.experience': 'Experience' };
    expect(presentationEdits(base, values, [], defaults)).toEqual([
      {
        kind: 'set',
        path: 'section_headings.experience',
        value: 'Work History',
      },
    ]);
  });

  it('forgets a rename typed back to the template’s own word', () => {
    // Undoing a rename must leave no trace, exactly as returning a space
    // control to where it started does.
    const values = { 'section_headings.experience': 'Experience' };
    const defaults = { 'section_headings.experience': 'Experience' };
    const out = presentationEdits(base, values, [], defaults);
    expect(out.some((e) => e.kind === 'set')).toBe(false);
  });
});
