import { z } from 'zod';

/**
 * The template description format (`<id>.template.yaml`): a layout tree of
 * rows and stacks whose leaves are header parts and resume sections. Class
 * names are relative to the prefix: `org` is `tpl-harvard__org`.
 */

const Ident = z.string().regex(/^[a-z][A-Za-z0-9]*$/, 'a camelCase field name');
const ClassName = z
  .string()
  .regex(/^[a-z][a-z0-9-]*$/, 'a kebab-case class name');
const Tag = z.enum([
  'article',
  'aside',
  'div',
  'em',
  'h3',
  'li',
  'p',
  'section',
  'span',
  'strong',
  'ul',
]);

/** The localized words a separator may print (`doc.t.joins`). */
const JoinWordSchema = z.enum(['degreeField']);
type JoinWord = z.infer<typeof JoinWordSchema>;

/** The kit's modifier classes a section may add; never prefixed. */
/** The fixed headings a panel may carry (`doc.t.panels`). */
const PanelHeading = z.enum([
  'contacts',
  'personalInformation',
  'locations',
  'websites',
  'links',
]);

/** The labels a part may print before its value (`doc.t.labels`). */
const Label = z.enum(['title']);

const KitModifier = z.enum(['tpl-described--marked', 'tpl-described--grid']);

/** The kit's keyword-list classes (`kit/keywords.css`). */
const KeywordsKit = z.enum([
  'tpl-keywords',
  'tpl-keywords--boxed',
  'tpl-keywords--inline',
  'tpl-keywords--tags',
]);

/** The kit's page classes a container may carry (`paged.css`). */
const PageKit = z.enum(['tpl-sheet-tall']);

