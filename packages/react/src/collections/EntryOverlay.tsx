import {
  ArrowDownIcon,
  ArrowUpIcon,
  GripIcon,
  PlusIcon,
  TrashIcon,
} from './icons.js';
import type { CollectionHandle } from './useCollection.js';
import './collection.css';
import { useEntryText } from './entry-text.js';
import { useEditorText } from '../i18n/index.js';
import { LibraryAction } from './library/LibraryAction.js';

/** Where an item came from, which decides what removing it means. */
export type ItemOrigin = 'added' | 'written';

/**
 * The overlay for the entry the candidate has selected: what this region is,
 * and everything that can be done to it.
 *
 * Two things it is NOT allowed to be. It is not in the document's flow — it is
 * absolutely positioned above the entry, so appearing cannot move a line and the
 * page break stays where the print stylesheet puts it. And it is not on paper —
 * it is `data-chrome`, hidden by the print rules, and the selection is cleared
 * on `beforeprint` besides.
 *
 * Every action here is also on the keyboard: the buttons are buttons, they are
 * in the tab order, and `move` is the same call the drag handle makes. The
 * overlay is how the operations are DISCOVERED, never the only way to reach
 * them — `editor-usability` (#35) names mouse-only editing as a defect, and an
 * affordance that fixed discoverability by making everything a drag would be
 * trading one for the other.
 */
export function EntryOverlay<T>({
  collection,
  index,
  noun,
  label: section,
  handleProps,
}: {
  collection: CollectionHandle<T> & { originOf?: (i: number) => ItemOrigin };
  index: number;
  noun: string;
  /** Which section this is in, so the bar says where it is acting. */
  label: string;
  /**
   * What makes this item draggable, when dragging is offered at all.
   *
   * A HANDLE rather than the whole entry: the entry is full of live text
   * fields, and a drag that begins anywhere inside one would be competing with
   * selecting a word.
   */
  handleProps?: Record<string, unknown>;
}) {
  const origin = collection.originOf?.(index) ?? 'added';
  const refusal = collection.removeReason(index);
  const last = collection.items.length - 1;

  /*
   * "Experience · Role 2" — where, then which.
   *
   * Sentence case, because it is read as a name rather than as a heading; and
   * the section first, because a candidate with six sections and eleven bullets
   * needs to know which document they are in before which item.
   */
  const text = useEntryText(noun, index, origin);
  const editor = useEditorText();
  const label = editor.format(editor.t.entry.name, {
    ...editor.noun(noun),
    section,
    position: index + 1,
  });

  return (
    <span
      className="tpl-entry-overlay"
      data-chrome
      contentEditable={false}
      role="toolbar"
      aria-label={editor.format(editor.t.entry.toolbar, { name: label })}
    >
      {handleProps ? (
        <span
          className="tpl-entry-overlay__grip"
          title={text.drag}
          {...handleProps}
        >
          <GripIcon />
          <span className="tpl-entry-overlay__label">{label}</span>
        </span>
      ) : (
        <span className="tpl-entry-overlay__grip" data-static>
          <span className="tpl-entry-overlay__label">{label}</span>
        </span>
      )}

      <span className="tpl-entry-overlay__divider" aria-hidden="true" />

      {collection.canMove && (
        <>
          <button
            type="button"
            className="tpl-entry-overlay__btn"
            title={text.moveUp}
            aria-label={text.moveUpLabel}
            disabled={index === 0}
            onClick={() => collection.move(index, index - 1)}
          >
            <ArrowUpIcon />
          </button>
          <button
            type="button"
            className="tpl-entry-overlay__btn"
            title={text.moveDown}
            aria-label={text.moveDownLabel}
            disabled={index === last}
            onClick={() => collection.move(index, index + 1)}
          >
            <ArrowDownIcon />
          </button>
        </>
      )}

      {collection.canAdd && (
        <button
          type="button"
          className="tpl-entry-overlay__btn"
          title={text.addBelow}
          aria-label={text.addAfterLabel}
          onClick={() => collection.add(index)}
        >
          <PlusIcon />
        </button>
      )}
      <LibraryAction
        collection={collection}
        index={index}
        noun={noun}
        className="tpl-entry-overlay__btn"
      />

      <button
        type="button"
        className="tpl-entry-overlay__btn"
        data-tone="danger"
        disabled={refusal !== undefined}
        /*
         * The word is the honest one for what actually happens. Removing an
         * addition deletes it; "removing" a writer-produced entry HIDES it, and
         * a control that said delete would be describing an operation the
         * product refuses to perform — the score and the requirement audit are
         * derived against that content.
         */
        title={refusal ?? text.remove}
        aria-label={text.removeLabel}
        onClick={() => collection.remove(index)}
      >
        <TrashIcon />
      </button>
    </span>
  );
}
