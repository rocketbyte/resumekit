/**
 * `@resumekit/react/all-templates`: every template, loaded now.
 *
 * Import it once where a template must render without waiting — server-side
 * rendering, a print bundle, a test suite. In a browser application leave it
 * out: templates load on first use, each with its own stylesheet.
 */
import { registerTemplates } from './registry.js';
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
import { ElegantDocument } from './templates/elegant/ElegantDocument.js';
import { ElegantLogosDocument } from './templates/elegant-logos/ElegantLogosDocument.js';
import { PolishedDocument } from './templates/polished/PolishedDocument.js';
import { ExecutiveDocument } from './templates/executive/ExecutiveDocument.js';
import { MeridianDocument } from './templates/meridian/MeridianDocument.js';
import { CobaltDocument } from './templates/cobalt/CobaltDocument.js';
import { CrimsonDocument } from './templates/crimson/CrimsonDocument.js';
import { EngineerDocument } from './templates/engineer/EngineerDocument.js';
import { SplitDocument } from './templates/split/SplitDocument.js';
import { AcademicDocument } from './templates/academic/AcademicDocument.js';
import { AltaDocument } from './templates/alta/AltaDocument.js';
import { PrismDocument } from './templates/prism/PrismDocument.js';
import { HipsterDocument } from './templates/hipster/HipsterDocument.js';
import { ScholarDocument } from './templates/scholar/ScholarDocument.js';
import { PortraitDocument } from './templates/portrait/PortraitDocument.js';
import { CurveDocument } from './templates/curve/CurveDocument.js';

registerTemplates({
  harvard: HarvardDocument,
  ivy: IvyDocument,
  classic: ClassicDocument,
  compact: CompactDocument,
  timeline: TimelineDocument,
  modern: ModernDocument,
  stylish: StylishDocument,
  creative: CreativeDocument,
  contemporary: ContemporaryDocument,
  'double-column': DoubleColumnDocument,
  'double-column-logos': DoubleColumnLogosDocument,
  elegant: ElegantDocument,
  'elegant-logos': ElegantLogosDocument,
  polished: PolishedDocument,
  executive: ExecutiveDocument,
  meridian: MeridianDocument,
  cobalt: CobaltDocument,
  crimson: CrimsonDocument,
  engineer: EngineerDocument,
  split: SplitDocument,
  academic: AcademicDocument,
  alta: AltaDocument,
  prism: PrismDocument,
  hipster: HipsterDocument,
  scholar: ScholarDocument,
  portrait: PortraitDocument,
  curve: CurveDocument,
});
