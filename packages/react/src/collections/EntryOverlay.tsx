import {
  ArrowDownIcon,
  ArrowUpIcon,
  GripIcon,
  PlusIcon,
  TrashIcon,
} from './icons.js';
import type { CollectionHandle } from './useCollection.js';
import './collection.css';

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
  const label = `${section} · ${noun.charAt(0).toUpperCase()}${noun.slice(1)} ${
    index + 1
  }`;

  return (
    <span
      className="tpl-entry-overlay"
      data-chrome
      contentEditable={false}
      role="toolbar"
      aria-label={`${label} — editing actions`}
    >
      {handleProps ? (
        <span
          className="tpl-entry-overlay__grip"
          title={`Drag to move this ${noun}`}
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
            title={`Move this ${noun} up`}
            aria-label={`Move ${noun} ${index + 1} up`}
            disabled={index === 0}
            onClick={() => collection.move(index, index - 1)}
          >
            <ArrowUpIcon />
          </button>
          <button
            type="button"
            className="tpl-entry-overlay__btn"
            title={`Move this ${noun} down`}
            aria-label={`Move ${noun} ${index + 1} down`}
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
          title={`Add a ${noun} below`}
          aria-label={`Add a ${noun} after ${index + 1}`}
          onClick={() => collection.add(index)}
        >
          <PlusIcon />
        </button>
      )}

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
        title={
          refusal ??
          (origin === 'added'
            ? `Remove this ${noun}`
            : `Hide this ${noun} — it stays in your tailored resume and can be brought back`)
        }
        aria-label={
          origin === 'added'
            ? `Remove ${noun} ${index + 1}`
            : `Hide ${noun} ${index + 1}`
        }
        onClick={() => collection.remove(index)}
      >
        <TrashIcon />
      </button>
    </span>
  );
}
