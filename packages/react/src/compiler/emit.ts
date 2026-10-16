import {
  holdsSections,
  sectionsOf,
  type Container,
  type Entry,
  type EntryNode,
  type LayoutNode,
  type Section,
  type TemplateDescription,
} from './schema.js';

/**
 * A description → its two source files, as text. Deterministic, so the drift
 * check compares strings; the generator formats the result with Prettier.
 */
export interface Emitted {
  document: string;
  entries: string;
}

const q = (s: string) => JSON.stringify(s);

export function generatedHeader(id: string): string {
  return (
    `/*\n` +
    ` * GENERATED from ${id}.template.yaml by @resumekit/react's template compiler.\n` +
    ` * Do not edit: change the description and run the package's\n` +
    ` * \`generate-templates\` script. \`check-templates\` fails when they disagree.\n` +
    ` */\n`
  );
}

export function emit(d: TemplateDescription): Emitted {
  return { document: emitDocument(d), entries: emitEntries(d) };
}

function entryComponentName(d: TemplateDescription, entry: Entry): string {
  return `${d.component}${entry.name}`;
}

function cls(d: TemplateDescription, name: string): string {
  return `${d.prefix}__${name}`;
}

interface EntryUses {
  editableText: boolean;
  bulletList: boolean;
  inlineList: boolean;
  separator: boolean;
  placeholder: boolean;
  chip: boolean;
}

function walk(nodes: EntryNode[] | undefined, uses: EntryUses): void {
  for (const n of nodes ?? []) {
    if ('tag' in n) walk(n.children, uses);
    else if ('fragment' in n) walk(n.fragment, uses);
    else if ('field' in n) {
      uses.editableText = true;
      if (n.placeholder !== false) uses.placeholder = true;
    } else if ('separator' in n || 'word' in n) uses.separator = true;
    else if ('bullets' in n) uses.bulletList = true;
    else if ('chip' in n) uses.chip = true;
    else if ('inlineList' in n) {
      uses.inlineList = true;
      uses.placeholder = true;
    }
  }
}

/** The node's own condition, as a JS expression over `item`; or none. */
function condition(n: EntryNode): string | undefined {
  if (n.whenAny) return `(${n.whenAny.map((f) => `item.${f}`).join(' || ')})`;
  if (n.when === undefined) return undefined;
  const all = typeof n.when === 'string' ? [n.when] : n.when;
  return all.map((f) => `item.${f}`).join(' && ');
}

function emitNode(d: TemplateDescription, n: EntryNode): string {
  const body = emitBare(d, n);
  const when = condition(n);
  if (!when) return body;
  /* A bare `{"text"}` is an expression already; anything else is markup. */
  const inner = body.startsWith('{') ? body.slice(1, -1) : `(\n${body}\n)`;
  return `{${when} && ${inner}}`;
}

function emitBare(d: TemplateDescription, n: EntryNode): string {
  if ('tag' in n) {
    const attrs =
      (n.class ? ` className=${q(cls(d, n.class))}` : '') +
      (n.decorative ? ' aria-hidden="true"' : '') +
      (n.block ? ' data-block' : '');
    const children = (n.children ?? []).map((c) => emitNode(d, c)).join('\n');
    return children
      ? `<${n.tag}${attrs}>\n${children}\n</${n.tag}>`
      : `<${n.tag}${attrs} />`;
  }
  if ('fragment' in n) {
    return `<>\n${n.fragment.map((c) => emitNode(d, c)).join('\n')}\n</>`;
  }
  if ('field' in n) {
    const value = n.optional ? `item.${n.field} ?? ''` : `item.${n.field}`;
    return (
      `<EditableText path={\`\${path}.${n.field}\`} value={${value}} ` +
      (n.placeholder === false
        ? '/>'
        : `placeholder={placeholder(${q(n.placeholder ?? n.field)})} />`)
    );
  }
  if ('text' in n) return `{${q(n.text)}}`;
  if ('separator' in n) {
    const [a, b] = n.between;
    return `<Separator between={[item.${a}, item.${b}]} text=${q(n.separator)} />`;
  }
  if ('word' in n) {
    const [a, b] = n.between;
    return `<Separator between={[item.${a}, item.${b}]} word=${q(n.word)} />`;
  }
  if ('bullets' in n) {
    return `<EditableBulletList path={\`\${path}.${n.bullets}\`} items={item.${n.bullets}} />`;
  }
  if ('chip' in n) {
    return `<InitialsChip name={item.${n.chip}} className=${q(cls(d, n.class))} />`;
  }
  return (
    `<EditableInlineList path={\`\${path}.${n.inlineList}\`} items={item.${n.inlineList}} ` +
    `placeholder={placeholder(${q(n.placeholder ?? n.inlineList)})} />`
  );
}

