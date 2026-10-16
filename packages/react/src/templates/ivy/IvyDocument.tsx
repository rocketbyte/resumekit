/*
 * GENERATED from ivy.template.yaml by @cvgs/resume-templates' template compiler.
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
  IvyCustomEntry,
  IvyEducationEntry,
  IvyExperienceEntry,
} from './entries.js';
import './ivy.css';
import { useEditorText, useDocumentText } from '../../i18n/index.js';

export interface IvyDocumentProps {
  resume: ResumeObject;
}

export function IvyDocument({ resume }: IvyDocumentProps) {
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
      className="tpl-ivy"
      style={documentStyle('i', style)}
      aria-label={doc.t.resume}
      lang={doc.locale}
    >
      <header className="tpl-ivy__head-block" data-block>
        <Heading level={1} className="tpl-ivy__name">
          <EditableText path="name" value={resume.name} />
        </Heading>

        {(resume.headline || authoring) && (
          <p className="tpl-ivy__headline">
            <EditableText
              path="headline"
              value={resume.headline ?? ''}
              placeholder={placeholder('headline')}
            />
          </p>
        )}

        {(contact.length > 0 || resume.links.length > 0 || authoring) && (
          <p className="tpl-ivy__contact">
            {contact.map(({ field, path, value, placeholder }) => (
              <span
                key={path}
                className={`tpl-ivy__contact-item tpl-contact--${field}`}
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
                <span className="tpl-ivy__contact-item tpl-contact--link">
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
          className="tpl-ivy__section"
          headingClassName="tpl-ivy__heading"
        >
          <p className="tpl-ivy__prose" data-block>
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
          className="tpl-ivy__section"
          headingClassName="tpl-ivy__heading"
        >
          <Collection section="experience" items={resume.experience}>
            {({ item, path, chrome, itemProps }) => (
              <IvyExperienceEntry
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
          className="tpl-ivy__section"
          headingClassName="tpl-ivy__heading"
        >
          <Collection section="education" items={resume.education}>
            {({ item, path, chrome, itemProps }) => (
              <IvyEducationEntry
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
        className="tpl-ivy__section tpl-described--marked tpl-described--grid"
        headingClassName="tpl-ivy__heading"
        items={resume.achievements}
        entryClassName="tpl-ivy__described"
      />

      {(resume.skills.length > 0 || authoring) && (
        <DocumentSection
          id="skills"
          heading={resume.section_headings?.skills}
          title={doc.t.sections.skills}
          className="tpl-ivy__section"
          headingClassName="tpl-ivy__heading"
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
        id="courses"
        heading={resume.section_headings?.courses}
        title={doc.t.sections.courses}
        className="tpl-ivy__section tpl-ivy__courses"
        headingClassName="tpl-ivy__heading"
        items={resume.courses}
        entryClassName="tpl-ivy__described"
      />

      <LanguageList
        items={resume.languages}
        heading={resume.section_headings?.languages}
        className="tpl-ivy__section"
        headingClassName="tpl-ivy__heading"
        rowClassName="tpl-ivy__language"
      />

      {resume.certifications.length > 0 && (
        <DocumentSection
          id="certifications"
          heading={resume.section_headings?.certifications}
          title={doc.t.sections.certifications}
          className="tpl-ivy__section"
          headingClassName="tpl-ivy__heading"
        >
          <div data-block data-split>
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
        className="tpl-ivy__section tpl-described--marked"
        headingClassName="tpl-ivy__heading"
        items={resume.passions}
        entryClassName="tpl-ivy__described"
      />

      <CustomSections
        sections={resume.custom_sections}
        sectionClass="tpl-ivy__section"
        headingClass="tpl-ivy__heading"
        Entry={IvyCustomEntry}
      />
    </article>
  );
}
