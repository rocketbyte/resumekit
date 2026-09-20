import { PLACEHOLDERS, type ResumeObject } from '@cvgs/core';
import { EditableText } from '../../nodes/EditableText.js';
import { EditableBulletList } from '../../nodes/EditableBulletList.js';
import { CustomSections } from '../../nodes/CustomSections.js';
import { Collection } from '../../collections/Collection.js';
import { LinkField } from '../../nodes/LinkField.js';
import { useAuthoring } from '../../collections/authoring-context.js';
import { useDocumentStyle } from '../../presentation-context.js';
import { BulletSkillGroup } from '../../kit/BulletSkillGroup.js';
import { DocumentSection } from '../../kit/DocumentSection.js';
import { DescribedEntries } from '../../kit/DescribedEntries.js';
import { LanguageList } from '../../kit/LanguageList.js';
import { contactLines } from '../../kit/contact.js';
import { documentStyle } from '../../kit/documentStyle.js';
import { monogram } from '../../kit/monogram.js';
import {
  ExecCustomEntry,
  ExecEducationEntry,
  ExecExperienceEntry,
} from './entries.js';
import './executive.css';

/**
 * The Executive template.
 *
 * Same contract as Harvard: one Craft node for the whole document, structure as
 * plain JSX inside this render (so it is not addressable), and every editable
 * field declared as an `<Element id=…>` linked node carrying its **domain path**.
 * The paths are identical to Harvard's, which is what makes an overlay written
 * under one template apply unchanged under this one.
 *
 * The reference prints a location per experience entry, which this résumé
 * cannot hold, so entry locations are omitted rather than invented. Languages
 * WAS the other such gap; `resume.languages` closed it, and the section is now
 * a first-class list with a level per language. See `design.md`, decision 1.
 */

export interface ExecutiveDocumentProps {
  resume: ResumeObject;
}