function emitEntry(d: TemplateDescription, entry: Entry): string {
  const r = entry.root;
  const attrs =
    ` {...itemProps} className=${q(cls(d, r.class))}` +
    (r.block ? ' data-block' : '');
  const children = entry.children.map((c) => emitNode(d, c)).join('\n');
  const uses = emptyUses();
  walk(entry.children, uses);
  return (
    `export function ${entryComponentName(d, entry)}({\n` +
    `  item,\n  path,\n  chrome,\n  itemProps,\n}: {\n` +
    `  item: ${entry.type};\n  path: string;\n  chrome: ReactNode;\n  itemProps: ItemRootProps;\n}) {\n` +
    (uses.placeholder ? `  const { placeholder } = useEditorText();\n` : '') +
    `  return (\n<${r.tag}${attrs}>\n{chrome}\n${children}\n</${r.tag}>\n  );\n}\n`
  );
}

function emptyUses(): EntryUses {
  return {
    editableText: false,
    bulletList: false,
    inlineList: false,
    separator: false,
    placeholder: false,
    chip: false,
  };
}

function emitEntries(d: TemplateDescription): string {
  const entries = Object.values(d.entries);
  const uses = emptyUses();
  for (const e of entries) walk(e.children, uses);
  const types = [...new Set(entries.map((e) => e.type))].sort();
  const imports = [
    `import type { ReactNode } from 'react';`,
    `import type { ItemRootProps } from '../../collections/CollectionItems.js';`,
    `import { ${types.map((t) => `type ${t}`).join(', ')} } from '@resumekit/schema';`,
    uses.editableText &&
      `import { EditableText } from '../../nodes/EditableText.js';`,
    uses.bulletList &&
      `import { EditableBulletList } from '../../nodes/EditableBulletList.js';`,
    uses.inlineList &&
      `import { EditableInlineList } from '../../nodes/EditableInlineList.js';`,
    uses.placeholder && `import { useEditorText } from '../../i18n/index.js';`,
    uses.separator && `import { Separator } from '../../kit/Separator.js';`,
    uses.chip && `import { InitialsChip } from '../../kit/InitialsChip.js';`,
  ].filter(Boolean);
  return (
    generatedHeader(d.id) +
    imports.join('\n') +
    '\n\n' +
    entries.map((e) => emitEntry(d, e)).join('\n')
  );
}

type ContactNode = Extract<LayoutNode, { kind: 'contact' }>;

interface Ctx {
  d: TemplateDescription;
  /** Each contact node's variable: `contact`, then `contact2`, … */
  contacts: Map<ContactNode, string>;
}

interface SectionStyle {
  sectionClass?: string;
  headingClass?: string;
}

function sectionClasses(
  d: TemplateDescription,
  style: SectionStyle,
  kit: readonly string[] = [],
): string {
  return [
    cls(d, d.classes.section),
    ...(style.sectionClass ? [cls(d, style.sectionClass)] : []),
    ...kit,
  ].join(' ');
}

function headingClasses(d: TemplateDescription, style: SectionStyle): string {
  return [
    d.classes.heading,
    ...(style.headingClass ? [style.headingClass] : []),
  ]
    .map((x) => cls(d, x))
    .join(' ');
}

function sectionProps(
  d: TemplateDescription,
  id: string,
  title: string,
  style: SectionStyle,
  kit: readonly string[] = [],
): string {
  return (
    `id=${q(id)}\n` +
    `heading={resume.section_headings?.${id}}\n` +
    `title={doc.t.sections.${title}}\n` +
    `className=${q(sectionClasses(d, style, kit))}\n` +
    `headingClassName=${q(headingClasses(d, style))}` +
    leadProp(d)
  );
}

