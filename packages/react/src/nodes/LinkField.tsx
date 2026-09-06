import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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
  /**
   * Add another link after this one. `null` in a document being read, and where
   * the collection cannot grow.
   *
   * The control belongs on the ENTRY because this collection renders inside a
   * line: once it has items there is nowhere else to put one that does not cost
   * the document a line the preview has not got.
   */
  onAdd?: (() => void) | null;
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
export function LinkField({ item, path, placeholder, onAdd }: LinkFieldProps) {
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

  /*
   * A link with neither half was just minted, and opening its popover is the
   * only thing a candidate can usefully do with it — so pressing "Add links"
   * lands them in the two fields rather than on an empty word they then have to
   * find and press again.
   *
   * Sound because it cannot be mistaken for a stored link: `LinkSchema` requires
   * `url` to be non-empty, so a saved résumé never carries a blank one. Only
   * `collection.add()` produces `{ label: '', url: '' }`.
   *
   * Read ONCE, at mount. Reading it live would slam the popover shut the moment
   * the first character arrived, and reopen it if the candidate cleared both
   * fields while typing.
   */
  const [open, setOpen] = useState(() => editing && !item.label && !item.url);
  const root = useRef<HTMLSpanElement>(null);
  const pop = useRef<HTMLSpanElement>(null);
  const [at, setAt] = useState<{ top: number; left: number } | null>(null);

  /*
   * Close on an outside press or Escape. Written here rather than imported:
   * `useDismiss` lives in `apps/web/src/ui`, and `scope:templates` may not
   * depend on the app. Ten lines is the cheaper of the two prices.
   */
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      /* The panel is portalled out of the link, so "outside" is outside BOTH. */
      const target = e.target as Node;
      if (root.current?.contains(target) || pop.current?.contains(target)) {
        return;
      }
      setOpen(false);
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

  /*
   * The whole link opens the popover, and the handler is on the WRAPPER rather
   * than on an element drawn over the text.
   *
   * The overlay this replaces was `position: absolute; inset: 0` inside an
   * inline `<span>`. That asks the browser to resolve a containing block from
   * the bounding box of an inline's fragments, which is exactly the kind of
   * geometry jsdom cannot model — so the suite proved the handler ran while
   * saying nothing about whether a pointer could ever reach it. A handler is
   * not an element: it has no box to get wrong, and it costs the document
   * nothing, which is the same guarantee by a shorter route.
   *
   * `mousedown` is where the press is refused, not `click`. By click time the
   * browser has already placed a caret in the text and Craft has already
   * selected the field — so the popover would open on top of a field that had
   * just become editable, and the two would fight over the keyboard.
   */
  const openPopover = (e: {
    preventDefault: () => void;
    stopPropagation: () => void;
  }) => {
    e.preventDefault();
    e.stopPropagation();
  };

  /*
   * Where the popover is drawn, measured when it opens.
   *
   * It is rendered into `document.body` through a portal and positioned
   * `fixed`, and both halves of that are load-bearing.
   *
   * `position: absolute` inside `.tpl-link` is what it did before, and that
   * asked the browser to resolve a containing block from the bounding box of an
   * INLINE span's fragments — the same fragile geometry that made the old
   * overlay trigger unreachable. A popover positioned against a degenerate box
   * lands somewhere nobody can see, which looks exactly like a popover that
   * never opened.
   *
   * And an ancestor clips it. `paged.css` masks `.tpl-pages__flow` on a
   * multi-page document to hide the gutter between sheets, and a mask clips
   * everything inside it: a panel hanging below a link would be cut off at the
   * page edge, or vanish entirely in the gap between two.
   *
   * A portal has neither problem — nothing above it in the DOM can clip it, and
   * nothing about an inline box decides where it goes. The React tree is
   * unchanged by a portal, so the address's Craft node stays registered and the
   * document still saves it.
   */
  useLayoutEffect(() => {
    if (!open) return;
    const box = root.current?.getBoundingClientRect();
    if (box) setAt({ top: box.bottom + 4, left: box.left });
  }, [open]);

  const stop = (e: { stopPropagation: () => void }) => e.stopPropagation();

  return (
    <span
      className="tpl-link"
      ref={root}
      {...(editing
        ? {
            onMouseDown: openPopover,
            onClick: (e: {
              preventDefault: () => void;
              stopPropagation: () => void;
            }) => {
              openPopover(e);
              setOpen((v) => !v);
            },
          }
        : {})}
    >
      {text}
      {editing && (
        <>
          {/*
           * The keyboard's way in, and the accessible name for what the pointer
           * already does. Visually hidden rather than drawn: the affordance a
           * mouse uses is the link itself, so a second visible control would be
           * furniture — but a span with a click handler is reachable by nothing
           * without this.
           */}
          <button
            type="button"
            className="tpl-link__trigger"
            data-chrome
            contentEditable={false}
            aria-expanded={open}
            aria-label={`Edit ${label || shownUrl || 'this link'}`}
            title="Edit this link"
            onClick={(e) => {
              e.stopPropagation();
              setOpen((v) => !v);
            }}
          />

          {/*
           * Add another, once this one says something. Withheld while the link
           * is still blank: a row of empty links is not what pressing add was
           * for, and the first thing to do with a new one is fill it in.
           */}
          {onAdd && (label || shownUrl) ? (
            <button
              type="button"
              className="tpl-link__add"
              data-chrome
              contentEditable={false}
              aria-label="Add another link"
              title="Add another link"
              onClick={(e) => {
                e.stopPropagation();
                onAdd();
              }}
              onMouseDown={stop}
            >
              +
            </button>
          ) : null}

          {/*
           * The address's node — the store the popover writes to, and the only
           * reason the address survives a save.
           *
           * It stays HERE, in the document's own tree, rather than travelling
           * to the portal with the panel: it is mounted whether or not the
           * popover is open, because a node outside the React tree is not
           * collected. Hidden, marked chrome, and taking no space.
           */}
          <span className="tpl-link__store" data-chrome hidden>
            <Element
              id={urlPath}
              is={EditableText}
              path={urlPath}
              value={item.url}
            />
          </span>

          {open && at
            ? createPortal(
                <span
                  className="tpl-link__pop"
                  ref={pop}
                  data-chrome
                  style={{ top: at.top, left: at.left }}
                  onMouseDown={stop}
                  onClick={stop}
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
                </span>,
                document.body,
              )
            : null}
        </>
      )}
    </span>
  );
}
