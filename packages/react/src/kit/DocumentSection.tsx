import type { ReactNode } from 'react';
import type { ResumeSectionId } from '@cvgs/core';
import { useSpaceSlot } from '../spacing/useSpaceSlot.js';
import { EditableText } from '../nodes/EditableText.js';

export interface DocumentSectionProps {
  /** The stored section this is, which gives it an adjustable gap and a rail. */
  id: ResumeSectionId;
  /**
   * What this section is called by default — the template's own word for it.
   *
   * Printed unless the candidate has renamed the section, and used as the
   * guidance in the field when they clear it, so a section can never end up
   * with no heading at all.
   */
  title: string;
  /**
   * The heading the candidate typed, from `resume.section_headings[id]`.
   *
   * Passed in rather than read from a context because a template already has
   * the résumé in hand, and a second way to reach the document's own data is a
   * second thing that can disagree with the first.
   */
  heading?: string;
  /** The template's own section and heading classes. */
  className: string;
  headingClassName: string;
  children: ReactNode;
}

/**
 * One of the résumé's named sections, in whichever template draws it.
 *
 * The gap above it, its rail, and its editable heading come with it, so every
 * template offers the same controls by using this rather than by remembering
 * to. A component rather than a hook per section, because a template renders a
 * section only when it has something in it, and a hook cannot be called behind
 * that.
 *
 * ## The heading is a field
 *
 * `EditableText`, addressed at `section_headings.<id>`, so renaming a section
 * is an ordinary `set` edit and needs no edit kind, no store and no save path of
 * its own — it rides the one the rest of the document's text already uses, and
 * is therefore undoable, exportable and template-independent for free. A custom
 * section's heading has been editable since it was introduced; this is the same
 * capability for the sections the schema names.
 *
 * The VALUE is `heading || title`: the candidate's word when they have typed
 * one, and the template's own otherwise. So the default is real text that
 * prints and extracts rather than a placeholder, and clearing the field returns
 * the section to its proper name instead of leaving the page with a nameless
 * block of entries.
 */
export function DocumentSection({
  id,
  title,
  heading,
  className,
  headingClassName,
  children,
}: DocumentSectionProps) {
  /*
   * The rail is named by what is PRINTED, so "Interests · space above" names
   * the section the candidate can see rather than the one the schema calls it.
   */
  const printed = heading || title;
  const space = useSpaceSlot({ section: id }, printed);
  return (
    <section className={className} {...space.rootProps}>
      {space.handle}
      <h2 className={headingClassName} data-block data-keep-with-next>
        <EditableText
          path={`section_headings.${id}`}
          value={printed}
          placeholder={title}
          defaultValue={title}
        />
      </h2>
      {children}
    </section>
  );
}