/** Every heading's lead, when the description accents headings. */
function leadProp(d: TemplateDescription): string {
  return d.headingAccent === undefined ? '' : `\nheadingLead={headingLead}`;
}

function entryCollection(
  d: TemplateDescription,
  s: { section: string; entry: string; gap?: boolean },
): string {
  const entry = d.entries[s.entry] as Entry;
  return (
    `<Collection section=${q(s.section)} items={resume.${s.section}}` +
    `${s.gap === false ? ' gap={false}' : ''}>\n` +
    `{({ item, path, chrome, itemProps }) => (\n` +
    `<${entryComponentName(d, entry)} item={item} path={path} chrome={chrome} itemProps={itemProps} />\n` +
    `)}\n</Collection>`
  );
}

/** `className="…"` from a template class and kit classes; empty for none. */
function classAttr(
  d: TemplateDescription,
  own: string | undefined,
  kit: readonly string[] = [],
): string {
  const names = [...(own ? [cls(d, own)] : []), ...kit];
  return names.length > 0 ? ` className=${q(names.join(' '))}` : '';
}

interface Wrapper {
  tag: string;
  class?: string;
  kit?: readonly string[];
  block?: boolean;
  split?: boolean;
}

function wrap(
  d: TemplateDescription,
  w: Wrapper | undefined,
  body: string,
): string {
  if (!w) return body;
  const attrs =
    classAttr(d, w.class, w.kit) +
    (w.block ? ' data-block' : '') +
    (w.split ? ' data-split' : '');
  return `<${w.tag}${attrs}>\n${body}\n</${w.tag}>`;
}

function titled(
  d: TemplateDescription,
  when: string,
  id: string,
  title: string,
  style: SectionStyle,
  body: string,
): string {
  return (
    `{${when} && (\n` +
    `<DocumentSection\n${sectionProps(d, id, title, style)}\n>\n${body}\n</DocumentSection>\n)}`
  );
}

const offered = (field: string) => `(resume.${field}.length > 0 || authoring)`;

/** The kit's skill groups, in the wrapper each style is drawn in by default. */
function skillGroups(
  d: TemplateDescription,
  groups: 'bullets' | 'inline' | 'grid' | 'tags',
  wrapper: Wrapper | undefined,
): string {
  if (groups === 'grid' || groups === 'tags') {
    const [list, group] =
      groups === 'grid'
        ? ['tpl-skill-grid', 'GridSkillGroup']
        : ['tpl-skill-tags', 'TagSkillGroup'];
    return wrap(
      d,
      {
        tag: wrapper?.tag ?? 'div',
        class: wrapper?.class,
        kit: [list, ...(wrapper?.kit ?? [])],
      },
      `<Collection section="skills" items={resume.skills}>\n` +
        `{({ item, path, chrome, itemProps }) => (\n` +
        `<${group} item={item} path={path} chrome={chrome} itemProps={itemProps} />\n` +
        `)}\n</Collection>`,
    );
  }
  const w: Wrapper =
    wrapper ??
    (groups === 'bullets'
      ? { tag: 'div', kit: ['tpl-keywords'], split: true }
      : { tag: 'p', class: 'keywords' });
  const item =
    groups === 'bullets'
      ? `{({ item, path }) => <BulletSkillGroup item={item} path={path} />}`
      : `{({ item, path, index }) => <InlineSkillGroup item={item} path={path} first={index === 0} />}`;
  return wrap(
    d,
    { ...w, block: w.block ?? true },
    `<Collection section="skills" items={resume.skills} noun="skill" gap={false}>\n${item}\n</Collection>`,
  );
}