export function ExecutiveDocument({ resume }: ExecutiveDocumentProps) {
  const style = useDocumentStyle();
  /*
   * A section with nothing in it is omitted from the DOCUMENT and offered in
   * the EDITOR, because a candidate cannot add their first role to a section
   * that is not drawn. The read-only page is unchanged: with no authoring
   * context this is false and an empty section stays absent.
   */
  const authoring = useAuthoring() !== null;

  const [location] = contactLines(resume.contact, ['location'], authoring);
  const contact = contactLines(resume.contact, ['email', 'phone'], authoring);

  return (
    <article
      className="tpl-exec"
      style={documentStyle('e', style)}
      aria-label="Resume document"
    >
      {/* ── Header band ──────────────────────────────────────────────────── */}
      <header className="tpl-exec__band" data-block>
        <span className="tpl-exec__monogram" aria-hidden="true">
          {monogram(resume.name)}
        </span>

        <div className="tpl-exec__identity">
          <h1 className="tpl-exec__name">
            <EditableText path="name" value={resume.name} />
          </h1>

          {location && (
            <p className="tpl-exec__where">
              <EditableText
                path={location.path}
                value={location.value}
                placeholder={location.placeholder}
              />
            </p>
          )}

          {contact.length > 0 && (
            <p className="tpl-exec__contact">
              {contact.map(({ path, value, placeholder }) => (
                <span key={path} className="tpl-exec__contact-item">
                  <EditableText
                    path={path}
                    value={value}
                    placeholder={placeholder}
                  />
                </span>
              ))}
            </p>
          )}
        </div>
      </header>

      <div className="tpl-exec__body">
        {(resume.summary || authoring) && (
          <DocumentSection
            id="summary"
            heading={resume.section_headings?.summary}
            title="Professional Summary"
            className="tpl-exec__section"
            headingClassName="tpl-exec__heading"
          >
            <p className="tpl-exec__prose" data-block>
              <EditableText
                path="summary"
                value={resume.summary ?? ''}
                placeholder={PLACEHOLDERS['summary']}
                multiline
              />
            </p>
          </DocumentSection>
        )}

        <DescribedEntries
          id="achievements"
          heading={resume.section_headings?.achievements}
          title="Achievements"
          items={resume.achievements}
          className="tpl-exec__section tpl-described--marked"
          headingClassName="tpl-exec__heading"
          entryClassName="tpl-exec__described"
        />
        {(resume.skills.length > 0 || authoring) && (
          <DocumentSection
            id="skills"
            heading={resume.section_headings?.skills}
            title="Technical Skills"
            className="tpl-exec__section"
            headingClassName="tpl-exec__heading"
          >
            {/*
             * Two VISUAL columns over the lists, not structural ones: CSS
             * columns leave the DOM — and therefore the text a parser extracts
             * — in document order.
             */}
            <div className="tpl-exec__columns" data-block>
              {/* "skill", because this template prints no category: what a candidate
                    adds here is a skill, and the group it lands in is storage. */}
              <Collection
                section="skills"
                items={resume.skills}
                noun="skill"
                gap={false}
              >
                {({ item, path }) => (
                  <BulletSkillGroup item={item} path={path} />
                )}
              </Collection>
            </div>
          </DocumentSection>
        )}

        {(resume.experience.length > 0 || authoring) && (
          <DocumentSection
            id="experience"
            heading={resume.section_headings?.experience}
            title="Experience"
            className="tpl-exec__section"
            headingClassName="tpl-exec__heading"
          >
            <Collection section="experience" items={resume.experience}>
              {({ item, path, chrome, itemProps }) => (
                <ExecExperienceEntry
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
            className="tpl-exec__section"
            headingClassName="tpl-exec__heading"
          >
            <Collection section="education" items={resume.education}>
              {({ item, path, chrome, itemProps }) => (
                <ExecEducationEntry
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
          id="courses"
          heading={resume.section_headings?.courses}
          title="Courses"
          items={resume.courses}
          className="tpl-exec__section"
          headingClassName="tpl-exec__heading"
          entryClassName="tpl-exec__described"
        />
        <LanguageList
          items={resume.languages}
          heading={resume.section_headings?.languages}
          className="tpl-exec__section"
          headingClassName="tpl-exec__heading"
          rowClassName="tpl-exec__language"
        />

        {resume.certifications.length > 0 && (
          <DocumentSection
            id="certifications"
            heading={resume.section_headings?.certifications}
            title="Certifications"
            className="tpl-exec__section"
            headingClassName="tpl-exec__heading"
          >
            <div data-block>
              <EditableBulletList
                path="certifications"
                items={resume.certifications}
              />
            </div>
          </DocumentSection>
        )}
        <DescribedEntries
          id="passions"
          heading={resume.section_headings?.passions}
          title="Passions"
          items={resume.passions}
          className="tpl-exec__section tpl-described--marked"
          headingClassName="tpl-exec__heading"
          entryClassName="tpl-exec__described"
        />

        {(resume.headline || authoring) && (
          <section className="tpl-exec__section">
            <h2 className="tpl-exec__heading" data-block data-keep-with-next>
              Personal Information
            </h2>
            <p className="tpl-exec__prose" data-block>
              {'Title: '}
              <EditableText
                path="headline"
                value={resume.headline ?? ''}
                placeholder={PLACEHOLDERS['headline']}
              />
            </p>
          </section>
        )}

        {resume.contact.location && (
          <section className="tpl-exec__section">
            <h2 className="tpl-exec__heading" data-block data-keep-with-next>
              Locations
            </h2>
            <p className="tpl-exec__prose" data-block>
              {/* The same field the header shows: one location, two places it
                  is printed, never two values that can disagree. */}
              {resume.contact.location}
            </p>
          </section>
        )}

        {(resume.links.length > 0 || authoring) && (
          <section className="tpl-exec__section">
            <h2 className="tpl-exec__heading" data-block data-keep-with-next>
              Websites, Portfolios, Profiles
            </h2>
            <ul className="tpl-exec__links" data-block>
              <Collection section="links" items={resume.links} gap={false}>
                {({ item, path, chrome, itemProps, justAdded }) => (
                  <li {...itemProps} className="tpl-exec__link">
                    {chrome}
                    <LinkField item={item} path={path} justAdded={justAdded} />
                  </li>
                )}
              </Collection>
            </ul>
          </section>
        )}
        {/*
         * The candidate's own sections, inside the column that carries the
         * résumé — not after the body. A section outside it inherits none of
         * the page's side padding, so it ran to the paper's edge and its
         * rail fell outside the flow, where nothing can click it.
         */}
        <CustomSections
          sections={resume.custom_sections}
          sectionClass="tpl-exec__section"
          headingClass="tpl-exec__heading"
          Entry={ExecCustomEntry}
        />
      </div>
    </article>
  );
}
