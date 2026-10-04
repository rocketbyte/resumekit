import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import { TemplateDescriptionSchema } from './schema.js';
import { emit } from './emit.js';

const description = (id: string) =>
  parse(
    readFileSync(
      join(
        dirname(fileURLToPath(import.meta.url)),
        `../templates/${id}/${id}.template.yaml`,
      ),
      'utf8',
    ),
  );
const HARVARD = description('harvard');
const DOUBLE_COLUMN = description('double-column');

/** Three columns, the middle one split again into a row of two. */
const NESTED = {
  id: 'nested',
  component: 'Nested',
  prefix: 'tpl-n',
  styleKey: 'n',
  layout: [
    {
      row: [
        'name',
        {
          stack: ['headline'],
          class: 'band',
          vars: { '--tpl-n-tint': '#eef' },
        },
      ],
      tag: 'header',
      class: 'head',
      block: true,
    },
    {
      row: [
        { stack: ['summary'], class: 'left', width: '30%' },
        {
          stack: [
            'experience',
            {
              row: [{ stack: ['courses'] }, { stack: ['passions'] }],
              gap: '8pt',
            },
          ],
          class: 'middle',
          span: 2,
        },
        { stack: [{ section: 'skills', groups: 'bullets' }], class: 'right' },
      ],
      class: 'body',
    },
  ],
  entries: { experience: DOUBLE_COLUMN.entries.experience },
};

const issues = (raw: unknown) =>
  TemplateDescriptionSchema.safeParse(raw).error?.issues ?? [];

describe('the template description schema', () => {
  it('accepts the described templates', () => {
    for (const d of [HARVARD, DOUBLE_COLUMN, NESTED]) {
      expect(issues(d)).toEqual([]);
    }
  });

  it('names the field when a contact detail does not exist', () => {
    const [header, ...rest] = HARVARD.layout;
    const bad = {
      ...HARVARD,
      layout: [
        { ...header, stack: ['name', { contact: ['location', 'fax'] }] },
        ...rest,
      ],
    };
    expect(issues(bad)[0]?.path).toEqual([
      'layout',
      0,
      'children',
      1,
      'fields',
      1,
    ]);
  });

  it('refuses a kit class that is not in the list', () => {
    const bad = {
      ...NESTED,
      layout: [
        NESTED.layout[0],
        { row: [{ stack: [{ section: 'courses', kit: ['tpl-big'] }] }] },
      ],
    };
    expect(issues(bad)[0]?.path).toEqual([
      'layout',
      1,
      'children',
      0,
      'children',
      0,
      'kit',
      0,
    ]);
  });

  it('refuses a section that uses an entry it does not define', () => {
    const bad = { ...HARVARD, entries: { ...HARVARD.entries } };
    delete bad.entries.education;
    expect(
      issues(bad)
        .map((i) => i.message)
        .join(),
    ).toMatch(/entry "education"/);
  });

  it('refuses a section placed twice', () => {
    const bad = { ...HARVARD, layout: [...HARVARD.layout, 'courses'] };
    expect(
      issues(bad)
        .map((i) => i.message)
        .join(),
    ).toMatch(/twice/);
  });

  it('refuses an option the format does not have', () => {
    const bad = {
      ...HARVARD,
      layout: [...HARVARD.layout, { section: 'interests', colour: 'red' }],
    };
    expect(issues(bad).length).toBeGreaterThan(0);
  });

  describe('keeps the page paginatable', () => {
    it('refuses a grid of skills kept or split as one block', () => {
      const bad = {
        ...NESTED,
        layout: [
          NESTED.layout[0],
          {
            row: [
              {
                stack: [
                  {
                    section: 'skills',
                    groups: 'grid',
                    wrapper: { tag: 'div', block: true },
                  },
                ],
              },
            ],
          },
        ],
      };
      expect(
        issues(bad)
          .map((i) => i.message)
          .join(),
      ).toMatch(/grid groups are blocks of their own/);
    });

    it('refuses sections after a row of sections', () => {
      const bad = { ...NESTED, layout: [...NESTED.layout, 'education'] };
      expect(
        issues(bad)
          .map((i) => i.message)
          .join(),
      ).toMatch(/last thing holding sections/);
    });

    it('refuses sections inside a block', () => {
      const bad = {
        ...NESTED,
        layout: [
          { ...NESTED.layout[0], row: ['name', { stack: ['education'] }] },
          NESTED.layout[1],
        ],
      };
      expect(
        issues(bad)
          .map((i) => i.message)
          .join(),
      ).toMatch(/block cannot hold sections/);
    });

    it('refuses a section directly in a row, outside a column', () => {
      const bad = {
        ...NESTED,
        layout: [
          NESTED.layout[0],
          { row: ['education', { stack: ['courses'] }] },
        ],
      };
      expect(
        issues(bad)
          .map((i) => i.message)
          .join(),
      ).toMatch(/holds columns/);
    });
  });
});

