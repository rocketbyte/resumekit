import { createElement, use, type ComponentType } from 'react';
import type { ResumeObject, TemplateId } from '@resumekit/schema';
import { EditableText } from './nodes/EditableText.js';
import { EditableBulletList } from './nodes/EditableBulletList.js';
import { EditableInlineList } from './nodes/EditableInlineList.js';
import './nodes/template-node.css';

/**
 * Every template's renderer, loaded on first use.
 *
 * Each template is its own module, with its own stylesheet, behind a dynamic
 * import: an application downloads the code and CSS of the templates it
 * actually draws, not of the whole catalog. A template that has loaded renders
 * synchronously from then on, so only the first draw of each one suspends —
 * `TemplateDocument` holds a Suspense boundary for it, and an application that
 * renders `Document` itself needs one too (or preloads; see `preloadTemplate`).
 *
 * `registry.spec.ts` asserts this map and `TEMPLATES` in `@resumekit/schema`
 * name exactly the same templates; the loader map below is typed by
 * `TemplateId`, so a catalog entry with no loader does not compile.
 */
/**
 * What every template's document component accepts: the resume, and nothing
 * else. Presentation arrives by context, because Craft node props are frozen at
 * mount — see `presentation-context.tsx`.
 */
export interface TemplateDocumentProps {
  resume: ResumeObject;
}

export interface TemplateRenderer {
  Document: ComponentType<TemplateDocumentProps>;
}

export interface TemplateRenderer {
  Document: ComponentType<TemplateDocumentProps>;
}

type DocumentComponent = ComponentType<TemplateDocumentProps>;

const LOADERS: Record<TemplateId, () => Promise<DocumentComponent>> = {
  harvard: () =>
    import('./templates/harvard/HarvardDocument.js').then(
      (m) => m.HarvardDocument,
    ),
  ivy: () =>
    import('./templates/ivy/IvyDocument.js').then((m) => m.IvyDocument),
  classic: () =>
    import('./templates/classic/ClassicDocument.js').then(
      (m) => m.ClassicDocument,
    ),
  compact: () =>
    import('./templates/compact/CompactDocument.js').then(
      (m) => m.CompactDocument,
    ),
  timeline: () =>
    import('./templates/timeline/TimelineDocument.js').then(
      (m) => m.TimelineDocument,
    ),
  modern: () =>
    import('./templates/modern/ModernDocument.js').then(
      (m) => m.ModernDocument,
    ),
  stylish: () =>
    import('./templates/stylish/StylishDocument.js').then(
      (m) => m.StylishDocument,
    ),
  creative: () =>
    import('./templates/creative/CreativeDocument.js').then(
      (m) => m.CreativeDocument,
    ),
  contemporary: () =>
    import('./templates/contemporary/ContemporaryDocument.js').then(
      (m) => m.ContemporaryDocument,
    ),
  'double-column': () =>
    import('./templates/double-column/DoubleColumnDocument.js').then(
      (m) => m.DoubleColumnDocument,
    ),
  'double-column-logos': () =>
    import('./templates/double-column-logos/DoubleColumnLogosDocument.js').then(
      (m) => m.DoubleColumnLogosDocument,
    ),
  elegant: () =>
    import('./templates/elegant/ElegantDocument.js').then(
      (m) => m.ElegantDocument,
    ),
  'elegant-logos': () =>
    import('./templates/elegant-logos/ElegantLogosDocument.js').then(
      (m) => m.ElegantLogosDocument,
    ),
  polished: () =>
    import('./templates/polished/PolishedDocument.js').then(
      (m) => m.PolishedDocument,
    ),
  executive: () =>
    import('./templates/executive/ExecutiveDocument.js').then(
      (m) => m.ExecutiveDocument,
    ),
  meridian: () =>
    import('./templates/meridian/MeridianDocument.js').then(
      (m) => m.MeridianDocument,
    ),
  cobalt: () =>
    import('./templates/cobalt/CobaltDocument.js').then(
      (m) => m.CobaltDocument,
    ),
  crimson: () =>
    import('./templates/crimson/CrimsonDocument.js').then(
      (m) => m.CrimsonDocument,
    ),
  engineer: () =>
    import('./templates/engineer/EngineerDocument.js').then(
      (m) => m.EngineerDocument,
    ),
  split: () =>
    import('./templates/split/SplitDocument.js').then((m) => m.SplitDocument),
  academic: () =>
    import('./templates/academic/AcademicDocument.js').then(
      (m) => m.AcademicDocument,
    ),
  alta: () =>
    import('./templates/alta/AltaDocument.js').then((m) => m.AltaDocument),
  prism: () =>
    import('./templates/prism/PrismDocument.js').then((m) => m.PrismDocument),
  hipster: () =>
    import('./templates/hipster/HipsterDocument.js').then(
      (m) => m.HipsterDocument,
    ),
  scholar: () =>
    import('./templates/scholar/ScholarDocument.js').then(
      (m) => m.ScholarDocument,
    ),
  portrait: () =>
    import('./templates/portrait/PortraitDocument.js').then(
      (m) => m.PortraitDocument,
    ),
  curve: () =>
    import('./templates/curve/CurveDocument.js').then((m) => m.CurveDocument),
};

