import type { ComponentType } from 'react';
import type { Resolver } from '@craftjs/core';
import type { ResumeObject, TemplateId } from '@cvgs/core';
import { EditableText } from './nodes/EditableText.js';
import { EditableBulletList } from './nodes/EditableBulletList.js';
import { EditableInlineList } from './nodes/EditableInlineList.js';
import { HarvardDocument } from './templates/harvard/HarvardDocument.js';
import './nodes/template-node.css';

/**
 * A template's renderer: the document component, plus the Craft.js resolver that
 * can reconstruct its node tree.
 *
 * Adding a template is one entry here and one document file — everything else
 * (the editor, the overlay, the save path, the print rules) is template-agnostic
 * by construction. `registry.spec.ts` asserts this map and `TEMPLATES` in
 * `@cvgs/core` name exactly the same templates, so a catalog entry with no
 * renderer, or a renderer no catalog knows about, fails the suite.
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
  resolver: Resolver;
}

/** The nodes every template edits with. Shared, because the overlay is shared. */
const EDITABLE_NODES: Resolver = {
  EditableText,
  EditableBulletList,
  EditableInlineList,
};

export const TEMPLATE_RENDERERS: Record<TemplateId, TemplateRenderer> = {
  harvard: {
    Document: HarvardDocument,
    resolver: { ...EDITABLE_NODES, HarvardDocument },
  },
};

/** Every node component the registry can instantiate, for the lock test. */
export const REGISTERED_NODES = Object.values(TEMPLATE_RENDERERS).flatMap(
  (renderer) => Object.entries(renderer.resolver),
);
