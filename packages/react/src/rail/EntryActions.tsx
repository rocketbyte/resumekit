import {
  ArrowDownIcon,
  ArrowUpIcon,
  GripIcon,
  PlusIcon,
  TrashIcon,
} from '../collections/icons.js';
import type { CollectionHandle } from '../collections/useCollection.js';
import type { ItemOrigin } from '../collections/EntryOverlay.js';
import { useEntryText } from '../collections/entry-text.js';
import { LibraryAction } from '../collections/library/LibraryAction.js';

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
  path,
  handleProps,
}: {
  collection: CollectionHandle<T> & { originOf?: (i: number) => ItemOrigin };
  index: number;
  noun: string;
  /** The entry's field path, for actions that write into it. */
  path?: string;
  handleProps?: Record<string, unknown>;
}) {
  const origin = collection.originOf?.(index) ?? 'added';
  const refusal = collection.removeReason(index);
  const last = collection.items.length - 1;
  const text = useEntryText(noun, index, origin);

  return (
    <>
      {handleProps && (
        <span
          className="tpl-rail__btn tpl-rail__grip"
          title={text.drag}
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
            title={text.moveUp}
            aria-label={text.moveUpLabel}
            disabled={index === 0}
            onClick={() => collection.move(index, index - 1)}
          >
            <ArrowUpIcon />
          </button>
          <button
            type="button"
            className="tpl-rail__btn"
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
          className="tpl-rail__btn"
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
        path={path}
        noun={noun}
        className="tpl-rail__btn"
      />
      <button
        type="button"
        className="tpl-rail__btn"
        data-tone="danger"
        disabled={refusal !== undefined}
        title={refusal ?? text.remove}
        aria-label={text.removeLabel}
        onClick={() => collection.remove(index)}
      >
        <TrashIcon />
      </button>
    </>
  );
}
