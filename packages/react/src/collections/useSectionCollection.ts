import { useMemo } from 'react';
import {
  collectionOrder,
  isAppendEdit,
  isDropEdit,
  isHideEdit,
  isReorderEdit,
  slotKey,
  type AppendableSection,
  type ResumeEdits,
  type Slot,
} from '@cvgs/core';
import { useAuthoring } from './authoring-context.js';
import {
  movedTo,
  useCollection,
  type CollectionHandle,
  type CollectionStore,
} from './useCollection.js';

/** Where an item on the page came from, which decides what removing it means. */
export type ItemOrigin = 'added' | 'written';

export interface SectionCollectionHandle<T> extends CollectionHandle<T> {
  /** The slot behind each rendered position, for building field paths. */
  slots: readonly Slot[];
  originOf: (index: number) => ItemOrigin;
  /** A key that follows the ITEM, so a reorder moves elements, not remounts. */
  keyOf: (index: number) => string;
  /**
   * The path prefix that addresses the item at a rendered position.
   *
   * Built from the slot's BASE index, never from where it is drawn. A reordered
   * document renders the entry from `experience.2` in first place, and the
   * fields inside it must keep saying `experience.2.*` — otherwise a stored
   * edit would follow the position rather than the job.
   */
  pathOf: (index: number) => string;
}

/** A ref for a new addition. Minted here so it survives a new writer run. */
const mintRef = () =>
  `add-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

/**
 * A top-level section of the résumé, as a collection backed by the overlay.
 *
 * Adding, removing and moving are all overlay operations rather than array
 * writes, because the array is the writer's and must stay the writer's: what
 * persists is the record of what the candidate decided, applied over output
 * that never changes. That is the same rule the text overlay has followed since
 * #29, extended to the operations #56 introduced.
 */
export function useSectionCollection<T>(
  section: AppendableSection,
  items: readonly T[],
): SectionCollectionHandle<T> {
  const authoring = useAuthoring();

  const slots = useMemo<Slot[]>(
    () =>
      authoring
        ? collectionOrder(authoring.base, authoring.edits, section)
        : [],
    [authoring, section],
  );

  const store = useMemo<CollectionStore<T>>(() => {
    if (!authoring) {
      // Read-only: the list is what it is, and nothing can act on it.
      return {
        items,
        insert: () => undefined,
        removeAt: () => undefined,
        reorder: () => undefined,
      };
    }
    const { edits, onEditsChange } = authoring;

    /** Store an ordering of the given slots, replacing any earlier one. */
    const writeOrder = (next: Slot[], rest: ResumeEdits = edits) =>
      onEditsChange([
        ...rest.filter(
          (edit) => !(isReorderEdit(edit) && edit.section === section),
        ),
        { kind: 'reorder', section, order: next },
      ]);

    return {
      items,

      insert: (index, item) => {
        const ref = mintRef();
        const next: ResumeEdits = [
          ...edits,
          {
            kind: 'append',
            ref,
            section,
            author: 'candidate',
            entry: item,
          },
        ];
        // An addition lands where the candidate asked for it, not at the end,
        // which needs the ordering written in the same step.
        const placed = [...slots];
        placed.splice(Math.min(index, placed.length), 0, { ref });
        writeOrder(placed, next);
      },

      removeAt: (index) => {
        const slot = slots[index];
        if (!slot) return;
        const remaining = slots.filter((_, i) => i !== index);
        if ('ref' in slot) {
          /*
           * Removed by deleting the addition itself: the entry was never
           * anywhere but this overlay, so there is nothing left to reconcile.
           */
          writeOrder(
            remaining,
            edits.filter(
              (edit) =>
                !(
                  (isAppendEdit(edit) || isDropEdit(edit)) &&
                  edit.ref === slot.ref
                ),
            ),
          );
          return;
        }
        /*
         * A writer-produced entry is HIDDEN. The score, the requirement audit
         * and `still_missing[]` are derived against what the writer produced;
         * deleting one would leave those figures describing a document that no
         * longer exists.
         */
        writeOrder(remaining, [
          ...edits,
          { kind: 'hide', section, base: slot.base },
        ]);
      },

      reorder: (from, to) => writeOrder(movedTo(slots, from, to)),
    };
  }, [authoring, items, section, slots]);

  const handle = useCollection<T>(section, store);

  return useMemo(
    () => ({
      ...handle,
      slots,
      originOf: (index) =>
        slots[index] && 'ref' in slots[index] ? 'added' : 'written',
      /*
       * Scoped by SECTION, because a slot key is only unique within its own
       * collection — `b0` is the writer's first entry in experience and in
       * education alike. The selection is document-wide, so an unscoped key
       * selected two entries at once.
       */
      keyOf: (index) => {
        const slot = slots[index];
        return `${section}:${slot ? slotKey(slot) : index}`;
      },
      pathOf: (index) => {
        const slot = slots[index];
        if (slot && 'base' in slot) return `${section}.${slot.base}`;
        /*
         * An addition has no base position, so its fields are addressed by
         * where it currently sits — which is what `presentationEdits` folds
         * back into the addition itself, so nothing is stored against it.
         */
        return `${section}.${index}`;
      },
    }),
    [handle, slots, section],
  );
}

/** Whether an overlay hides the writer entry at `base` in `section`. */
export function isHidden(
  edits: ResumeEdits,
  section: AppendableSection,
  base: number,
): boolean {
  return edits.some(
    (edit) =>
      isHideEdit(edit) && edit.section === section && edit.base === base,
  );
}

/** Compare two slots. Exported so a caller never re-derives the key format. */
export const sameSlot = (a: Slot, b: Slot) => slotKey(a) === slotKey(b);
