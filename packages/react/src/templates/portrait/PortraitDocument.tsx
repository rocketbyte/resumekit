/*
 * GENERATED from portrait.template.yaml by @resumekit/react's template compiler.
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
  PortraitCustomEntry,
  PortraitEducationEntry,
  PortraitExperienceEntry,
} from './entries.js';
import '../../kit/layout.css';
import '../../kit/contact-icons.css';
import './portrait.css';
import { useEditorText, useDocumentText } from '../../i18n/index.js';

export interface PortraitDocumentProps {
  resume: ResumeObject;
}

export function PortraitDocument({ resume }: PortraitDocumentProps) {
  const { placeholder } = useEditorText();
  const doc = useDocumentText();
  const style = useDocumentStyle();
  const authoring = useAuthoring() !== null;

  const contact = useContactLines(
    resume.contact,
    ['location', 'phone', 'email'],
    authoring,
  );

  const headingLead = { count: 3, className: 'tpl-portrait__heading-lead' };

  return (
    <article
      className="tpl-portrait"
      style={documentStyle('pt', style)}
      aria-label={doc.t.resume}
      lang={doc.locale}
    >
      <div className="tpl-portrait__body tpl-sheet-tall" data-layout="row">
        <aside className="tpl-portrait__aside" data-flow>
          <header className="tpl-portrait__head" data-block>
            <InitialsAvatar
              name={resume.name}
              className="tpl-portrait__avatar"
            />

            <Heading level={1} className="tpl-portrait__name">
              <EditableText path="name" value={resume.name} />
            </Heading>

            {(resume.headline || authoring) && (
              <p className="tpl-portrait__headline">
                <EditableText
                  path="headline"
                  value={resume.headline ?? ''}
                  placeholder={placeholder('headline')}
                />
              </p>
            )}

            {(contact.length > 0 || resume.links.length > 0 || authoring) && (
              <div className="tpl-portrait__contact tpl-contact-icons">
                {contact.map(({ field, path, value, placeholder }) => (
                  <p
                    key={path}
                    className={`tpl-portrait__contact-item tpl-contact--${field}`}
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
                    <p className="tpl-portrait__contact-item tpl-contact--link">
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
          </header>

          {(resume.summary || authoring) && (
            <DocumentSection
              id="summary"
              heading={resume.section_headings?.summary}
              title={doc.t.sections.summary}
              className="tpl-portrait__section"
              headingClassName="tpl-portrait__heading"
              headingLead={headingLead}
            >
              <p className="tpl-portrait__prose" data-block>
                <EditableText
                  path="summary"
                  value={resume.summary ?? ''}
                  placeholder={placeholder('summary')}
                  multiline
                />
              </p>
            </DocumentSection>
          )}

          {(resume.skills.length > 0 || authoring) && (
            <DocumentSection
              id="skills"
              heading={resume.section_headings?.skills}
              title={doc.t.sections.skills}
              className="tpl-portrait__section"
              headingClassName="tpl-portrait__heading"
              headingLead={headingLead}
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
            className="tpl-portrait__section tpl-portrait__languages"
            headingClassName="tpl-portrait__heading"
            headingLead={headingLead}
            rowClassName="tpl-portrait__language"
          />
        </aside>

        <div className="tpl-portrait__main" data-flow>
          {(resume.experience.length > 0 || authoring) && (
            <DocumentSection
              id="experience"
              heading={resume.section_headings?.experience}
              title={doc.t.sections.experience}
              className="tpl-portrait__section"
              headingClassName="tpl-portrait__heading"
              headingLead={headingLead}
            >
              <Collection section="experience" items={resume.experience}>
                {({ item, path, chrome, itemProps }) => (
                  <PortraitExperienceEntry
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
              className="tpl-portrait__section"
              headingClassName="tpl-portrait__heading"
              headingLead={headingLead}
            >
              <Collection section="education" items={resume.education}>
                {({ item, path, chrome, itemProps }) => (
                  <PortraitEducationEntry
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
            className="tpl-portrait__section"
            headingClassName="tpl-portrait__heading"
            headingLead={headingLead}
            items={resume.achievements}
            entryClassName="tpl-portrait__described"
          />

          <DescribedEntries
            id="courses"
            heading={resume.section_headings?.courses}
            title={doc.t.sections.courses}
            className="tpl-portrait__section"
            headingClassName="tpl-portrait__heading"
            headingLead={headingLead}
            items={resume.courses}
            entryClassName="tpl-portrait__described"
          />

          {(resume.certifications.length > 0 || authoring) && (
            <DocumentSection
              id="certifications"
              heading={resume.section_headings?.certifications}
              title={doc.t.sections.certifications}
              className="tpl-portrait__section"
              headingClassName="tpl-portrait__heading"
              headingLead={headingLead}
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
            title={doc.t.sections.interests}
            className="tpl-portrait__section"
            headingClassName="tpl-portrait__heading"
            headingLead={headingLead}
            items={resume.passions}
            entryClassName="tpl-portrait__described"
          />

          <CustomSections
            sections={resume.custom_sections}
            sectionClass="tpl-portrait__section"
            headingClass="tpl-portrait__heading"
            headingLead={headingLead}
            Entry={PortraitCustomEntry}
          />
        </div>
      </div>
    </article>
  );
}
