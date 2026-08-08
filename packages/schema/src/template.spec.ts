import { describe, expect, it } from 'vitest';
import {
  DEFAULT_TEMPLATE_ID,
  DENSITIES,
  DENSITY_DEFAULT,
  DOCUMENT_FONTS,
  DocumentStyleSchema,
  INK_COLORS,
  ResumeSectionSpacingSchema,
  THEMES,
  applyTheme,
  spacingFor,
  ResumeFormatsSchema,
  ResumePresentationSchema,
  SCALE_DEFAULT,
  SCALE_MAX,
  SCALE_MIN,
  TemplateConfigSchema,
  formatFor,
  formatIsEmpty,
  normalizeScale,
  resolveTemplates,
  PutPresentationRequestSchema,
  TEMPLATES,
  TemplateIdSchema,
  applyPresentation,
  isResumeFieldPath,
  orderedTemplates,
  presentationEdits,
  readAtPath,
  templateDetails,
  type EditValue,
  type TemplateId,
} from './template.js';
import type { ResumeObject } from './resume.js';

const templateIds = Object.keys(TEMPLATES) as TemplateId[];

function resume(): ResumeObject {
  return {
    name: 'Starlin Gil Cruz',
    contact: { email: 'me@example.com', location: 'Santo Domingo, DO' },
    links: [{ label: 'GitHub', url: 'github.com/example' }],
    headline: 'Senior Software Engineer',
    summary: 'Ten years building backend platforms.',
    skills: [{ category: 'Backend', items: ['Node.js', 'TypeScript'] }],
    experience: [
      {
        company: 'Doral Health & Wellness',
        title: 'Senior Software Engineer',
        start: '2024-02',
        end: 'Present',
        bullets: ['Designed NestJS microservices.', 'Improved API security.'],
        tech: ['NestJS'],
      },
    ],
    education: [{ school: 'UTESA', degree: 'BSc', field: 'Software' }],
    certifications: [],
  };
}

describe('template catalog', () => {
  it.each(templateIds)('%s is a complete entry', (id) => {
    const t = templateDetails(id);
    expect(t.name.trim().length).toBeGreaterThan(0);
    expect(t.description.trim().length).toBeGreaterThan(0);
    expect(['letter', 'a4']).toContain(t.page);
    expect(t.ats.length).toBeGreaterThan(0);
  });

  it('refuses an identifier that is not in the catalog', () => {
    expect(TemplateIdSchema.safeParse('not-a-template').success).toBe(false);
  });

  it.each(templateIds)('%s is addressable by the derived schema', (id) => {
    expect(TemplateIdSchema.parse(id)).toBe(id);
  });

  it('names a default that exists', () => {
    expect(templateIds).toContain(DEFAULT_TEMPLATE_ID);
  });

  it('orders every catalog entry exactly once', () => {
    expect(orderedTemplates().map((t) => t.id)).toEqual(templateIds);
  });

  it('gives every template its own guarantees', () => {
    // A guarantee describes what a renderer does. Two templates sharing one
    // list means at least one of them is being described by the other's code.
    const claims = templateIds.map((id) => TEMPLATES[id].ats.join('|'));
    expect(new Set(claims).size).toBe(claims.length);
  });

  it('makes Meridian disclose two columns and a reading order', () => {
    const claims = TEMPLATES.meridian.ats.join(' ').toLowerCase();
    expect(claims).toMatch(/two columns/);
    expect(claims).toMatch(/first/);
  });

  it('does not let Meridian borrow Executive’s linear-text claim', () => {
    // Executive's columns are CSS columns over one list, so its extracted text
    // really is linear. Meridian's are grid tracks holding different sections,
    // where that property does not hold — so the phrasing may not carry over.
    expect(TEMPLATES.executive.ats.join(' ').toLowerCase()).toMatch(/linear/);
    expect(TEMPLATES.meridian.ats.join(' ').toLowerCase()).not.toMatch(
      /linear/,
    );
  });

  it('makes Cobalt name the sections its extracted text reaches first', () => {
    /*
     * Not `/first/` — Meridian's phrasing, and it works there because its main
     * column is also its left one. This template's rail is on the left, so
     * "main first" and "left first" point in opposite directions and the
     * useful thing to state is the ORDER, in section names a candidate
     * recognises.
     */
    const claims = TEMPLATES.cobalt.ats.join(' ').toLowerCase();
    expect(claims).toMatch(/two columns/);
    expect(claims).not.toMatch(/linear/);
    expect(claims).not.toMatch(/single column/);

    const order = ['summary', 'skills', 'education', 'work history'];
    const at = order.map((section) => claims.indexOf(section));
    expect(at.every((i) => i >= 0)).toBe(true);
    expect([...at].sort((a, b) => a - b)).toEqual(at);
  });

  it('lets only the templates that force a print colour claim one', () => {
    // The claim is checkable and it is not shared: a template that paints a
    // band must say so, and one that paints none may say THAT — but neither
    // may borrow the other's sentence.
    expect(TEMPLATES.cobalt.ats.join(' ').toLowerCase()).toMatch(
      /background graphics off/,
    );
    expect(TEMPLATES.cobalt.ats.join(' ').toLowerCase()).not.toMatch(
      /forced to print/,
    );
    for (const id of ['executive', 'meridian'] as const) {
      expect(TEMPLATES[id].ats.join(' ').toLowerCase()).toMatch(
        /forced to print/,
      );
      expect(TEMPLATES[id].ats.join(' ').toLowerCase()).not.toMatch(
        /background graphics off/,
      );
    }
  });
});

