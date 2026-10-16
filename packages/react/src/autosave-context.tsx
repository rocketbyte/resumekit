import { createContext, useContext, type ReactNode } from 'react';

/**
 * How a document says it has changed enough to be worth storing.
 *
 * The candidate no longer presses anything: there is no save control, so the
 * document is responsible for knowing when it has become worth writing down.
 * That knowledge is genuinely per-component and cannot be recovered from the
 * outside — a surface watching the overlay sees only "something differs", and
 * cannot tell a keystroke mid-word from a role the candidate just deleted. So
 * each component says which of the two it just did, and the host decides what
 * that costs in requests.
 *
 * Two verbs, and the difference between them is the only decision a component
 * makes:
 *
 * - `saveNow` — a discrete act that is finished the moment it happens. Adding a
 *   bullet, removing a role, reordering. There is no "rest of it" coming, and
 *   waiting would only mean the candidate watching an unsaved document.
 * - `saveSoon` — one keystroke of something still being typed. The host
 *   coalesces these, so a sentence is one write rather than forty.
 *
 * Both end in the same call — the one the save button used to make. Nothing
 * here saves anything; this is a way to ASK, and the host owns the answer.
 */
export interface AutosaveContextValue {
  /** Store the document as soon as the change has landed. */
  saveNow: () => void;
  /** Store the document once the typing it belongs to has settled. */
  saveSoon: () => void;
}

/**
 * What a document that is only being read does when it is asked to save:
 * nothing.
 *
 * A default rather than a `null` for the same reason `useFieldFormat` has one —
 * a component must render identically whether or not it can be edited, and a
 * component that had to ask which mode it was in before it could report a
 * change would be two components. The read-only document, the saved-résumé view
 * and the export renderer mount no provider and therefore never write.
 */
const NEVER: AutosaveContextValue = {
  saveNow: () => undefined,
  saveSoon: () => undefined,
};

const AutosaveContext = createContext<AutosaveContextValue>(NEVER);

export function DocumentAutosaveProvider({
  value,
  children,
}: {
  value: AutosaveContextValue;
  children: ReactNode;
}) {
  return (
    <AutosaveContext.Provider value={value}>
      {children}
    </AutosaveContext.Provider>
  );
}

/** How this component reports that it changed the document. */
export function useAutosave(): AutosaveContextValue {
  return useContext(AutosaveContext);
}
