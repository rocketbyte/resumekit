import {
  Suspense,
  isValidElement,
  lazy,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
} from 'react';
import { useAuthoring } from './authoring-context.js';
import { useSpaceSlot } from '../spacing/SpaceHandle.js';
import type { ItemOrigin } from './EntryOverlay.js';
import type { CollectionHandle } from './useCollection.js';
import './collection.css';

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
}

export interface CollectionItemsProps<T> {
  collection: CollectionHandle<T> & {
    originOf?: (index: number) => ItemOrigin;
    pathOf?: (index: number) => string;
    keyOf?: (index: number) => string;
  };
  /** The path prefix, when the collection does not supply one of its own. */
  basePath?: string;
  noun: string;
  /** The section's own name, for the overlay's label. */
  label: string;
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
  children,
}: ItemProps<T>) {
  /*
   * The SPACE, but never the handle: `useSpaceSlot` returns no control without
   * an authoring context, so a read item carries the padding a candidate
   * recorded and nothing to change it with. Which is the point — the space is
   * the document and prints; the control is chrome and does not.
   */
  const space = useSpaceSlot({ path }, `${noun} ${index + 1}`);
  const element = children({
    item: collection.items[index] as T,
    path,
    index,
    chrome: null,
    itemProps: { ...space.rootProps },
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
  children,
}: CollectionItemsProps<T>) {
  const authoring = useAuthoring();

  /*
   * Unique across the whole DOCUMENT, not just within this collection: the
   * selection is document-wide, so two collections whose items were keyed by
   * position alone would select together.
   */
  const ids = collection.items.map(
    (_, index) => collection.keyOf?.(index) ?? `${basePath ?? noun}:${index}`,
  );
  const sortable = Boolean(authoring) && collection.canMove;

  const rendered = collection.items.map((_, index) => (
    <ReadOnlyItem
      key={ids[index]}
      collection={collection}
      index={index}
      noun={noun}
      label={label}
      path={
        collection.pathOf?.(index) ??
        `${basePath ?? ''}.${index}`.replace(/^\./, '')
      }
    >
      {children}
    </ReadOnlyItem>
  ));

  /*
   * An empty collection has no item to hang "add below" on. Rendering an
   * in-flow control here moves nothing, because a template omits a section it
   * has no data for — there is no line below it to push.
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
            ids={ids}
            sortable={sortable}
          >
            {children}
          </AuthoredItems>
        </Suspense>
      ) : (
        rendered
      )}

      {empty && (
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
            + Add {noun}
          </button>
        </div>
      )}
    </>
  );
}
