import type {
  Entry,
  EntryNode,
  Section,
  TemplateDescription,
} from './schema.js';

/**
 * A template description → the template's two source files, as text.
 *
 * Pure and deterministic: the same description always yields the same bytes,
 * so the drift check can compare by string. Formatting is the caller's (the
 * generator runs Prettier over the result); this produces correct, readable
 * TSX, not pretty TSX.
 *
 * The output composes the kit exactly as a hand-written template does — the
 * same components, props and markup — so the editor, the paginator and the PDF
 * see nothing new.
 */
export interface Emitted {
  document: string;
  entries: string;
}

const q = (s: string) => JSON.stringify(s);

export function generatedHeader(id: string): string {
  return (
    `/*\n` +
    ` * GENERATED from ${id}.template.yaml by @cvgs/resume-templates' template compiler.\n` +
    ` * Do not edit: change the description and run the package's\n` +
    ` * \`generate-templates\` script. \`check-templates\` fails when they disagree.\n` +
    ` */\n`
  );
}

export function emit(d: TemplateDescription): Emitted {
  return { document: emitDocument(d), entries: emitEntries(d) };
}

/* ------------------------------------------------------------- entries --- */

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
}

function walk(nodes: EntryNode[] | undefined, uses: EntryUses): void {
  for (const n of nodes ?? []) {
    if ('tag' in n) walk(n.children, uses);
    else if ('field' in n) {
      uses.editableText = true;
      uses.placeholder = true;
    } else if ('separator' in n) uses.separator = true;
    else if ('bullets' in n) uses.bulletList = true;
    else if ('inlineList' in n) {
      uses.inlineList = true;
      uses.placeholder = true;
    }
  }
}

function emitNode(d: TemplateDescription, n: EntryNode): string {
  if ('tag' in n) {
    const attrs =
      (n.class ? ` className=${q(cls(d, n.class))}` : '') +
      (n.block ? ' data-block' : '');
    const children = (n.children ?? []).map((c) => emitNode(d, c)).join('\n');
    return children
      ? `<${n.tag}${attrs}>\n${children}\n</${n.tag}>`
      : `<${n.tag}${attrs} />`;
  }
  if ('field' in n) {
    const value = n.optional ? `item.${n.field} ?? ''` : `item.${n.field}`;
    return (
      `<EditableText path={\`\${path}.${n.field}\`} value={${value}} ` +
      `placeholder={placeholder(${q(n.placeholder ?? n.field)})} />`
    );
  }
  if ('text' in n) return `{${q(n.text)}}`;
  if ('separator' in n) {
    const [a, b] = n.between;
    return `<Separator between={[item.${a}, item.${b}]} text=${q(n.separator)} />`;
  }
  if ('bullets' in n) {
    return `<EditableBulletList path={\`\${path}.${n.bullets}\`} items={item.${n.bullets}} />`;
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
    `import { ${types.map((t) => `type ${t}`).join(', ')} } from '@cvgs/core';`,
    uses.editableText &&
      `import { EditableText } from '../../nodes/EditableText.js';`,
    uses.bulletList &&
      `import { EditableBulletList } from '../../nodes/EditableBulletList.js';`,
    uses.inlineList &&
      `import { EditableInlineList } from '../../nodes/EditableInlineList.js';`,
    uses.placeholder && `import { useEditorText } from '../../i18n/index.js';`,
    uses.separator && `import { Separator } from '../../kit/Separator.js';`,
  ].filter(Boolean);
  return (
    generatedHeader(d.id) +
    imports.join('\n') +
    '\n\n' +
    entries.map((e) => emitEntry(d, e)).join('\n')
  );
}

/* ------------------------------------------------------------ document --- */

function sectionProps(
  d: TemplateDescription,
  section: string,
  title: string,
): string {
  return (
    `id=${q(section)}\n` +
    `heading={resume.section_headings?.${section}}\n` +
    `title={doc.t.sections.${title}}\n` +
    `className=${q(cls(d, d.classes.section))}\n` +
    `headingClassName=${q(cls(d, d.classes.sectionTitle))}`
  );
}

