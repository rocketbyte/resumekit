import { PLACEHOLDERS, type ResumeObject } from '@cvgs/core';
import { Collection } from '../../collections/Collection.js';
import { useAuthoring } from '../../collections/authoring-context.js';
import { CustomSections } from '../../nodes/CustomSections.js';
import { EditableInlineList } from '../../nodes/EditableInlineList.js';
import { EditableText } from '../../nodes/EditableText.js';
import { LinkField } from '../../nodes/LinkField.js';
import { useDocumentStyle } from '../../presentation-context.js';
import { DocumentSection } from '../../kit/DocumentSection.js';
import { DescribedEntries } from '../../kit/DescribedEntries.js';
import { LanguageList } from '../../kit/LanguageList.js';
import { BulletSkillGroup } from '../../kit/BulletSkillGroup.js';
import { contactLines } from '../../kit/contact.js';
import { documentStyle } from '../../kit/documentStyle.js';
import {
  TimelineCustomEntry,
  TimelineEducationEntry,
  TimelineExperienceEntry,
} from './entries.js';
import './timeline.css';

/**
 * The Timeline template.
 *
 * One column, with every entry hung off a dated spine: the dates and the place
 * at the left, a ruled line with a dot, then the role over the employer in the
 * accent. The spine is the design's whole idea, and it is drawn as a border on
 * the entry's own middle column so that it exists exactly where entries do.
 *
 * Skills are chips — boxes by appearance, list items by structure — and the
 * candidate's own sections are set two to a row.
 */
export interface TimelineDocumentProps {
  resume: ResumeObject;
}

export function TimelineDocument({ resume }: TimelineDocumentProps) {
  const style = useDocumentStyle();
  const authoring = useAuthoring() !== null;

  const contact = contactLines(
    resume.contact,
    ['phone', 'email', 'location'],
    authoring,
  );

  return (
    <article
      className="tpl-timeline"
      style={documentStyle('tl', style)}
      aria-label="Resume document"
    >
      <header className="tpl-timeline__head-block" data-block>
        <h1 className="tpl-timeline__name">
          <EditableText path="name" value={resume.name} />
        </h1>

        {(resume.headline || authoring) && (
          <p className="tpl-timeline__headline">
            <EditableText
              path="headline"
              value={resume.headline ?? ''}
              placeholder={PLACEHOLDERS['headline']}
            />
          </p>
        )}

        {(contact.length > 0 || resume.links.length > 0 || authoring) && (
          <p className="tpl-timeline__contact">
            {contact.map(({ path, value, placeholder }) => (
              <span key={path} className="tpl-timeline__contact-item">
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
                <span className="tpl-timeline__contact-item">
                  <span {...itemProps}>
                    {chrome}
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
          title="Summary"
          className="tpl-timeline__section"
          headingClassName="tpl-timeline__heading"
        >
          <p className="tpl-timeline__prose" data-block>
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
          className="tpl-timeline__section"
          headingClassName="tpl-timeline__heading"
        >
          <Collection section="experience" items={resume.experience}>
            {({ item, path, chrome, itemProps }) => (
              <TimelineExperienceEntry
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
          className="tpl-timeline__section"
          headingClassName="tpl-timeline__heading"
        >
          <Collection section="education" items={resume.education}>
            {({ item, path, chrome, itemProps }) => (
              <TimelineEducationEntry
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
        className="tpl-timeline__section tpl-described--marked tpl-described--grid"
        headingClassName="tpl-timeline__heading"
        entryClassName="tpl-timeline__described"
      />
      <CustomSections
        sections={resume.custom_sections}
        sectionClass="tpl-timeline__section"
        headingClass="tpl-timeline__heading"
        Entry={TimelineCustomEntry}
      />

      {(resume.skills.length > 0 || authoring) && (
        <DocumentSection
          id="skills"
          heading={resume.section_headings?.skills}
          title="Skills"
          className="tpl-timeline__section"
          headingClassName="tpl-timeline__heading"
        >
          {/* Keywords over a rule, one to a line, and every one a list ITEM:
              a parser reads them one per line rather than as a run. */}
          <div
            className="tpl-keywords tpl-keywords--inline"
            data-block
            data-split
          >
            <Collection
              section="skills"
              items={resume.skills}
              noun="skill"
              gap={false}
            >
              {({ item, path }) => <BulletSkillGroup item={item} path={path} />}
            </Collection>
          </div>
        </DocumentSection>
      )}

      {/* A plain section: "the space above Languages" is not a stored gap, and
          reusing the skills key would give two sections one rail. */}
      <DescribedEntries
        id="courses"
        heading={resume.section_headings?.courses}
        title="Courses"
        items={resume.courses}
        className="tpl-timeline__section"
        headingClassName="tpl-timeline__heading"
        entryClassName="tpl-timeline__described"
      />
      <LanguageList
        items={resume.languages}
        heading={resume.section_headings?.languages}
        className="tpl-timeline__section"
        headingClassName="tpl-timeline__heading"
        rowClassName="tpl-timeline__language"
      />

      {resume.certifications.length > 0 && (
        <DocumentSection
          id="certifications"
          heading={resume.section_headings?.certifications}
          title="Certifications"
          className="tpl-timeline__section"
          headingClassName="tpl-timeline__heading"
        >
          <p className="tpl-timeline__keywords" data-block>
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
        className="tpl-timeline__section tpl-described--marked"
        headingClassName="tpl-timeline__heading"
        entryClassName="tpl-timeline__described"
      />
    </article>
  );
}