describe('the emitter', () => {
  const d = TemplateDescriptionSchema.parse(HARVARD);
  const nested = emit(TemplateDescriptionSchema.parse(NESTED)).document;

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

  it('makes every column of a row of sections a flow, at any depth', () => {
    for (const column of ['left', 'middle', 'right']) {
      expect(nested).toMatch(
        new RegExp(`className="tpl-n__${column}"[^>]*data-flow`),
      );
    }
    expect(nested.match(/data-flow/g)).toHaveLength(5);
  });

  it('sizes columns and sets custom properties through variables, not styles', () => {
    expect(nested).toContain(`"--tpl-grow": "2"`);
    expect(nested).toContain(`"--tpl-basis": "30%"`);
    expect(nested).toContain(`"--tpl-gap": "8pt"`);
    expect(nested).toContain(`"--tpl-n-tint": "#eef"`);
    expect(nested).toContain(`import '../../kit/layout.css';`);
    expect(emit(d).document).not.toContain('layout.css');
  });

  it('draws an entry node only when the item has its fields', () => {
    const entries = emit(
      TemplateDescriptionSchema.parse(description('cobalt')),
    ).entries;
    expect(entries).toContain('{(item.field || item.end) && (');
    expect(entries).toContain(`{item.field && item.end && ", "}`);
  });

  it('places a hand-written piece where the description names it', () => {
    const { document } = emit(
      TemplateDescriptionSchema.parse(description('cobalt')),
    );
    expect(document).toContain(`import { CobaltCrest } from './crest.js';`);
    expect(document).toContain('<CobaltCrest resume={resume} />');
  });

  it('draws grid skills as entries of the kit’s grid list', () => {
    const { document } = emit(
      TemplateDescriptionSchema.parse({
        ...NESTED,
        layout: [
          NESTED.layout[0],
          {
            row: [
              {
                stack: [
                  {
                    section: 'skills',
                    groups: 'grid',
                    wrapper: { tag: 'div', class: 'skills' },
                  },
                ],
              },
            ],
          },
        ],
      }),
    );
    expect(document).toContain(
      `import { GridSkillGroup } from '../../kit/GridSkillGroup.js';`,
    );
    expect(document).toMatch(
      /<div className="tpl-n__skills tpl-skill-grid">\s*<Collection section="skills" items=\{resume\.skills\}>/,
    );
    expect(document).toContain(
      '<GridSkillGroup item={item} path={path} chrome={chrome} itemProps={itemProps} />',
    );
    expect(document).not.toMatch(
      /InlineSkillGroup|BulletSkillGroup|data-split/,
    );
  });

  it('gives each contact line its own details', () => {
    const { document } = emit(
      TemplateDescriptionSchema.parse(description('executive')),
    );
    expect(document).toContain(`const contact = useContactLines(`);
    expect(document).toContain(`const contact2 = useContactLines(`);
  });

  it('names each contact detail by its field, and draws icons only when asked', () => {
    const line = (part: object) =>
      emit(
        TemplateDescriptionSchema.parse({
          ...NESTED,
          layout: [{ stack: ['name', part] }],
        }),
      ).document;
    const plain = line({ contact: ['phone', 'email'], links: true });
    expect(plain).toContain(
      'className={`tpl-n__contact-item tpl-contact--${field}`}',
    );
    expect(plain).toContain(
      'className="tpl-n__contact-item tpl-contact--link"',
    );
    expect(plain).not.toMatch(/tpl-contact-icons|contact-icons\.css/);

    const bare = line({
      contact: ['location'],
      class: 'place',
      item: false,
      icons: true,
    });
    expect(bare).toContain(
      'className="tpl-n__place tpl-contact--location tpl-contact-icons"',
    );
    expect(bare).toContain(`import '../../kit/contact-icons.css';`);

    expect(line({ links: 'links', icons: true })).toMatch(
      /className="tpl-n__links tpl-contact-icons"[\s\S]*className="tpl-n__link tpl-contact--link"/,
    );
  });

  it('composes only the kit, and never a mutator', () => {
    for (const source of [...Object.values(emit(d)), nested]) {
      for (const [, path] of source.matchAll(/from '([^']+)'/g)) {
        expect(path).toMatch(
          /^(react|@cvgs\/core|\.\/[\w.-]+|\.\.\/\.\.\/(nodes|kit|collections|i18n|presentation-context)[\w/.-]*)$/,
        );
      }
    }
  });
});
