/*
 * GENERATED from harvard.template.yaml by @resumekit/react's template compiler.
 * Do not edit: change the description and run the package's
 * `generate-templates` script. `check-templates` fails when they disagree.
 */
import type { ResumeObject } from '@resumekit/schema';
import { useDocumentStyle } from '../../presentation-context.js';
import { useAuthoring } from '../../collections/authoring-context.js';
import { EditableText } from '../../nodes/EditableText.js';
import { EditableInlineList } from '../../nodes/EditableInlineList.js';
import { CustomSections } from '../../nodes/CustomSections.js';
import { Collection } from '../../collections/Collection.js';
import { DocumentSection } from '../../kit/DocumentSection.js';
import { DescribedEntries } from '../../kit/DescribedEntries.js';
import { LanguageList } from '../../kit/LanguageList.js';
import { useContactLines } from '../../kit/contact.js';
import { documentStyle } from '../../kit/documentStyle.js';
import { Heading } from '../../kit/Heading.js';
import { LinkField } from '../../nodes/LinkField.js';
import {
  HarvardCustomEntry,
  HarvardEducationEntry,
  HarvardExperienceEntry,
  HarvardSkillGroup,
} from './entries.js';
import './harvard.css';
import { useEditorText, useDocumentText } from '../../i18n/index.js';

export interface HarvardDocumentProps {
  resume: ResumeObject;
}

export function HarvardDocument({ resume }: HarvardDocumentProps) {
  const { placeholder } = useEditorText();
  const doc = useDocumentText();
  const style = useDocumentStyle();
  const authoring = useAuthoring() !== null;

  const contact = useContactLines(
    resume.contact,
    ['location', 'email', 'phone'],
    authoring,
  );

  return (
    <article
      className="tpl-harvard"
      style={documentStyle('h', style)}
      aria-label={doc.t.resume}
      lang={doc.locale}
    >
      <header className="tpl-harvard__head" data-block>
        <Heading level={1} className="tpl-harvard__name">
          <EditableText path="name" value={resume.name} />
        </Heading>

        {(resume.headline || authoring) && (
          <p className="tpl-harvard__headline">
            <EditableText
              path="headline"
              value={resume.headline ?? ''}
              placeholder={placeholder('headline')}
            />
          </p>
        )}

        {(contact.length > 0 || resume.links.length > 0 || authoring) && (
          <p className="tpl-harvard__contact">
            {contact.map(({ field, path, value, placeholder }) => (
              <span
                key={path}
                className={`tpl-harvard__contact-item tpl-contact--${field}`}
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
                <span className="tpl-harvard__contact-item tpl-contact--link">
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
          title={doc.t.sections.professionalSummary}
          className="tpl-harvard__section"
          headingClassName="tpl-harvard__section-title"
        >
          <p className="tpl-harvard__summary" data-block>
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
          title={doc.t.sections.education}
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
        title={doc.t.sections.achievements}
        className="tpl-harvard__section"
        headingClassName="tpl-harvard__section-title"
        items={resume.achievements}
        entryClassName="tpl-harvard__described"
      />

      <DescribedEntries
        id="courses"
        heading={resume.section_headings?.courses}
        title={doc.t.sections.courses}
        className="tpl-harvard__section"
        headingClassName="tpl-harvard__section-title"
        items={resume.courses}
        entryClassName="tpl-harvard__described"
      />

      {(resume.skills.length > 0 || authoring) && (
        <DocumentSection
          id="skills"
          heading={resume.section_headings?.skills}
          title={doc.t.sections.technicalSkills}
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

      <LanguageList
        items={resume.languages}
        heading={resume.section_headings?.languages}
        className="tpl-harvard__section tpl-harvard__languages"
        headingClassName="tpl-harvard__section-title"
        rowClassName="tpl-harvard__language"
      />

      <DescribedEntries
        id="passions"
        heading={resume.section_headings?.passions}
        title={doc.t.sections.interests}
        className="tpl-harvard__section"
        headingClassName="tpl-harvard__section-title"
        items={resume.passions}
        entryClassName="tpl-harvard__described"
      />

      {resume.certifications.length > 0 && (
        <DocumentSection
          id="certifications"
          heading={resume.section_headings?.certifications}
          title={doc.t.sections.certifications}
          className="tpl-harvard__section"
          headingClassName="tpl-harvard__section-title"
        >
          <p className="tpl-harvard__inline-list" data-block>
            <EditableInlineList
              path="certifications"
              items={resume.certifications}
              placeholder={placeholder('certifications')}
            />
          </p>
        </DocumentSection>
      )}

      <CustomSections
        sections={resume.custom_sections}
        sectionClass="tpl-harvard__section"
        headingClass="tpl-harvard__section-title"
        Entry={HarvardCustomEntry}
      />
    </article>
  );
}
