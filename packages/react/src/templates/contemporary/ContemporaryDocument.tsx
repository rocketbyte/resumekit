/*
 * GENERATED from contemporary.template.yaml by @cvgs/resume-templates' template compiler.
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
import { InitialsAvatar } from '../../kit/InitialsAvatar.js';
import { useContactLines } from '../../kit/contact.js';
import { documentStyle } from '../../kit/documentStyle.js';
import { Heading } from '../../kit/Heading.js';
import { LinkField } from '../../nodes/LinkField.js';
import {
  ContemporaryCustomEntry,
  ContemporaryEducationEntry,
  ContemporaryExperienceEntry,
} from './entries.js';
import '../../kit/layout.css';
import '../../kit/contact-icons.css';
import './contemporary.css';
import { useEditorText, useDocumentText } from '../../i18n/index.js';

export interface ContemporaryDocumentProps {
  resume: ResumeObject;
}

export function ContemporaryDocument({ resume }: ContemporaryDocumentProps) {
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
      className="tpl-contemporary"
      style={documentStyle('cn', style)}
      aria-label={doc.t.resume}
      lang={doc.locale}
    >
      <header
        className="tpl-contemporary__head-block"
        data-layout="row"
        data-block
      >
        <div className="tpl-contemporary__identity">
          <Heading level={1} className="tpl-contemporary__name">
            <EditableText path="name" value={resume.name} />
          </Heading>

          {(resume.headline || authoring) && (
            <p className="tpl-contemporary__headline">
              <EditableText
                path="headline"
                value={resume.headline ?? ''}
                placeholder={placeholder('headline')}
              />
            </p>
          )}
        </div>

        <InitialsAvatar
          name={resume.name}
          className="tpl-contemporary__avatar"
        />
      </header>

      <div className="tpl-contemporary__body" data-layout="row">
        <aside className="tpl-contemporary__aside" data-flow>
          {(contact.length > 0 || resume.links.length > 0 || authoring) && (
            <section className="tpl-contemporary__section">
              <Heading
                level={2}
                className="tpl-contemporary__heading tpl-contemporary__heading--contacts"
                data-block
                data-keep-with-next
              >
                {doc.t.panels.contacts}
              </Heading>
              {(contact.length > 0 || resume.links.length > 0 || authoring) && (
                <div
                  className="tpl-contemporary__contacts tpl-contact-icons"
                  data-block
                >
                  {contact.map(({ field, path, value, placeholder }) => (
                    <p
                      key={path}
                      className={`tpl-contemporary__contact-item tpl-contact--${field}`}
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
                      <p className="tpl-contemporary__contact-item tpl-contact--link">
                        <span {...itemProps}>
                          {chrome}
                          <LinkField
                            item={item}
                            path={path}
                            justAdded={justAdded}
                          />
                        </span>
                      </p>
                    )}
                  </Collection>
                </div>
              )}
            </section>
          )}

          {(resume.summary || authoring) && (
            <DocumentSection
              id="summary"
              heading={resume.section_headings?.summary}
              title={doc.t.sections.summary}
              className="tpl-contemporary__section"
              headingClassName="tpl-contemporary__heading tpl-contemporary__heading--summary"
            >
              <p className="tpl-contemporary__prose" data-block>
                <EditableText
                  path="summary"
                  value={resume.summary ?? ''}
                  placeholder={placeholder('summary')}
                  multiline
                />
              </p>
            </DocumentSection>
          )}

          <DescribedEntries
            id="achievements"
            heading={resume.section_headings?.achievements}
            title={doc.t.sections.keyAchievements}
            className="tpl-contemporary__section tpl-described--marked"
            headingClassName="tpl-contemporary__heading tpl-contemporary__heading--achievements"
            items={resume.achievements}
            entryClassName="tpl-contemporary__described"
          />

          <CustomSections
            sections={resume.custom_sections}
            sectionClass="tpl-contemporary__section"
            headingClass="tpl-contemporary__heading"
            Entry={ContemporaryCustomEntry}
          />

          {(resume.skills.length > 0 || authoring) && (
            <DocumentSection
              id="skills"
              heading={resume.section_headings?.skills}
              title={doc.t.sections.skills}
              className="tpl-contemporary__section"
              headingClassName="tpl-contemporary__heading"
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
            className="tpl-contemporary__section"
            headingClassName="tpl-contemporary__heading tpl-contemporary__heading--courses"
            items={resume.courses}
            entryClassName="tpl-contemporary__described"
          />

          {resume.certifications.length > 0 && (
            <DocumentSection
              id="certifications"
              heading={resume.section_headings?.certifications}
              title={doc.t.sections.certifications}
              className="tpl-contemporary__section"
              headingClassName="tpl-contemporary__heading"
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
            className="tpl-contemporary__section tpl-described--marked"
            headingClassName="tpl-contemporary__heading tpl-contemporary__heading--passions"
            items={resume.passions}
            entryClassName="tpl-contemporary__described"
          />
        </aside>

        <div className="tpl-contemporary__main" data-flow>
          {(resume.experience.length > 0 || authoring) && (
            <DocumentSection
              id="experience"
              heading={resume.section_headings?.experience}
              title={doc.t.sections.experience}
              className="tpl-contemporary__section"
              headingClassName="tpl-contemporary__heading tpl-contemporary__heading--experience"
            >
              <Collection section="experience" items={resume.experience}>
                {({ item, path, chrome, itemProps }) => (
                  <ContemporaryExperienceEntry
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
              className="tpl-contemporary__section"
              headingClassName="tpl-contemporary__heading tpl-contemporary__heading--education"
            >
              <Collection section="education" items={resume.education}>
                {({ item, path, chrome, itemProps }) => (
                  <ContemporaryEducationEntry
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
            className="tpl-contemporary__section"
            headingClassName="tpl-contemporary__heading"
            rowClassName="tpl-contemporary__language"
          />
        </div>
      </div>
    </article>
  );
}
