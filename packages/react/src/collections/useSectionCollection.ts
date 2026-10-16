import { useMemo, useState } from 'react';
import {
  additionPaths,
  collectionOrder,
  isAppendEdit,
  isDropEdit,
  isHideEdit,
  isReorderEdit,
  slotKey,
  type AppendableSection,
  type ResumeEdits,
  type Slot,
} from '@resumekit/schema';
import { useAuthoring } from './authoring-context.js';
import { useDocumentOverlay } from './overlay-context.js';
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
   * Whether the item at a rendered position is the one the candidate has just
   * ADDED — an act, in this session, rather than a property of its contents.
   *
   * The distinction is the whole point. `originOf` says an entry came from the
   * overlay rather than from the writer, which stays true forever; this says
   * the candidate pressed add a moment ago and is waiting for somewhere to
   * type. A control that wants to open itself on arrival — a link's popover —
   * needs the second question, and answering it with the first, or with "is
   * this entry still empty", opens EVERY empty entry in the document every time
   * it is drawn.
   */
  justAdded: (index: number) => boolean;
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
  /*
   * The ref minted by the most recent `insert`, and nothing else. Held here
   * because `insert` is where the act happens; a component downstream can only
   * see the result of it.
   */
  const [addedRef, setAddedRef] = useState<string | null>(null);
  /*
   * Where each entry SITS, taken from the projection rather than from the
   * authoring capability — because a document that cannot be edited still has
   * to know. Reading it from `useAuthoring` meant the saved-résumé view and the
   * export renderer numbered entries by where they were drawn, so every stored
   * value on a reordered entry was read at the wrong address there.
   */
  const { base, edits } = useDocumentOverlay();

  const slots = useMemo<Slot[]>(
    () => (base ? collectionOrder(base, edits ?? [], section) : []),
    [base, edits, section],
  );

  /*
   * Where an addition's fields are addressed, taken from the domain rather
   * than re-derived here. This module used to answer it with the render index,
   * which is a different answer from the one `presentationEdits` reads back —
   * and two answers to "where does this entry live" is how a candidate's new
   * role came to share its fields with the writer's second one.
   */
  const additions = useMemo(
    () => (base ? additionPaths(base, edits ?? []) : null),
    [base, edits],
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
    const { liveEdits, onEditsChange } = authoring;

    /*
     * Every write below starts from the LIVE overlay, never from the snapshot
     * the slots were derived from: what a candidate has typed into an addition
     * since the last shape change lives inside that addition's own edit, and
     * rebuilding from a snapshot would write the placeholder back over it.
     */

    /** Store an ordering of the given slots, replacing any earlier one. */
    const writeOrder = (next: Slot[], rest: ResumeEdits = liveEdits()) =>
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
        setAddedRef(ref);
        const next: ResumeEdits = [
          ...liveEdits(),
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

      insertMany: (index, added) => {
        const refs = added.map(() => mintRef());
        const next: ResumeEdits = [
          ...liveEdits(),
          ...added.map((entry, i) => ({
            kind: 'append' as const,
            ref: refs[i] as string,
            section,
            author: 'candidate' as const,
            entry,
          })),
        ];
        const placed = [...slots];
        placed.splice(
          Math.min(index, placed.length),
          0,
          ...refs.map((ref) => ({ ref })),
        );
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
            liveEdits().filter(
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
          ...liveEdits(),
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
      justAdded: (index) => {
        const slot = slots[index];
        return Boolean(slot && 'ref' in slot && slot.ref === addedRef);
      },
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
         * An addition is addressed PAST the end of the writer's array, which
         * is where applying the overlay actually puts it — never by the
         * position it is drawn in. Drawing position belongs to the `reorder`
         * edit; an address that moved with it would collide with the writer's
         * own entry at that index and blank it off the page.
         */
        const path = slot ? additions?.get(slot.ref) : undefined;
        return path ?? `${section}.${index}`;
      },
    }),
    [handle, slots, section, additions, addedRef],
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
