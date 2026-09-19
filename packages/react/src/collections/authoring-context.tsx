import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';
import { documentShapeKey } from '@cvgs/core';
import type { ResumeEdits, ResumeObject } from '@cvgs/core';
import { EntrySelectionProvider } from './selection-context.js';
import { RailProvider } from '../rail/rail-store.js';
import { DocumentOverlayProvider } from './overlay-context.js';

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
  /**
   * The overlay as it stood when the document's SHAPE last changed — what to
   * DERIVE from: which entries exist, in what order, at what address.
   *
   * Deliberately not the live overlay. An addition's words live inside its own
   * `append` edit, so the overlay gets a new identity for every character typed
   * into a new role, and a context value that followed it re-rendered every
   * field on the page four times a word. None of the questions asked of this
   * — `collectionOrder`, `additionPaths` — can answer differently for a
   * different sentence, so a snapshot per shape is both cheaper and the same
   * answer.
   */
  edits: ResumeEdits;
  /**
   * The overlay RIGHT NOW, for building the next one.
   *
   * A function, so it cannot be captured stale. Everything that writes reads
   * through here: rebuilding an overlay from the snapshot above would put back
   * the placeholder text a new entry was minted with and undo the sentence
   * somebody had just typed into it.
   */
  liveEdits: () => ResumeEdits;
  /** Replace the overlay. One call per operation, so undo has whole steps. */
  onEditsChange: (next: ResumeEdits) => void;
}

const AuthoringContext = createContext<AuthoringContextValue | null>(null);

/** What the editor supplies: the writer's résumé, the overlay NOW, and a writer. */
export interface DocumentAuthoring {
  base: ResumeObject;
  /** The overlay as it currently stands, structural operations included. */
  edits: ResumeEdits;
  onEditsChange: (next: ResumeEdits) => void;
}

export function DocumentAuthoringProvider({
  value,
  children,
}: {
  value: DocumentAuthoring;
  children: ReactNode;
}) {
  const { base, edits, onEditsChange } = value;

  /*
   * The live overlay, and the snapshot the document derives from — separated
   * HERE rather than at the call site, so the distinction cannot be got wrong
   * by whoever mounts the next authorable surface. A caller hands over the
   * overlay as it stands; what reaches the document is a value whose identity
   * moves only when the document's shape does, plus a way to read the live one.
   */
  const live = useRef(edits);
  live.current = edits;
  const liveEdits = useCallback(() => live.current, []);

  const shape = documentShapeKey(edits);
  const snapshot = useMemo(
    () => live.current,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [shape],
  );

  const published = useMemo<AuthoringContextValue>(
    () => ({ base, edits: snapshot, liveEdits, onEditsChange }),
    [base, snapshot, liveEdits, onEditsChange],
  );

  return (
    <AuthoringContext.Provider value={published}>
      {/*
       * An authorable document is a PROJECTION of these two values, so it
       * publishes them as one — a caller that mounts authoring never has to
       * remember to mount the projection beside it. A document that cannot be
       * edited mounts the projection on its own; see `overlay-context.tsx` for
       * why both surfaces must have it.
       */}
      <DocumentOverlayProvider base={base} edits={snapshot}>
        {/*
         * Which entry is selected is state this provider OWNS rather than takes,
         * because it is a fact about the editing session and not about the
         * document — nothing stores it, nothing saves it, and a caller that had to
         * pass it in would be a caller that could get it wrong. One selection for
         * the whole document, so choosing a qualification puts away the role's
         * overlay.
         */}
        <RailProvider>
          <EntrySelectionProvider>{children}</EntrySelectionProvider>
        </RailProvider>
      </DocumentOverlayProvider>
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
