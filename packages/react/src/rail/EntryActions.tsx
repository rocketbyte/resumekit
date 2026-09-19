import {
  ArrowDownIcon,
  ArrowUpIcon,
  GripIcon,
  PlusIcon,
  TrashIcon,
} from '../collections/icons.js';
import type { CollectionHandle } from '../collections/useCollection.js';
import type { ItemOrigin } from '../collections/EntryOverlay.js';

/**
 * An entry's own actions in its rail — the same operations, names and rules as
 * the compact toolbar, laid out vertically. Every one is a button in the tab
 * order; the reorder grip is the one drag, and "move up/down" is the same
 * operation for anyone not dragging.
 */
export function EntryActions<T>({
  collection,
  index,
  noun,
  handleProps,
}: {
  collection: CollectionHandle<T> & { originOf?: (i: number) => ItemOrigin };
  index: number;
  noun: string;
  handleProps?: Record<string, unknown>;
}) {
  const origin = collection.originOf?.(index) ?? 'added';
  const refusal = collection.removeReason(index);
  const last = collection.items.length - 1;

  return (
    <>
      {handleProps && (
        <span
          className="tpl-rail__btn tpl-rail__grip"
          title={`Drag to move this ${noun}`}
          {...handleProps}
        >
          <GripIcon />
        </span>
      )}
      {collection.canMove && (
        <>
          <button
            type="button"
            className="tpl-rail__btn"
            title={`Move this ${noun} up`}
            aria-label={`Move ${noun} ${index + 1} up`}
            disabled={index === 0}
            onClick={() => collection.move(index, index - 1)}
          >
            <ArrowUpIcon />
          </button>
          <button
            type="button"
            className="tpl-rail__btn"
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
          className="tpl-rail__btn"
          title={`Add a ${noun} below`}
          aria-label={`Add a ${noun} after ${index + 1}`}
          onClick={() => collection.add(index)}
        >
          <PlusIcon />
        </button>
      )}
      <button
        type="button"
        className="tpl-rail__btn"
        data-tone="danger"
        disabled={refusal !== undefined}
        /* Removing an addition deletes it; "removing" a written entry hides it. */
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
    </>
  );
}
