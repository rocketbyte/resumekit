import { isValidElement } from 'react';
import { EntryOverlay } from './EntryOverlay.js';
import { SortableItems, useDragHandle } from './SortableItems.js';
import { useEntrySelection } from './selection-context.js';
import { SpacedBlock } from '../spacing/SpacedBlock.js';
import type {
  CollectionItemsProps,
  ItemProps,
  ItemRootProps,
} from './CollectionItems.js';

/**
 * Everything an authorable document needs, and nothing a readable one does.
 *
 * Split into its own module so that the drag-and-drop library is reached only
 * through a dynamic import. `template-rendering` requires that the read-only
 * document and the export renderer load no editing code, and an import at the
 * top of a shared file would have made that untrue however carefully the
 * component was guarded — the requirement is about the bundle, not the render.
 */

/**
 * An item on a document that is being AUTHORED.
 *
 * A component rather than a loop body, because the drag handle is a hook and a
 * hook cannot be called per iteration of a map.
 */
function AuthoredItem<T>({
  collection,
  index,
  path,
  id,
  noun,
  label,
  gap,
  sortable,
  children,
}: ItemProps<T> & { id: string; sortable: boolean }) {
  const { handleProps, setNodeRef, style } = useDragHandle(id, !sortable);
  const { active, select } = useEntrySelection();
  const selected = active === id;

  const element = children({
    item: collection.items[index] as T,
    path,
    index,
    /*
     * The overlay is rendered only for the selected entry. Every entry is
     * outlined at rest — that is what says the document can be edited — but the
     * actions belong to the one region the candidate is working on, or the page
     * would be a wall of toolbars.
     */
    chrome: selected ? (
      <EntryOverlay
        collection={collection}
        index={index}
        noun={noun}
        label={label}
        handleProps={sortable ? handleProps : undefined}
      />
    ) : null,
    itemProps: {
      /*
       * The marker every editing affordance hangs off: the outline that shows
       * the entry can be acted on, the positioning context its controls need,
       * and the name the guide label reads. Written for every authored item —
       * not only a draggable one — so an entry in a collection of one is still
       * visibly an entry.
       */
      'data-entry': '',
      'data-entry-label': `${noun} ${index + 1}`,
      ...(selected ? { 'data-selected': '' } : {}),
      /*
       * Selecting on click and NOT stopping the event. A click on a job title
       * both selects the field to type in and selects the entry it belongs to,
       * which is what a candidate means by it — the formatting rail acts on the
       * field, this overlay acts on the entry, and neither has to win.
       */
      onClick: () => select(id),
      ...(sortable ? { ref: setNodeRef, style } : {}),
    } as ItemRootProps,
  });

  if (!isValidElement(element)) return null;

  /*
   * The gap above this entry, held OUTSIDE it — which is how one role is
   * separated from the one before it without the role's own box growing and
   * taking its selection outline with it. Addressed by the entry's own PATH, so
   * the space follows the job through a reorder rather than staying at the
   * position it was set in.
   */
  return gap ? (
    <SpacedBlock target={{ path }} label={`${noun} ${index + 1}`}>
      {element}
    </SpacedBlock>
  ) : (
    element
  );
}

/** The items of a collection, drawn with their controls. */
export default function AuthoredItems<T>({
  collection,
  basePath,
  noun,
  label,
  gap,
  ids,
  sortable,
  children,
}: Pick<
  CollectionItemsProps<T>,
  'collection' | 'basePath' | 'noun' | 'label'
> & {
  gap: boolean;
  ids: readonly string[];
  sortable: boolean;
  children: CollectionItemsProps<T>['children'];
}) {
  const rendered = collection.items.map((_, index) => (
    <AuthoredItem
      key={ids[index]}
      id={ids[index] as string}
      collection={collection}
      index={index}
      noun={noun}
      label={label}
      gap={gap}
      sortable={sortable}
      path={
        collection.pathOf?.(index) ??
        `${basePath ?? ''}.${index}`.replace(/^\./, '')
      }
    >
      {children}
    </AuthoredItem>
  ));

  return sortable ? (
    <SortableItems ids={ids} onMove={collection.move}>
      {rendered}
    </SortableItems>
  ) : (
    <>{rendered}</>
  );
}