function emitSection(d: TemplateDescription, s: Section): string {
  switch (s.kind) {
    case 'text':
      return (
        `{(resume.${s.section} || authoring) && (\n` +
        `<DocumentSection\n${sectionProps(d, s.section, s.title)}\n>\n` +
        `<p className=${q(cls(d, s.class))} data-block>\n` +
        `<EditableText path=${q(s.section)} value={resume.${s.section} ?? ''} ` +
        `placeholder={placeholder(${q(s.section)})}${s.multiline ? ' multiline' : ''} />\n` +
        `</p>\n</DocumentSection>\n)}`
      );
    case 'entries': {
      const entry = d.entries[s.entry] as Entry;
      const collection =
        `<Collection section=${q(s.section)} items={resume.${s.section}}` +
        `${s.gap === false ? ' gap={false}' : ''}>\n` +
        `{({ item, path, chrome, itemProps }) => (\n` +
        `<${entryComponentName(d, entry)} item={item} path={path} chrome={chrome} itemProps={itemProps} />\n` +
        `)}\n</Collection>`;
      const body = s.wrapper
        ? `<${s.wrapper.tag} className=${q(cls(d, s.wrapper.class))}${s.wrapper.block ? ' data-block' : ''}>\n${collection}\n</${s.wrapper.tag}>`
        : collection;
      return (
        `{(resume.${s.section}.length > 0 || authoring) && (\n` +
        `<DocumentSection\n${sectionProps(d, s.section, s.title)}\n>\n${body}\n</DocumentSection>\n)}`
      );
    }
    case 'described':
      return (
        `<DescribedEntries\n${sectionProps(d, s.section, s.title)}\nitems={resume.${s.section}}\n` +
        `entryClassName=${q(cls(d, d.classes.described))}\n/>`
      );
    case 'inline-list': {
      const when =
        s.offerWhenEmpty === false
          ? `resume.${s.section}.length > 0`
          : `(resume.${s.section}.length > 0 || authoring)`;
      return (
        `{${when} && (\n` +
        `<DocumentSection\n${sectionProps(d, s.section, s.title)}\n>\n` +
        `<p className=${q(cls(d, s.class))} data-block>\n` +
        `<EditableInlineList path=${q(s.section)} items={resume.${s.section}} ` +
        `placeholder={placeholder(${q(s.section)})} />\n` +
        `</p>\n</DocumentSection>\n)}`
      );
    }
    case 'languages':
      return (
        `<LanguageList\nitems={resume.languages}\n` +
        `heading={resume.section_headings?.languages}\n` +
        `className=${q(cls(d, d.classes.section))}\n` +
        `headingClassName=${q(cls(d, d.classes.sectionTitle))}\n` +
        `rowClassName=${q(cls(d, s.rowClass))}\n/>`
      );
    case 'custom': {
      const entry = d.entries[s.entry] as Entry;
      return (
        `<CustomSections\nsections={resume.custom_sections}\n` +
        `sectionClass=${q(cls(d, d.classes.section))}\n` +
        `headingClass=${q(cls(d, d.classes.sectionTitle))}\n` +
        `Entry={${entryComponentName(d, entry)}}\n/>`
      );
    }
  }
}