describe('resume field paths', () => {
  it.each([
    'name',
    'summary',
    'contact.email',
    'experience.0.bullets',
    'skills.12.items',
    'certifications',
  ])('accepts %s', (path) => {
    expect(isResumeFieldPath(path)).toBe(true);
  });

  it.each([
    '',
    '.',
    'summary.',
    'Summary',
    'experience..bullets',
    'experience.0.bullets;drop',
    '__proto__',
    'contact.__proto__.x',
    'constructor.prototype',
  ])('rejects %s', (path) => {
    expect(isResumeFieldPath(path)).toBe(false);
  });
});

describe('applyPresentation', () => {
  it('replaces a scalar field', () => {
    const out = applyPresentation(resume(), [
      { path: 'headline', value: 'Backend Engineer' },
    ]);
    expect(out.headline).toBe('Backend Engineer');
  });

  it('replaces a list whole rather than merging it', () => {
    const out = applyPresentation(resume(), [
      { path: 'experience.0.bullets', value: ['Only this one.'] },
    ]);
    expect(out.experience[0].bullets).toEqual(['Only this one.']);
  });

  it('lengthens a list the candidate added to', () => {
    const out = applyPresentation(resume(), [
      { path: 'experience.0.bullets', value: ['a', 'b', 'c'] },
    ]);
    expect(out.experience[0].bullets).toHaveLength(3);
  });

  it('writes an optional field the writer omitted', () => {
    const base = resume();
    delete base.contact.phone;
    const out = applyPresentation(base, [
      { path: 'contact.phone', value: '+1 555 0100' },
    ]);
    expect(out.contact.phone).toBe('+1 555 0100');
  });

  it('never mutates the resume it was given', () => {
    const base = resume();
    const before = structuredClone(base);
    applyPresentation(base, [
      { path: 'experience.0.bullets', value: ['changed'] },
    ]);
    expect(base).toEqual(before);
  });

  it('is a no-op for an empty overlay', () => {
    const base = resume();
    expect(applyPresentation(base, [])).toEqual(base);
  });

  it('skips an unresolvable path and applies the rest', () => {
    const out = applyPresentation(resume(), [
      { path: 'experience.9.bullets', value: ['nowhere'] },
      { path: 'nonexistent.0.field', value: 'nowhere' },
      { path: 'summary', value: 'Applied anyway.' },
    ]);
    expect(out.summary).toBe('Applied anyway.');
    expect(out.experience).toHaveLength(1);
  });

  it('drops an unknown leaf key rather than storing it', () => {
    const out = applyPresentation(resume(), [
      { path: 'contact.telex', value: 'not a field' },
    ]) as ResumeObject & { contact: { telex?: string } };
    expect(out.contact.telex).toBeUndefined();
  });

  it('rejects a prototype-reaching path without touching the prototype', () => {
    applyPresentation(resume(), [
      // The schema-level guard also rejects this; the assertion below is that
      // nothing escaped before validation ran.
      { path: '__proto__.polluted', value: 'yes' },
    ]);
    expect(({} as Record<string, unknown>)['polluted']).toBeUndefined();
  });

  it('refuses an edit that breaks the resume schema', () => {
    expect(() =>
      applyPresentation(resume(), [{ path: 'name', value: '' }]),
    ).toThrow();
    expect(() =>
      applyPresentation(resume(), [
        { path: 'experience.0.company', value: '' },
      ]),
    ).toThrow();
  });

  it('refuses a list value where the schema wants a string', () => {
    expect(() =>
      applyPresentation(resume(), [{ path: 'summary', value: ['a', 'b'] }]),
    ).toThrow();
  });
});

