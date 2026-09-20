import type { ComponentType } from 'react';
import type { ResumeObject, TemplateId } from '@cvgs/core';
import { EditableText } from './nodes/EditableText.js';
import { EditableBulletList } from './nodes/EditableBulletList.js';
import { EditableInlineList } from './nodes/EditableInlineList.js';
import { HarvardDocument } from './templates/harvard/HarvardDocument.js';
import { IvyDocument } from './templates/ivy/IvyDocument.js';
import { ClassicDocument } from './templates/classic/ClassicDocument.js';
import { CompactDocument } from './templates/compact/CompactDocument.js';
import { TimelineDocument } from './templates/timeline/TimelineDocument.js';
import { ModernDocument } from './templates/modern/ModernDocument.js';
import { StylishDocument } from './templates/stylish/StylishDocument.js';
import { CreativeDocument } from './templates/creative/CreativeDocument.js';
import { ContemporaryDocument } from './templates/contemporary/ContemporaryDocument.js';
import { DoubleColumnDocument } from './templates/double-column/DoubleColumnDocument.js';
import { DoubleColumnLogosDocument } from './templates/double-column-logos/DoubleColumnLogosDocument.js';
import { ExecutiveDocument } from './templates/executive/ExecutiveDocument.js';
import { MeridianDocument } from './templates/meridian/MeridianDocument.js';
import { CobaltDocument } from './templates/cobalt/CobaltDocument.js';
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
}

export const TEMPLATE_RENDERERS: Record<TemplateId, TemplateRenderer> = {
  harvard: { Document: HarvardDocument },
  ivy: { Document: IvyDocument },
  classic: { Document: ClassicDocument },
  compact: { Document: CompactDocument },
  timeline: { Document: TimelineDocument },
  modern: { Document: ModernDocument },
  stylish: { Document: StylishDocument },
  creative: { Document: CreativeDocument },
  contemporary: { Document: ContemporaryDocument },
  'double-column': { Document: DoubleColumnDocument },
  'double-column-logos': { Document: DoubleColumnLogosDocument },
  executive: { Document: ExecutiveDocument },
  meridian: { Document: MeridianDocument },
  cobalt: { Document: CobaltDocument },
};

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
