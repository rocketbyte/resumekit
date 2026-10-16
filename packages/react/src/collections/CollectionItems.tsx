import {
  Suspense,
  isValidElement,
  lazy,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
} from 'react';
import { isUnfilled } from '@resumekit/schema';
import { useAuthoring } from './authoring-context.js';
import { useSpaceSlot } from '../spacing/useSpaceSlot.js';
import type { ItemOrigin } from './EntryOverlay.js';
import type { CollectionHandle } from './useCollection.js';
import './collection.css';
import { useItemName } from './entry-text.js';
import { useEditorText } from '../i18n/index.js';

/**
 * What a template's root element must carry for the item to be movable.
 *
 * Opaque on purpose. A template spreads it and reads nothing out of it, so the
 * drag implementation — or its removal — is not a change to any template.
 */
export type ItemRootProps = HTMLAttributes<HTMLElement> & {
  /*
   * A CALLBACK ref, not a ref object. An entry's root element differs by
   * template — an `<article>` in Harvard, an `<li>` in a skills list — and a
   * `RefObject<HTMLElement>` is assignable to neither. A callback taking the
   * base type is assignable to both, which is what lets one opaque prop be
   * spread onto any of them.
   */
  ref?: (node: HTMLElement | null) => void;
  /** Marks the element as one item of a collection. See `collection.css`. */
  'data-entry'?: string;
  /** What to call it in the overlay's label — the collection's own noun. */
  'data-entry-label'?: string;
  /** Present on the one entry the candidate is working on. */
  'data-selected'?: string;
};

/** What a template's entry component is given. Values and a path; no verbs. */
export interface EntryRenderProps<T> {
  item: T;
  /** Where this item lives in the résumé — `experience.2`, never `experience.0`. */
  path: string;
  /** Where it is DRAWN. For keys and labels only; never for a field path. */
  index: number;
  /**
   * The item's controls, which the entry component MUST render inside its own
   * root element.
   *
   * Handed over rather than injected, because an entry component is a component
   * and appending a child to one only sets a prop it ignores. The template
   * therefore decides WHERE the controls sit in its markup — which is right,
   * since it owns the layout — and it cannot decide WHAT they are: `chrome` is
   * opaque, and no template can reach the operations behind it.
   *
   * `null` when the document is only being read, so a template renders the same
   * markup either way without asking which mode it is in.
   */
  chrome: ReactNode;
  /** Spread onto the entry's root element. Opaque; see {@link ItemRootProps}. */
  itemProps: ItemRootProps;
  /**
   * Whether the candidate has just added THIS item, in this session.
   *
   * For a control that opens itself on arrival — a link's popover, which has
   * nowhere else to put the address. Deliberately an ACT and not a property of
   * the item: keyed off "this entry is still empty" instead, every empty entry
   * in the document opened one, every time it was drawn.
   *
   * `false` on a document being read, which adds nothing.
   */
  justAdded: boolean;
}

export interface CollectionItemsProps<T> {
  collection: CollectionHandle<T> & {
    originOf?: (index: number) => ItemOrigin;
    justAdded?: (index: number) => boolean;
    pathOf?: (index: number) => string;
    keyOf?: (index: number) => string;
  };
  /** The path prefix, when the collection does not supply one of its own. */
  basePath?: string;
  noun: string;
  /** The section's own name, for the overlay's label. */
  label: string;
  /**
   * Whether these items may carry structural space above them.
   *
   * The TEMPLATE decides, because only the template knows what it renders an
   * item as. Structural space is held by a wrapper element around the item, and
   * a wrapper is not valid around every item: a skills group is an `<li>` in a
   * `<ul>`, and a `<div>` between them is not a list. It is not wanted there
   * either — nobody needs to push two lines of keywords apart. Defaults to on,
   * so a template that renders entries gets its gaps by saying nothing.
   */
  gap?: boolean;
  /** Where the empty-state add sits — see `Collection`. Defaults to `block`. */
  emptyAdd?: 'block' | 'inline';
  /** The template's entry component. MUST return a single element. */
  children: (props: EntryRenderProps<T>) => ReactElement | null;
}

/** What every item render needs, however it is being drawn. */
export interface ItemProps<T> {
  collection: CollectionItemsProps<T>['collection'];
  index: number;
  path: string;
  noun: string;
  label: string;
  /** Whether this item may carry structural space above it. See `gap`. */
  gap: boolean;
  children: CollectionItemsProps<T>['children'];
}

/**
 * An item on a document that is being READ.
 *
 * No controls, no drag hook, and an empty `itemProps` — so the markup a
 * template produces here is exactly the markup it produced before collections
 * existed, and the printed page and the export renderer cannot carry chrome
 * they never asked to be free of.
 */
function ReadOnlyItem<T>({
  collection,
  index,
  path,
  noun,
  gap,
  children,
}: ItemProps<T>) {
  /*
   * The SPACE, but never the handle: `useSpaceSlot` yields no control without
   * an authoring context, so a read item sits below the space its owner
   * recorded and offers nothing to change it with. Which is the point — the
   * space is the document and prints; the control is chrome and does not.
   */
  const space = useSpaceSlot({ path }, useItemName(noun, index));
  const element = children({
    item: collection.items[index] as T,
    path,
    index,
    chrome: null,
    itemProps: gap ? { ...space.rootProps } : {},
    justAdded: false,
  });
  return isValidElement(element) ? element : null;
}

