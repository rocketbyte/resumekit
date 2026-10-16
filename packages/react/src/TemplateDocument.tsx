import {
  DEFAULT_TEMPLATE_ID,
  type ResumePresentation,
  type ResumeObject,
} from '@resumekit/schema';
import { Suspense } from 'react';
import { TEMPLATE_RENDERERS } from './registry.js';
import { presentedResume } from './presented.js';
import { PagedSheet } from './PagedSheet.js';
import { DocumentPresentationProvider } from './presentation-context.js';
import { DocumentSpacingProvider } from './spacing/spacing-context.js';
import { DocumentOverlayProvider } from './collections/overlay-context.js';
import './document.css';

export interface TemplateDocumentProps {
  /** The writer's resume object. */
  resume: ResumeObject;
  /** How the owner chose to present it; absent means the default template. */
  presentation?: ResumePresentation;
  /**
   * The gap between sheets. Defaults to the gap drawn on screen; the export
   * renderer passes `0`, because paper has none.
   *
   * This is the whole of the difference between the document on screen and the
   * document in the file. Everything else — the components, the stylesheets, the
   * geometry, the paginator — is one definition used twice.
   */
  sheetGap?: number;
  /**
   * Shrink the page to fit a container narrower than the paper, as on a phone.
   * For viewing only: the export must never pass it, since a rendered page is
   * the page.
   */
  shrinkToFit?: boolean;
}

/**
 * Below this a page is unreadable anyway; it scrolls rather than shrinks.
 * 0.3 is what a 320px phone needs once the card's padding is taken: at 0.35 the
 * page was wider than its card there and lost its right edge.
 */
const SHRINK_MIN = 0.3;

/**
 * A resume rendered read-only in its template.
 *
 * The same component tree the designer edits, mounted with `enabled={false}` so
 * nothing is selectable and no field ever becomes an input. Reusing the tree
 * rather than writing a second renderer is what guarantees the read-only view
 * and the editable one cannot drift apart — there is one Harvard template, not a
 * viewing copy and an editing copy.
 */
export function TemplateDocument({
  resume,
  presentation,
  sheetGap,
  shrinkToFit = false,
}: TemplateDocumentProps) {
  const templateId = presentation?.template_id ?? DEFAULT_TEMPLATE_ID;
  const { Document } = TEMPLATE_RENDERERS[templateId];
  const presented = presentedResume(resume, presentation?.edits ?? []);

  return (
    <div className="tpl-editor tpl-editor--static">
      {/* No field registry, so every field renders as text and neither the
          preview nor the export has to remember to turn anything off. */}
      {/* Same paged canvas and the same presentation path as the designer,
            so a saved resume shows the same pages in the same places as the
            editor that produced it. */}
      <DocumentPresentationProvider
        style={presentation?.style}
        formats={presentation?.formats}
        language={presentation?.language}
      >
        {/*
         * The recorded space, with no way to change it.
         *
         * Mounted without an `onChange`, which is the whole of what makes
         * this read-only: every gap renders the space its owner recorded and
         * draws no handle, so the saved-résumé view and the PDF renderer
         * carry the document and none of the workshop. The same rule the
         * authoring context follows, stated the same way.
         */}
        {/*
         * What this document was projected from, so its entries are addressed
         * the same way the editor addressed them. Without it a reordered
         * résumé numbered its entries by where they were DRAWN here, and
         * every stored value on one — its space, its bolding, its link — was
         * read at the wrong address.
         */}
        <DocumentOverlayProvider
          base={resume}
          edits={presentation?.edits ?? []}
        >
          <DocumentSpacingProvider
            value={{ sections: presentation?.section_spacing }}
          >
            {/* A template loads on first use; the sheet mounts once it has. */}
            <Suspense fallback={null}>
              <PagedSheet
                sheetGap={sheetGap}
                minZoom={shrinkToFit ? SHRINK_MIN : 1}
                measureKey={JSON.stringify([
                  presentation?.style,
                  presentation?.section_spacing,
                ])}
              >
                <Document resume={presented} />
              </PagedSheet>
            </Suspense>
          </DocumentSpacingProvider>
        </DocumentOverlayProvider>
      </DocumentPresentationProvider>
    </div>
  );
}
