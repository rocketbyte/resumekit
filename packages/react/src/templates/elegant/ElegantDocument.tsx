import { PLACEHOLDERS, type ResumeObject } from '@cvgs/core';
import { Collection } from '../../collections/Collection.js';
import { useAuthoring } from '../../collections/authoring-context.js';
import { CustomSections } from '../../nodes/CustomSections.js';
import { EditableInlineList } from '../../nodes/EditableInlineList.js';
import { EditableText } from '../../nodes/EditableText.js';
import { LinkField } from '../../nodes/LinkField.js';
import { useDocumentStyle } from '../../presentation-context.js';
import { InlineSkillGroup } from '../../kit/InlineSkillGroup.js';
import { InitialsAvatar } from '../../kit/InitialsAvatar.js';
import { DocumentSection } from '../../kit/DocumentSection.js';
import { DescribedEntries } from '../../kit/DescribedEntries.js';
import { LanguageList } from '../../kit/LanguageList.js';
import { contactLines } from '../../kit/contact.js';
import { documentStyle } from '../../kit/documentStyle.js';
import {
  ElegantCustomEntry,
  ElegantEducationEntry,
  ElegantExperienceEntry,
} from './entries.js';
import './elegant.css';

/**
 * The Elegant template.
 *
 * A painted rail down the right of the page, reversed out in white, beside a
 * work history written FIRST — the only ATS property this shape can honestly
 * offer.
 *
 * The rail runs the FULL height of every sheet, which is why the header lives
 * inside the wide column rather than above both: a header spanning the page
 * would cut the panel off at the top of page one and nowhere else.
 *
 * Reversed type is the one thing here that a browser may decline to print, so
 * the panel asks to be painted and the catalog says the rail is forced rather
 * than promising what an unpainted design can.
 */
export interface ElegantDocumentProps {
  resume: ResumeObject;
}

export function ElegantDocument({ resume }: ElegantDocumentProps) {
  const style = useDocumentStyle();
  const authoring = useAuthoring() !== null;

  const contact = contactLines(
    resume.contact,
    ['phone', 'email', 'location'],
    authoring,
  );

  return (
    <article
      className="tpl-elegant"
      style={documentStyle('el', style)}
      aria-label="Resume document"
    >
      <div className="tpl-elegant__body tpl-sheet-tall">
        <div className="tpl-elegant__main" data-flow>
          <header className="tpl-elegant__head-block" data-block>
            <div className="tpl-elegant__identity">
              <h1 className="tpl-elegant__name">
                <EditableText path="name" value={resume.name} />
              </h1>

              {(resume.headline || authoring) && (
                <p className="tpl-elegant__headline">
                  <EditableText
                    path="headline"
                    value={resume.headline ?? ''}
                    placeholder={PLACEHOLDERS['headline']}
                  />
                </p>
              )}

              {(contact.length > 0 || resume.links.length > 0 || authoring) && (
                <p className="tpl-elegant__contact">
                  {contact.map(({ path, value, placeholder }) => (
                    <span key={path} className="tpl-elegant__contact-item">
                      <EditableText
                        path={path}
                        value={value}
                        placeholder={placeholder}
                      />
                    </span>
                  ))}
                  <Collection
                    section="links"
                    items={resume.links}
                    gap={false}
                    emptyAdd="inline"
                  >
                    {({ item, path, chrome, itemProps, justAdded }) => (
                      <span className="tpl-elegant__contact-item">
                        <span {...itemProps}>
                          {chrome}
                          <LinkField
                            item={item}
                            path={path}
                            justAdded={justAdded}
                          />
                        </span>
                      </span>
                    )}
                  </Collection>
                </p>
              )}
            </div>
          </header>

          {(resume.summary || authoring) && (
            <DocumentSection
              id="summary"
              heading={resume.section_headings?.summary}
              title="Summary"
              className="tpl-elegant__section"
              headingClassName="tpl-elegant__heading"
            >
              <p className="tpl-elegant__prose" data-block>
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
              className="tpl-elegant__section"
              headingClassName="tpl-elegant__heading"
            >
              <Collection section="experience" items={resume.experience}>
                {({ item, path, chrome, itemProps }) => (
                  <ElegantExperienceEntry
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
              className="tpl-elegant__section"
              headingClassName="tpl-elegant__heading"
            >
              <Collection section="education" items={resume.education}>
                {({ item, path, chrome, itemProps }) => (
                  <ElegantEducationEntry
                    item={item}
                    path={path}
                    chrome={chrome}
                    itemProps={itemProps}
                  />
                )}
              </Collection>
            </DocumentSection>
          )}

          {/* Languages: read from `resume.languages`, so each one carries a level
              and the section carries a gap of its own. */}
          <LanguageList
            items={resume.languages}
            heading={resume.section_headings?.languages}
            className="tpl-elegant__section"
            headingClassName="tpl-elegant__heading"
            rowClassName="tpl-elegant__language"
          />
        </div>

        {/* ── The rail: what a reader scans ─────────────────────────────── */}
        <aside className="tpl-elegant__aside" data-flow>
          {/* No photograph is stored, and none is invented: the initials ride
              the top of the rail, where the reference puts a portrait. */}
          <InitialsAvatar name={resume.name} className="tpl-elegant__avatar" />

          <DescribedEntries
            id="achievements"
            heading={resume.section_headings?.achievements}
            title="Achievements"
            items={resume.achievements}
            className="tpl-elegant__section tpl-described--marked"
            headingClassName="tpl-elegant__heading"
            entryClassName="tpl-elegant__described"
          />
          <CustomSections
            sections={resume.custom_sections}
            sectionClass="tpl-elegant__section"
            headingClass="tpl-elegant__heading"
            Entry={ElegantCustomEntry}
          />

          {(resume.skills.length > 0 || authoring) && (
            <DocumentSection
              id="skills"
              heading={resume.section_headings?.skills}
              title="Skills"
              className="tpl-elegant__section"
              headingClassName="tpl-elegant__heading"
            >
              {/* One run of keywords, as this reference sets them — and still a
                  field per group, so a parser reads the separators as characters. */}
              <p className="tpl-elegant__keywords" data-block>
                <Collection
                  section="skills"
                  items={resume.skills}
                  noun="skill"
                  gap={false}
                >
                  {({ item, path, index }) => (
                    <InlineSkillGroup
                      item={item}
                      path={path}
                      first={index === 0}
                    />
                  )}
                </Collection>
              </p>
            </DocumentSection>
          )}

          <DescribedEntries
            id="courses"
            heading={resume.section_headings?.courses}
            title="Courses"
            items={resume.courses}
            className="tpl-elegant__section"
            headingClassName="tpl-elegant__heading"
            entryClassName="tpl-elegant__described"
          />
          {resume.certifications.length > 0 && (
            <DocumentSection
              id="certifications"
              heading={resume.section_headings?.certifications}
              title="Certifications"
              className="tpl-elegant__section"
              headingClassName="tpl-elegant__heading"
            >
              <p className="tpl-elegant__prose" data-block>
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
            className="tpl-elegant__section tpl-described--marked"
            headingClassName="tpl-elegant__heading"
            entryClassName="tpl-elegant__described"
          />
        </aside>
      </div>
    </article>
  );
}
