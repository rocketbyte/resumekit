import { COLLECTIONS, type AppendableSection } from '@cvgs/core';
import { useSectionCollection } from './useSectionCollection.js';
import { CollectionItems, type EntryRenderProps } from './CollectionItems.js';
import type { ReactElement } from 'react';

export type { EntryRenderProps };

export interface CollectionProps<T> {
  section: AppendableSection;
  items: readonly T[];
  children: (props: EntryRenderProps<T>) => ReactElement | null;
  /**
   * What to call one of these. Defaults to the domain's own word for it, so a
   * template never names a thing differently from the rest of the product.
   */
  noun?: string;
}

/**
 * A repeatable section of the résumé: its items, and everything that may be
 * done to them.
 *
 * The behaviour lives in `useSectionCollection` and the markup in
 * `CollectionItems`; this is the seam between them. A template passes what an
 * item looks like and receives no way to change the list — which is what stops
 * "just this one button, just here" from becoming four divergent
 * implementations of add.
 *
 * With no authoring context — the read-only document, the saved-résumé view,
 * the export renderer — this renders the items and nothing else, so a printed
 * page cannot carry a control and no consumer has to remember to turn one off.
 */
export function Collection<T>({
  section,
  items,
  children,
  noun,
}: CollectionProps<T>) {
  const collection = useSectionCollection<T>(section, items);
  return (
    <CollectionItems
      collection={collection}
      noun={noun ?? COLLECTIONS[section].noun}
    >
      {children}
    </CollectionItems>
  );
}
