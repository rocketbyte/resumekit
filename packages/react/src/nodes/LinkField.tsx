import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Link } from '@resumekit/schema';
import { useEditorText } from '../i18n/index.js';
import { useAutosave } from '../autosave-context.js';
import { useFieldRegistry, useFieldValue } from '../fields/field-registry.js';
import { EditableText } from './EditableText.js';
import './link-field.css';

export interface LinkFieldProps {
  /** The entry this field renders — its text and its address. */
  item: Link;
  /** Where the entry lives, e.g. `links.0`. Its fields hang off this. */
  path: string;
  /**
   * What the field says while the link is blank.
   *
   * Defaulted from the domain's own guidance rather than required of each
   * template, because a template that passed none rendered an empty inline
   * span: no text, no width, and nothing on the page to say a link belonged
   * there. Three of the four did exactly that.
   */
  placeholder?: string;
  /**
   * Whether the candidate has just added this link, in this session.
   *
   * The only thing that opens the panel on its own. It used to open for any
   * link with no text and no address — a property of the CONTENTS rather than
   * an act — on the reasoning that only `collection.add()` produces a blank
   * pair. That reasoning held for one press and not for a document: a résumé
   * that had somehow acquired a hundred blank links drew a hundred panels
   * stacked over the page, one per link, every time it was rendered.
   *
   * The act is what the popover actually wants, and the collection is the only
   * thing that knows it — see `SectionCollectionHandle.justAdded`.
   */
  justAdded?: boolean;
}

