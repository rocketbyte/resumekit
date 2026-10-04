/*
 * GENERATED from timeline.template.yaml by @cvgs/resume-templates' template compiler.
 * Do not edit: change the description and run the package's
 * `generate-templates` script. `check-templates` fails when they disagree.
 */
import type { ResumeObject } from '@cvgs/core';
import { useDocumentStyle } from '../../presentation-context.js';
import { useAuthoring } from '../../collections/authoring-context.js';
import { EditableText } from '../../nodes/EditableText.js';
import { EditableInlineList } from '../../nodes/EditableInlineList.js';
import { CustomSections } from '../../nodes/CustomSections.js';
import { Collection } from '../../collections/Collection.js';
import { DocumentSection } from '../../kit/DocumentSection.js';
import { DescribedEntries } from '../../kit/DescribedEntries.js';
import { LanguageList } from '../../kit/LanguageList.js';
import { BulletSkillGroup } from '../../kit/BulletSkillGroup.js';
import { useContactLines } from '../../kit/contact.js';
import { documentStyle } from '../../kit/documentStyle.js';
import { Heading } from '../../kit/Heading.js';
import { LinkField } from '../../nodes/LinkField.js';
import {
  TimelineCustomEntry,
  TimelineEducationEntry,
  TimelineExperienceEntry,
} from './entries.js';
import './timeline.css';
import { useEditorText, useDocumentText } from '../../i18n/index.js';

export interface TimelineDocumentProps {
  resume: ResumeObject;
}

export function TimelineDocument({ resume }: TimelineDocumentProps) {
  const { placeholder } = useEditorText();
  const doc = useDocumentText();
  const style = useDocumentStyle();
  const authoring = useAuthoring() !== null;

  const contact = useContactLines(
    resume.contact,
    ['phone', 'email', 'location'],
    authoring,
  );

  return (
    <article
      className="tpl-timeline"
      style={documentStyle('tl', style)}
      aria-label={doc.t.resume}
      lang={doc.locale}
    >
      <header className="tpl-timeline__head-block" data-block>
        <Heading level={1} className="tpl-timeline__name">
          <EditableText path="name" value={resume.name} />
        </Heading>

        {(resume.headline || authoring) && (
          <p className="tpl-timeline__headline">
            <EditableText
              path="headline"
              value={resume.headline ?? ''}
              placeholder={placeholder('headline')}
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
          title={doc.t.sections.summary}
          className="tpl-timeline__section"
          headingClassName="tpl-timeline__heading"
        >
          <p className="tpl-timeline__prose" data-block>
            <EditableText
              path="summary"
              value={resume.summary ?? ''}
              placeholder={placeholder('summary')}
              multiline
            />
          </p>
        </DocumentSection>
      )}

      {(resume.experience.length > 0 || authoring) && (
        <DocumentSection
          id="experience"
          heading={resume.section_headings?.experience}
          title={doc.t.sections.experience}
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
          title={doc.t.sections.education}
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
        title={doc.t.sections.achievements}
        className="tpl-timeline__section tpl-described--marked tpl-described--grid"
        headingClassName="tpl-timeline__heading"
        items={resume.achievements}
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
          title={doc.t.sections.skills}
          className="tpl-timeline__section"
          headingClassName="tpl-timeline__heading"
        >
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

      <DescribedEntries
        id="courses"
        heading={resume.section_headings?.courses}
        title={doc.t.sections.courses}
        className="tpl-timeline__section"
        headingClassName="tpl-timeline__heading"
        items={resume.courses}
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
          title={doc.t.sections.certifications}
          className="tpl-timeline__section"
          headingClassName="tpl-timeline__heading"
        >
          <p className="tpl-timeline__keywords" data-block>
            <EditableInlineList
              path="certifications"
              items={resume.certifications}
              placeholder={placeholder('certifications')}
            />
          </p>
        </DocumentSection>
      )}

      <DescribedEntries
        id="passions"
        heading={resume.section_headings?.passions}
        title={doc.t.sections.passions}
        className="tpl-timeline__section tpl-described--marked"
        headingClassName="tpl-timeline__heading"
        items={resume.passions}
        entryClassName="tpl-timeline__described"
      />
    </article>
  );
}
