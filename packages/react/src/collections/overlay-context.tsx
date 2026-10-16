import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { ResumeEdits, ResumeObject } from '@cvgs/core';

/**
 * What the document was PROJECTED from: the writer's résumé and the overlay
 * applied to it.
 *
 * Not a capability — this says nothing about what may be done to the document —
 * but the answer to a question every surface has to ask: which entry is drawn
 * in which position, and therefore what each field's path is. A résumé the
 * candidate has reordered renders `experience.2` in first place, and its fields
 * must keep saying `experience.2.*` so a stored value follows the job rather
 * than the position.
 *
 * It exists because that answer used to come from the AUTHORING context, which
 * only the editor mounts. The saved-résumé view and the export renderer
 * therefore fell back to numbering entries by where they were drawn — so every
 * per-path value on a reordered entry was read at the wrong address there:
 * a space set above the second role, and its bolding and its link with it,
 * silently moved to whichever role happened to be drawn second. The document on
 * screen and the document that gets sent have to agree about what an entry is
 * called, so both mount this.
 */
export interface DocumentOverlay {
  /** The writer's résumé — what every slot reference resolves against. */
  base?: ResumeObject;
  /** The overlay it was projected through. Structural operations only matter. */
  edits?: ResumeEdits;
}

const OverlayContext = createContext<DocumentOverlay>({});

export function DocumentOverlayProvider({
  base,
  edits,
  children,
}: DocumentOverlay & { children: ReactNode }) {
  // Keyed on the values themselves: this is read by every collection in the
  // document, and a fresh object per render would re-derive all of them.
  const value = useMemo(() => ({ base, edits }), [base, edits]);
  return (
    <OverlayContext.Provider value={value}>{children}</OverlayContext.Provider>
  );
}

/** What the document was projected from, or an empty answer outside one. */
export function useDocumentOverlay(): DocumentOverlay {
  return useContext(OverlayContext);
}
