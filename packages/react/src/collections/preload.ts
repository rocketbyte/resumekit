/**
 * Fetch the editing layer before anything needs it.
 *
 * The controls live behind a dynamic import so that a document which is only
 * being read — the saved-résumé view, and the renderer that produces the PDF —
 * never loads them or the drag library they use. That split is worth keeping,
 * but it has a cost the editor should not pay: the chunk is requested when the
 * first collection renders its first control, which is the moment a candidate
 * reaches for one.
 *
 * So a surface that KNOWS it will be edited says so on mount, and the fetch
 * overlaps the time somebody spends reading their résumé rather than the time
 * they spend waiting for a button.
 *
 * Idempotent: the module cache makes a second call free, so a caller may say it
 * as often as it likes.
 */
export function preloadEditingLayer(): Promise<unknown> {
  return Promise.all([
    import('./AuthoredItems.js'),
    import('../nodes/AuthoredBullets.js'),
  ]);
}
