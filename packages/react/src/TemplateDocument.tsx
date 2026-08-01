import { Editor, Element, Frame } from '@craftjs/core';
import {
  DEFAULT_TEMPLATE_ID,
  type ResumePresentation,
  type ResumeObject,
} from '@cvgs/core';
import { TEMPLATE_RENDERERS } from './registry.js';
import { presentedResume } from './serialize.js';
import { PagedSheet } from './PagedSheet.js';
import { DocumentPresentationProvider } from './presentation-context.js';
import './designer.css';

export interface TemplateDocumentProps {
  /** The writer's resume object. */
  resume: ResumeObject;
  /** How the owner chose to present it; absent means the default template. */
  presentation?: ResumePresentation;
}

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
}: TemplateDocumentProps) {
  const templateId = presentation?.template_id ?? DEFAULT_TEMPLATE_ID;
  const { Document, resolver, sheetClassName } = TEMPLATE_RENDERERS[templateId];
  const presented = presentedResume(resume, presentation?.edits ?? []);

  return (
    <div className="tpl-editor tpl-editor--static">
      <Editor resolver={resolver} enabled={false}>
        {/* Same paged canvas and the same presentation path as the designer,
            so a saved resume shows the same pages in the same places as the
            editor that produced it. */}
        <DocumentPresentationProvider
          style={presentation?.style}
          formats={presentation?.formats}
        >
          <PagedSheet
            measureKey={JSON.stringify(presentation?.style)}
            sheetClassName={sheetClassName}
          >
            <Frame>
              <Element is={Document} resume={presented} />
            </Frame>
          </PagedSheet>
        </DocumentPresentationProvider>
      </Editor>
    </div>
  );
}
