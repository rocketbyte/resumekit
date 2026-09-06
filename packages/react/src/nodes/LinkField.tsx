import { useEffect, useRef, useState } from 'react';
import { Element, useEditor } from '@craftjs/core';
import type { Link } from '@cvgs/core';
import { EditableText } from './EditableText.js';
import './link-field.css';

export interface LinkFieldProps {
  /** The entry this field renders — its text and its address. */
  item: Link;
  /** Where the entry lives, e.g. `links.0`. Its fields hang off this. */
  path: string;
  /** What the text field says when the writer produced no label. */
  placeholder?: string;
}

/**
 * One of a résumé's links, in every template.
 *
 * The four templates each had their own answer and three of them amounted to
 * no answer at all: Harvard rendered a `Collection` of `label ?? url` inline in
 * the contact line, while Cobalt, Executive and Meridian rendered a bare `.map`
 * of the URL as the visible text behind `{links.length > 0 && …}` — no
 * collection, so a résumé whose writer produced no links had nothing to press,
 * and one moved between templates lost its labels.
 *
 * What is shared is what a link IS: the text the document shows and the address
 * behind it. Where it SITS is still the template's decision — this renders the
 * field and nothing around it, so Harvard keeps its contact line and the others
 * keep their websites list. Same split `useSpaceSlot` uses.
 *
 * ## Both fields are ordinary editable text
 *
 * No new write path. Both are `EditableText` nodes carrying their own `path`,
 * which is the only channel a value survives in: the save rebuilds the overlay
 * with `presentationEdits(base, valuesFromNodes(nodes), structural)`, collecting
 * nodes that carry a `path` and filtering `structural` down to its non-`set`
 * operations. A value written through the authoring context's `onEditsChange`
 * instead would show on screen and be dropped by the next save.
 *
 * ## The address field costs the document nothing
 *
 * It is mounted in a popover that is `position: absolute`,
 * `contentEditable={false}`, `data-chrome` and hidden in print — the contract
 * `SpaceHandle` and `EntryOverlay` already meet, and the reason `spacing.css`
 * gives for meeting it: a wrapper "is present in the editor and absent from the
 * preview, so the same document measured differently in the two".
 *
 * MOUNTED, not conditionally rendered. An unmounted node is not in the tree the
 * save walks, so a popover that only existed while open would lose the address
 * the moment it closed.
 *
 * A read-only document renders neither the popover nor the trigger, so the
 * preview and the export emit exactly the anchor they emitted before.
 */
export function LinkField({ item, path, placeholder }: LinkFieldProps) {
  const { editing } = useEditor((state) => ({
    editing: state.options.enabled,
  }));
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLSpanElement>(null);

  /*
   * Close on an outside press or Escape. Written here rather than imported:
   * `useDismiss` lives in `apps/web/src/ui`, and `scope:templates` may not
   * depend on the app. Ten lines is the cheaper of the two prices — the other
   * is a shared package for a listener pair.
   */
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  /*
   * The text, in flow, exactly as every other field in the document: the label,
   * falling back to the address so a link with no label still reads as
   * something rather than as a gap. `undefined` rather than `''` for the
   * address — `href ?? format?.href` falls back only on nullish, so an empty
   * string used to SHADOW an address set elsewhere and the link printed dead.
   */
  const text = (
    <Element
      id={`${path}.label`}
      is={EditableText}
      path={`${path}.label`}
      value={item.label ?? item.url}
      placeholder={placeholder}
      href={item.url || undefined}
    />
  );

  /*
   * The wrapper is rendered in BOTH states, and that is the point rather than an
   * oversight. An element the editor adds and the preview does not is an element
   * the two documents differ by — which is the whole defect this component was
   * written to end — so the structure is identical and only the CHROME inside it
   * is conditional.
   *
   * It costs the document nothing: `position: relative` with no offsets moves
   * nothing, which is the same argument `[data-gap]` already makes for hosting
   * the spacing handle. `LinkField.spec.tsx` compares the two DOMs with the
   * chrome stripped and fails if they are not byte-identical.
   */
  return (
    <span className="tpl-link" ref={root}>
      {text}
      {editing && (
        <>
          {/*
           * The one control in flow would be a button, so there is none: pressing
           * the address opens the popover, and the trigger is drawn by CSS on the
           * text that is already there.
           */}
          <button
            type="button"
            className="tpl-link__trigger"
            data-chrome
            contentEditable={false}
            aria-expanded={open}
            aria-label={`Address for ${item.label || item.url || 'this link'}`}
            title="Set this link's address"
            onClick={() => setOpen((v) => !v)}
          />
          <span
            className="tpl-link__pop"
            data-chrome
            contentEditable={false}
            hidden={!open}
          >
            <span className="tpl-link__pop-label">Link</span>
            <span className="tpl-link__pop-field">
              <Element
                id={`${path}.url`}
                is={EditableText}
                path={`${path}.url`}
                value={item.url}
                placeholder="https://"
              />
            </span>
          </span>
        </>
      )}
    </span>
  );
}
