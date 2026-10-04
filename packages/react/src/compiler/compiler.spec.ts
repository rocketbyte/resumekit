import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import { TemplateDescriptionSchema } from './schema.js';
import { emit } from './emit.js';

const HARVARD = parse(
  readFileSync(
    join(
      dirname(fileURLToPath(import.meta.url)),
      '../templates/harvard/harvard.template.yaml',
    ),
    'utf8',
  ),
);

describe('the template description schema', () => {
  it('accepts the Harvard description', () => {
    expect(TemplateDescriptionSchema.safeParse(HARVARD).success).toBe(true);
  });

  it('names the field when a contact detail does not exist', () => {
    const bad = {
      ...HARVARD,
      header: { ...HARVARD.header, contact: ['location', 'fax'] },
    };
    const result = TemplateDescriptionSchema.safeParse(bad);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(['header', 'contact', 1]);
  });

  it('refuses a section that uses an entry it does not define', () => {
    const bad = { ...HARVARD, entries: { ...HARVARD.entries } };
    delete bad.entries.education;
    const result = TemplateDescriptionSchema.safeParse(bad);
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((i) => i.message).join()).toMatch(
      /entry "education"/,
    );
  });

  it('refuses an option the format does not have', () => {
    const bad = {
      ...HARVARD,
      sections: [
        ...HARVARD.sections,
        {
          kind: 'text',
          section: 'summary',
          title: 'experience',
          class: 'x',
          colour: 'red',
        },
      ],
    };
    expect(TemplateDescriptionSchema.safeParse(bad).success).toBe(false);
  });
});

describe('the emitter', () => {
  const d = TemplateDescriptionSchema.parse(HARVARD);

  it('is deterministic, so the drift check can compare text', () => {
    expect(emit(d)).toEqual(emit(d));
  });

  it('marks its output as generated, from which description', () => {
    const { document, entries } = emit(d);
    for (const source of [document, entries]) {
      expect(source).toMatch(/GENERATED from harvard\.template\.yaml/);
    }
  });

  it('imports the template’s own stylesheet, as the contract requires', () => {
    expect(emit(d).document).toContain(`import './harvard.css';`);
  });

  it('composes only the kit, and never a mutator', () => {
    const { document, entries } = emit(d);
    for (const source of [document, entries]) {
      for (const [, path] of source.matchAll(/from '([^']+)'/g)) {
        expect(path).toMatch(
          /^(react|@cvgs\/core|\.\/[\w.-]+|\.\.\/\.\.\/(nodes|kit|collections|i18n|presentation-context)[\w/.-]*)$/,
        );
      }
    }
  });
});
