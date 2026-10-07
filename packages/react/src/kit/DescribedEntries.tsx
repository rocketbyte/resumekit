import type { DescribedEntry } from '@cvgs/core';
import { DocumentSection } from './DocumentSection.js';
import type { HeadingLead } from './textShapes.js';
import { Collection } from '../collections/Collection.js';
import { useAuthoring } from '../collections/authoring-context.js';
import { EditableText } from '../nodes/EditableText.js';
import { useEditorText } from '../i18n/index.js';

/** The three sections that are a title over a paragraph. */
export type DescribedSectionId = 'achievements' | 'courses' | 'passions';

/**
 * Which guidance each section's two fields show, by core's `PLACEHOLDERS` keys.
 *
 * Spelled out rather than derived from the id, because `PLACEHOLDERS` is keyed
 * by a name a person chose and a singularising slice would be a rule that holds
 * for these three and breaks on the fourth.
 */
const GUIDANCE: Record<DescribedSectionId, { title: string; body: string }> = {
  achievements: {
    title: 'achievement_title',
    body: 'achievement_description',
  },
  courses: { title: 'course_title', body: 'course_description' },
  passions: { title: 'passion_title', body: 'passion_description' },
};

export interface DescribedEntriesProps {
  id: DescribedSectionId;
  /** The heading's DEFAULT. A template may retitle it — several references say
   *  "Key Achievements", and one says "Interests" rather than "Passions". */
  title: string;
  /** What the candidate renamed it to, from `resume.section_headings[id]`. */
  heading?: string;
  /*
   * OPTIONAL, for the reason `CustomSections` states: these fields are
   * defaulted by `ResumeObjectSchema`, but a résumé only carries the default if
   * it was PARSED. A writer résumé read straight out of storage — or a test
   * fixture — has never been through the schema, so the field is genuinely
   * absent. Tolerated here once rather than guarded at fifty-one call sites.
   */
  items: readonly DescribedEntry[] | undefined;
  /** The template's own section, heading and entry classes. */
  className: string;
  headingClassName: string;
  entryClassName: string;
  /** As `DocumentSection`'s. */
  headingLead?: HeadingLead;
}

/**
 * Achievements, Courses and Passions: a title, and a paragraph under it.
 *
 * ONE component for three sections and seventeen templates, because the
 * contract says a template "places and styles" a shared capability and "never
 * re-implements" it — and the alternative here is fifty-one copies of the same
 * two fields.
 *
 * A template passes its classes and nothing else. It does not pass an entry
 * component, as `CustomSections` does, because a custom section's shape is the
 * candidate's and this shape is the references': every one of the thirteen sets
 * these entries as a title over prose, so the markup is settled and only the
 * painting varies. That also makes the "never bullets" rule structural — there
 * is no bullet list here to render.
 *
 * Several references draw a glyph beside each entry. That is a template's
 * `::before` on `.tpl-described__title`, not a prop: nothing in the résumé says
 * which glyph an achievement deserves, so a template may repeat ONE mark and
 * cannot vary it per entry.
 */
export function DescribedEntries({
  id,
  title,
  heading,
  items,
  className,
  headingClassName,
  entryClassName,
  headingLead,
}: DescribedEntriesProps) {
  const authoring = useAuthoring() !== null;
  const { placeholder } = useEditorText();
  const entries = items ?? [];

  /*
   * Offered while authoring, omitted when read.
   *
   * The rule lives HERE rather than in each template's `{(x.length > 0 ||
   * authoring) && …}` guard, because it is one rule and seventeen templates —
   * and a template that got the guard subtly wrong would silently print an
   * empty heading on somebody's exported PDF.
   */
  if (entries.length === 0 && !authoring) return null;

  return (
    <DocumentSection
      id={id}
      title={title}
      heading={heading}
      className={`tpl-described ${className}`}
      headingClassName={headingClassName}
      headingLead={headingLead}
    >
      <Collection section={id} items={entries}>
        {({ item, path, chrome, itemProps }) => (
          <article
            {...itemProps}
            className={`tpl-described__entry ${entryClassName}`}
            data-block
          >
            {chrome}
            <p className="tpl-described__title">
              <EditableText
                path={`${path}.title`}
                value={item.title}
                placeholder={placeholder(GUIDANCE[id].title)}
              />
            </p>
            <p className="tpl-described__body">
              <EditableText
                path={`${path}.description`}
                value={item.description}
                placeholder={placeholder(GUIDANCE[id].body)}
                multiline
              />
            </p>
          </article>
        )}
      </Collection>
    </DocumentSection>
  );
}
