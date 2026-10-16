import { renderToStaticMarkup } from 'react-dom/server';
import '../all-templates.js';
import { TEMPLATE_RENDERERS } from '../registry.js';
import { DocumentPresentationProvider } from '../presentation-context.js';
import { PictureProvider } from '../picture-context.js';
import type { RenderStatic } from './api.js';

/**
 * A template's read-only page as HTML. Read-only, every field is plain markup
 * from props, so the server render is the browser's (`parity.spec.tsx`). The
 * root is the app's read-only one (`TemplateDocument`), without pagination.
 */
export const renderStatic: RenderStatic = (template, resume, options = {}) => {
  const { Document } = TEMPLATE_RENDERERS[template];
  const page = (
    <div className="tpl-editor tpl-editor--static">
      <DocumentPresentationProvider language={options.language}>
        <Document resume={resume} />
      </DocumentPresentationProvider>
    </div>
  );
  return renderToStaticMarkup(
    options.picture ? <PictureProvider>{page}</PictureProvider> : page,
  );
};
