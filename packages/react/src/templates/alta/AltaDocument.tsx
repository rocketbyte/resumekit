/*
 * GENERATED from alta.template.yaml by @cvgs/resume-templates' template compiler.
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
import { TagSkillGroup } from '../../kit/TagSkillGroup.js';
import { InitialsAvatar } from '../../kit/InitialsAvatar.js';
import { useContactLines } from '../../kit/contact.js';
import { documentStyle } from '../../kit/documentStyle.js';
import { Heading } from '../../kit/Heading.js';
import { LinkField } from '../../nodes/LinkField.js';
import {
  AltaCustomEntry,
  AltaEducationEntry,
  AltaExperienceEntry,
} from './entries.js';
import '../../kit/layout.css';
import '../../kit/contact-icons.css';
import './alta.css';
import { useEditorText, useDocumentText } from '../../i18n/index.js';

export interface AltaDocumentProps {
  resume: ResumeObject;
}

export function AltaDocument({ resume }: AltaDocumentProps) {
  const { placeholder } = useEditorText();
  const doc = useDocumentText();
  const style = useDocumentStyle();
  const authoring = useAuthoring() !== null;

  const contact = useContactLines(
    resume.contact,
    ['email', 'phone', 'location'],
    authoring,
  );

  return (
    <article
      className="tpl-alta"
      style={documentStyle('al', style)}
      aria-label={doc.t.resume}
      lang={doc.locale}
    >
      <header className="tpl-alta__head" data-layout="row" data-block>
        <div className="tpl-alta__ident">
          <Heading level={1} className="tpl-alta__name">
            <EditableText path="name" value={resume.name} />
          </Heading>

          {(resume.headline || authoring) && (
            <p className="tpl-alta__headline">
              <EditableText
                path="headline"
                value={resume.headline ?? ''}
                placeholder={placeholder('headline')}
              />
            </p>
          )}

          {(contact.length > 0 || resume.links.length > 0 || authoring) && (
            <p className="tpl-alta__contact tpl-contact-icons">
              {contact.map(({ field, path, value, placeholder }) => (
                <span
                  key={path}
                  className={`tpl-alta__contact-item tpl-contact--${field}`}
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
                  <span className="tpl-alta__contact-item tpl-contact--link">
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

        <InitialsAvatar name={resume.name} className="tpl-alta__avatar" />
      </header>

      <div className="tpl-alta__body" data-layout="row">
        <div className="tpl-alta__main" data-flow>
          {(resume.experience.length > 0 || authoring) && (
            <DocumentSection
              id="experience"
              heading={resume.section_headings?.experience}
              title={doc.t.sections.experience}
              className="tpl-alta__section"
              headingClassName="tpl-alta__heading"
            >
              <Collection section="experience" items={resume.experience}>
                {({ item, path, chrome, itemProps }) => (
                  <AltaExperienceEntry
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
            sectionClass="tpl-alta__section"
            headingClass="tpl-alta__heading"
            Entry={AltaCustomEntry}
          />

          {(resume.education.length > 0 || authoring) && (
            <DocumentSection
              id="education"
              heading={resume.section_headings?.education}
              title={doc.t.sections.education}
              className="tpl-alta__section"
              headingClassName="tpl-alta__heading"
            >
              <Collection section="education" items={resume.education}>
                {({ item, path, chrome, itemProps }) => (
                  <AltaEducationEntry
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
            id="courses"
            heading={resume.section_headings?.courses}
            title={doc.t.sections.courses}
            className="tpl-alta__section tpl-alta__section--courses"
            headingClassName="tpl-alta__heading"
            items={resume.courses}
            entryClassName="tpl-alta__described"
          />

          {(resume.certifications.length > 0 || authoring) && (
            <DocumentSection
              id="certifications"
              heading={resume.section_headings?.certifications}
              title={doc.t.sections.certifications}
              className="tpl-alta__section"
              headingClassName="tpl-alta__heading"
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
        </div>

        <aside className="tpl-alta__aside" data-flow>
          {(resume.summary || authoring) && (
            <DocumentSection
              id="summary"
              heading={resume.section_headings?.summary}
              title={doc.t.sections.summary}
              className="tpl-alta__section tpl-alta__section--quote"
              headingClassName="tpl-alta__heading"
            >
              <p className="tpl-alta__prose" data-block>
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
            title={doc.t.sections.achievements}
            className="tpl-alta__section tpl-alta__section--proud"
            headingClassName="tpl-alta__heading"
            items={resume.achievements}
            entryClassName="tpl-alta__described"
          />

          {(resume.skills.length > 0 || authoring) && (
            <DocumentSection
              id="skills"
              heading={resume.section_headings?.skills}
              title={doc.t.sections.skills}
              className="tpl-alta__section"
              headingClassName="tpl-alta__heading"
            >
              <div className="tpl-skill-tags">
                <Collection section="skills" items={resume.skills}>
                  {({ item, path, chrome, itemProps }) => (
                    <TagSkillGroup
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
            className="tpl-alta__section"
            headingClassName="tpl-alta__heading"
            rowClassName="tpl-alta__language"
          />

          <DescribedEntries
            id="passions"
            heading={resume.section_headings?.passions}
            title={doc.t.sections.passions}
            className="tpl-alta__section tpl-alta__section--passions"
            headingClassName="tpl-alta__heading"
            items={resume.passions}
            entryClassName="tpl-alta__described"
          />
        </aside>
      </div>
    </article>
  );
}
