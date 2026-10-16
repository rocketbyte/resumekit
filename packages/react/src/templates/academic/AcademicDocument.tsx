/*
 * GENERATED from academic.template.yaml by @resumekit/react's template compiler.
 * Do not edit: change the description and run the package's
 * `generate-templates` script. `check-templates` fails when they disagree.
 */
import type { ResumeObject } from '@resumekit/schema';
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
import { InitialsAvatar } from '../../kit/InitialsAvatar.js';
import { useContactLines } from '../../kit/contact.js';
import { documentStyle } from '../../kit/documentStyle.js';
import { Heading } from '../../kit/Heading.js';
import { LinkField } from '../../nodes/LinkField.js';
import {
  AcademicCustomEntry,
  AcademicEducationEntry,
  AcademicExperienceEntry,
} from './entries.js';
import '../../kit/layout.css';
import '../../kit/contact-icons.css';
import './academic.css';
import { useEditorText, useDocumentText } from '../../i18n/index.js';

export interface AcademicDocumentProps {
  resume: ResumeObject;
}

export function AcademicDocument({ resume }: AcademicDocumentProps) {
  const { placeholder } = useEditorText();
  const doc = useDocumentText();
  const style = useDocumentStyle();
  const authoring = useAuthoring() !== null;

  const contact = useContactLines(
    resume.contact,
    ['location', 'phone', 'email'],
    authoring,
  );

  return (
    <article
      className="tpl-academic"
      style={documentStyle('ac', style)}
      aria-label={doc.t.resume}
      lang={doc.locale}
    >
      <header className="tpl-academic__head" data-layout="row" data-block>
        <div className="tpl-academic__identity">
          <Heading level={1} className="tpl-academic__name">
            <EditableText path="name" value={resume.name} />
          </Heading>

          {(resume.headline || authoring) && (
            <p className="tpl-academic__headline">
              <EditableText
                path="headline"
                value={resume.headline ?? ''}
                placeholder={placeholder('headline')}
              />
            </p>
          )}
        </div>

        {(contact.length > 0 || resume.links.length > 0 || authoring) && (
          <div className="tpl-academic__contact tpl-contact-icons">
            {contact.map(({ field, path, value, placeholder }) => (
              <p
                key={path}
                className={`tpl-academic__contact-item tpl-contact--${field}`}
              >
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
                <p className="tpl-academic__contact-item tpl-contact--link">
                  <span {...itemProps}>
                    {chrome}
                    <LinkField item={item} path={path} justAdded={justAdded} />
                  </span>
                </p>
              )}
            </Collection>
          </div>
        )}

        <InitialsAvatar name={resume.name} className="tpl-academic__avatar" />
      </header>

      {(resume.summary || authoring) && (
        <DocumentSection
          id="summary"
          heading={resume.section_headings?.summary}
          title={doc.t.sections.summary}
          className="tpl-academic__section"
          headingClassName="tpl-academic__heading"
        >
          <p className="tpl-academic__prose" data-block>
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
          className="tpl-academic__section"
          headingClassName="tpl-academic__heading"
        >
          <Collection section="education" items={resume.education}>
            {({ item, path, chrome, itemProps }) => (
              <AcademicEducationEntry
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
          className="tpl-academic__section"
          headingClassName="tpl-academic__heading"
        >
          <Collection section="experience" items={resume.experience}>
            {({ item, path, chrome, itemProps }) => (
              <AcademicExperienceEntry
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
        className="tpl-academic__section tpl-academic__section--hung"
        headingClassName="tpl-academic__heading"
        items={resume.achievements}
        entryClassName="tpl-academic__described"
      />

      <CustomSections
        sections={resume.custom_sections}
        sectionClass="tpl-academic__section"
        headingClass="tpl-academic__heading"
        Entry={AcademicCustomEntry}
      />

      <DescribedEntries
        id="courses"
        heading={resume.section_headings?.courses}
        title={doc.t.sections.courses}
        className="tpl-academic__section tpl-academic__section--hung"
        headingClassName="tpl-academic__heading"
        items={resume.courses}
        entryClassName="tpl-academic__described"
      />

      {(resume.certifications.length > 0 || authoring) && (
        <DocumentSection
          id="certifications"
          heading={resume.section_headings?.certifications}
          title={doc.t.sections.certifications}
          className="tpl-academic__section"
          headingClassName="tpl-academic__heading"
        >
          <div className="tpl-academic__hung" data-block data-split>
            <EditableBulletList
              path="certifications"
              items={resume.certifications}
              placeholder={placeholder('certification')}
            />
          </div>
        </DocumentSection>
      )}

      <LanguageList
        items={resume.languages}
        heading={resume.section_headings?.languages}
        className="tpl-academic__section"
        headingClassName="tpl-academic__heading"
        rowClassName="tpl-academic__language"
      />

      {(resume.skills.length > 0 || authoring) && (
        <DocumentSection
          id="skills"
          heading={resume.section_headings?.skills}
          title={doc.t.sections.skills}
          className="tpl-academic__section"
          headingClassName="tpl-academic__heading"
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

      <DescribedEntries
        id="passions"
        heading={resume.section_headings?.passions}
        title={doc.t.sections.passions}
        className="tpl-academic__section tpl-academic__section--items"
        headingClassName="tpl-academic__heading"
        items={resume.passions}
        entryClassName="tpl-academic__described"
      />
    </article>
  );
}
