import { PLACEHOLDERS, type ResumeObject } from '@cvgs/core';
import { useDocumentStyle } from '../../presentation-context.js';
import { useAuthoring } from '../../collections/authoring-context.js';
import { EditableText } from '../../nodes/EditableText.js';
import { EditableInlineList } from '../../nodes/EditableInlineList.js';
import { CustomSections } from '../../nodes/CustomSections.js';
import { Collection } from '../../collections/Collection.js';
import { DocumentSection } from '../../kit/DocumentSection.js';
import { DescribedEntries } from '../../kit/DescribedEntries.js';
import { LanguageList } from '../../kit/LanguageList.js';
import { contactLines } from '../../kit/contact.js';
import { documentStyle } from '../../kit/documentStyle.js';
import { LinkField } from '../../nodes/LinkField.js';
import {
  HarvardCustomEntry,
  HarvardEducationEntry,
  HarvardExperienceEntry,
  HarvardSkillGroup,
} from './entries.js';
import './harvard.css';

/**
 * The Harvard template.
 *
 * The whole document is ONE Craft.js node. Its structure — the header block, the
 * rule-underlined headings, the two-column entry rows — is plain JSX inside this
 * render, which means it is not merely locked but **not addressable**: there is
 * no node to select, no rule to relax, and no serialized entry for a layout the
 * candidate could change.
 *
 * Editable text is declared with `<Element id=…>`, which makes each field a
 * Craft.js **linked node** with its own selection state and props. The `id` is
 * the field's own domain path, so the tree cannot contain two nodes claiming to
 * edit the same thing, and `serialize.ts` can read the overlay straight off it.
 *
 * A section the resume has no data for is omitted, never rendered empty.
 */
export interface HarvardDocumentProps {
  resume: ResumeObject;
}

