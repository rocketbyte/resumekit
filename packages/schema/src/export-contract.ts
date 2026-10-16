/**
 * The contract between the API that builds an export and the browser that draws
 * it — declared here, in the library that owns the document, so the two sides
 * cannot describe it differently.
 *
 * It lives in `libs/core` — not beside the bundle — precisely so both sides can
 * hold it without either depending on the other. `apps/api` builds the document
 * and ships the bundle as an opaque asset; it imports no template, no component
 * and no React, so no `scope:api → scope:templates` edge exists.
 */
import type { CoverLetter } from './cover-letter.js';
import type { ResumeObject } from './resume.js';
import type { ResumePresentation } from './template.js';

/** The global the shell writes and the bundle reads. */
export const EXPORT_PAYLOAD_GLOBAL = '__CVGS_EXPORT__';

/** The global the bundle writes and the renderer waits on. */
export const EXPORT_STATE_GLOBAL = '__CVGS_EXPORT_STATE__';

/** The global carrying the page count, once the document has settled. */
export const EXPORT_PAGES_GLOBAL = '__CVGS_EXPORT_PAGES__';

/**
 * What the renderer waits for.
 *
 * `waitForExpression` is given `ready`; `failed` exists so a document that
 * cannot be drawn ends the wait immediately with a diagnosable state rather
 * than burning the full timeout and reporting only that it expired.
 */
export type ExportState = 'pending' | 'ready' | 'failed';

/** Everything the browser needs to draw a resume, and nothing else. */
export interface ResumeExportPayload {
  resume: ResumeObject;
  presentation?: ResumePresentation;
}

/**
 * Everything the browser needs to draw a cover letter. The date line arrives
 * already written, so the file does not depend on the renderer's locale or
 * clock.
 */
export interface LetterExportPayload {
  letter: CoverLetter;
  date: string;
}

export type ExportPayload = ResumeExportPayload | LetterExportPayload;

export function isLetterPayload(
  payload: ExportPayload,
): payload is LetterExportPayload {
  return 'letter' in payload;
}

/**
 * Paper has no gap between its pages.
 *
 * The single parameter separating the exported document from the one on screen.
 * Named here rather than written as a bare `0` at the call site, so the reason
 * travels with the value.
 */
export const PRINT_SHEET_GAP = 0;
