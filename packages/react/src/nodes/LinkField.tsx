import { useEffect, useRef, useState } from 'react';
import { Element, useEditor } from '@craftjs/core';
import type { Link } from '@cvgs/core';
import { useAutosave } from '../autosave-context.js';
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

/** A node's id, found by the résumé path it carries. */
function idOf(
  nodes: Record<string, { data?: { props?: Record<string, unknown> } }>,
  path: string,
): string | undefined {
  return Object.keys(nodes).find(
    (id) => nodes[id]?.data?.props?.['path'] === path,
  );
}

/**
 * One of a résumé's links, in every template.
 *
 * The four templates each had their own answer and three of them amounted to
 * none: Harvard rendered a `Collection` of `label ?? url` inline in the contact
 * line, while Cobalt, Executive and Meridian rendered a bare `.map` of the URL
 * as the visible text behind `{links.length > 0 && …}` — no collection, so a
 * résumé whose writer produced no links had nothing to press, and one moved
 * between templates lost its labels.
 *
 * What is shared is what a link IS: the text the document shows and the address
 * behind it. Where it SITS is still the template's decision — this renders the
 * field and nothing around it, so Harvard keeps its contact line and the others
 * keep their websites list.
 *
 * ## The document holds the text; the popover holds both fields
 *
 * The visible text is an ordinary `EditableText` in the flow, which is what
 * keeps it pixel-identical to the document it prints as. Pressing it opens a
 * popover carrying BOTH the text and the address, because a link is one thing
 * with two parts and reading its address out of a panel on the other side of
 * the screen was two places for one fact.
 *
 * ## Why the fields are proxies rather than inputs of their own
 *
 * A value survives in a Craft node or it does not survive. The save rebuilds
 * the overlay with `presentationEdits(base, valuesFromNodes(nodes), structural)`
 * — collecting nodes that carry a `path`, and filtering `structural` down to
 * its non-`set` operations — so a value written through the authoring context's
 * `onEditsChange` would show on screen and be dropped by the next save.
 *
 * Two nodes cannot share one path either: both would be collected and the later
 * would win, which is a race rather than a design. So each field has exactly one
 * node, and the popover's inputs write to those nodes by id. The ids are found
 * by the path they carry rather than assumed from the element key, so this does
 * not depend on how Craft happens to allocate them.
 *
 * ## The chrome costs the document nothing
 *
 * The trigger and the popover are `position: absolute`,
 * `contentEditable={false}`, `data-chrome`, and hidden in print — the contract
 * `SpaceHandle` and `EntryOverlay` already meet. The address node is mounted
 * whether or not the popover is open, because a node outside the tree is not
 * collected when the document saves; it is the store, and the input above it is
 * the control.
 *
 * The wrapper renders in BOTH states. An element the editor adds and the preview
 * does not is an element the two documents differ by — `position: relative` with
 * no offsets moves nothing, the same argument `[data-gap]` already makes.
 */
export function LinkField({ item, path, placeholder }: LinkFieldProps) {
  const labelPath = `${path}.label`;
  const urlPath = `${path}.url`;

  /*
   * Primitives only. A collector that returned a fresh object would re-render
   * this field on every editor state change, and there is one of these in a
   * line the candidate types into.
   */
  const { editing, labelId, urlId, label, url } = useEditor((state) => {
    const nodes = state.nodes as Parameters<typeof idOf>[0];
    const lid = idOf(nodes, labelPath);
    const uid = idOf(nodes, urlPath);
    return {
      editing: state.options.enabled,
      labelId: lid,
      urlId: uid,
      label: lid
        ? ((nodes[lid]?.data?.props?.['value'] as string | undefined) ?? '')
        : undefined,
      url: uid
        ? ((nodes[uid]?.data?.props?.['value'] as string | undefined) ?? '')
        : undefined,
    };
  });
  const { actions } = useEditor();
  const { saveSoon } = useAutosave();

  const [open, setOpen] = useState(false);
  const root = useRef<HTMLSpanElement>(null);

  /*
   * Close on an outside press or Escape. Written here rather than imported:
   * `useDismiss` lives in `apps/web/src/ui`, and `scope:templates` may not
   * depend on the app. Ten lines is the cheaper of the two prices.
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

  const write = (id: string | undefined, next: string) => {
    if (!id) return;
    actions.setProp(id, (props: { value?: string }) => {
      props.value = next;
    });
    saveSoon();
  };

  /*
   * The address is written to TWO places, and it has to be.
   *
   * Its own node is the store — the one the save collects. The text's node
   * carries the same address as `href`, because that is what makes the document
   * an anchor and therefore what makes the link followable in the exported PDF.
   *
   * Both by `setProp`, because a Craft node's props are frozen at mount: this
   * component can pass `href` into `<Element>` for the FIRST render and never
   * again, so an address typed here would have updated the input and left the
   * document linking to the old one. `undefined` rather than `''` when it is
   * cleared — `href ?? format?.href` falls back only on nullish, so an empty
   * string would shadow an address set elsewhere and print the link dead.
   */
  const writeUrl = (next: string) => {
    write(urlId, next);
    if (labelId) {
      actions.setProp(labelId, (props: { href?: string }) => {
        props.href = next || undefined;
      });
    }
  };

  /*
   * The text, in flow, exactly as every other field in the document: the label,
   * falling back to the address so a link with no label reads as something
   * rather than as a gap.
   *
   * `undefined` rather than `''` for the address — `href ?? format?.href` falls
   * back only on nullish, so an empty string used to SHADOW an address set
   * elsewhere and the link printed dead.
   */
  const shownUrl = url ?? item.url;
  const text = (
    <Element
      id={labelPath}
      is={EditableText}
      path={labelPath}
      value={item.label ?? item.url}
      placeholder={placeholder}
      href={shownUrl || undefined}
    />
  );

  return (
    <span className="tpl-link" ref={root}>
      {text}
      {editing && (
        <>
          {/*
           * ON the text, not beside it. Beside it is the version that costs a
           * space: an inline button in the contact line makes that line longer
           * in the editor than in the file. Absolutely positioned across the
           * link's own box, so pressing the link opens its two fields.
           */}
          <button
            type="button"
            className="tpl-link__trigger"
            data-chrome
            contentEditable={false}
            aria-expanded={open}
            aria-label={`Edit ${label || shownUrl || 'this link'}`}
            title="Edit this link"
            onClick={() => setOpen((v) => !v)}
          />
          <span
            className="tpl-link__pop"
            data-chrome
            contentEditable={false}
            hidden={!open}
          >
            <label className="tpl-link__row">
              <span className="tpl-link__label">Text</span>
              <input
                className="tpl-link__input"
                type="text"
                value={label ?? item.label ?? ''}
                placeholder={placeholder ?? 'LinkedIn'}
                onChange={(e) => write(labelId, e.target.value)}
              />
            </label>
            <label className="tpl-link__row">
              <span className="tpl-link__label">Link</span>
              <input
                className="tpl-link__input"
                type="url"
                value={shownUrl}
                placeholder="https://"
                onChange={(e) => writeUrl(e.target.value)}
              />
            </label>
            {/*
             * The address's node — the store the input above writes to, and the
             * only reason the address survives a save. Hidden rather than
             * unrendered: a node outside the tree is not collected.
             */}
            <span hidden>
              <Element
                id={urlPath}
                is={EditableText}
                path={urlPath}
                value={item.url}
              />
            </span>
          </span>
        </>
      )}
    </span>
  );
}