function emitSection(d: TemplateDescription, s: Section): string {
  switch (s.section) {
    case 'summary':
      return titled(
        d,
        '(resume.summary || authoring)',
        'summary',
        s.title,
        s,
        `<p className=${q(cls(d, s.paragraph))} data-block>\n` +
          `<EditableText path="summary" value={resume.summary ?? ''} ` +
          `placeholder={placeholder("summary")} multiline />\n</p>`,
      );
    case 'experience':
    case 'education':
      return titled(
        d,
        offered(s.section),
        s.section,
        s.title,
        s,
        wrap(d, s.wrapper, entryCollection(d, s)),
      );
    case 'skills':
      return titled(
        d,
        offered('skills'),
        'skills',
        s.title,
        s,
        s.entry
          ? wrap(d, s.wrapper, entryCollection(d, { ...s, entry: s.entry }))
          : skillGroups(d, s.groups ?? 'bullets', s.wrapper),
      );
    case 'achievements':
    case 'courses':
    case 'passions':
      return (
        `<DescribedEntries\n${sectionProps(d, s.section, s.title, s, s.kit)}\nitems={resume.${s.section}}\n` +
        `entryClassName=${q(cls(d, d.classes.described))}\n/>`
      );
    case 'certifications':
      return titled(
        d,
        s.whenEmpty === 'hide'
          ? 'resume.certifications.length > 0'
          : offered('certifications'),
        'certifications',
        s.title,
        s,
        s.as === 'bullets'
          ? wrap(
              d,
              { tag: 'div', class: s.class, block: true, split: s.split },
              `<EditableBulletList path="certifications" items={resume.certifications} ` +
                `placeholder={placeholder("certification")} />`,
            )
          : `<p className=${q(cls(d, s.class ?? 'prose'))} data-block>\n` +
              `<EditableInlineList path="certifications" items={resume.certifications} ` +
              `placeholder={placeholder("certifications")} />\n</p>`,
      );
    case 'languages':
      return (
        `<LanguageList\nitems={resume.languages}\n` +
        `heading={resume.section_headings?.languages}\n` +
        `className=${q(sectionClasses(d, s))}\n` +
        `headingClassName=${q(headingClasses(d, s))}` +
        leadProp(d) +
        `\nrowClassName=${q(cls(d, s.row))}\n/>`
      );
    case 'custom':
      return (
        `<CustomSections\nsections={resume.custom_sections}\n` +
        `sectionClass=${q(sectionClasses(d, s))}\n` +
        `headingClass=${q(headingClasses(d, s))}` +
        leadProp(d) +
        `\nEntry={${entryComponentName(d, d.entries[s.entry] as Entry)}}\n/>`
      );
  }
}

function containerStyle(n: Container): (readonly [string, string | number])[] {
  return [
    ...(n.span !== undefined ? [['--tpl-grow', n.span] as const] : []),
    ...(n.width !== undefined
      ? ([
          ['--tpl-grow', 0],
          ['--tpl-shrink', 0],
          ['--tpl-basis', n.width],
        ] as const)
      : []),
    ...(n.gap !== undefined ? [['--tpl-gap', n.gap] as const] : []),
    ...Object.entries(n.vars ?? {}),
  ];
}

function contactCondition(c: Ctx, n: ContactNode): string {
  const v = c.contacts.get(n) as string;
  return n.links
    ? `(${v}.length > 0 || resume.links.length > 0 || authoring)`
    : `${v}.length > 0`;
}

/** The test behind a container's `when`, the same one its part uses. */
function containerCondition(c: Ctx, n: Container): string | undefined {
  switch (n.when) {
    case undefined:
      return undefined;
    case 'headline':
      return '(resume.headline || authoring)';
    case 'location':
      return 'resume.contact.location';
    case 'links':
      return '(resume.links.length > 0 || authoring)';
    case 'contact': {
      /* Every contact line inside, not the first: a block that opens with the
         address alone must still show for a resume that has only links. */
      const inner = nodesOf(n.children).filter(
        (x): x is ContactNode => x.kind === 'contact',
      );
      if (inner.length === 0)
        throw new Error('when: contact needs a contact line inside');
      return inner.length === 1
        ? contactCondition(c, inner[0])
        : `(${inner.map((x) => contactCondition(c, x)).join(' || ')})`;
    }
  }
}