describe('presentationEdits', () => {
  it('keeps nothing when nothing changed', () => {
    const base = resume();
    const values: Record<string, EditValue> = {
      summary: base.summary,
      'experience.0.bullets': [...base.experience[0].bullets],
      'contact.email': base.contact.email as string,
    };
    expect(presentationEdits(base, values)).toEqual([]);
  });

  it('keeps only the paths that differ', () => {
    const base = resume();
    const edits = presentationEdits(base, {
      summary: base.summary,
      headline: 'Backend Engineer',
      'experience.0.bullets': ['Designed NestJS microservices.'],
    });
    expect(edits.map((e) => e.path)).toEqual([
      'experience.0.bullets',
      'headline',
    ]);
  });

  it('treats a reordered list as a change', () => {
    const base = resume();
    const reversed = [...base.experience[0].bullets].reverse();
    expect(
      presentationEdits(base, { 'experience.0.bullets': reversed }),
    ).toEqual([{ path: 'experience.0.bullets', value: reversed }]);
  });

  it('records a value for a field the writer left absent', () => {
    const base = resume();
    delete base.contact.phone;
    expect(presentationEdits(base, { 'contact.phone': '555' })).toEqual([
      { path: 'contact.phone', value: '555' },
    ]);
  });

  it('ignores a malformed path instead of storing it', () => {
    // Built by parsing rather than as a literal: `{ __proto__: … }` in source is
    // a prototype assignment, so the literal would never carry the own property
    // this is meant to reject.
    const hostile = JSON.parse('{"__proto__":"x","summary.":"y"}') as Record<
      string,
      EditValue
    >;
    expect(presentationEdits(resume(), hostile)).toEqual([]);
  });

  it('round-trips: applying the derived overlay reproduces the values', () => {
    const base = resume();
    const values: Record<string, EditValue> = {
      headline: 'Staff Engineer',
      'experience.0.bullets': ['One.', 'Two.', 'Three.'],
      'skills.0.items': ['Go', 'Rust'],
    };
    const applied = applyPresentation(base, presentationEdits(base, values));
    for (const [path, value] of Object.entries(values)) {
      expect(readAtPath(applied, path)).toEqual(value);
    }
  });
});

describe('PutPresentationRequestSchema', () => {
  it('defaults an omitted overlay to empty', () => {
    expect(
      PutPresentationRequestSchema.parse({ template_id: DEFAULT_TEMPLATE_ID }),
    ).toEqual({ template_id: DEFAULT_TEMPLATE_ID, edits: [] });
  });

  it('rejects an unknown template', () => {
    expect(
      PutPresentationRequestSchema.safeParse({ template_id: 'moderne' })
        .success,
    ).toBe(false);
  });

  it('rejects the same field edited twice', () => {
    expect(
      PutPresentationRequestSchema.safeParse({
        template_id: DEFAULT_TEMPLATE_ID,
        edits: [
          { path: 'summary', value: 'a' },
          { path: 'summary', value: 'b' },
        ],
      }).success,
    ).toBe(false);
  });

  it('rejects a malformed field path', () => {
    expect(
      PutPresentationRequestSchema.safeParse({
        template_id: DEFAULT_TEMPLATE_ID,
        edits: [{ path: 'experience..bullets', value: ['x'] }],
      }).success,
    ).toBe(false);
  });

  it('carries no component name, node id, or editor key', () => {
    // The stored shape is domain paths and values. If this ever parses an
    // editor tree, the persistence decision in design.md has been reversed.
    const parsed = PutPresentationRequestSchema.parse({
      template_id: DEFAULT_TEMPLATE_ID,
      edits: [{ path: 'summary', value: 'x' }],
    });
    expect(Object.keys(parsed).sort()).toEqual(['edits', 'template_id']);
    expect(JSON.stringify(parsed)).not.toMatch(/resolvedName|ROOT|linkedNodes/);
  });
});

