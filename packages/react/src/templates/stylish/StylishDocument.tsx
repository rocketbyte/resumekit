/*
 * GENERATED from stylish.template.yaml by @cvgs/resume-templates' template compiler.
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
import { InitialsAvatar } from '../../kit/InitialsAvatar.js';
import { useContactLines } from '../../kit/contact.js';
import { documentStyle } from '../../kit/documentStyle.js';
import { Heading } from '../../kit/Heading.js';
import { LinkField } from '../../nodes/LinkField.js';
import {
  StylishCustomEntry,
  StylishEducationEntry,
  StylishExperienceEntry,
} from './entries.js';
import '../../kit/layout.css';
import '../../kit/contact-icons.css';
import './stylish.css';
import { useEditorText, useDocumentText } from '../../i18n/index.js';

export interface StylishDocumentProps {
  resume: ResumeObject;
}

export function StylishDocument({ resume }: StylishDocumentProps) {
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
      className="tpl-stylish"
      style={documentStyle('st', style)}
      aria-label={doc.t.resume}
      lang={doc.locale}
    >
      <header className="tpl-stylish__head-block" data-layout="row" data-block>
        <div className="tpl-stylish__identity">
          <Heading level={1} className="tpl-stylish__name">
            <EditableText path="name" value={resume.name} />
          </Heading>

          {(resume.headline || authoring) && (
            <p className="tpl-stylish__headline">
              <EditableText
                path="headline"
                value={resume.headline ?? ''}
                placeholder={placeholder('headline')}
              />
            </p>
          )}

          {(contact.length > 0 || resume.links.length > 0 || authoring) && (
            <p className="tpl-stylish__contact tpl-contact-icons">
              {contact.map(({ field, path, value, placeholder }) => (
                <span
                  key={path}
                  className={`tpl-stylish__contact-item tpl-contact--${field}`}
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
                  <span className="tpl-stylish__contact-item tpl-contact--link">
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

        <InitialsAvatar name={resume.name} className="tpl-stylish__avatar" />
      </header>

      <div className="tpl-stylish__body" data-layout="row">
        <aside className="tpl-stylish__aside" data-flow>
          <DescribedEntries
            id="achievements"
            heading={resume.section_headings?.achievements}
            title={doc.t.sections.achievements}
            className="tpl-stylish__section tpl-described--marked"
            headingClassName="tpl-stylish__heading"
            items={resume.achievements}
            entryClassName="tpl-stylish__described"
          />

          <CustomSections
            sections={resume.custom_sections}
            sectionClass="tpl-stylish__section"
            headingClass="tpl-stylish__heading"
            Entry={StylishCustomEntry}
          />

          {(resume.skills.length > 0 || authoring) && (
            <DocumentSection
              id="skills"
              heading={resume.section_headings?.skills}
              title={doc.t.sections.skills}
              className="tpl-stylish__section"
              headingClassName="tpl-stylish__heading"
            >
              <div
                className="tpl-keywords tpl-keywords--boxed"
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
            className="tpl-stylish__section"
            headingClassName="tpl-stylish__heading"
            items={resume.courses}
            entryClassName="tpl-stylish__described"
          />

          {resume.certifications.length > 0 && (
            <DocumentSection
              id="certifications"
              heading={resume.section_headings?.certifications}
              title={doc.t.sections.certifications}
              className="tpl-stylish__section"
              headingClassName="tpl-stylish__heading"
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
            className="tpl-stylish__section tpl-described--marked"
            headingClassName="tpl-stylish__heading"
            items={resume.passions}
            entryClassName="tpl-stylish__described"
          />
        </aside>

        <div className="tpl-stylish__main" data-flow>
          {(resume.summary || authoring) && (
            <DocumentSection
              id="summary"
              heading={resume.section_headings?.summary}
              title={doc.t.sections.summary}
              className="tpl-stylish__section"
              headingClassName="tpl-stylish__heading"
            >
              <p className="tpl-stylish__prose" data-block>
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
              className="tpl-stylish__section"
              headingClassName="tpl-stylish__heading"
            >
              <Collection section="experience" items={resume.experience}>
                {({ item, path, chrome, itemProps }) => (
                  <StylishExperienceEntry
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
              className="tpl-stylish__section"
              headingClassName="tpl-stylish__heading"
            >
              <Collection section="education" items={resume.education}>
                {({ item, path, chrome, itemProps }) => (
                  <StylishEducationEntry
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
            className="tpl-stylish__section"
            headingClassName="tpl-stylish__heading"
            rowClassName="tpl-stylish__language"
          />
        </div>
      </div>
    </article>
  );
}
