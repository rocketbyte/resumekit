/**
 * `@cvgs/resume-templates` — the document, and only the document.
 *
 * The résumé's templates, the nodes their text is edited through, the page
 * geometry and the paginator live here so that **every surface that draws a
 * résumé draws the same one**: the editor in `apps/web`, and the server-side
 * renderer that produces the PDF. Fidelity between screen and file is not a
 * test that runs after the fact — it is the absence of a second definition.
 *
 * What is NOT here is application: the control rail, the download menu, the
 * overlay serializer, the route, the miniatures. Those are how a person works
 * on a document, not what a document is.
 *
 * The library depends on `@cvgs/core` for the catalog and the schemas, on React
 * and Craft.js to render, and on nothing else. It reaches no server SDK, no HTTP
 * client, and no application code.
 */

/** The renderer for a template id, plus the resolver that rebuilds its tree. */
export {
  TEMPLATE_RENDERERS,
  REGISTERED_NODES,
  type TemplateRenderer,
  type TemplateDocumentProps,
} from './registry.js';

/** A résumé drawn read-only, with a presentation applied. */
export { TemplateDocument } from './TemplateDocument.js';

/**
 * The résumé as it should be drawn — the writer's output plus the candidate's
 * overlay. Document-side, because it answers what is on the page.
 */
export { presentedResume } from './presented.js';

/** The sheet: real page geometry, and the measurement that fills it. */
export { PagedSheet, useRepaginate, useSheetZoom } from './PagedSheet.js';

/** Where a page ends. The same decision on screen and on paper. */
export * from './pagination.js';

/**
 * The view zoom: how large the page is DRAWN, which is never how large it is.
 *
 * A surface that can edit passes `maxZoom` to `PagedSheet`; everything that
 * merely renders takes the default of 1 and gets no zoom and no control.
 */
export {
  ZOOM_MAX,
  ZOOM_MIN,
  ZOOM_STEP,
  ZOOM_SETTLE_MS,
  fitZoom,
  step,
} from './useFitZoom.js';

/** Presentation reaches nodes through context, never through frozen props. */
export {
  DocumentPresentationProvider,
  useDocumentStyle,
  useFieldFormat,
} from './presentation-context.js';

/**
 * Authoring: what a candidate may do to a repeatable part of the document.
 *
 * The PROVIDER is exported and the operations are not. A surface that can edit
 * mounts the provider; everything inside reads what it may do from there, and
 * nothing outside this library can reach an add, a remove or a move. That is
 * what keeps the read-only document, the saved-résumé view and the export
 * renderer free of authoring by construction rather than by remembering.
 */
export { DocumentAuthoringProvider } from './collections/authoring-context.js';
export {
  FieldRegistryProvider,
  useField,
  useFieldRegistry,
  type Field,
  type FieldRegistry,
} from './fields/field-registry.js';

// Dates that disagree with the résumé's chronological order, marked where they
// are. Editor-only: the preview and the export renderer mount no provider.
export {
  DateIssuesProvider,
  useDateIssue,
  type DateIssuesProviderProps,
} from './fields/date-issues-context.js';

/**
 * Autosave: the document tells the surface when it is worth storing.
 *
 * Exported the same way authoring is, and for the same reason. The PROVIDER
 * crosses the boundary; the request functions do not. A surface that persists a
 * résumé mounts this and supplies the one call it already had — everything
 * inside asks through the context, and a surface that only draws a document
 * mounts nothing and therefore writes nothing.
 */
export { DocumentAutosaveProvider } from './autosave-context.js';

/**
 * Spacing: the gap above a section or an entry, as a control in the gap.
 *
 * The PROVIDER crosses the boundary and the handle does not, on the same terms
 * as authoring above. A surface that can edit mounts this and supplies the one
 * write; a surface that only draws a résumé mounts nothing, so every gap in it
 * renders the space a candidate recorded and no control at all.
 */
export { DocumentOverlayProvider } from './collections/overlay-context.js';
export {
  DocumentSpacingProvider,
  type DocumentSpacingValue,
  type SpaceTarget,
} from './spacing/spacing-context.js';
export type { AutosaveContextValue } from './autosave-context.js';
export { preloadEditingLayer } from './collections/preload.js';
export type { AuthoringContextValue } from './collections/authoring-context.js';

/** The editable nodes, and the rules that keep them locked. */
export { EditableText } from './nodes/EditableText.js';
export { EditableBulletList } from './nodes/EditableBulletList.js';
export { EditableInlineList } from './nodes/EditableInlineList.js';
export { CustomSections } from './nodes/CustomSections.js';
export { BOUNDED_NODE_PROPS, FORBIDDEN_NODE_PROPS } from './nodes/locked.js';
export type { FieldFormatting, LinkTarget } from './nodes/formatting.js';
