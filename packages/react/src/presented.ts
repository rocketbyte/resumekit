import {
  applyPresentation,
  type ResumeEdits,
  type ResumeObject,
} from '@resumekit/schema';

/**
 * The resume as it should be drawn: the writer's output with the candidate's
 * corrections applied.
 *
 * Lives with the DOCUMENT rather than with the editor, because it answers "what
 * is on the page" — the question every surface that draws a résumé has to
 * answer, including the server-side renderer that never loads an editor.
 *
 * Falls back to the writer's own resume if the overlay cannot be applied. An
 * overlay is data at rest that can outlive the schema it was written against,
 * and a resume that will not open is a worse failure than an edit that does not
 * show — so the document always renders.
 */
export function presentedResume(
  base: ResumeObject,
  edits: ResumeEdits,
): ResumeObject {
  try {
    return applyPresentation(base, edits);
  } catch {
    return base;
  }
}