export function HarvardDocument({ resume }: HarvardDocumentProps) {
  // Live, for the reason `presentation-context.tsx` explains: a node prop would
  // be frozen at mount and no style change would ever appear.
  const style = useDocumentStyle();
  /*
   * A section with nothing in it is omitted from the DOCUMENT and offered in
   * the EDITOR, because a candidate cannot add their first role to a section
   * that is not drawn. The read-only page is unchanged: with no authoring
   * context this is false and an empty section stays absent.
   */
  const authoring = useAuthoring() !== null;

  const contact = contactLines(
    resume.contact,
    ['location', 'email', 'phone'],
    authoring,
  );

  return (
    <article
      className="tpl-harvard"
      style={documentStyle('h', style)}
      aria-label="Resume document"
    >
      <header className="tpl-harvard__head" data-block>
        <h1 className="tpl-harvard__name">
          <EditableText path="name" value={resume.name} />
        </h1>

        {(resume.headline || authoring) && (
          <p className="tpl-harvard__headline">
            <EditableText
              path="headline"
              value={resume.headline ?? ''}
              placeholder={PLACEHOLDERS['headline']}
            />
          </p>
        )}

        {(contact.length > 0 || resume.links.length > 0 || authoring) && (
          <p className="tpl-harvard__contact">
            {/* The separator is drawn by CSS between siblings, so a detail the
                writer did not have cannot leave a stray bar behind it. */}
            {contact.map(({ path, value, placeholder }) => (
              <span key={path} className="tpl-harvard__contact-item">
                <EditableText
                  path={path}
                  value={value}
                  placeholder={placeholder}
                />
              </span>
            ))}

            {/*
             * Links are a COLLECTION, like every other repeatable part of the
             * résumé, and for the reason the contact fields above are always
             * offered: a candidate whose writer produced none had no way to add
             * one. The collection brings the add control with it — including
             * the in-flow "+ Add link" it shows when there are none at all —
             * so LinkedIn and GitHub are a click away rather than absent.
             */}
            {/*
             * `inline`, because this collection lives INSIDE the contact line.
             * The block add control drew a dashed button on a second line the
             * preview does not have — see `CollectionItems`.
             */}
            <Collection
              section="links"
              items={resume.links}
              gap={false}
              emptyAdd="inline"
            >
              {({ item, path, chrome, itemProps, justAdded }) => (
                <span className="tpl-harvard__contact-item">
                  {/*
                   * Two spans, because the separator belongs to the LINE and
                   * the ring belongs to the LINK.
                   *
                   * The bar between contact details is drawn by
                   * `.tpl-harvard__contact-item + …::before`, which puts it
                   * inside this element's box, at its leading edge. The editor
                   * rings whichever element carries `itemProps` — so with both
                   * on one span the ring enclosed the bar that divides this
                   * link from the one before it, and reached back over the
                   * phone number. One span in, and it is round the link alone.
                   *
                   * It renders in both states, so the edited document and the
                   * read one still differ by nothing: an inline span with no
                   * styles of its own occupies exactly what its content does.
                   */}
                  <span {...itemProps}>
                    {chrome}
                    {/* The guidance is the field's own default now, so all four
                        templates read the same word. */}
                    <LinkField item={item} path={path} justAdded={justAdded} />
                  </span>
                </span>
              )}
            </Collection>
          </p>
        )}
      </header>

      {(resume.summary || authoring) && (
        <DocumentSection
          id="summary"
          heading={resume.section_headings?.summary}
          title="Professional Summary"
          className="tpl-harvard__section"
          headingClassName="tpl-harvard__section-title"
        >
          <p className="tpl-harvard__summary" data-block>
            <EditableText
              path="summary"
              value={resume.summary ?? ''}
              placeholder={PLACEHOLDERS['summary']}
              multiline
            />
          </p>
        </DocumentSection>
      )}

      {(resume.experience.length > 0 || authoring) && (
        <DocumentSection
          id="experience"
          heading={resume.section_headings?.experience}
          title="Experience"
          className="tpl-harvard__section"
          headingClassName="tpl-harvard__section-title"
        >
          <Collection section="experience" items={resume.experience}>
            {({ item, path, chrome, itemProps }) => (
              <HarvardExperienceEntry
                item={item}
                path={path}
                chrome={chrome}
                itemProps={itemProps}
              />
            )}
          </Collection>
        </DocumentSection>
      )}

      {(resume.education.length > 0 || authoring) && (
        <DocumentSection
          id="education"
          heading={resume.section_headings?.education}
          title="Education"
          className="tpl-harvard__section"
          headingClassName="tpl-harvard__section-title"
        >
          <Collection section="education" items={resume.education}>
            {({ item, path, chrome, itemProps }) => (
              <HarvardEducationEntry
                item={item}
                path={path}
                chrome={chrome}
                itemProps={itemProps}
              />
            )}
          </Collection>
        </DocumentSection>
      )}

      <DescribedEntries
        id="achievements"
        heading={resume.section_headings?.achievements}
        title="Achievements"
        items={resume.achievements}
        className="tpl-harvard__section"
        headingClassName="tpl-harvard__heading"
        entryClassName="tpl-harvard__described"
      />
      {(resume.skills.length > 0 || authoring) && (
        <DocumentSection
          id="skills"
          heading={resume.section_headings?.skills}
          title="Technical Skills"
          className="tpl-harvard__section"
          headingClassName="tpl-harvard__section-title"
        >
          <ul className="tpl-harvard__skills" data-block>
            <Collection section="skills" items={resume.skills} gap={false}>
              {({ item, path, chrome, itemProps }) => (
                <HarvardSkillGroup
                  item={item}
                  path={path}
                  chrome={chrome}
                  itemProps={itemProps}
                />
              )}
            </Collection>
          </ul>
        </DocumentSection>
      )}

      <DescribedEntries
        id="courses"
        heading={resume.section_headings?.courses}
        title="Courses"
        items={resume.courses}
        className="tpl-harvard__section"
        headingClassName="tpl-harvard__heading"
        entryClassName="tpl-harvard__described"
      />
      <LanguageList
        items={resume.languages}
        heading={resume.section_headings?.languages}
        className="tpl-harvard__section"
        headingClassName="tpl-harvard__heading"
        rowClassName="tpl-harvard__language"
      />
      {resume.certifications.length > 0 && (
        <DocumentSection
          id="certifications"
          heading={resume.section_headings?.certifications}
          title="Certifications"
          className="tpl-harvard__section"
          headingClassName="tpl-harvard__section-title"
        >
          <p className="tpl-harvard__inline-list" data-block>
            <EditableInlineList
              path="certifications"
              items={resume.certifications}
              placeholder={PLACEHOLDERS['certifications']}
            />
          </p>
        </DocumentSection>
      )}
      <DescribedEntries
        id="passions"
        heading={resume.section_headings?.passions}
        title="Passions"
        items={resume.passions}
        className="tpl-harvard__section"
        headingClassName="tpl-harvard__heading"
        entryClassName="tpl-harvard__described"
      />
      {/*
       * The candidate's own sections, after every section this template
       * knows. Heading in the template's own style; entries in the shared
       * neutral layout — see `CustomSections.tsx`.
       */}
      <CustomSections
        sections={resume.custom_sections}
        sectionClass="tpl-harvard__section"
        headingClass="tpl-harvard__section-title"
        Entry={HarvardCustomEntry}
      />
    </article>
  );
}
