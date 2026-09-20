import { PLACEHOLDERS, type ResumeObject } from '@cvgs/core';
import { Collection } from '../../collections/Collection.js';
import { useAuthoring } from '../../collections/authoring-context.js';
import { CustomSections } from '../../nodes/CustomSections.js';
import { EditableInlineList } from '../../nodes/EditableInlineList.js';
import { EditableText } from '../../nodes/EditableText.js';
import { LinkField } from '../../nodes/LinkField.js';
import { useDocumentStyle } from '../../presentation-context.js';
import { BulletSkillGroup } from '../../kit/BulletSkillGroup.js';
import { InitialsAvatar } from '../../kit/InitialsAvatar.js';
import { DocumentSection } from '../../kit/DocumentSection.js';
import { DescribedEntries } from '../../kit/DescribedEntries.js';
import { LanguageList } from '../../kit/LanguageList.js';
import { contactLines } from '../../kit/contact.js';
import { documentStyle } from '../../kit/documentStyle.js';
import {
  ModernCustomEntry,
  ModernEducationEntry,
  ModernExperienceEntry,
} from './entries.js';
import './modern.css';

/**
 * The Modern template.
 *
 * A navy name over an accented headline, the candidate's initials where the
 * reference shows a portrait, and a body of two columns with the work history
 * in the wide one — written FIRST, which is the only ATS property this shape
 * can honestly offer.
 *
 * Its headings are ruled across their own column, which is what tells the two
 * columns apart at a glance without drawing a divider between them.
 *
 * Each column is `data-flow`, so `PagedSheet` breaks it by its own height.
 */
export interface ModernDocumentProps {
  resume: ResumeObject;
}

export function ModernDocument({ resume }: ModernDocumentProps) {
  const style = useDocumentStyle();
  const authoring = useAuthoring() !== null;

  const contact = contactLines(
    resume.contact,
    ['phone', 'email', 'location'],
    authoring,
  );

  return (
    <article
      className="tpl-modern"
      style={documentStyle('md', style)}
      aria-label="Resume document"
    >
      <header className="tpl-modern__head-block" data-block>
        <div className="tpl-modern__identity">
          <h1 className="tpl-modern__name">
            <EditableText path="name" value={resume.name} />
          </h1>

          {(resume.headline || authoring) && (
            <p className="tpl-modern__headline">
              <EditableText
                path="headline"
                value={resume.headline ?? ''}
                placeholder={PLACEHOLDERS['headline']}
              />
            </p>
          )}

          {(contact.length > 0 || resume.links.length > 0 || authoring) && (
            <p className="tpl-modern__contact">
              {contact.map(({ path, value, placeholder }) => (
                <span key={path} className="tpl-modern__contact-item">
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
                  <span className="tpl-modern__contact-item">
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
        {/* No photograph is stored, and none is invented: the initials stand
            in the slot the design gives a portrait. */}
        <InitialsAvatar name={resume.name} className="tpl-modern__avatar" />
      </header>

      <div className="tpl-modern__body">
        <div className="tpl-modern__main" data-flow>
          {(resume.experience.length > 0 || authoring) && (
            <DocumentSection
              id="experience"
              heading={resume.section_headings?.experience}
              title="Experience"
              className="tpl-modern__section"
              headingClassName="tpl-modern__heading"
            >
              <Collection section="experience" items={resume.experience}>
                {({ item, path, chrome, itemProps }) => (
                  <ModernExperienceEntry
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
              className="tpl-modern__section"
              headingClassName="tpl-modern__heading"
            >
              <Collection section="education" items={resume.education}>
                {({ item, path, chrome, itemProps }) => (
                  <ModernEducationEntry
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
            className="tpl-modern__section"
            headingClassName="tpl-modern__heading"
            rowClassName="tpl-modern__language"
          />
        </div>

        {/* ── The rail: what a reader scans ─────────────────────────────── */}
        <aside className="tpl-modern__aside" data-flow>
          {(resume.summary || authoring) && (
            <DocumentSection
              id="summary"
              heading={resume.section_headings?.summary}
              title="Summary"
              className="tpl-modern__section"
              headingClassName="tpl-modern__heading"
            >
              <p className="tpl-modern__prose" data-block>
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
            className="tpl-modern__section tpl-described--marked"
            headingClassName="tpl-modern__heading"
            entryClassName="tpl-modern__described"
          />
          <CustomSections
            sections={resume.custom_sections}
            sectionClass="tpl-modern__section"
            headingClass="tpl-modern__heading"
            Entry={ModernCustomEntry}
          />

          {(resume.skills.length > 0 || authoring) && (
            <DocumentSection
              id="skills"
              heading={resume.section_headings?.skills}
              title="Skills"
              className="tpl-modern__section"
              headingClassName="tpl-modern__heading"
            >
              {/* Keywords over a rule, one to a line, and every one a list ITEM:
                  a parser reads them one per line rather than as a run. */}
              <div className="tpl-keywords" data-block data-split>
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

          <DescribedEntries
            id="courses"
            heading={resume.section_headings?.courses}
            title="Courses"
            items={resume.courses}
            className="tpl-modern__section"
            headingClassName="tpl-modern__heading"
            entryClassName="tpl-modern__described"
          />
          {resume.certifications.length > 0 && (
            <DocumentSection
              id="certifications"
              heading={resume.section_headings?.certifications}
              title="Certifications"
              className="tpl-modern__section"
              headingClassName="tpl-modern__heading"
            >
              <p className="tpl-modern__prose" data-block>
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
            className="tpl-modern__section tpl-described--marked"
            headingClassName="tpl-modern__heading"
            entryClassName="tpl-modern__described"
          />
        </aside>
      </div>
    </article>
  );
}
