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
  DoubleColumnCustomEntry,
  DoubleColumnEducationEntry,
  DoubleColumnExperienceEntry,
} from './entries.js';
import './double-column.css';

/**
 * The Double Column template.
 *
 * The plainest two-column page in the catalog, and the loudest headings: set
 * at reading size over a heavy rule, so the eye finds a section before it
 * finds a word. The work history is in the wide column and written FIRST,
 * which is the only ATS property this shape can honestly offer.
 *
 * Its rail separates one highlight from the next with a dotted rule rather
 * than with space, which is what lets the column stay dense without the notes
 * running together.
 *
 * Each column is `data-flow`, so `PagedSheet` breaks it by its own height.
 */
export interface DoubleColumnDocumentProps {
  resume: ResumeObject;
}

export function DoubleColumnDocument({ resume }: DoubleColumnDocumentProps) {
  const style = useDocumentStyle();
  const authoring = useAuthoring() !== null;

  const contact = contactLines(
    resume.contact,
    ['phone', 'email', 'location'],
    authoring,
  );

  return (
    <article
      className="tpl-dc"
      style={documentStyle('dc', style)}
      aria-label="Resume document"
    >
      <header className="tpl-dc__head-block" data-block>
        <div className="tpl-dc__identity">
          <h1 className="tpl-dc__name">
            <EditableText path="name" value={resume.name} />
          </h1>

          {(resume.headline || authoring) && (
            <p className="tpl-dc__headline">
              <EditableText
                path="headline"
                value={resume.headline ?? ''}
                placeholder={PLACEHOLDERS['headline']}
              />
            </p>
          )}

          {(contact.length > 0 || resume.links.length > 0 || authoring) && (
            <p className="tpl-dc__contact">
              {contact.map(({ path, value, placeholder }) => (
                <span key={path} className="tpl-dc__contact-item">
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
                  <span className="tpl-dc__contact-item">
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
        <InitialsAvatar name={resume.name} className="tpl-dc__avatar" />
      </header>

      <div className="tpl-dc__body">
        <div className="tpl-dc__main" data-flow>
          {(resume.summary || authoring) && (
            <DocumentSection
              id="summary"
              heading={resume.section_headings?.summary}
              title="Summary"
              className="tpl-dc__section"
              headingClassName="tpl-dc__heading"
            >
              <p className="tpl-dc__prose" data-block>
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
              className="tpl-dc__section"
              headingClassName="tpl-dc__heading"
            >
              <Collection section="experience" items={resume.experience}>
                {({ item, path, chrome, itemProps }) => (
                  <DoubleColumnExperienceEntry
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
              className="tpl-dc__section"
              headingClassName="tpl-dc__heading"
            >
              <Collection section="education" items={resume.education}>
                {({ item, path, chrome, itemProps }) => (
                  <DoubleColumnEducationEntry
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
            className="tpl-dc__section"
            headingClassName="tpl-dc__heading"
            rowClassName="tpl-dc__language"
          />
        </div>

        {/* ── The rail: what a reader scans ─────────────────────────────── */}
        <aside className="tpl-dc__aside" data-flow>
          <DescribedEntries
            id="achievements"
            heading={resume.section_headings?.achievements}
            title="Achievements"
            items={resume.achievements}
            className="tpl-dc__section tpl-described--marked"
            headingClassName="tpl-dc__heading"
            entryClassName="tpl-dc__described"
          />
          <CustomSections
            sections={resume.custom_sections}
            sectionClass="tpl-dc__section"
            headingClass="tpl-dc__heading"
            Entry={DoubleColumnCustomEntry}
          />

          {(resume.skills.length > 0 || authoring) && (
            <DocumentSection
              id="skills"
              heading={resume.section_headings?.skills}
              title="Skills"
              className="tpl-dc__section"
              headingClassName="tpl-dc__heading"
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
            className="tpl-dc__section"
            headingClassName="tpl-dc__heading"
            entryClassName="tpl-dc__described"
          />
          {resume.certifications.length > 0 && (
            <DocumentSection
              id="certifications"
              heading={resume.section_headings?.certifications}
              title="Certifications"
              className="tpl-dc__section"
              headingClassName="tpl-dc__heading"
            >
              <p className="tpl-dc__prose" data-block>
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
            className="tpl-dc__section tpl-described--marked"
            headingClassName="tpl-dc__heading"
            entryClassName="tpl-dc__described"
          />
        </aside>
      </div>
    </article>
  );
}
