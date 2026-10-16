import { useMemo } from 'react';
import {
  COLLECTIONS,
  isSectionEdit,
  type CustomEntry,
} from '@resumekit/schema';
import { useAuthoring } from './authoring-context.js';
import {
  movedTo,
  useCollection,
  type CollectionHandle,
  type CollectionStore,
} from './useCollection.js';

/**
 * The entries inside a section the candidate declared.
 *
 * Backed by the declaring `section` edit rather than by an `append`, because the
 * whole section — its heading and its entries — is one operation in the overlay.
 * There is no writer-produced content in here to protect, so removal is deletion
 * and the asymmetry the top-level sections need does not arise.
 *
 * Which makes this the smallest complete collection in the product, and a
 * useful check on the layer: it shares every rule (`min`, the refusal message,
 * the move semantics) with `experience` and differs only in its store.
 */
export function useCustomEntries(
  sectionRef: string,
  entries: readonly CustomEntry[],
): CollectionHandle<CustomEntry> {
  const authoring = useAuthoring();

  const store = useMemo<CollectionStore<CustomEntry>>(() => {
    if (!authoring) {
      return {
        items: entries,
        insert: () => undefined,
        removeAt: () => undefined,
        reorder: () => undefined,
      };
    }
    const { liveEdits, onEditsChange } = authoring;

    /*
     * Rewritten from the OVERLAY's own entries, not from the ones on screen.
     *
     * The rendered list is a projection frozen when the document tree was
     * built, and the candidate's typing since then lives in the editor's nodes
     * — it reaches the overlay through the reporter, and only the overlay. So
     * an insert or a move rebuilt from what is drawn would write back the text
     * the section was declared with and quietly undo the sentence somebody had
     * just finished. The overlay is what the overlay is written from.
     */
    const write = (
      transform: (current: CustomEntry[]) => readonly CustomEntry[],
    ) =>
      onEditsChange(
        liveEdits().map((edit) =>
          isSectionEdit(edit) && edit.ref === sectionRef
            ? { ...edit, entries: [...transform([...edit.entries])] }
            : edit,
        ),
      );

    return {
      items: entries,
      insert: (index, item) =>
        write((current) => {
          const next = [...current];
          next.splice(Math.min(index, next.length), 0, item);
          return next;
        }),
      removeAt: (index) =>
        write((current) => current.filter((_, i) => i !== index)),
      reorder: (from, to) => write((current) => movedTo(current, from, to)),
    };
  }, [authoring, entries, sectionRef]);

  return useCollection<CustomEntry>('custom_entries', store);
}

/** A blank entry for a custom section, from the same table everything else uses. */
export const mintCustomEntry = () =>
  COLLECTIONS.custom_entries.mint() as CustomEntry;
