import { createContext, useContext, type ReactNode } from 'react';
import type { ResumeEdits, ResumeObject } from '@cvgs/core';
import { EntrySelectionProvider } from './selection-context.js';

/**
 * What a document needs in order to be authored, rather than only read.
 *
 * Supplied by the editor and by nothing else. The read-only document mounts no
 * provider, so every collection inside it reports `canAdd: false` and renders no
 * control — which is how the printed page, the saved-résumé view and the export
 * renderer stay free of authoring chrome without any of them opting out.
 *
 * Deliberately the same shape of dependency as `presentation-context`: a
 * template asks for what it needs and never learns who is answering.
 */
export interface AuthoringContextValue {
  /** The writer's résumé — what every slot reference is resolved against. */
  base: ResumeObject;
  /** The overlay as it currently stands, structural operations included. */
  edits: ResumeEdits;
  /** Replace the overlay. One call per operation, so undo has whole steps. */
  onEditsChange: (next: ResumeEdits) => void;
}

const AuthoringContext = createContext<AuthoringContextValue | null>(null);

export function DocumentAuthoringProvider({
  value,
  children,
}: {
  value: AuthoringContextValue;
  children: ReactNode;
}) {
  return (
    <AuthoringContext.Provider value={value}>
      {/*
       * Which entry is selected is state this provider OWNS rather than takes,
       * because it is a fact about the editing session and not about the
       * document — nothing stores it, nothing saves it, and a caller that had to
       * pass it in would be a caller that could get it wrong. One selection for
       * the whole document, so choosing a qualification puts away the role's
       * overlay.
       */}
      <EntrySelectionProvider>{children}</EntrySelectionProvider>
    </AuthoringContext.Provider>
  );
}

/**
 * The authoring capability, or `null` when the document is only being read.
 *
 * Returning `null` rather than throwing is the point: a template must render
 * identically whether or not it can be edited, and a component that had to know
 * which mode it was in would be two components.
 */
export function useAuthoring(): AuthoringContextValue | null {
  return useContext(AuthoringContext);
}