function emitHeader(d: TemplateDescription): string {
  const links = d.header.links
    ? `<Collection\nsection="links"\nitems={resume.links}\ngap={false}\nemptyAdd="inline"\n>\n` +
      `{({ item, path, chrome, itemProps, justAdded }) => (\n` +
      `<span className=${q(cls(d, 'contact-item'))}>\n<span {...itemProps}>\n{chrome}\n` +
      `<LinkField item={item} path={path} justAdded={justAdded} />\n</span>\n</span>\n)}\n</Collection>`
    : '';
  return (
    `<header className=${q(cls(d, 'head'))} data-block>\n` +
    `<h1 className=${q(cls(d, 'name'))}>\n<EditableText path="name" value={resume.name} />\n</h1>\n\n` +
    `{(resume.headline || authoring) && (\n<p className=${q(cls(d, 'headline'))}>\n` +
    `<EditableText path="headline" value={resume.headline ?? ''} placeholder={placeholder('headline')} />\n</p>\n)}\n\n` +
    `{(contact.length > 0${d.header.links ? ' || resume.links.length > 0' : ''} || authoring) && (\n` +
    `<p className=${q(cls(d, 'contact'))}>\n` +
    `{contact.map(({ path, value, placeholder }) => (\n` +
    `<span key={path} className=${q(cls(d, 'contact-item'))}>\n` +
    `<EditableText path={path} value={value} placeholder={placeholder} />\n</span>\n))}\n` +
    `${links}\n</p>\n)}\n</header>`
  );
}

function emitDocument(d: TemplateDescription): string {
  const entryNames = [
    ...new Set(
      d.sections.flatMap((s) =>
        s.kind === 'entries' || s.kind === 'custom'
          ? [entryComponentName(d, d.entries[s.entry] as Entry)]
          : [],
      ),
    ),
  ].sort();
  const kinds = new Set(d.sections.map((s) => s.kind));
  const needsSection =
    kinds.has('text') || kinds.has('entries') || kinds.has('inline-list');
  const needsCollection = kinds.has('entries') || d.header.links;
  const imports = [
    `import type { ResumeObject } from '@cvgs/core';`,
    `import { useDocumentStyle } from '../../presentation-context.js';`,
    `import { useAuthoring } from '../../collections/authoring-context.js';`,
    `import { EditableText } from '../../nodes/EditableText.js';`,
    kinds.has('inline-list') &&
      `import { EditableInlineList } from '../../nodes/EditableInlineList.js';`,
    kinds.has('custom') &&
      `import { CustomSections } from '../../nodes/CustomSections.js';`,
    needsCollection &&
      `import { Collection } from '../../collections/Collection.js';`,
    needsSection &&
      `import { DocumentSection } from '../../kit/DocumentSection.js';`,
    kinds.has('described') &&
      `import { DescribedEntries } from '../../kit/DescribedEntries.js';`,
    kinds.has('languages') &&
      `import { LanguageList } from '../../kit/LanguageList.js';`,
    `import { useContactLines } from '../../kit/contact.js';`,
    `import { documentStyle } from '../../kit/documentStyle.js';`,
    d.header.links && `import { LinkField } from '../../nodes/LinkField.js';`,
    entryNames.length > 0 &&
      `import { ${entryNames.join(', ')} } from './entries.js';`,
    `import './${d.id}.css';`,
    `import { useEditorText, useDocumentText } from '../../i18n/index.js';`,
  ].filter(Boolean);

  const sections = d.sections.map((s) => emitSection(d, s)).join('\n\n');
  return (
    generatedHeader(d.id) +
    imports.join('\n') +
    `\n\nexport interface ${d.component}DocumentProps {\n  resume: ResumeObject;\n}\n\n` +
    `export function ${d.component}Document({ resume }: ${d.component}DocumentProps) {\n` +
    `  const { placeholder } = useEditorText();\n` +
    `  const doc = useDocumentText();\n` +
    `  const style = useDocumentStyle();\n` +
    `  const authoring = useAuthoring() !== null;\n\n` +
    `  const contact = useContactLines(\n    resume.contact,\n    ${JSON.stringify(d.header.contact).replace(/"/g, "'")},\n    authoring,\n  );\n\n` +
    `  return (\n<article\nclassName=${q(d.prefix)}\nstyle={documentStyle(${q(d.styleKey)}, style)}\n` +
    `aria-label={doc.t.resume}\nlang={doc.locale}\n>\n` +
    emitHeader(d) +
    '\n\n' +
    sections +
    `\n</article>\n  );\n}\n`
  );
}
