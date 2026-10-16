import { useMemo } from 'react';
import { COLLECTIONS, type CollectionId } from '@cvgs/core';
import { useAutosave } from '../autosave-context.js';
import { useEditorText } from '../i18n/index.js';

/**
 * Everything a collection can do, and every reason it cannot.
 *
 * This is the whole behavioural surface of the feature, and it exists once. A
 * template receives none of it: an entry component is handed values and a path,
 * so a template cannot acquire the ability to add or remove by reaching past
 * its own interface. `collections.spec.tsx` asserts that.
 */
export interface CollectionHandle<T> {
  readonly id: CollectionId;
  readonly items: readonly T[];
  /** False for a singular location, which is why the summary offers no add. */
  readonly canAdd: boolean;
  readonly canMove: boolean;
  /** Why this item cannot be removed, or `undefined` when it can. */
  removeReason: (index: number) => string | undefined;
  add: (afterIndex?: number) => void;
  /** Insert ready-made items after `afterIndex`, as ONE step of the document's history. */
  addMany: (afterIndex: number, items: readonly T[]) => void;
  remove: (index: number) => void;
  move: (from: number, to: number) => void;
}

/** How a particular storage answers the three operations. */
export interface CollectionStore<T> {
  items: readonly T[];
  insert: (index: number, item: T) => void;
  /** Several items at once; stores that can write them as one step say how. */
  insertMany?: (index: number, items: readonly T[]) => void;
  removeAt: (index: number) => void;
  reorder: (from: number, to: number) => void;
  /**
   * Why the item at `index` may not be removed, beyond the minimum length the
   * table already enforces. The overlay-backed store answers here that the
   * writer produced this entry and it is hidden rather than deleted.
   */
  removeReason?: (index: number) => string | undefined;
}

/** Move `from` to `to`, returning a new array. The one definition of the move. */
export function movedTo<T>(items: readonly T[], from: number, to: number): T[] {
  const next = [...items];
  const [moved] = next.splice(from, 1);
  if (moved === undefined) return [...items];
  next.splice(Math.max(0, Math.min(to, next.length)), 0, moved);
  return next;
}

/**
 * The policy half of a collection: what may be done, and what may not.
 *
 * Storage-agnostic on purpose. A bullet list is held in the editor's own node
 * props because its text is text like any other; an experience entry is held in
 * the presentation overlay because adding one is a decision, not a difference
 * between two strings. Both are the same collection to a candidate, so both get
 * the same rules from here and differ only in the `store` they are given.
 *
 * It is also where every collection **stores itself**. Adding a bullet, removing
 * a role and reordering a qualification all arrive here, and all three are the
 * same kind of event: a discrete act with nothing still coming after it. So the
 * save request is made once, in the one place all three pass through, rather
 * than at each of the several call sites that could have forgotten it — and it
 * is made AFTER the guards, so a removal the rules refused writes nothing.
 */
export function useCollection<T>(
  id: CollectionId,
  store: CollectionStore<T>,
): CollectionHandle<T> {
  const def = COLLECTIONS[id];
  const text = useEditorText();
  const { items } = store;
  const { saveNow } = useAutosave();

  return useMemo<CollectionHandle<T>>(
    () => ({
      id,
      items,
      canAdd: def.arity === 'many',
      canMove: def.reorderable && items.length > 1,

      removeReason: (index) => {
        const { t, format } = text;
        if (def.arity !== 'many') return t.refusal.single;
        if (items.length <= def.min) {
          /*
           * Explained rather than hidden — the rule #29 set for the last
           * bullet, now stated for every collection that has a minimum. A rule
           * the candidate cannot see is a rule they run into.
           */
          return def.min === 1
            ? format(t.refusal.minimumOne, text.noun(def.noun))
            : format(t.refusal.minimum, { count: def.min });
        }
        return store.removeReason?.(index);
      },

      add: (afterIndex) => {
        if (def.arity !== 'many') return;
        const at = afterIndex === undefined ? items.length : afterIndex + 1;
        store.insert(at, def.mint() as T);
        saveNow();
      },

      addMany: (afterIndex, added) => {
        if (def.arity !== 'many' || added.length === 0) return;
        const at = afterIndex + 1;
        if (store.insertMany) store.insertMany(at, added);
        else added.forEach((item, i) => store.insert(at + i, item));
        saveNow();
      },

      remove: (index) => {
        if (def.arity !== 'many' || items.length <= def.min) return;
        if (store.removeReason?.(index) !== undefined) return;
        store.removeAt(index);
        saveNow();
      },

      move: (from, to) => {
        if (!def.reorderable) return;
        if (from === to || from < 0 || from >= items.length) return;
        store.reorder(from, Math.max(0, Math.min(to, items.length - 1)));
        saveNow();
      },
    }),
    [id, def, items, store, saveNow, text],
  );
}