function emitContainer(c: Ctx, n: Container, flow: boolean): string {
  const { d } = c;
  const tag = n.tag ?? 'div';
  const style = containerStyle(n);
  const attrs =
    classAttr(d, n.class, n.kit) +
    (n.decorative ? ' aria-hidden="true"' : '') +
    (n.kind === 'row'
      ? ' data-layout="row"'
      : n.gap !== undefined
        ? ' data-layout="stack"'
        : '') +
    (n.span !== undefined || n.width !== undefined
      ? ' data-layout-sized'
      : '') +
    (flow ? ' data-flow' : '') +
    (n.block ? ' data-block' : '') +
    (style.length > 0
      ? ` style={{ ${style.map(([k, v]) => `${q(k)}: ${q(String(v))}`).join(', ')} } as CSSProperties}`
      : '');
  const heading =
    n.heading !== undefined
      ? `<Heading level={2} className=${q(
          [d.classes.heading, ...(n.headingClass ? [n.headingClass] : [])]
            .map((x) => cls(d, x))
            .join(' '),
        )} data-block data-keep-with-next>\n${
          d.headingAccent === undefined
            ? `{doc.t.panels.${n.heading}}`
            : `{leadLetters(headingLead)(doc.t.panels.${n.heading})}`
        }\n</Heading>\n`
      : '';
  /* A row of sections makes each of its columns a flow of its own. */
  const flows = n.kind === 'row' && holdsSections(n);
  const children = n.children.map((x) => emitLayout(c, x, flows)).join('\n\n');
  const element = `<${tag}${attrs}>\n${heading}${children}\n</${tag}>`;
  const when = containerCondition(c, n);
  return when ? `{${when} && (\n${element}\n)}` : element;
}

function emitLayout(c: Ctx, n: LayoutNode, flow = false): string {
  const { d } = c;
  switch (n.kind) {
    case 'row':
    case 'stack':
      return emitContainer(c, n, flow);
    case 'name':
      return (
        `<Heading level={1} className=${q(cls(d, n.class))}${n.block ? ' data-block' : ''}>\n` +
        `<EditableText path="name" value={resume.name}${
          n.split
            ? ` shape={nameParts(${q(cls(d, 'name-first'))}, ${q(cls(d, 'name-last'))})}`
            : ''
        } />\n</Heading>`
      );
    case 'headline':
      return (
        `{(resume.headline || authoring) && (\n` +
        `<${n.tag} className=${q(cls(d, n.class))}${n.block ? ' data-block' : ''}>\n` +
        (n.prefix !== undefined ? `{doc.t.labels.${n.prefix}}\n` : '') +
        `<EditableText path="headline" value={resume.headline ?? ''} placeholder={placeholder('headline')} />\n` +
        `</${n.tag}>\n)}`
      );
    case 'avatar':
      return `<InitialsAvatar name={resume.name} className=${q(cls(d, n.class))} />`;
    case 'monogram': {
      const initials = n.inner
        ? `<span>{monogram(resume.name)}</span>`
        : `{monogram(resume.name)}`;
      return `<${n.tag} className=${q(cls(d, n.class))} aria-hidden="true">\n${initials}\n</${n.tag}>`;
    }
    case 'contact': {
      const v = c.contacts.get(n) as string;
      const editable = `<EditableText path={path} value={value} placeholder={placeholder} />`;
      /* Each detail names its field in a class, which survives the picture
         render that drops `data-path`; a line of one bare field takes it. */
      const each = n.item
        ? `<${n.itemTag} key={path} className={\`${cls(d, n.item)} tpl-contact--\${field}\`}>\n${editable}\n</${n.itemTag}>`
        : editable.replace('<EditableText ', '<EditableText key={path} ');
      const linkClass = [
        ...(n.item ? [cls(d, n.item)] : []),
        'tpl-contact--link',
      ].join(' ');
      const links = n.links
        ? `<Collection\nsection="links"\nitems={resume.links}\ngap={false}\nemptyAdd="inline"\n>\n` +
          `{({ item, path, chrome, itemProps, justAdded }) => (\n` +
          `<${n.itemTag} className=${q(linkClass)}>\n<span {...itemProps}>\n{chrome}\n` +
          `<LinkField item={item} path={path} justAdded={justAdded} />\n</span>\n</${n.itemTag}>\n)}\n</Collection>`
        : '';
      const own = [
        cls(d, n.class),
        ...(n.item === false && n.fields.length === 1
          ? [`tpl-contact--${n.fields[0]}`]
          : []),
        ...(n.icons ? ['tpl-contact-icons'] : []),
      ].join(' ');
      return (
        `{${contactCondition(c, n)} && (\n` +
        `<${n.tag} className=${q(own)}${n.block ? ' data-block' : ''}>\n` +
        `{${v}.map(({ ${n.item ? 'field, ' : ''}path, value, placeholder }) => (\n${each}\n))}\n` +
        `${links}\n</${n.tag}>\n)}`
      );
    }
    case 'links':
      return (
        `<${n.tag} className=${q([cls(d, n.class), ...(n.icons ? ['tpl-contact-icons'] : [])].join(' '))} data-block${n.split ? ' data-split' : ''}>\n` +
        `<Collection section="links" items={resume.links} gap={false}>\n` +
        `{({ item, path, chrome, itemProps, justAdded }) => (\n` +
        `<li {...itemProps} className=${q(`${cls(d, n.item)} tpl-contact--link`)}>\n{chrome}\n` +
        `<LinkField item={item} path={path} justAdded={justAdded} />\n</li>\n)}\n` +
        `</Collection>\n</${n.tag}>`
      );
    case 'location':
      return `{resume.contact.location}`;
    case 'text':
      return `{${q(n.text)}}`;
    case 'component':
      return `<${n.name} resume={resume} />`;
    case 'section': {
      const { kind: _, ...section } = n;
      return emitSection(d, section as Section);
    }
  }
}