/**
 * The items of a collection, with their controls, from any store.
 *
 * The rendering lives here so that a section backed by the overlay and a custom
 * section backed by its own declaring edit produce identical markup and
 * identical affordances — the two would otherwise be two implementations of the
 * same screen, which is the duplication this whole change exists to remove.
 */
/*
 * Loaded on demand, and that is the whole point: this is where `@dnd-kit` and
 * the authoring controls live, so a document that is only being read — the
 * saved-résumé view, and the server-side renderer that produces the PDF — never
 * fetches either. Asserted in `collections.spec.tsx`.
 */
const AuthoredItems = lazy(() => import('./AuthoredItems.js')) as <T>(
  props: Pick<
    CollectionItemsProps<T>,
    'collection' | 'basePath' | 'noun' | 'label'
  > & {
    gap: boolean;
    ids: readonly string[];
    sortable: boolean;
    children: CollectionItemsProps<T>['children'];
  },
) => ReactElement;

export function CollectionItems<T>({
  collection,
  basePath,
  noun,
  label,
  gap = true,
  emptyAdd = 'block',
  children,
}: CollectionItemsProps<T>) {
  const authoring = useAuthoring();
  const { t, format, noun: forms } = useEditorText();

  /*
   * Unique across the whole DOCUMENT, not just within this collection: the
   * selection is document-wide, so two collections whose items were keyed by
   * position alone would select together.
   */
  const ids = collection.items.map(
    (_, index) => collection.keyOf?.(index) ?? `${basePath ?? noun}:${index}`,
  );
  const sortable = Boolean(authoring) && collection.canMove;

  /*
   * An UNFILLED item is not drawn on a document being read.
   *
   * "A placeholder is an absence" is already the domain's rule — `renderText`
   * omits an unfilled entry from the text export and reports it as omitted —
   * and this is the same rule for the rendered document. In the editor an
   * entry the candidate has added and not yet typed into is guidance they are
   * about to fill in; in the preview, the printed page and the exported file it
   * is nothing at all, and it must LOOK like nothing.
   *
   * That last part is why this is a filter and not a style. A blank item still
   * has a separator: Harvard draws one between contact items with
   * `.tpl-harvard__contact-item + .tpl-harvard__contact-item::before`, so a
   * résumé carrying blank links printed a run of bare `|` bars with nothing
   * between them. The separator belongs to the element, so the only way to
   * remove it is not to render the element.
   */
  const drawn = collection.items
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => Boolean(authoring) || !isUnfilled(item));

  const rendered = drawn.map(({ index }) => (
    <ReadOnlyItem
      key={ids[index]}
      collection={collection}
      index={index}
      noun={noun}
      label={label}
      gap={gap}
      path={
        collection.pathOf?.(index) ??
        `${basePath ?? ''}.${index}`.replace(/^\./, '')
      }
    >
      {children}
    </ReadOnlyItem>
  ));

  /*
   * An empty collection has no item to hang "add below" on. A BLOCK control
   * here moves nothing, because a template omits a section it has no data for —
   * there is no line below it to push. Inside a line of the document that is
   * false, and `emptyAdd` is how a template says so.
   */
  const empty = authoring && collection.canAdd && collection.items.length === 0;

  return (
    <>
      {authoring ? (
        /*
         * The read-only items are the FALLBACK, so the document is on screen
         * before the editing chunk arrives rather than after it — a candidate
         * opening the editor sees their résumé, then its controls.
         */
        <Suspense fallback={rendered}>
          <AuthoredItems
            collection={collection}
            basePath={basePath}
            noun={noun}
            label={label}
            gap={gap}
            ids={ids}
            sortable={sortable}
          >
            {children}
          </AuthoredItems>
        </Suspense>
      ) : (
        rendered
      )}

      {/*
       * Adding to a collection that is empty.
       *
       * `block` is a control on its own line, and it can be: a template omits a
       * section it has no data for, so there is no line below it to push.
       *
       * `inline` exists because that reasoning stops at a section. A collection
       * rendered INSIDE a line — the links in a contact row — was drawing a
       * dashed button on a second line the preview does not have, so the header
       * was one line taller in the editor than in the file. Marking it chrome
       * was not enough: chrome that sits in the flow still moves the document,
       * which is what `LinkField.spec.tsx` could not see, because it strips
       * chrome before comparing.
       *
       * The inline form is an empty FIELD with a placeholder, sized like the
       * items beside it. Pressing it mints the entry, and the entry's own field
       * takes over — so the line keeps its shape and the control reads as the
       * thing it produces.
       */}
      {empty &&
        (emptyAdd === 'inline' ? (
          <button
            type="button"
            className="tpl-collection__add-inline"
            data-chrome
            contentEditable={false}
            data-placeholder={format(t.entry.addFirstPlaceholder, forms(noun))}
            aria-label={format(t.entry.addFirstLabel, forms(noun))}
            onClick={() => collection.add()}
          />
        ) : (
          <div
            className="tpl-collection__add"
            data-chrome
            contentEditable={false}
          >
            <button
              type="button"
              className="tpl-collection__add-btn"
              onClick={() => collection.add()}
            >
              {format(t.entry.addFirst, forms(noun))}
            </button>
          </div>
        ))}
    </>
  );
}
