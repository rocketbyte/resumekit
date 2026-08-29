import { useState, type ReactNode } from 'react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  restrictToParentElement,
  restrictToVerticalAxis,
} from '@dnd-kit/modifiers';
import { useRepaginate } from '../PagedSheet.js';

/**
 * Dragging, as ONE presentation over `move(from, to)`.
 *
 * Everything here is optional by construction: the same operation is on the
 * keyboard and on the ↑/↓ controls, the document is fully authorable without a
 * pointer, and removing this file would cost the product a convenience rather
 * than a capability. That is the test for whether a drag library has been let
 * too far in.
 *
 * `@dnd-kit` and not the lighter `@atlaskit/pragmatic-drag-and-drop`, for two
 * reasons that are properties of THIS document rather than of the libraries:
 * a selected editable field is a live `<textarea>`, and the native HTML5 drag
 * API the lighter library builds on fights text selection inside one; and dnd-kit
 * never re-parents a node — it transforms, and the array is reordered in state —
 * where a DOM-mutating sortable would fight both React and the paginator, which
 * is what `resume-document-formatting` (#30) refused when it chose to paginate by
 * pushing blocks rather than by re-parenting them.
 */

export interface SortableItemsProps {
  /** The stable key per position, in order. Supplied by the collection. */
  ids: readonly string[];
  onMove: (from: number, to: number) => void;
  disabled?: boolean;
  children: ReactNode;
}

/**
 * A handle for one item, for the template's chrome to render.
 *
 * Returned as props rather than as an element so the handle sits wherever the
 * controls sit, in the margin, and inherits their positioning.
 */
export function useDragHandle(id: string, disabled?: boolean) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  return {
    handleProps: { ...attributes, ...listeners },
    setNodeRef,
    style: {
      /*
       * Written out rather than pulled from `@dnd-kit/utilities`, which is one
       * more package for one string. The axis is restricted to vertical, so `x`
       * is always zero — but it is written anyway, because a modifier is a
       * choice and this should not silently break if the choice changes.
       */
      transform: transform
        ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
        : undefined,
      transition,
      /* Lifted, so the item being moved is legible against the ones it passes. */
      zIndex: isDragging ? 2 : undefined,
      opacity: isDragging ? 0.85 : undefined,
    },
    isDragging,
  };
}

export function SortableItems({
  ids,
  onMove,
  disabled,
  children,
}: SortableItemsProps) {
  const repaginate = useRepaginate();
  const [dragging, setDragging] = useState(false);

  const sensors = useSensors(
    /*
     * A drag only begins after the pointer has travelled a little. Without the
     * distance constraint a click meant to select a field would start a drag,
     * which in a document whose whole point is in-place editing is the more
     * likely intent by far.
     */
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function onDragEnd(event: DragEndEvent) {
    setDragging(false);
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = ids.indexOf(String(active.id));
    const to = ids.indexOf(String(over.id));
    if (from === -1 || to === -1) return;
    onMove(from, to);
    /*
     * ONE repagination, on drop. The paginator measures where blocks land and
     * corrects its own prediction against it; a live drag transform moves a
     * block without moving the layout, so measuring mid-drag would feed the
     * correction a position nothing settles at.
     */
    repaginate();
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      onDragStart={() => setDragging(true)}
      onDragCancel={() => setDragging(false)}
      onDragEnd={onDragEnd}
    >
      <SortableContext
        items={ids as string[]}
        strategy={verticalListSortingStrategy}
        disabled={disabled}
      >
        <div
          hidden
          data-dragging={dragging || undefined}
          aria-hidden="true"
          style={{ display: 'none' }}
        />
        {children}
      </SortableContext>
    </DndContext>
  );
}
