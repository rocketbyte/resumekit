import { useEffect, useRef, useState } from 'react';
import { CloseIcon, PlusIcon } from '../collections/icons.js';
import type { CollectionHandle } from '../collections/useCollection.js';
import { SortableItems, useDragHandle } from '../collections/SortableItems.js';

/**
 * A bullet list the candidate can act on.
 *
 * Split from `EditableBulletList` for the reason `AuthoredItems` is split from
 * `CollectionItems`: this module reaches the drag-and-drop library, and the
 * read-only document — the saved-résumé view, and the renderer that produces the
 * PDF — must not load it. The split is what makes that a fact about the bundle
 * rather than a promise about the render.
 */

export interface AuthoredBulletsProps {
  path: string;
  items: readonly string[];
  bullets: CollectionHandle<string>;
  /** Whether the list is the field being typed into. */
  editing: boolean;
  onEdit: (index: number, next: string) => void;
}

/**
 * One bullet: its text, its grip, and its two controls.
 *
 * The grip stands **in the marker's column**. A bullet's first column is the
 * marker gutter — every template draws a `•` there — and on hover the marker
 * gives that space up to the handle rather than the handle finding space of its
 * own. So the row does not grow, nothing to the right of it shifts, and the
 * affordance appears exactly where the eye already is.
 *
 * Vertically it is centred on the whole bullet rather than sitting on the first
 * baseline where the marker sits: it is the handle for the row, and on a bullet
 * that wraps to three lines a top-aligned handle reads as belonging to the first
 * of them.
 *
 * Add and remove sit in the page's right margin, out of the document's flow,
 * and appear on the same hover. Both were previously shown whenever the list was
 * selected, which meant a candidate had to click a bullet before learning it
 * could be added to.
 */
function Bullet({
  index,
  item,
  path,
  bullets,
  editing,
  onEdit,
  sortable,
  onActivate,
  fieldRef,
}: {
  index: number;
  item: string;
  path: string;
  bullets: CollectionHandle<string>;
  editing: boolean;
  onEdit: (index: number, next: string) => void;
  sortable: boolean;
  onActivate: (index: number) => void;
  fieldRef: (index: number, el: HTMLTextAreaElement | null) => void;
}) {
  const { handleProps, setNodeRef, style } = useDragHandle(
    `${path}:${index}`,
    !sortable,
  );
  const refusal = bullets.removeReason(index);

  return (
    <li
      className="tpl-bullet"
      data-authored
      /*
       * Which bullet the caret belongs in. A bullet list is ONE editor node, so
       * selecting it turns every bullet into a field in the same render — and
       * without this, which of them ends up focused is left to the order the
       * browser happens to deliver the events in.
       */
      onPointerDown={() => onActivate(index)}
      ref={sortable ? setNodeRef : undefined}
      style={sortable ? style : undefined}
    >
      {/*
       * `aria-hidden` on the glyph, never on the control: the button carries the
       * label, and dnd-kit's keyboard sensor makes it a real way to reorder —
       * Space picks the bullet up, the arrow keys move it, Space puts it down,
       * Escape cancels. That is why the ↑/↓ buttons this replaces are not
       * missed: the handle is the keyboard route as well as the pointer one,
       * which is the only basis on which replacing them was allowed.
       */}
      <button
        type="button"
        className="tpl-bullet__grip"
        data-chrome
        title="Drag to move this bullet, or press Space and use the arrow keys"
        aria-label={`Move bullet ${index + 1}`}
        {...(sortable ? handleProps : {})}
      >
        <span aria-hidden="true">⠿</span>
      </button>

      {editing ? (
        <span className="tpl-text tpl-grow" data-value={item}>
          <textarea
            className="tpl-input"
            ref={(el) => fieldRef(index, el)}
            value={item}
            rows={1}
            aria-label={`${path}.${index}`}
            onChange={(e) => onEdit(index, e.target.value)}
          />
        </span>
      ) : (
        <span className="tpl-text">{item}</span>
      )}

      <span className="tpl-bullet__tools" data-chrome contentEditable={false}>
        <button
          type="button"
          className="tpl-tool"
          title="Add a bullet below"
          aria-label={`Add a bullet after ${index + 1}`}
          onClick={() => bullets.add(index)}
        >
          <PlusIcon />
        </button>
        <button
          type="button"
          className="tpl-tool"
          data-tone="danger"
          disabled={refusal !== undefined}
          /*
           * Disabled and explained rather than hidden: a rule the candidate
           * cannot see is a rule they run into. The words are the collection's,
           * not this component's.
           */
          title={refusal ?? 'Remove this bullet'}
          aria-label={`Remove bullet ${index + 1}`}
          onClick={() => bullets.remove(index)}
        >
          <CloseIcon />
        </button>
      </span>
    </li>
  );
}

export default function AuthoredBullets({
  path,
  items,
  bullets,
  editing,
  onEdit,
}: AuthoredBulletsProps) {
  const sortable = bullets.canMove;
  const ids = items.map((_, index) => `${path}:${index}`);

  /* The bullet the candidate pointed at, and the fields to put the caret in. */
  const [caret, setCaret] = useState<number | null>(null);
  const fields = useRef<Record<number, HTMLTextAreaElement | null>>({});

  useEffect(() => {
    if (!editing || caret === null) return;
    fields.current[caret]?.focus();
  }, [editing, caret]);

  const rows = items.map((item, index) => (
    <Bullet
      // Bullets have no identity of their own — they are strings the candidate
      // reorders and deletes — so the index is the only honest key.
      key={index}
      index={index}
      item={item}
      path={path}
      bullets={bullets}
      editing={editing}
      onEdit={onEdit}
      sortable={sortable}
      onActivate={setCaret}
      fieldRef={(i, el) => {
        fields.current[i] = el;
      }}
    />
  ));

  return sortable ? (
    <SortableItems ids={ids} onMove={bullets.move}>
      {rows}
    </SortableItems>
  ) : (
    <>{rows}</>
  );
}
