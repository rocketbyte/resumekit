import { isValidElement } from 'react';
import { COLLECTIONS } from '@cvgs/core';
import { EntryOverlay } from './EntryOverlay.js';
import { SortableItems, useDragHandle } from './SortableItems.js';
import { useEntrySelection } from './selection-context.js';
import { useSpaceSlot } from '../spacing/useSpaceSlot.js';
import { ContainerRail } from '../rail/ContainerRail.js';
import { EntryActions } from '../rail/EntryActions.js';
import { RAIL_KEY } from '../rail/rail-store.js';
import { useItemName } from './entry-text.js';
import { useEditorText } from '../i18n/index.js';
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
  /*
   * The gap above this entry — how one role is separated from the one before
   * it. Addressed by the entry's own PATH, so the space follows the job through
   * a reorder rather than staying at the position it was set in.
   */
  const itemName = useItemName(noun, index);
  const space = useSpaceSlot({ path }, itemName);
  const { t, format, noun: forms } = useEditorText();

  /*
   * A CONTAINER — a role, a school, a skills group, a custom section — carries
   * one rail beside the sheet with the space above it and its own actions. A
   * bullet or an inline item sits inside a line of the document, where a rail in
   * the margin could not point at it, so it keeps its compact toolbar.
   */
  const shape = COLLECTIONS[collection.id].shape;
  const container = shape === 'entry' || shape === 'section';
  const railKey = `e:${id}`;
  const itemLabel = format(t.entry.name, {
    ...forms(noun),
    section: label,
    position: index + 1,
  });

  const element = children({
    item: collection.items[index] as T,
    path,
    index,
    /*
     * Chrome, absolutely positioned, no layout. A container's rail exists only
     * while it is pointed at, focused or selected; a line item's toolbar only
     * while it is selected — or the page would be a wall of controls.
     */
    chrome: container ? (
      <ContainerRail
        railKey={railKey}
        toolbarLabel={format(t.entry.toolbar, { name: itemLabel })}
        selected={selected}
        space={gap ? { target: { path }, label: itemName } : null}
      >
        <EntryActions
          collection={collection}
          index={index}
          noun={noun}
          path={path}
          handleProps={sortable ? handleProps : undefined}
        />
      </ContainerRail>
    ) : selected ? (
      <EntryOverlay
        collection={collection}
        index={index}
        noun={noun}
        label={label}
        handleProps={sortable ? handleProps : undefined}
      />
    ) : null,
    /* Whether this is the entry the candidate just asked for — see
       `SectionCollectionHandle.justAdded`. */
    justAdded: collection.justAdded?.(index) ?? false,
    itemProps: {
      /*
       * The marker every editing affordance hangs off: the outline that shows
       * the entry can be acted on, the positioning context its controls need,
       * and the name the guide label reads. Written for every authored item —
       * not only a draggable one — so an entry in a collection of one is still
       * visibly an entry.
       *
       * Its VALUE is the collection's own shape, because how much room the ring
       * may take beside an item is a property of what the item is. A block
       * entry has a page margin to spend and nothing to collide with, which is
       * what the 24px default is for; an item that sits INSIDE a line of the
       * document has the rest of that line on both sides of it, and the same
       * ring reached across the separator and over the phone number next to it.
       * Every rule that already existed matches on the attribute's presence, so
       * naming it costs nothing and `collection.css` gains one rule.
       */
      'data-entry': COLLECTIONS[collection.id].shape,
      'data-entry-label': itemName,
      ...(container ? { [RAIL_KEY]: railKey } : {}),
      ...(selected ? { 'data-selected': '' } : {}),
      /*
       * Selecting on click and NOT stopping the event. A click on a job title
       * both selects the field to type in and selects the entry it belongs to,
       * which is what a candidate means by it — the formatting rail acts on the
       * field, this overlay acts on the entry, and neither has to win.
       */
      onClick: () => select(id),
      ...(gap ? space.rootProps : {}),
      /*
       * Merged rather than spread over: the sortable transform and the recorded
       * step count are both styles on this one element, and whichever was
       * written second would otherwise delete the other.
       */
      ...(sortable
        ? {
            ref: setNodeRef,
            style: { ...(gap ? space.rootProps.style : {}), ...style },
          }
        : {}),
    } as ItemRootProps,
  });

  return isValidElement(element) ? element : null;
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
