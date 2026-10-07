/*
 * GENERATED from scholar.template.yaml by @cvgs/resume-templates' template compiler.
 * Do not edit: change the description and run the package's
 * `generate-templates` script. `check-templates` fails when they disagree.
 */
import type { ResumeObject } from '@cvgs/core';
import { useDocumentStyle } from '../../presentation-context.js';
import { useAuthoring } from '../../collections/authoring-context.js';
import { EditableText } from '../../nodes/EditableText.js';
import { EditableBulletList } from '../../nodes/EditableBulletList.js';
import { CustomSections } from '../../nodes/CustomSections.js';
import { Collection } from '../../collections/Collection.js';
import { DocumentSection } from '../../kit/DocumentSection.js';
import { DescribedEntries } from '../../kit/DescribedEntries.js';
import { LanguageList } from '../../kit/LanguageList.js';
import { GridSkillGroup } from '../../kit/GridSkillGroup.js';
import { useContactLines } from '../../kit/contact.js';
import { documentStyle } from '../../kit/documentStyle.js';
import { Heading } from '../../kit/Heading.js';
import { LinkField } from '../../nodes/LinkField.js';
import {
  ScholarCustomEntry,
  ScholarEducationEntry,
  ScholarExperienceEntry,
} from './entries.js';
import './scholar.css';
import { useEditorText, useDocumentText } from '../../i18n/index.js';

export interface ScholarDocumentProps {
  resume: ResumeObject;
}

export function ScholarDocument({ resume }: ScholarDocumentProps) {
  const { placeholder } = useEditorText();
  const doc = useDocumentText();
  const style = useDocumentStyle();
  const authoring = useAuthoring() !== null;

  const contact = useContactLines(resume.contact, ['location'], authoring);
  const contact2 = useContactLines(
    resume.contact,
    ['email', 'phone'],
    authoring,
  );

  return (
    <article
      className="tpl-scholar"
      style={documentStyle('sc', style)}
      aria-label={doc.t.resume}
      lang={doc.locale}
    >
      <header className="tpl-scholar__head" data-block>
        <Heading level={1} className="tpl-scholar__name">
          <EditableText path="name" value={resume.name} />
        </Heading>

        {(resume.headline || authoring) && (
          <p className="tpl-scholar__headline">
            <EditableText
              path="headline"
              value={resume.headline ?? ''}
              placeholder={placeholder('headline')}
            />
          </p>
        )}

        {contact.length > 0 && (
          <p className="tpl-scholar__contact">
            {contact.map(({ field, path, value, placeholder }) => (
              <span
                key={path}
                className={`tpl-scholar__contact-item tpl-contact--${field}`}
              >
                <EditableText
                  path={path}
                  value={value}
                  placeholder={placeholder}
                />
              </span>
            ))}
          </p>
        )}

        {(contact2.length > 0 || resume.links.length > 0 || authoring) && (
          <p className="tpl-scholar__contact">
            {contact2.map(({ field, path, value, placeholder }) => (
              <span
                key={path}
                className={`tpl-scholar__contact-item tpl-contact--${field}`}
              >
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
                <span className="tpl-scholar__contact-item tpl-contact--link">
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
          className="tpl-scholar__section"
          headingClassName="tpl-scholar__heading"
        >
          <p className="tpl-scholar__prose" data-block>
            <EditableText
              path="summary"
              value={resume.summary ?? ''}
              placeholder={placeholder('summary')}
              multiline
            />
          </p>
        </DocumentSection>
      )}

      {(resume.education.length > 0 || authoring) && (
        <DocumentSection
          id="education"
          heading={resume.section_headings?.education}
          title={doc.t.sections.education}
          className="tpl-scholar__section"
          headingClassName="tpl-scholar__heading"
        >
          <Collection section="education" items={resume.education}>
            {({ item, path, chrome, itemProps }) => (
              <ScholarEducationEntry
                item={item}
                path={path}
                chrome={chrome}
                itemProps={itemProps}
              />
            )}
          </Collection>
        </DocumentSection>
      )}

      {(resume.experience.length > 0 || authoring) && (
        <DocumentSection
          id="experience"
          heading={resume.section_headings?.experience}
          title={doc.t.sections.experience}
          className="tpl-scholar__section"
          headingClassName="tpl-scholar__heading"
        >
          <Collection section="experience" items={resume.experience}>
            {({ item, path, chrome, itemProps }) => (
              <ScholarExperienceEntry
                item={item}
                path={path}
                chrome={chrome}
                itemProps={itemProps}
              />
            )}
          </Collection>
        </DocumentSection>
      )}

      <CustomSections
        sections={resume.custom_sections}
        sectionClass="tpl-scholar__section"
        headingClass="tpl-scholar__heading"
        Entry={ScholarCustomEntry}
      />

      {(resume.skills.length > 0 || authoring) && (
        <DocumentSection
          id="skills"
          heading={resume.section_headings?.skills}
          title={doc.t.sections.technicalSkills}
          className="tpl-scholar__section"
          headingClassName="tpl-scholar__heading"
        >
          <div className="tpl-skill-grid">
            <Collection section="skills" items={resume.skills}>
              {({ item, path, chrome, itemProps }) => (
                <GridSkillGroup
                  item={item}
                  path={path}
                  chrome={chrome}
                  itemProps={itemProps}
                />
              )}
            </Collection>
          </div>
        </DocumentSection>
      )}

      <LanguageList
        items={resume.languages}
        heading={resume.section_headings?.languages}
        className="tpl-scholar__section tpl-scholar__languages"
        headingClassName="tpl-scholar__heading"
        rowClassName="tpl-scholar__language"
      />

      <DescribedEntries
        id="achievements"
        heading={resume.section_headings?.achievements}
        title={doc.t.sections.achievements}
        className="tpl-scholar__section"
        headingClassName="tpl-scholar__heading"
        items={resume.achievements}
        entryClassName="tpl-scholar__described"
      />

      <DescribedEntries
        id="courses"
        heading={resume.section_headings?.courses}
        title={doc.t.sections.courses}
        className="tpl-scholar__section"
        headingClassName="tpl-scholar__heading"
        items={resume.courses}
        entryClassName="tpl-scholar__described"
      />

      {(resume.certifications.length > 0 || authoring) && (
        <DocumentSection
          id="certifications"
          heading={resume.section_headings?.certifications}
          title={doc.t.sections.certifications}
          className="tpl-scholar__section"
          headingClassName="tpl-scholar__heading"
        >
          <div data-block>
            <EditableBulletList
              path="certifications"
              items={resume.certifications}
              placeholder={placeholder('certification')}
            />
          </div>
        </DocumentSection>
      )}

      <DescribedEntries
        id="passions"
        heading={resume.section_headings?.passions}
        title={doc.t.sections.passions}
        className="tpl-scholar__section"
        headingClassName="tpl-scholar__heading"
        items={resume.passions}
        entryClassName="tpl-scholar__described"
      />
    </article>
  );
}