/** Both halves of a link, while they are being typed and before they are set. */
interface LinkDraft {
  label: string;
  url: string;
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
 * ## The field on the page is a way IN, not a place to type
 *
 * A link is one thing with two parts, and only one of them is on the page. So
 * the visible text is a **read-only** field: it registers at `links.N.label`,
 * draws that text in the document's own typography, and shows the collection's
 * guidance while it is blank — an ordinary-looking field the candidate can see
 * belongs there — but it refuses the caret. Pressing it opens the popover, and
 * the popover is where both halves are typed.
 *
 * The alternative was tried and is what this replaced. With the text editable
 * in place, one press did two things: `EditableText`'s own `mousedown` selected
 * the field and turned it into a `contenteditable`, and this component's opened
 * a popover over it. Two live editors for one value, fighting over the
 * keyboard, and a candidate could still type a label with no way to see what it
 * pointed at.
 *
 * ## Typed into a draft, set by Ok
 *
 * The popover's inputs hold a DRAFT — a copy of both halves — and nothing
 * reaches the document until Ok. That is what makes an address a decision
 * rather than a side effect of typing: a half-written `https://li` is not a
 * link, and every keystroke of it used to land in the résumé and, at the end of
 * the debounce, in storage. Escape and a press outside discard the draft, so
 * backing out of a link leaves the document exactly as it was.
 *
 * Ok writes both fields through the registry, by path — see
 * `FieldRegistry.write`. That is the only route that survives: the save rebuilds
 * the overlay from the fields that carry a path, so a value written any other
 * way would show on screen and be dropped by the next save. Two fields cannot
 * share one path either, so each half has exactly one field and the popover
 * writes to them rather than being a second owner of either.
 *
 * ## Adding and removing belong to the COLLECTION, not here
 *
 * This renders one link. It does not render a control to make another, and it
 * did: a `+` sat past the end of every link, on the reasoning that a collection
 * inside a line has nowhere else to put one. That reasoning was true only
 * because a link could not be selected — the press was swallowed before it
 * reached the item root, so the entry toolbar every other collection uses for
 * add, remove and reorder never appeared on a link. With the press let through,
 * links get the same controls as a role or a qualification, and a second, link-
 * shaped way to add is one the candidate has to learn separately.
 *
 * ## The chrome costs the document nothing
 *
 * The trigger and the popover are `position: absolute`,
 * `contentEditable={false}`, `data-chrome`, and hidden in print — the contract
 * `SpaceHandle` and `EntryOverlay` already meet. The address field is mounted
 * whether or not the popover is open, because a field outside the tree is not
 * collected when the document saves; it is the store, and the popover is the
 * control.
 *
 * The wrapper renders in BOTH states. An element the editor adds and the preview
 * does not is an element the two documents differ by — `position: relative` with
 * no offsets moves nothing, the same argument `[data-gap]` already makes.
 */
export function LinkField({
  item,
  path,
  placeholder: givenPlaceholder,
  justAdded = false,
}: LinkFieldProps) {
  const { t, format } = useEditorText();
  const placeholder = givenPlaceholder ?? t.placeholders.label;
  const labelPath = `${path}.label`;
  const urlPath = `${path}.url`;

  /*
   * Both halves of the link, read from the fields that hold them.
   *
   * `useFieldValue` on a path this component does not RENDER is how it reads
   * the address: the address's own field is mounted below, hidden, and this is
   * the same value. It replaces a scan of Craft's node map for the node
   * carrying this path — the indirection `retire-craftjs` removed, since the
   * path was always the identity.
   */
  const registry = useFieldRegistry();
  const label = String(
    useFieldValue(labelPath) ?? item.label ?? item.url ?? '',
  );
  const address = String(useFieldValue(urlPath) ?? item.url ?? '');
  const editing = registry?.enabled ?? false;

  /* What the document shows: the text, falling back to the address so a link
     with no label reads as something rather than as a gap. */
  const shown = label || address;

  /*
   * Setting a link is a discrete act with nothing still coming after it, so
   * `saveNow` rather than the deferred request typing makes. The draft below is
   * why: the popover writes once, on Ok, and not once per character.
   */
  const { saveNow } = useAutosave();

  /*
   * The draft IS the open state: a popover is open exactly while there is
   * something being typed in it. Two flags for one fact is how they come apart.
   *
   * A link the candidate JUST ADDED opens straight away, because the address
   * has nowhere else to be typed. Only that — never "this link is blank". The
   * blank test reads as equivalent and is not: it is true of every empty link
   * in the document at every render, so a résumé carrying a few of them opened
   * a panel for each, stacked over the page.
   */
  const [draft, setDraft] = useState<LinkDraft | null>(() =>
    editing && justAdded ? { label: '', url: '' } : null,
  );
  const open = draft !== null;

  const root = useRef<HTMLSpanElement>(null);
  const pop = useRef<HTMLFormElement>(null);
  const firstInput = useRef<HTMLInputElement>(null);
  const [at, setAt] = useState<{ top: number; left: number } | null>(null);

  const openWith = () => setDraft({ label, url: address });
  const discard = () => setDraft(null);

  /*
   * Ok, which is the only thing that writes.
   *
   * Trimmed, because an address is pasted far more often than it is typed and a
   * leading space is enough to make `isSafeLinkTarget` refuse a perfectly good
   * URL — a link that silently stops being followable in the export.
   */
  const set = () => {
    if (!draft) return;
    registry?.write(labelPath, draft.label.trim());
    registry?.write(urlPath, draft.url.trim());
    setDraft(null);
    saveNow();
  };

  /* Nothing to set while both halves are blank, and a button that does nothing
     should say so rather than pretend. */
  const settable = Boolean(draft && (draft.label.trim() || draft.url.trim()));

  /*
   * Close on an outside press or Escape. Written here rather than imported
   * from a UI library the document would otherwise not need: ten lines is the
   * cheaper of the two prices.
   */
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      /* The panel is portalled out of the link, so "outside" is outside BOTH. */
      const target = e.target as Node;
      if (root.current?.contains(target) || pop.current?.contains(target)) {
        return;
      }
      setDraft(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDraft(null);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  /*
   * The text, in flow, in the document's own typography — and read-only, so the
   * press that opens the popover cannot also put a caret in it. See the note on
   * `EditableText`'s `readOnly`.
   *
   * `undefined` rather than `''` for the address — `href ?? format?.href` falls
   * back only on nullish, so an empty string used to SHADOW an address set
   * elsewhere and the link printed dead.
   */
  const text = (
    <EditableText
      path={labelPath}
      value={item.label ?? item.url ?? ''}
      placeholder={placeholder}
      href={address || undefined}
      readOnly={editing}
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
   * `mousedown` is where the caret is refused, not `click`. By click time the
   * browser has already placed one in the text, so it has to be cancelled
   * before the selection it would make.
   *
   * The press is NOT stopped from bubbling, and that is the fix for a control
   * nobody could reach. An item's root carries `onClick: select(id)` — it is
   * how every collection reveals the entry's own toolbar, and the toolbar is
   * where remove and reorder live. Swallowing the press here meant a link was
   * the one entry in the document that could never be selected, so a link the
   * candidate did not want could not be got rid of. Selecting the entry and
   * opening the panel are not rivals: the panel edits the link, the toolbar
   * acts on the entry, which is the same division `AuthoredItem` already
   * describes for a job title.
   */
  const refuseCaret = (e: { preventDefault: () => void }) => e.preventDefault();

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
   * unchanged by a portal, so the address's field stays registered and the
   * document still saves it.
   */
  useLayoutEffect(() => {
    if (!open) {
      setAt(null);
      return;
    }
    const box = root.current?.getBoundingClientRect();
    if (box) setAt({ top: box.bottom + 4, left: box.left });
  }, [open]);

  /*
   * The caret belongs in the panel that just appeared, not left behind in the
   * document: the field on the page refuses it, so a press with no follow-up
   * would leave the keyboard pointing at nothing.
   *
   * A second effect rather than a line in the one above, because the panel does
   * not exist yet when that one runs — it renders on `draft && at`, and `at` is
   * what that effect is measuring. Focusing there would reach for an input that
   * mounts a render later, find `null`, and silently do nothing.
   */
  useEffect(() => {
    if (open && at) firstInput.current?.focus({ preventScroll: true });
  }, [open, at]);

  const stop = (e: { stopPropagation: () => void }) => e.stopPropagation();

  return (
    <span
      className="tpl-link"
      ref={root}
      {...(editing
        ? {
            onMouseDown: refuseCaret,
            onClick: (e: { preventDefault: () => void }) => {
              refuseCaret(e);
              if (open) discard();
              else openWith();
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
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-label={
              shown ? format(t.link.edit, { name: shown }) : t.link.editThis
            }
            title={t.link.editThis}
            onClick={(e) => {
              e.stopPropagation();
              if (open) discard();
              else openWith();
            }}
          />

          {/*
           * The address's field — the store the popover writes to, and the only
           * reason the address survives a save.
           *
           * It stays HERE, in the document's own tree, rather than travelling
           * to the portal with the panel: it is mounted whether or not the
           * popover is open, because a field outside the React tree is not
           * collected. Hidden, marked chrome, and taking no space.
           */}
          <span className="tpl-link__store" data-chrome hidden>
            <EditableText path={urlPath} value={item.url} readOnly />
          </span>

          {draft && at
            ? createPortal(
                /*
                 * A FORM, so Enter sets the link the way it does in every other
                 * two-field panel, and Ok is the submit button rather than a
                 * button that happens to be pressed last. Portalled to the
                 * body, so it nests inside nothing.
                 */
                <form
                  className="tpl-link__pop"
                  ref={pop}
                  data-chrome
                  role="dialog"
                  aria-label={t.link.dialog}
                  style={{ top: at.top, left: at.left }}
                  onMouseDown={stop}
                  onClick={stop}
                  onSubmit={(e) => {
                    e.preventDefault();
                    set();
                  }}
                >
                  <label className="tpl-link__row">
                    <span className="tpl-link__label">{t.link.text}</span>
                    <input
                      ref={firstInput}
                      className="tpl-link__input"
                      type="text"
                      value={draft.label}
                      placeholder={placeholder}
                      onChange={(e) =>
                        setDraft({ ...draft, label: e.target.value })
                      }
                    />
                  </label>
                  <label className="tpl-link__row">
                    <span className="tpl-link__label">{t.link.url}</span>
                    <input
                      className="tpl-link__input"
                      type="url"
                      value={draft.url}
                      placeholder={t.placeholders.url}
                      onChange={(e) =>
                        setDraft({ ...draft, url: e.target.value })
                      }
                    />
                  </label>
                  <div className="tpl-link__actions">
                    <button
                      type="submit"
                      className="tpl-link__ok"
                      disabled={!settable}
                    >
                      {t.link.ok}
                    </button>
                  </div>
                </form>,
                document.body,
              )
            : null}
        </>
      )}
    </span>
  );
}