function nodesOf(nodes: LayoutNode[]): LayoutNode[] {
  return nodes.flatMap((n) =>
    n.kind === 'row' || n.kind === 'stack' ? [n, ...nodesOf(n.children)] : [n],
  );
}

function emitDocument(d: TemplateDescription): string {
  const nodes = nodesOf(d.layout);
  const has = (kind: LayoutNode['kind']) => nodes.some((n) => n.kind === kind);
  const sections = sectionsOf(d.layout);
  const uses = (...names: Section['section'][]) =>
    sections.some((s) => names.includes(s.section));
  const contactNodes = nodes.filter(
    (n): n is ContactNode => n.kind === 'contact',
  );
  const c: Ctx = {
    d,
    contacts: new Map(
      contactNodes.map((n, i) => [n, i === 0 ? 'contact' : `contact${i + 1}`]),
    ),
  };
  const skills = sections.find((s) => s.section === 'skills');
  const groups = skills?.section === 'skills' ? skills.groups : undefined;
  const certs = sections.find((s) => s.section === 'certifications');
  const certsAs = certs?.section === 'certifications' ? certs.as : undefined;
  const components = nodes.filter(
    (n): n is Extract<LayoutNode, { kind: 'component' }> =>
      n.kind === 'component',
  );
  const styled = nodes.some(
    (n) =>
      (n.kind === 'row' || n.kind === 'stack') && containerStyle(n).length > 0,
  );
  const linkFields = has('links') || contactNodes.some((n) => n.links);
  const panelHeadings = nodes.some(
    (n) => (n.kind === 'row' || n.kind === 'stack') && n.heading !== undefined,
  );
  const textShapes = [
    ...(d.headingAccent !== undefined && panelHeadings ? ['leadLetters'] : []),
    ...(nodes.some((n) => n.kind === 'name' && n.split) ? ['nameParts'] : []),
  ];
  const entryNames = [
    ...new Set(
      sections.flatMap((s) =>
        'entry' in s && s.entry
          ? [entryComponentName(d, d.entries[s.entry] as Entry)]
          : [],
      ),
    ),
  ].sort();
  const needsSection = uses(
    'summary',
    'experience',
    'education',
    'skills',
    'certifications',
  );
  const needsCollection =
    uses('experience', 'education', 'skills') || linkFields;
  const imports = [
    styled && `import type { CSSProperties } from 'react';`,
    `import type { ResumeObject } from '@resumekit/schema';`,
    `import { useDocumentStyle } from '../../presentation-context.js';`,
    `import { useAuthoring } from '../../collections/authoring-context.js';`,
    `import { EditableText } from '../../nodes/EditableText.js';`,
    certsAs === 'inline' &&
      `import { EditableInlineList } from '../../nodes/EditableInlineList.js';`,
    certsAs === 'bullets' &&
      `import { EditableBulletList } from '../../nodes/EditableBulletList.js';`,
    uses('custom') &&
      `import { CustomSections } from '../../nodes/CustomSections.js';`,
    needsCollection &&
      `import { Collection } from '../../collections/Collection.js';`,
    needsSection &&
      `import { DocumentSection } from '../../kit/DocumentSection.js';`,
    uses('achievements', 'courses', 'passions') &&
      `import { DescribedEntries } from '../../kit/DescribedEntries.js';`,
    uses('languages') &&
      `import { LanguageList } from '../../kit/LanguageList.js';`,
    groups === 'bullets' &&
      `import { BulletSkillGroup } from '../../kit/BulletSkillGroup.js';`,
    groups === 'inline' &&
      `import { InlineSkillGroup } from '../../kit/InlineSkillGroup.js';`,
    groups === 'grid' &&
      `import { GridSkillGroup } from '../../kit/GridSkillGroup.js';`,
    groups === 'tags' &&
      `import { TagSkillGroup } from '../../kit/TagSkillGroup.js';`,
    has('avatar') &&
      `import { InitialsAvatar } from '../../kit/InitialsAvatar.js';`,
    has('monogram') && `import { monogram } from '../../kit/monogram.js';`,
    textShapes.length > 0 &&
      `import { ${textShapes.join(', ')} } from '../../kit/textShapes.js';`,
    contactNodes.length > 0 &&
      `import { useContactLines } from '../../kit/contact.js';`,
    `import { documentStyle } from '../../kit/documentStyle.js';`,
    `import { Heading } from '../../kit/Heading.js';`,
    linkFields && `import { LinkField } from '../../nodes/LinkField.js';`,
    entryNames.length > 0 &&
      `import { ${entryNames.join(', ')} } from './entries.js';`,
    ...[...new Set(components.map((n) => n.from))]
      .sort()
      .map(
        (from) =>
          `import { ${[...new Set(components.filter((n) => n.from === from).map((n) => n.name))].sort().join(', ')} } from '${from}';`,
      ),
    (has('row') || styled) && `import '../../kit/layout.css';`,
    nodes.some(
      (n) => (n.kind === 'contact' || n.kind === 'links') && n.icons,
    ) && `import '../../kit/contact-icons.css';`,
    `import './${d.id}.css';`,
    `import { useEditorText, useDocumentText } from '../../i18n/index.js';`,
  ].filter(Boolean);

  const hooks = contactNodes
    .map(
      (n) =>
        `  const ${c.contacts.get(n)} = useContactLines(\n    resume.contact,\n    ${JSON.stringify(n.fields).replace(/"/g, "'")},\n    authoring,\n  );\n`,
    )
    .join('');

  return (
    generatedHeader(d.id) +
    imports.join('\n') +
    `\n\nexport interface ${d.component}DocumentProps {\n  resume: ResumeObject;\n}\n\n` +
    `export function ${d.component}Document({ resume }: ${d.component}DocumentProps) {\n` +
    `  const { placeholder } = useEditorText();\n` +
    `  const doc = useDocumentText();\n` +
    `  const style = useDocumentStyle();\n` +
    `  const authoring = useAuthoring() !== null;\n\n` +
    (hooks ? `${hooks}\n` : '') +
    (d.headingAccent !== undefined
      ? `  const headingLead = { count: ${d.headingAccent}, className: ${q(cls(d, 'heading-lead'))} };\n\n`
      : '') +
    `  return (\n<article\nclassName=${q(d.prefix)}\nstyle={documentStyle(${q(d.styleKey)}, style)}\n` +
    `aria-label={doc.t.resume}\nlang={doc.locale}\n>\n` +
    d.layout.map((n) => emitLayout(c, n)).join('\n\n') +
    `\n</article>\n  );\n}\n`
  );
}
