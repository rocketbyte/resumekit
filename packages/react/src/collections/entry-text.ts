import { useMemo } from 'react';
import { useEditorText } from '../i18n/index.js';
import type { ItemOrigin } from './EntryOverlay.js';

/**
 * What an entry's actions are called, in the editor's language.
 *
 * One place for the compact toolbar and the rail, which offer the same
 * operations and must name them the same way. The noun is `COLLECTIONS`' stable
 * word; the catalog gives its forms, so "Move this role up" and "Subir esta
 * viñeta" are each one sentence with the noun placed, not assembled.
 */
export function useEntryText(noun: string, index: number, origin: ItemOrigin) {
  const text = useEditorText();
  return useMemo(() => {
    const { t, format } = text;
    const params = { ...text.noun(noun), position: index + 1 };
    const added = origin === 'added';
    return {
      drag: format(t.entry.drag, params),
      moveUp: format(t.entry.moveUp, params),
      moveUpLabel: format(t.entry.moveUpLabel, params),
      moveDown: format(t.entry.moveDown, params),
      moveDownLabel: format(t.entry.moveDownLabel, params),
      addBelow: format(t.entry.addBelow, params),
      addAfterLabel: format(t.entry.addAfterLabel, params),
      /* Removing an addition deletes it; "removing" a written entry hides it. */
      remove: format(added ? t.entry.remove : t.entry.hide, params),
      removeLabel: format(
        added ? t.entry.removeLabel : t.entry.hideLabel,
        params,
      ),
    };
  }, [text, noun, index, origin]);
}

/** "role 2": how the rail and the space handle name one entry. */
export function useItemName(noun: string, index: number): string {
  const { t, format, noun: forms } = useEditorText();
  return format(t.entry.item, { ...forms(noun), position: index + 1 });
}