/** A CSS length or keyword, passed through to a custom property. */
const CssValue = z.union([
  z.number(),
  z.string().regex(/^[\w\s.%()+\-*/,#]+$/, 'a plain CSS value'),
]);

/** Drawn only when the item has all (`when`) or any (`whenAny`) of these fields. */
interface Conditional {
  when?: string | string[];
  whenAny?: string[];
}
const conditional = {
  when: z.union([Ident, z.array(Ident).min(1)]).optional(),
  whenAny: z.array(Ident).min(2).optional(),
};

export type EntryNode = Conditional &
  (
    | {
        tag: z.infer<typeof Tag>;
        class?: string;
        block?: boolean;
        /** Drawn for the eye only: hidden from assistive technology. */
        decorative?: boolean;
        children?: EntryNode[];
      }
    | { fragment: EntryNode[] }
    | {
        field: string;
        optional?: boolean;
        /** A guidance key, or `false` for none. */
        placeholder?: string | false;
      }
    | { text: string }
    | { separator: string; between: [string, string] }
    | { word: JoinWord; between: [string, string] }
    | { bullets: string }
    | { inlineList: string; placeholder?: string }
    | { chip: string; class: string }
  );

export const EntryNodeSchema: z.ZodType<EntryNode> = z.lazy(() =>
  z.union([
    z
      .object({
        tag: Tag,
        class: ClassName.optional(),
        block: z.boolean().optional(),
        decorative: z.boolean().optional(),
        children: z.array(EntryNodeSchema).optional(),
        ...conditional,
      })
      .strict(),
    z
      .object({ fragment: z.array(EntryNodeSchema).min(1), ...conditional })
      .strict(),
    z
      .object({
        field: Ident,
        optional: z.boolean().optional(),
        placeholder: z.union([Ident, z.literal(false)]).optional(),
        ...conditional,
      })
      .strict(),
    z.object({ text: z.string(), ...conditional }).strict(),
    z
      .object({
        separator: z.string(),
        between: z.tuple([Ident, Ident]),
        ...conditional,
      })
      .strict(),
    z
      .object({
        word: JoinWordSchema,
        between: z.tuple([Ident, Ident]),
        ...conditional,
      })
      .strict(),
    z.object({ bullets: Ident, ...conditional }).strict(),
    z
      .object({
        inlineList: Ident,
        placeholder: Ident.optional(),
        ...conditional,
      })
      .strict(),
    /** The initials of an organisation, where a design shows its logo. */
    z.object({ chip: Ident, class: ClassName, ...conditional }).strict(),
  ]),
);

const EntryType = z.enum([
  'Experience',
  'Education',
  'SkillGroup',
  'CustomEntry',
]);

export const EntrySchema = z
  .object({
    /** The exported component name, after the template's own: `SkillGroup`. */
    name: z.string().regex(/^[A-Z][A-Za-z0-9]*$/),
    type: EntryType,
    root: z
      .object({
        tag: Tag,
        class: ClassName,
        block: z.boolean().optional(),
      })
      .strict(),
    children: z.array(EntryNodeSchema),
  })
  .strict();
export type Entry = z.infer<typeof EntrySchema>;

/** The `doc.t.sections` keys a section may be titled by. */
const SectionTitle = z.enum([
  'summary',
  'professionalSummary',
  'experience',
  'education',
  'achievements',
  'keyAchievements',
  'skills',
  'technicalSkills',
  'courses',
  'certifications',
  'passions',
  'interests',
]);

const Wrapper = z
  .object({ tag: Tag, class: ClassName, block: z.boolean().optional() })
  .strict();

/** Every section may add its own classes to the shared ones. */
const sectionStyle = {
  /** A further class on the section, e.g. `section--wide`. */
  sectionClass: ClassName.optional(),
  /** A further class on its heading, e.g. `heading--marked`. */
  headingClass: ClassName.optional(),
};

const described = (section: 'achievements' | 'courses' | 'passions') =>
  z
    .object({
      section: z.literal(section),
      ...sectionStyle,
      title: SectionTitle.default(section),
      kit: z.array(KitModifier).optional(),
    })
    .strict();

const collection = (section: 'experience' | 'education') =>
  z
    .object({
      section: z.literal(section),
      ...sectionStyle,
      title: SectionTitle.default(section),
      entry: Ident.default(section),
      wrapper: Wrapper.optional(),
      gap: z.boolean().optional(),
    })
    .strict();

const SECTION_OPTIONS = [
  z
    .object({
      section: z.literal('summary'),
      ...sectionStyle,
      title: SectionTitle.default('summary'),
      paragraph: ClassName.default('prose'),
    })
    .strict(),
  collection('experience'),
  collection('education'),
  /**
   * Skill groups: the template's own `entry`, or the kit's `bullets`, `inline`,
   * `grid` or `tags` groups. A grid's or tags' groups are blocks of their own.
   */
  z
    .object({
      section: z.literal('skills'),
      ...sectionStyle,
      title: SectionTitle.default('skills'),
      entry: Ident.optional(),
      groups: z.enum(['bullets', 'inline', 'grid', 'tags']).optional(),
      wrapper: z
        .object({
          tag: Tag,
          class: ClassName.optional(),
          kit: z.array(KeywordsKit).optional(),
          block: z.boolean().optional(),
          /** Its list items break across pages one by one. */
          split: z.boolean().optional(),
        })
        .strict()
        .optional(),
      gap: z.boolean().optional(),
    })
    .strict(),
  described('achievements'),
  described('courses'),
  described('passions'),
  /** An editable comma list (`inline`) or bullet list (`bullets`). */
  z
    .object({
      section: z.literal('certifications'),
      ...sectionStyle,
      title: SectionTitle.default('certifications'),
      as: z.enum(['inline', 'bullets']).default('inline'),
      /** The paragraph's class (inline) or the list wrapper's (bullets). */
      class: ClassName.optional(),
      /** Bullets only: they break across pages one by one. */
      split: z.boolean().optional(),
      /** `hide` leaves it out while authoring too, until there is one. */
      whenEmpty: z.enum(['offer', 'hide']).default('offer'),
    })
    .strict(),
  z
    .object({
      section: z.literal('languages'),
      ...sectionStyle,
      row: ClassName.default('language'),
    })
    .strict(),
  z
    .object({
      section: z.literal('custom'),
      entry: Ident.default('custom'),
      ...sectionStyle,
    })
    .strict(),
] as const;

export const SectionSchema = z.discriminatedUnion('section', SECTION_OPTIONS);
export type Section = z.infer<typeof SectionSchema>;

const SectionNodeSchema = z.discriminatedUnion(
  'section',
  SECTION_OPTIONS.map((o) => o.extend({ kind: z.literal('section') })) as never,
) as unknown as z.ZodType<{ kind: 'section' } & Section>;

const ContactField = z.enum(['location', 'email', 'phone']);

/** Draw a container only when the resume has this, by the test its part uses. */
const When = z.enum(['headline', 'location', 'links', 'contact']);

const ContainerTag = z.enum([
  'div',
  'header',
  'aside',
  'section',
  'footer',
  'p',
  'span',
  'ul',
]);

const containerOptions = {
  tag: ContainerTag.optional(),
  class: ClassName.optional(),
  /** The kit's page classes, e.g. `tpl-sheet-tall`. */
  kit: z.array(PageKit).optional(),
  /** Kept on one page: the paginator never breaks inside it. */
  block: z.boolean().optional(),
  /** Drawn for the eye only: hidden from assistive technology. */
  decorative: z.boolean().optional(),
  /** A fixed heading for a panel that is not a resume section (`doc.t.panels`). */
  heading: PanelHeading.optional(),
  /** A further class for that heading, e.g. `heading--marked`. */
  headingClass: ClassName.optional(),
  when: When.optional(),
  /** Custom properties set on the element, e.g. `--tpl-dc-accent: '#123'`. */
  vars: z
    .record(
      z.string().regex(/^--[a-z][a-z0-9-]*$/, 'a --custom-property'),
      CssValue,
    )
    .optional(),
  /** Inside a row: a share of the free width (`2` takes twice a `1`). */
  span: z.number().positive().optional(),
  /** Inside a row: a fixed width, e.g. `32%` or `160pt`. */
  width: z.string().optional(),
  /** Space between a row's columns, or a stack's children. */
  gap: CssValue.optional(),
};

export type Container = {
  kind: 'row' | 'stack';
  children: LayoutNode[];
  tag?: z.infer<typeof ContainerTag>;
  class?: string;
  kit?: z.infer<typeof PageKit>[];
  block?: boolean;
  decorative?: boolean;
  heading?: z.infer<typeof PanelHeading>;
  headingClass?: string;
  when?: z.infer<typeof When>;
  vars?: Record<string, string | number>;
  span?: number;
  width?: string;
  gap?: string | number;
};

export type LayoutNode =
  | Container
  | {
      kind: 'name';
      class: string;
      block?: boolean;
      /** Given names and surname in spans of their own: `__name-first`, `__name-last`. */
      split?: boolean;
    }
  | {
      kind: 'headline';
      class: string;
      tag: 'p' | 'span';
      block?: boolean;
      /** A label printed before the headline (`doc.t.labels`). */
      prefix?: z.infer<typeof Label>;
    }
  | { kind: 'avatar'; class: string }
  | {
      kind: 'monogram';
      class: string;
      tag: 'p' | 'span';
      /** Wrap the initials in a `span`, for a design that styles it. */
      inner?: boolean;
    }
  | {
      kind: 'contact';
      fields: z.infer<typeof ContactField>[];
      links: boolean;
      tag: 'p' | 'div';
      class: string;
      /** The class of the element around each detail; `false` for none. */
      item: string | false;
      itemTag: 'span' | 'p';
      block?: boolean;
      /** An icon before each detail, drawn by `kit/contact-icons.css`. */
      icons?: boolean;
    }
  | {
      kind: 'links';
      tag: 'ul';
      class: string;
      item: string;
      split?: boolean;
      icons?: boolean;
    }
  | { kind: 'location' }
  | { kind: 'text'; text: string }
  | { kind: 'component'; name: string; from: string }
  | ({ kind: 'section' } & Section);

const PARTS = ['name', 'headline', 'avatar', 'monogram'] as const;
const CONTAINERS = ['row', 'stack'] as const;

/**
 * Give every node a `kind` from how it is written, so the schema can
 * discriminate on it and name the wrong field. A bare word is a part
 * (`name`, `headline`, `avatar`, `monogram`, `location`, `links`) or a section
 * with its defaults; a map is named by its key (`row`, `stack`, `contact`,
 * `links`, `component`, `text`, a part, or `section`).
 */
function withKind(node: unknown): unknown {
  if (typeof node === 'string') {
    if ((PARTS as readonly string[]).includes(node)) return { kind: node };
    if (node === 'location') return { kind: 'location' };
    if (node === 'links') return { kind: 'links' };
    return { kind: 'section', section: node };
  }
  if (node === null || typeof node !== 'object' || Array.isArray(node)) {
    return node;
  }
  const o = node as Record<string, unknown>;
  for (const k of CONTAINERS) {
    if (k in o) {
      const { [k]: children, ...rest } = o;
      return { kind: k, children, ...rest };
    }
  }
  if ('contact' in o) {
    const { contact, ...rest } = o;
    return { kind: 'contact', fields: contact, ...rest };
  }
  if ('links' in o && !('contact' in o)) {
    const { links, ...rest } = o;
    return { kind: 'links', class: links, ...rest };
  }
  if ('component' in o) {
    const { component, ...rest } = o;
    return { kind: 'component', name: component, ...rest };
  }
  if ('text' in o) return { kind: 'text', ...o };
  for (const k of PARTS) {
    if (k in o) {
      const { [k]: cls, ...rest } = o;
      return { kind: k, class: cls, ...rest };
    }
  }
  if ('section' in o) return { kind: 'section', ...o };
  return node;
}

export const LayoutNodeSchema: z.ZodType<LayoutNode, unknown> = z.lazy(() =>
  z.preprocess(
    withKind,
    z.discriminatedUnion('kind', [
      z
        .object({
          kind: z.literal('row'),
          children: z.array(LayoutNodeSchema).min(1),
          ...containerOptions,
        })
        .strict(),
      z
        .object({
          kind: z.literal('stack'),
          children: z.array(LayoutNodeSchema).min(1),
          ...containerOptions,
        })
        .strict(),
      z
        .object({
          kind: z.literal('name'),
          class: ClassName.default('name'),
          block: z.boolean().optional(),
          split: z.boolean().optional(),
        })
        .strict(),
      z
        .object({
          kind: z.literal('headline'),
          class: ClassName.default('headline'),
          tag: z.enum(['p', 'span']).default('p'),
          block: z.boolean().optional(),
          prefix: Label.optional(),
        })
        .strict(),
      z
        .object({
          kind: z.literal('avatar'),
          class: ClassName.default('avatar'),
        })
        .strict(),
      z
        .object({
          kind: z.literal('monogram'),
          class: ClassName.default('monogram'),
          tag: z.enum(['p', 'span']).default('span'),
          inner: z.boolean().optional(),
        })
        .strict(),
      z
        .object({
          kind: z.literal('contact'),
          fields: z.array(ContactField).min(1),
          links: z.boolean().default(false),
          tag: z.enum(['p', 'div']).default('p'),
          class: ClassName.default('contact'),
          item: z.union([ClassName, z.literal(false)]).default('contact-item'),
          itemTag: z.enum(['span', 'p']).default('span'),
          block: z.boolean().optional(),
          icons: z.boolean().optional(),
        })
        .strict(),
      z
        .object({
          kind: z.literal('links'),
          tag: z.literal('ul').default('ul'),
          class: ClassName.default('links'),
          item: ClassName.default('link'),
          split: z.boolean().optional(),
          icons: z.boolean().optional(),
        })
        .strict(),
      z.object({ kind: z.literal('location') }).strict(),
      z.object({ kind: z.literal('text'), text: z.string() }).strict(),
      z
        .object({
          kind: z.literal('component'),
          name: z.string().regex(/^[A-Z][A-Za-z0-9]*$/),
          /** A module beside the description: `./crest.js`. */
          from: z
            .string()
            .regex(/^\.\/[\w-]+\.js$/, 'a sibling module, ./x.js'),
        })
        .strict(),
      SectionNodeSchema as never,
    ]),
  ),
) as never;

export const TemplateDescriptionSchema = z
  .object({
    id: z.string().regex(/^[a-z][a-z0-9-]*$/),
    /** The component name prefix: `Harvard` → `HarvardDocument`. */
    component: z.string().regex(/^[A-Z][A-Za-z0-9]*$/),
    /** The root class; every other class is `<prefix>__<name>`. */
    prefix: ClassName,
    /** The key `documentStyle` reads the presentation under. */
    styleKey: z.string().min(1),
    /** Classes every section shares. */
    classes: z
      .object({
        section: ClassName.default('section'),
        heading: ClassName.default('heading'),
        described: ClassName.default('described'),
      })
      .strict()
      .default({
        section: 'section',
        heading: 'heading',
        described: 'described',
      }),
    /**
     * The first letters of every heading — sections, custom sections, panels —
     * in a span of their own, `__heading-lead`, for the stylesheet to colour or
     * box. The heading stays one field.
     */
    headingAccent: z.number().int().min(1).max(12).optional(),
    /** The page, top to bottom: a stack of layout nodes. */
    layout: z.array(LayoutNodeSchema).min(1),
    entries: z.record(Ident, EntrySchema).default({}),
  })
  .strict()
  .superRefine((d, ctx) => {
    const seen = new Set<string>();
    for (const s of sectionsOf(d.layout)) {
      if (seen.has(s.section)) {
        ctx.addIssue({
          code: 'custom',
          path: ['layout'],
          message: `section "${s.section}" appears twice`,
        });
      }
      seen.add(s.section);
      if (s.section === 'skills' && !s.entry === !s.groups) {
        ctx.addIssue({
          code: 'custom',
          path: ['layout'],
          message: 'skills takes an entry or groups — one of them',
        });
      }
      if (
        s.section === 'skills' &&
        (s.groups === 'grid' || s.groups === 'tags') &&
        (s.wrapper?.block || s.wrapper?.split)
      ) {
        ctx.addIssue({
          code: 'custom',
          path: ['layout'],
          message: `${s.groups} groups are blocks of their own — the wrapper takes no block or split`,
        });
      }
      const entry = 'entry' in s ? s.entry : undefined;
      if (entry && !(entry in d.entries)) {
        ctx.addIssue({
          code: 'custom',
          path: ['layout'],
          message: `section "${s.section}" uses entry "${entry}", which is not in entries`,
        });
      }
    }
    checkFlows(d.layout, ['layout'], ctx);
  });
export type TemplateDescription = z.infer<typeof TemplateDescriptionSchema>;

/** Every section under these nodes, in reading order. */
export function sectionsOf(nodes: LayoutNode[]): Section[] {
  return nodes.flatMap((n) => {
    if (n.kind === 'section') {
      const { kind: _, ...s } = n;
      return [s as Section];
    }
    return n.kind === 'row' || n.kind === 'stack' ? sectionsOf(n.children) : [];
  });
}

/** Whether the subtree holds content the paginator breaks: a section or a panel. */
export function holdsSections(n: LayoutNode): boolean {
  if (n.kind === 'section') return true;
  if (n.kind !== 'row' && n.kind !== 'stack') return false;
  return n.heading !== undefined || n.children.some(holdsSections);
}

/*
 * The paginator breaks each flow (a column) on its own, so: a row of sections
 * is the last thing holding sections in its parent, its children are the
 * columns, and a `block` never holds sections (blocks do not nest).
 */
function checkFlows(
  nodes: LayoutNode[],
  path: (string | number)[],
  ctx: z.RefinementCtx,
): void {
  nodes.forEach((n, i) => {
    if (n.kind !== 'row' && n.kind !== 'stack') return;
    const here = [...path, i];
    if (n.block && holdsSections(n)) {
      ctx.addIssue({
        code: 'custom',
        path: here,
        message: 'a block cannot hold sections — they break across pages',
      });
    }
    if (n.kind === 'row' && holdsSections(n)) {
      n.children.forEach((c, j) => {
        if (c.kind !== 'row' && c.kind !== 'stack') {
          ctx.addIssue({
            code: 'custom',
            path: [...here, 'children', j],
            message:
              'a row of sections holds columns — put this in a stack of its own',
          });
        }
      });
      const later = nodes.slice(i + 1).some(holdsSections);
      if (later) {
        ctx.addIssue({
          code: 'custom',
          path: here,
          message:
            'a row of sections must be the last thing holding sections in its parent',
        });
      }
    }
    checkFlows(n.children, [...here, 'children'], ctx);
  });
}
