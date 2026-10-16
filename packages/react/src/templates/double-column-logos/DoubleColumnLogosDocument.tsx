/*
 * GENERATED from double-column-logos.template.yaml by @cvgs/resume-templates' template compiler.
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
import { BulletSkillGroup } from '../../kit/BulletSkillGroup.js';
import { useContactLines } from '../../kit/contact.js';
import { documentStyle } from '../../kit/documentStyle.js';
import { Heading } from '../../kit/Heading.js';
import { LinkField } from '../../nodes/LinkField.js';
import {
  DoubleColumnLogosCustomEntry,
  DoubleColumnLogosEducationEntry,
  DoubleColumnLogosExperienceEntry,
} from './entries.js';
import '../../kit/layout.css';
import '../../kit/contact-icons.css';
import './double-column-logos.css';
import { useEditorText, useDocumentText } from '../../i18n/index.js';

export interface DoubleColumnLogosDocumentProps {
  resume: ResumeObject;
}

export function DoubleColumnLogosDocument({
  resume,
}: DoubleColumnLogosDocumentProps) {
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
      className="tpl-dcl"
      style={documentStyle('dcl', style)}
      aria-label={doc.t.resume}
      lang={doc.locale}
    >
      <header className="tpl-dcl__head-block" data-block>
        <Heading level={1} className="tpl-dcl__name">
          <EditableText path="name" value={resume.name} />
        </Heading>

        {(resume.headline || authoring) && (
          <p className="tpl-dcl__headline">
            <EditableText
              path="headline"
              value={resume.headline ?? ''}
              placeholder={placeholder('headline')}
            />
          </p>
        )}

        {(contact.length > 0 || resume.links.length > 0 || authoring) && (
          <p className="tpl-dcl__contact tpl-contact-icons">
            {contact.map(({ field, path, value, placeholder }) => (
              <span
                key={path}
                className={`tpl-dcl__contact-item tpl-contact--${field}`}
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
                <span className="tpl-dcl__contact-item tpl-contact--link">
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

      <div className="tpl-dcl__body" data-layout="row">
        <div className="tpl-dcl__main" data-flow>
          {(resume.summary || authoring) && (
            <DocumentSection
              id="summary"
              heading={resume.section_headings?.summary}
              title={doc.t.sections.summary}
              className="tpl-dcl__section"
              headingClassName="tpl-dcl__heading"
            >
              <p className="tpl-dcl__prose" data-block>
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
              className="tpl-dcl__section"
              headingClassName="tpl-dcl__heading"
            >
              <Collection section="experience" items={resume.experience}>
                {({ item, path, chrome, itemProps }) => (
                  <DoubleColumnLogosExperienceEntry
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
              className="tpl-dcl__section"
              headingClassName="tpl-dcl__heading"
            >
              <Collection section="education" items={resume.education}>
                {({ item, path, chrome, itemProps }) => (
                  <DoubleColumnLogosEducationEntry
                    item={item}
                    path={path}
                    chrome={chrome}
                    itemProps={itemProps}
                  />
                )}
              </Collection>
            </DocumentSection>
          )}

          <LanguageList
            items={resume.languages}
            heading={resume.section_headings?.languages}
            className="tpl-dcl__section"
            headingClassName="tpl-dcl__heading"
            rowClassName="tpl-dcl__language"
          />
        </div>

        <aside className="tpl-dcl__aside" data-flow>
          <DescribedEntries
            id="achievements"
            heading={resume.section_headings?.achievements}
            title={doc.t.sections.keyAchievements}
            className="tpl-dcl__section tpl-described--marked"
            headingClassName="tpl-dcl__heading"
            items={resume.achievements}
            entryClassName="tpl-dcl__described"
          />

          <CustomSections
            sections={resume.custom_sections}
            sectionClass="tpl-dcl__section"
            headingClass="tpl-dcl__heading"
            Entry={DoubleColumnLogosCustomEntry}
          />

          {(resume.skills.length > 0 || authoring) && (
            <DocumentSection
              id="skills"
              heading={resume.section_headings?.skills}
              title={doc.t.sections.skills}
              className="tpl-dcl__section"
              headingClassName="tpl-dcl__heading"
            >
              <div
                className="tpl-keywords tpl-keywords--tags"
                data-block
                data-split
              >
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
            title={doc.t.sections.courses}
            className="tpl-dcl__section"
            headingClassName="tpl-dcl__heading"
            items={resume.courses}
            entryClassName="tpl-dcl__described"
          />

          {resume.certifications.length > 0 && (
            <DocumentSection
              id="certifications"
              heading={resume.section_headings?.certifications}
              title={doc.t.sections.certifications}
              className="tpl-dcl__section"
              headingClassName="tpl-dcl__heading"
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
            className="tpl-dcl__section tpl-described--marked"
            headingClassName="tpl-dcl__heading"
            items={resume.passions}
            entryClassName="tpl-dcl__described"
          />
        </aside>
      </div>
    </article>
  );
}
