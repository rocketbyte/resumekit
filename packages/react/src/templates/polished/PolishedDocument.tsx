import { PLACEHOLDERS, type ResumeObject } from '@cvgs/core';
import { Collection } from '../../collections/Collection.js';
import { useAuthoring } from '../../collections/authoring-context.js';
import { CustomSections } from '../../nodes/CustomSections.js';
import { EditableInlineList } from '../../nodes/EditableInlineList.js';
import { EditableText } from '../../nodes/EditableText.js';
import { LinkField } from '../../nodes/LinkField.js';
import { useDocumentStyle } from '../../presentation-context.js';
import { InlineSkillGroup } from '../../kit/InlineSkillGroup.js';
import { DocumentSection } from '../../kit/DocumentSection.js';
import { DescribedEntries } from '../../kit/DescribedEntries.js';
import { LanguageList } from '../../kit/LanguageList.js';
import { contactLines } from '../../kit/contact.js';
import { documentStyle } from '../../kit/documentStyle.js';
import {
  PolishedCustomEntry,
  PolishedEducationEntry,
  PolishedExperienceEntry,
} from './entries.js';
import './polished.css';

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
export interface PolishedDocumentProps {
  resume: ResumeObject;
}

export function PolishedDocument({ resume }: PolishedDocumentProps) {
  const style = useDocumentStyle();
  const authoring = useAuthoring() !== null;

  const contact = contactLines(
    resume.contact,
    ['phone', 'email', 'location'],
    authoring,
  );

  return (
    <article
      className="tpl-polished"
      style={documentStyle('po', style)}
      aria-label="Resume document"
    >
      <div className="tpl-polished__body tpl-sheet-tall">
        {/* ── The rail: what a reader scans ─────────────────────────────── */}
        <aside className="tpl-polished__aside" data-flow>
          <h1 className="tpl-polished__name" data-block>
            <EditableText path="name" value={resume.name} />
          </h1>

          <DescribedEntries
            id="achievements"
            heading={resume.section_headings?.achievements}
            title="Achievements"
            items={resume.achievements}
            className="tpl-polished__section tpl-described--marked"
            headingClassName="tpl-polished__heading"
            entryClassName="tpl-polished__described"
          />
          <CustomSections
            sections={resume.custom_sections}
            sectionClass="tpl-polished__section"
            headingClass="tpl-polished__heading"
            Entry={PolishedCustomEntry}
          />

          <DescribedEntries
            id="courses"
            heading={resume.section_headings?.courses}
            title="Courses"
            items={resume.courses}
            className="tpl-polished__section"
            headingClassName="tpl-polished__heading"
            entryClassName="tpl-polished__described"
          />
          {resume.certifications.length > 0 && (
            <DocumentSection
              id="certifications"
              heading={resume.section_headings?.certifications}
              title="Certifications"
              className="tpl-polished__section"
              headingClassName="tpl-polished__heading"
            >
              <p className="tpl-polished__prose" data-block>
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
            className="tpl-polished__section tpl-described--marked"
            headingClassName="tpl-polished__heading"
            entryClassName="tpl-polished__described"
          />
        </aside>
        <div className="tpl-polished__main" data-flow>
          <header className="tpl-polished__head-block" data-block>
            <div className="tpl-polished__identity">
              {(resume.headline || authoring) && (
                <p className="tpl-polished__headline">
                  <EditableText
                    path="headline"
                    value={resume.headline ?? ''}
                    placeholder={PLACEHOLDERS['headline']}
                  />
                </p>
              )}

              {(contact.length > 0 || resume.links.length > 0 || authoring) && (
                <p className="tpl-polished__contact">
                  {contact.map(({ path, value, placeholder }) => (
                    <span key={path} className="tpl-polished__contact-item">
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
                      <span className="tpl-polished__contact-item">
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
              className="tpl-polished__section"
              headingClassName="tpl-polished__heading"
            >
              <p className="tpl-polished__prose" data-block>
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
              className="tpl-polished__section"
              headingClassName="tpl-polished__heading"
            >
              <Collection section="experience" items={resume.experience}>
                {({ item, path, chrome, itemProps }) => (
                  <PolishedExperienceEntry
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
              className="tpl-polished__section"
              headingClassName="tpl-polished__heading"
            >
              <Collection section="education" items={resume.education}>
                {({ item, path, chrome, itemProps }) => (
                  <PolishedEducationEntry
                    item={item}
                    path={path}
                    chrome={chrome}
                    itemProps={itemProps}
                  />
                )}
              </Collection>
            </DocumentSection>
          )}

          {(resume.skills.length > 0 || authoring) && (
            <DocumentSection
              id="skills"
              heading={resume.section_headings?.skills}
              title="Skills"
              className="tpl-polished__section"
              headingClassName="tpl-polished__heading"
            >
              {/* One run of keywords, as this reference sets them — and still a
                  field per group, so a parser reads the separators as characters. */}
              <p className="tpl-polished__keywords" data-block>
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
          {/* Languages: read from `resume.languages`, so each one carries a level
              and the section carries a gap of its own. */}
          <LanguageList
            items={resume.languages}
            heading={resume.section_headings?.languages}
            className="tpl-polished__section"
            headingClassName="tpl-polished__heading"
            rowClassName="tpl-polished__language"
          />
        </div>
      </div>
    </article>
  );
}
