/**
 * A dev harness: every template, drawn with a résumé that populates all nine
 * sections, beside a link to the reference it was built from.
 *
 * Not shipped and not tested — `pnpm nx run resume-templates:gallery` and look.
 * It exists because the four supporting sections can only be judged by eye,
 * and `renderToStaticMarkup` of this library renders empty résumés.
 */
import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { TEMPLATES, type TemplateId } from '@resumekit/schema';
import { TemplateDocument } from '../src/TemplateDocument.js';
import { TEMPLATE_RENDERERS } from '../src/registry.js';
import { DocumentAuthoringProvider } from '../src/collections/authoring-context.js';
import { DocumentSpacingProvider } from '../src/spacing/spacing-context.js';
import { DocumentPresentationProvider } from '../src/presentation-context.js';
import { FieldRegistryProvider } from '../src/fields/field-registry.js';
import { RESUME } from './fixture.js';
import '../src/document.css';
import './gallery.css';

/**
 * The document as the BUILDER mounts it, so the gallery can show what a
 * candidate can actually touch — the section headings, the add controls, the
 * space handles. `TemplateDocument` mounts no field registry, which is right
 * for a preview and useless for checking that a heading takes a caret.
 */
function Authored({ id }: { id: TemplateId }) {
  const { Document } = TEMPLATE_RENDERERS[id];
  return (
    <DocumentAuthoringProvider
      value={{ base: RESUME, edits: [], onEditsChange: () => undefined }}
    >
      <DocumentSpacingProvider value={{ onChange: () => undefined }}>
        <DocumentPresentationProvider>
          <FieldRegistryProvider enabled>
            <div className="tpl-editor">
              <Document resume={RESUME} />
            </div>
          </FieldRegistryProvider>
        </DocumentPresentationProvider>
      </DocumentSpacingProvider>
    </DocumentAuthoringProvider>
  );
}

const IDS = Object.keys(TEMPLATES) as TemplateId[];

function Gallery() {
  const [id, setId] = useState<TemplateId>('modern');
  const [editing, setEditing] = useState(false);
  return (
    <div className="g">
      <nav className="g__nav">
        <p className="g__title">Templates</p>
        {IDS.map((t) => (
          <button
            key={t}
            className={t === id ? 'g__pick g__pick--on' : 'g__pick'}
            onClick={() => setId(t)}
          >
            {TEMPLATES[t].name}
          </button>
        ))}
        <label className="g__toggle">
          <input
            type="checkbox"
            checked={editing}
            onChange={(e) => setEditing(e.target.checked)}
          />{' '}
          Editing — click a heading to rename it
        </label>
        <p className="g__note">
          Reference:{' '}
          <a href={`/refs/${id}.png`} target="_blank" rel="noreferrer">
            {id}.png
          </a>
        </p>
      </nav>
      <main className="g__stage">
        {editing ? (
          <Authored id={id} />
        ) : (
          <TemplateDocument
            resume={RESUME}
            presentation={{ template_id: id, edits: [], updated_at: '' }}
          />
        )}
      </main>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<Gallery />);
