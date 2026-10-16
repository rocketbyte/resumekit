/*
 * GENERATED from polished.template.yaml by @resumekit/react's template compiler.
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
import { useContactLines } from '../../kit/contact.js';
import { documentStyle } from '../../kit/documentStyle.js';
import { Heading } from '../../kit/Heading.js';
import { LinkField } from '../../nodes/LinkField.js';
import {
  PolishedCustomEntry,
  PolishedEducationEntry,
  PolishedExperienceEntry,
} from './entries.js';
import '../../kit/layout.css';
import '../../kit/contact-icons.css';
import './polished.css';
import { useEditorText, useDocumentText } from '../../i18n/index.js';

export interface PolishedDocumentProps {
  resume: ResumeObject;
}

export function PolishedDocument({ resume }: PolishedDocumentProps) {
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
      className="tpl-polished"
      style={documentStyle('po', style)}
      aria-label={doc.t.resume}
      lang={doc.locale}
    >
      <div className="tpl-polished__body tpl-sheet-tall" data-layout="row">
        <aside className="tpl-polished__aside" data-flow>
          <Heading level={1} className="tpl-polished__name" data-block>
            <EditableText path="name" value={resume.name} />
          </Heading>

          <DescribedEntries
            id="achievements"
            heading={resume.section_headings?.achievements}
            title={doc.t.sections.achievements}
            className="tpl-polished__section tpl-described--marked"
            headingClassName="tpl-polished__heading"
            items={resume.achievements}
            entryClassName="tpl-polished__described"
          />

          <CustomSections
            sections={resume.custom_sections}
            sectionClass="tpl-polished__section"
            headingClass="tpl-polished__heading"
            Entry={PolishedCustomEntry}
          />

          <DescribedEntries
            id="courses"
            heading={resume.section_headings?.courses}
            title={doc.t.sections.courses}
            className="tpl-polished__section"
            headingClassName="tpl-polished__heading"
            items={resume.courses}
            entryClassName="tpl-polished__described"
          />

          {resume.certifications.length > 0 && (
            <DocumentSection
              id="certifications"
              heading={resume.section_headings?.certifications}
              title={doc.t.sections.certifications}
              className="tpl-polished__section"
              headingClassName="tpl-polished__heading"
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
            className="tpl-polished__section tpl-described--marked"
            headingClassName="tpl-polished__heading"
            items={resume.passions}
            entryClassName="tpl-polished__described"
          />
        </aside>

        <div className="tpl-polished__main" data-flow>
          <header className="tpl-polished__head-block" data-block>
            <div className="tpl-polished__identity">
              {(resume.headline || authoring) && (
                <p className="tpl-polished__headline">
                  <EditableText
                    path="headline"
                    value={resume.headline ?? ''}
                    placeholder={placeholder('headline')}
                  />
                </p>
              )}

              {(contact.length > 0 || resume.links.length > 0 || authoring) && (
                <p className="tpl-polished__contact tpl-contact-icons">
                  {contact.map(({ field, path, value, placeholder }) => (
                    <span
                      key={path}
                      className={`tpl-polished__contact-item tpl-contact--${field}`}
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
                      <span className="tpl-polished__contact-item tpl-contact--link">
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
          </header>

          {(resume.summary || authoring) && (
            <DocumentSection
              id="summary"
              heading={resume.section_headings?.summary}
              title={doc.t.sections.summary}
              className="tpl-polished__section"
              headingClassName="tpl-polished__heading"
            >
              <p className="tpl-polished__prose" data-block>
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
              className="tpl-polished__section"
              headingClassName="tpl-polished__heading"
            >
              <Collection section="experience" items={resume.experience}>
                {({ item, path, chrome, itemProps }) => (
                  <PolishedExperienceEntry
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
              className="tpl-polished__section"
              headingClassName="tpl-polished__heading"
            >
              <Collection section="education" items={resume.education}>
                {({ item, path, chrome, itemProps }) => (
                  <PolishedEducationEntry
                    item={item}
                    path={path}
                    chrome={chrome}
                    itemProps={itemProps}
                  />
                )}
              </Collection>
            </DocumentSection>
          )}

          {(resume.skills.length > 0 || authoring) && (
            <DocumentSection
              id="skills"
              heading={resume.section_headings?.skills}
              title={doc.t.sections.skills}
              className="tpl-polished__section"
              headingClassName="tpl-polished__heading"
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
            className="tpl-polished__section"
            headingClassName="tpl-polished__heading"
            rowClassName="tpl-polished__language"
          />
        </div>
      </div>
    </article>
  );
}