describe('document formatting catalogs', () => {
  const fontIds = Object.keys(
    DOCUMENT_FONTS,
  ) as (keyof typeof DOCUMENT_FONTS)[];
  const inkIds = Object.keys(INK_COLORS) as (keyof typeof INK_COLORS)[];

  it.each(fontIds)('%s names a system stack that needs no download', (id) => {
    const font = DOCUMENT_FONTS[id];
    expect(font.name.trim().length).toBeGreaterThan(0);
    // A url() would mean a webfont: a download that can fail, arrive late and
    // shift a measured page break — and a glyph set an ATS may not have.
    expect(font.stack).not.toMatch(/url\(|@font-face|https?:/);
    // Every stack ends in a generic family, so there is always a fallback.
    expect(font.stack).toMatch(/(sans-serif|serif|monospace)$/);
  });

  it.each(inkIds)('%s is a dark, document-appropriate ink', (id) => {
    const { hex } = INK_COLORS[id];
    expect(hex).toMatch(/^#[0-9a-f]{6}$/);
    // Readable on white, and still readable printed in greyscale.
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    expect(luminance).toBeLessThan(0.55);
  });

  it('offers a scale range that is bounded and centred on the template', () => {
    expect(SCALE_MIN).toBeLessThan(SCALE_DEFAULT);
    expect(SCALE_MAX).toBeGreaterThan(SCALE_DEFAULT);
  });

  it('normalizes a scale onto the step, within the bounds', () => {
    expect(normalizeScale(1.02)).toBe(1);
    expect(normalizeScale(5)).toBe(SCALE_MAX);
    expect(normalizeScale(0)).toBe(SCALE_MIN);
    expect(normalizeScale(1.07)).toBe(1.05);
  });

  it('refuses a style outside the catalog or the bounds', () => {
    const ok = { font: 'georgia', ink: 'navy', scale: 1 };
    expect(DocumentStyleSchema.safeParse(ok).success).toBe(true);
    expect(
      DocumentStyleSchema.safeParse({ ...ok, font: 'comic-sans' }).success,
    ).toBe(false);
    expect(
      DocumentStyleSchema.safeParse({ ...ok, ink: 'hotpink' }).success,
    ).toBe(false);
    expect(DocumentStyleSchema.safeParse({ ...ok, scale: 3 }).success).toBe(
      false,
    );
    expect(DocumentStyleSchema.safeParse({ ...ok, scale: 0.2 }).success).toBe(
      false,
    );
  });
});

describe('per-field formatting', () => {
  it('refuses the same field formatted twice', () => {
    expect(
      ResumeFormatsSchema.safeParse([
        { path: 'summary', bold: true },
        { path: 'summary', align: 'center' },
      ]).success,
    ).toBe(false);
  });

  it('refuses a record that carries no formatting at all', () => {
    // Clearing formatting removes the entry; an empty record would be a stored
    // statement that says nothing.
    expect(formatIsEmpty({ path: 'summary' })).toBe(true);
    expect(ResumeFormatsSchema.safeParse([{ path: 'summary' }]).success).toBe(
      false,
    );
  });

  it('finds the format for a path, and nothing for an unformatted one', () => {
    const formats = [
      { path: 'name', bold: true, align: 'center' as const },
      { path: 'summary', ink: 'slate' as const },
    ];
    expect(formatFor(formats, 'name')?.align).toBe('center');
    expect(formatFor(formats, 'headline')).toBeUndefined();
    expect(formatFor(undefined, 'name')).toBeUndefined();
  });

  it('addresses fields by the same paths the text edits use', () => {
    expect(
      ResumeFormatsSchema.safeParse([
        { path: 'experience.0.bullets', bold: true },
      ]).success,
    ).toBe(true);
    expect(
      ResumeFormatsSchema.safeParse([
        { path: 'experience..bullets', bold: true },
      ]).success,
    ).toBe(false);
  });
});

describe('a presentation stored before formatting existed', () => {
  it('still parses, and carries neither style nor formats', () => {
    const legacy = ResumePresentationSchema.parse({
      template_id: DEFAULT_TEMPLATE_ID,
      edits: [{ path: 'summary', value: 'Written in #29.' }],
      updated_at: '2026-07-31T00:00:00Z',
    });
    expect(legacy.style).toBeUndefined();
    expect(legacy.formats).toBeUndefined();
  });

  it('accepts a request that carries formatting', () => {
    const parsed = PutPresentationRequestSchema.parse({
      template_id: DEFAULT_TEMPLATE_ID,
      style: { font: 'garamond', ink: 'ink', scale: 0.95 },
      formats: [{ path: 'name', align: 'center' }],
    });
    expect(parsed.style?.font).toBe('garamond');
    expect(parsed.formats).toHaveLength(1);
    expect(parsed.edits).toEqual([]);
  });
});

describe('resolveTemplates', () => {
  it('is the catalog when there is no configuration', () => {
    const offered = resolveTemplates();
    expect(offered.map((t) => t.id)).toEqual(templateIds);
    expect(resolveTemplates([])).toEqual(offered);
  });

  it('hides a template configuration disables', () => {
    const offered = resolveTemplates([
      { template_id: DEFAULT_TEMPLATE_ID, enabled: false },
    ]);
    // The catalog holds one template today, so disabling it exercises the
    // never-empty guarantee rather than the hiding — both matter.
    expect(offered.length).toBeGreaterThan(0);
  });

  it('never returns an empty list, whatever configuration says', () => {
    // A misconfiguration must not produce an editor with nothing to choose:
    // that failure arrives through data, where no test of the code would catch
    // it. See design decision 2.
    const offered = resolveTemplates(
      templateIds.map((id) => ({ template_id: id, enabled: false })),
    );
    expect(offered).toHaveLength(1);
    expect(offered[0].id).toBe(DEFAULT_TEMPLATE_ID);
  });

  it('cannot introduce a template the catalog does not contain', () => {
    const offered = resolveTemplates([
      { template_id: 'moderne', enabled: true, order: 0 },
    ]);
    expect(offered.map((t) => t.id)).toEqual(templateIds);
  });

  it('carries operator emphasis through, and only that', () => {
    const [first] = resolveTemplates([
      { template_id: DEFAULT_TEMPLATE_ID, featured: true, badge: 'Popular' },
    ]);
    expect(first.featured).toBe(true);
    expect(first.badge).toBe('Popular');
    // The renderer-bound facts still come from the catalog.
    expect(first.page).toBe(TEMPLATES[DEFAULT_TEMPLATE_ID].page);
    expect(first.ats).toEqual([...TEMPLATES[DEFAULT_TEMPLATE_ID].ats]);
  });

  it('does not let configuration rewrite what a template guarantees', () => {
    const rogue = {
      template_id: DEFAULT_TEMPLATE_ID,
      // Not fields config can set — an ATS guarantee is only worth something
      // because it is verifiable against the renderer.
      ats: ['Two columns with tables'],
      page: 'a4',
    } as unknown as import('./template.js').TemplateConfig;
    const [first] = resolveTemplates([rogue]);
    expect(first.ats).toEqual([...TEMPLATES[DEFAULT_TEMPLATE_ID].ats]);
    expect(first.page).toBe(TEMPLATES[DEFAULT_TEMPLATE_ID].page);
  });

  it('orders by configuration, falling back to catalog order', () => {
    const offered = resolveTemplates([
      { template_id: DEFAULT_TEMPLATE_ID, order: 5 },
    ]);
    expect(offered.map((t) => t.id)).toContain(DEFAULT_TEMPLATE_ID);
  });

  it('accepts a config document that sets only the id', () => {
    expect(
      TemplateConfigSchema.safeParse({ template_id: 'harvard' }).success,
    ).toBe(true);
  });
});

describe('document styling — bounded spacing, accent and themes', () => {
  const base = {
    font: 'helvetica',
    ink: 'ink',
    scale: SCALE_DEFAULT,
  } as const;

  it('renders as the template defines it when nothing is styled', () => {
    // The whole migration story rests on this: every field added here is
    // optional, so a presentation stored before them stays valid and unchanged.
    const parsed = DocumentStyleSchema.parse(base);
    expect(parsed.accent).toBeUndefined();
    expect(parsed.density).toBeUndefined();
  });

  it('accepts an accent from the document ink palette', () => {
    for (const ink of Object.keys(INK_COLORS)) {
      expect(
        DocumentStyleSchema.safeParse({ ...base, accent: ink }).success,
      ).toBe(true);
    }
  });

  it('refuses an accent that is not a vetted document colour', () => {
    // The point of the palette: a colour nobody checked for greyscale print
    // cannot reach the document.
    expect(
      DocumentStyleSchema.safeParse({ ...base, accent: '#ff00ff' }).success,
    ).toBe(false);
  });

  it('refuses a density that is not in the catalog', () => {
    expect(
      DocumentStyleSchema.safeParse({ ...base, density: 1.4 }).success,
    ).toBe(false);
    expect(
      DocumentStyleSchema.safeParse({ ...base, density: 'airy' }).success,
    ).toBe(false);
  });

  it('keeps normal density at exactly the template’s own rhythm', () => {
    // Not cosmetic: this is what makes the default a no-op and the diff to
    // every stored resume zero pixels.
    expect(DENSITIES[DENSITY_DEFAULT].factor).toBe(1);
  });

  it('spaces a section at most once', () => {
    expect(
      ResumeSectionSpacingSchema.safeParse([
        { section: 'experience', space: 'md' },
        { section: 'experience', space: 'lg' },
      ]).success,
    ).toBe(false);
  });

  it('does not store a section spaced by nothing', () => {
    // Returning a control to where it started should leave no trace.
    expect(
      ResumeSectionSpacingSchema.safeParse([
        { section: 'skills', space: 'none' },
      ]).success,
    ).toBe(false);
  });

  it('refuses spacing for a section the resume does not have', () => {
    expect(
      ResumeSectionSpacingSchema.safeParse([
        { section: 'projects', space: 'md' },
      ]).success,
    ).toBe(false);
  });

  it('finds the spacing for a section, and nothing for an unspaced one', () => {
    const spacing = ResumeSectionSpacingSchema.parse([
      { section: 'experience', space: 'lg' },
    ]);
    expect(spacingFor(spacing, 'experience')?.space).toBe('lg');
    expect(spacingFor(spacing, 'education')).toBeUndefined();
    expect(spacingFor(undefined, 'experience')).toBeUndefined();
  });

  it('treats a field spaced by nothing as carrying no formatting', () => {
    expect(formatIsEmpty({ path: 'summary', space: 'none' })).toBe(true);
    expect(formatIsEmpty({ path: 'summary', space: 'md' })).toBe(false);
  });

  it('carries section spacing through the presentation and the request', () => {
    const spacing = [{ section: 'skills', space: 'sm' }];
    expect(
      ResumePresentationSchema.safeParse({
        template_id: DEFAULT_TEMPLATE_ID,
        edits: [],
        section_spacing: spacing,
        updated_at: new Date().toISOString(),
      }).success,
    ).toBe(true);
    expect(
      PutPresentationRequestSchema.safeParse({
        template_id: DEFAULT_TEMPLATE_ID,
        section_spacing: spacing,
      }).success,
    ).toBe(true);
  });

  it('applies a theme as concrete values, never as an identifier', () => {
    const styled = applyTheme(base, 'modern');
    expect(DocumentStyleSchema.safeParse(styled).success).toBe(true);
    expect(styled.font).toBe(THEMES.modern.style.font);
    expect(styled.accent).toBe(THEMES.modern.style.accent);
    expect(styled.density).toBe(THEMES.modern.style.density);
    // A stored document must never depend on a definition that can change
    // under it, so nothing records which theme produced these values.
    expect(Object.keys(styled)).not.toContain('theme');
  });

  it('leaves the size scale alone when a theme is applied', () => {
    // Scale is how a candidate fits their resume on one page — a decision about
    // their document, not about its styling. A theme has no opinion on it.
    const fitted = { ...base, scale: SCALE_MIN };
    expect(applyTheme(fitted, 'compact').scale).toBe(SCALE_MIN);
  });

  it('draws every theme from the catalogs the controls offer', () => {
    // A theme is a preset over the same bounded sets, so it cannot be the one
    // way to reach a value the guarantee suite never enumerates.
    for (const theme of Object.values(THEMES)) {
      expect(DOCUMENT_FONTS[theme.style.font]).toBeDefined();
      expect(INK_COLORS[theme.style.ink]).toBeDefined();
      expect(INK_COLORS[theme.style.accent]).toBeDefined();
      expect(DENSITIES[theme.style.density]).toBeDefined();
      expect(
        DocumentStyleSchema.safeParse({ ...base, ...theme.style }).success,
      ).toBe(true);
    }
  });
});
