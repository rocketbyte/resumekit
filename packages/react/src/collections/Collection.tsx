import { COLLECTIONS, type AppendableSection } from '@resumekit/schema';
import { useSectionCollection } from './useSectionCollection.js';
import { CollectionItems, type EntryRenderProps } from './CollectionItems.js';
import { useEditorText } from '../i18n/index.js';
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
  /**
   * Whether these items may carry structural space above them. The template
   * decides — see `CollectionItems`. Defaults to on.
   */
  gap?: boolean;
  /**
   * How the empty-state add control sits in the document.
   *
   * `block` — the default — is a control on a line of its own, which is right
   * for a SECTION a template omits when it has no data: there is no line below
   * it to push.
   *
   * `inline` is for a collection that renders inside a line of the document,
   * where a block control is a second line the preview does not have. It draws
   * an empty field with a placeholder instead, sized like the items beside it,
   * so the line keeps its shape.
   */
  emptyAdd?: 'block' | 'inline';
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
  gap,
  emptyAdd,
}: CollectionProps<T>) {
  const collection = useSectionCollection<T>(section, items);
  const { sectionName } = useEditorText();
  return (
    <CollectionItems
      collection={collection}
      noun={noun ?? COLLECTIONS[section].noun}
      label={sectionName(section)}
      gap={gap}
      emptyAdd={emptyAdd}
    >
      {children}
    </CollectionItems>
  );
}
