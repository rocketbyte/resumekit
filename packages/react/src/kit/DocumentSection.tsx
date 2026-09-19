import type { ReactNode } from 'react';
import type { ResumeSectionId } from '@cvgs/core';
import { useSpaceSlot } from '../spacing/useSpaceSlot.js';

export interface DocumentSectionProps {
  /** The stored section this is, which gives it an adjustable gap and a rail. */
  id: ResumeSectionId;
  /** The heading, as printed. Also names the section's controls. */
  title: string;
  /** The template's own section and heading classes. */
  className: string;
  headingClassName: string;
  children: ReactNode;
}

/**
 * One of the résumé's named sections, in whichever template draws it.
 *
 * The gap above it and its rail come with it, so every template offers the
 * same controls by using this rather than by remembering to. A component
 * rather than a hook per section, because a template renders a section only
 * when it has something in it, and a hook cannot be called behind that.
 */
export function DocumentSection({
  id,
  title,
  className,
  headingClassName,
  children,
}: DocumentSectionProps) {
  const space = useSpaceSlot({ section: id }, title);
  return (
    <section className={className} {...space.rootProps}>
      {space.handle}
      <h2 className={headingClassName} data-block data-keep-with-next>
        {title}
      </h2>
      {children}
    </section>
  );
}
