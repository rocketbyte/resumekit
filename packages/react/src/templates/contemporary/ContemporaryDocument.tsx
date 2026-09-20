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
  ContemporaryCustomEntry,
  ContemporaryEducationEntry,
  ContemporaryExperienceEntry,
} from './entries.js';
import './contemporary.css';

/**
 * The Contemporary template.
 *
 * The candidate's initials beside their name at the top, then two columns with
 * the rail on the LEFT — written first, because it is drawn first: document
 * order is the page's order, so the extracted text, the printed text layer and
 * the keyboard's path are one order by construction.
 *
 * The contact details live in the rail as a section of their own rather than
 * under the name, which is what the reference does and what gives the top of
 * the page its air.
 *
 * Each column is `data-flow`, so `PagedSheet` breaks it by its own height.
 */
export interface ContemporaryDocumentProps {
  resume: ResumeObject;
}

export function ContemporaryDocument({ resume }: ContemporaryDocumentProps) {
  const style = useDocumentStyle();
  const authoring = useAuthoring() !== null;

  const contact = contactLines(
    resume.contact,
    ['phone', 'email', 'location'],
    authoring,
  );

  return (
    <article
      className="tpl-contemporary"
      style={documentStyle('cn', style)}
      aria-label="Resume document"
    >
      <header className="tpl-contemporary__head-block" data-block>
        <div className="tpl-contemporary__identity">
          <h1 className="tpl-contemporary__name">
            <EditableText path="name" value={resume.name} />
          </h1>

          {(resume.headline || authoring) && (
            <p className="tpl-contemporary__headline">
              <EditableText
                path="headline"
                value={resume.headline ?? ''}
                placeholder={PLACEHOLDERS['headline']}
              />
            </p>
          )}
        </div>
        {/* No photograph is stored, and none is invented: the initials stand
            in the slot the design gives a portrait. */}
        <InitialsAvatar
          name={resume.name}
          className="tpl-contemporary__avatar"
        />
      </header>

      <div className="tpl-contemporary__body">
        {/* ── The rail: what a reader scans ─────────────────────────────── */}
        <aside className="tpl-contemporary__aside" data-flow>
          {(contact.length > 0 || resume.links.length > 0 || authoring) && (
            <section className="tpl-contemporary__section">
              <h2
                className="tpl-contemporary__heading"
                data-block
                data-keep-with-next
              >
                Contacts
              </h2>
              <div className="tpl-contemporary__contacts" data-block>
                {contact.map(({ path, value, placeholder }) => (
                  <p key={path} className="tpl-contemporary__contact-item">
                    <EditableText
                      path={path}
                      value={value}
                      placeholder={placeholder}
                    />
                  </p>
                ))}
                <Collection
                  section="links"
                  items={resume.links}
                  gap={false}
                  emptyAdd="inline"
                >
                  {({ item, path, chrome, itemProps, justAdded }) => (
                    <p className="tpl-contemporary__contact-item">
                      <span {...itemProps}>
                        {chrome}
                        <LinkField
                          item={item}
                          path={path}
                          justAdded={justAdded}
                        />
                      </span>
                    </p>
                  )}
                </Collection>
              </div>
            </section>
          )}

          {(resume.summary || authoring) && (
            <DocumentSection
              id="summary"
              heading={resume.section_headings?.summary}
              title="Summary"
              className="tpl-contemporary__section"
              headingClassName="tpl-contemporary__heading"
            >
              <p className="tpl-contemporary__prose" data-block>
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
            title="Key Achievements"
            items={resume.achievements}
            className="tpl-contemporary__section tpl-described--marked"
            headingClassName="tpl-contemporary__heading"
            entryClassName="tpl-contemporary__described"
          />
          <CustomSections
            sections={resume.custom_sections}
            sectionClass="tpl-contemporary__section"
            headingClass="tpl-contemporary__heading"
            Entry={ContemporaryCustomEntry}
          />

          {(resume.skills.length > 0 || authoring) && (
            <DocumentSection
              id="skills"
              heading={resume.section_headings?.skills}
              title="Skills"
              className="tpl-contemporary__section"
              headingClassName="tpl-contemporary__heading"
            >
              {/* One run of keywords, as this reference sets them — and still a
                  field per group, so a parser reads the separators as characters. */}
              <p className="tpl-contemporary__keywords" data-block>
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
            className="tpl-contemporary__section"
            headingClassName="tpl-contemporary__heading"
            entryClassName="tpl-contemporary__described"
          />
          {resume.certifications.length > 0 && (
            <DocumentSection
              id="certifications"
              heading={resume.section_headings?.certifications}
              title="Certifications"
              className="tpl-contemporary__section"
              headingClassName="tpl-contemporary__heading"
            >
              <p className="tpl-contemporary__prose" data-block>
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
            className="tpl-contemporary__section tpl-described--marked"
            headingClassName="tpl-contemporary__heading"
            entryClassName="tpl-contemporary__described"
          />
        </aside>
        <div className="tpl-contemporary__main" data-flow>
          {(resume.experience.length > 0 || authoring) && (
            <DocumentSection
              id="experience"
              heading={resume.section_headings?.experience}
              title="Experience"
              className="tpl-contemporary__section"
              headingClassName="tpl-contemporary__heading"
            >
              <Collection section="experience" items={resume.experience}>
                {({ item, path, chrome, itemProps }) => (
                  <ContemporaryExperienceEntry
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
              className="tpl-contemporary__section"
              headingClassName="tpl-contemporary__heading"
            >
              <Collection section="education" items={resume.education}>
                {({ item, path, chrome, itemProps }) => (
                  <ContemporaryEducationEntry
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
            className="tpl-contemporary__section"
            headingClassName="tpl-contemporary__heading"
            rowClassName="tpl-contemporary__language"
          />
        </div>
      </div>
    </article>
  );
}
