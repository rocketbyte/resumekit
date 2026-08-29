import type { ComponentType, ReactNode } from 'react';
import { Element } from '@craftjs/core';
import { PLACEHOLDERS, type CustomEntry, type CustomSection } from '@cvgs/core';
import { EditableText } from './EditableText.js';
import {
  CollectionItems,
  type ItemRootProps,
} from '../collections/CollectionItems.js';
import { useCustomEntries } from '../collections/useCustomEntries.js';

/** What every template supplies for one entry of a candidate's own section. */
export type CustomEntryComponent = ComponentType<{
  item: CustomEntry;
  path: string;
  chrome: ReactNode;
  itemProps: ItemRootProps;
}>;

export interface CustomSectionsProps {
  /*
   * OPTIONAL, and that is not defensive padding.
   *
   * `custom_sections` is defaulted by `ResumeObjectSchema`, but a résumé only
   * carries the default if it was PARSED. A writer résumé read straight out of
   * storage and handed to a template has never been through the schema, so the
   * field is genuinely absent — and a template that assumed otherwise crashed
   * every document written before this change. Tolerated here, once, rather
   * than guarded at four call sites.
   */
  sections: readonly CustomSection[] | undefined;
  /** The template's own section wrapper class. */
  sectionClass: string;
  /** The template's own heading class, so the heading matches its neighbours. */
  headingClass: string;
  /**
   * The template's own entry markup.
   *
   * This is what removed the neutral layout. The original note here explained
   * that borrowing one template's entry markup "would render as debris in the
   * other three" — true while entry markup was inline in a document's JSX, and
   * false now that each template names a component for it. A candidate's own
   * section is set in the same pattern as the sections above it.
   */
  Entry: CustomEntryComponent;
}

/** One declared section: the template's heading, the template's entries. */
function AuthoredSection({
  section,
  index,
  sectionClass,
  headingClass,
  Entry,
}: {
  section: CustomSection;
  index: number;
  sectionClass: string;
  headingClass: string;
  Entry: CustomEntryComponent;
}) {
  const collection = useCustomEntries(section.id, section.entries);
  const base = `custom_sections.${index}`;

  return (
    <section className={sectionClass}>
      <h2 className={headingClass} data-block data-keep-with-next>
        <Element
          id={`${base}.heading`}
          is={EditableText}
          path={`${base}.heading`}
          value={section.heading}
          placeholder={PLACEHOLDERS['heading']}
        />
      </h2>

      <CollectionItems
        collection={collection}
        basePath={`${base}.entries`}
        noun="entry"
      >
        {({ item, path, chrome, itemProps }) => (
          <Entry
            item={item}
            path={path}
            chrome={chrome}
            itemProps={itemProps}
          />
        )}
      </CollectionItems>
    </section>
  );
}

/**
 * The sections a candidate added, rendered in whichever template is mounted.
 *
 * Every field is a Craft.js linked node addressed by its DOMAIN path, exactly
 * as the writer-produced fields are, so `serialize.ts` reads them with the walk
 * it already has and nothing here needs to know a custom section is special.
 *
 * Nothing is a canvas and nothing takes a drag connector: an authored section
 * is as locked as a written one.
 */
export function CustomSections({
  sections = [],
  sectionClass,
  headingClass,
  Entry,
}: CustomSectionsProps) {
  return (
    <>
      {sections.map((section, i) => (
        <AuthoredSection
          key={section.id}
          section={section}
          index={i}
          sectionClass={sectionClass}
          headingClass={headingClass}
          Entry={Entry}
        />
      ))}
    </>
  );
}
