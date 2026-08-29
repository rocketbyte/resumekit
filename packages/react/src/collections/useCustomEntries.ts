import { useMemo } from 'react';
import { COLLECTIONS, isSectionEdit, type CustomEntry } from '@cvgs/core';
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
    const { edits, onEditsChange } = authoring;

    const write = (next: readonly CustomEntry[]) =>
      onEditsChange(
        edits.map((edit) =>
          isSectionEdit(edit) && edit.ref === sectionRef
            ? { ...edit, entries: [...next] }
            : edit,
        ),
      );

    return {
      items: entries,
      insert: (index, item) => {
        const next = [...entries];
        next.splice(Math.min(index, next.length), 0, item);
        write(next);
      },
      removeAt: (index) => write(entries.filter((_, i) => i !== index)),
      reorder: (from, to) => write(movedTo(entries, from, to)),
    };
  }, [authoring, entries, sectionRef]);

  return useCollection<CustomEntry>('custom_entries', store);
}

/** A blank entry for a custom section, from the same table everything else uses. */
export const mintCustomEntry = () =>
  COLLECTIONS.custom_entries.mint() as CustomEntry;
