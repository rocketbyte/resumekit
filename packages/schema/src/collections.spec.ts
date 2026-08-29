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
import { ResumeObjectSchema, type ResumeObject } from './resume.js';
import {
  APPENDABLE_FROM_COLLECTIONS,
  APPENDABLE_SECTIONS,
  applyPresentation,
  collectionOrder,
  presentationEdits,
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

  it('folds against where the entry is DRAWN, not where it was appended', () => {
    /*
     * The interaction that makes this subtle: an addition appended last is
     * rendered first once the section is reordered, so the editor emits its
     * fields at `experience.0.*`. Folding against the pre-reorder position
     * would attach the candidate's typing to the wrong entry.
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
      { 'experience.0.company': 'Real Employer Ltd' },
      structural,
    );
    const out = applyPresentation(base, saved).experience;
    expect(out.map((e) => e.company)).toEqual([
      'Real Employer Ltd',
      'Acme',
      'Beta',
    ]);
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