const loaded = new Map<TemplateId, DocumentComponent>();
const loading = new Map<TemplateId, Promise<DocumentComponent>>();

/**
 * Starts loading a template, and resolves once it can render synchronously.
 *
 * Call it as soon as the template is known — a saved resume's template id, the
 * one under the pointer in a chooser — so the first draw does not wait.
 */
export function preloadTemplate(id: TemplateId): Promise<DocumentComponent> {
  let pending = loading.get(id);
  if (!pending) {
    pending = LOADERS[id]().then((Document) => {
      loaded.set(id, Document);
      return Document;
    });
    loading.set(id, pending);
  }
  return pending;
}

/** Loads several templates — every one when no ids are given (tests, servers). */
export async function preloadTemplates(
  ids: readonly TemplateId[] = Object.keys(LOADERS) as TemplateId[],
): Promise<void> {
  await Promise.all(ids.map(preloadTemplate));
}

/**
 * Marks templates as loaded without a dynamic import. Used by
 * `@resumekit/react/all-templates`, which imports every template eagerly for
 * renderers that cannot wait (server-side rendering, the export bundle).
 */
export function registerTemplates(
  documents: Record<TemplateId, DocumentComponent>,
): void {
  for (const [id, Document] of Object.entries(documents) as [
    TemplateId,
    DocumentComponent,
  ][]) {
    loaded.set(id, Document);
    loading.set(id, Promise.resolve(Document));
  }
}

function deferred(id: TemplateId): DocumentComponent {
  function DeferredTemplate(props: TemplateDocumentProps) {
    const Document = loaded.get(id) ?? use(preloadTemplate(id));
    return createElement(Document, props);
  }
  DeferredTemplate.displayName = `Template(${id})`;
  return DeferredTemplate;
}

export const TEMPLATE_RENDERERS = Object.fromEntries(
  (Object.keys(LOADERS) as TemplateId[]).map((id) => [
    id,
    { Document: deferred(id) },
  ]),
) as Record<TemplateId, TemplateRenderer>;

/**
 * The editable field components, for the test that no field accepts a
 * presentational prop.
 *
 * A list rather than a resolver: there is no library to resolve a name for any
 * more (`retire-craftjs`), but the RULE those nodes are held to survives the
 * mechanism — a field may carry `bold`, `align`, `ink` and `href` from the
 * catalog, and never a style, a class or a dimension.
 */
export const REGISTERED_NODES: [string, unknown][] = [
  ['EditableText', EditableText],
  ['EditableBulletList', EditableBulletList],
  ['EditableInlineList', EditableInlineList],
];
