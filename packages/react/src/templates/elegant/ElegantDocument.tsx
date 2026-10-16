/*
 * GENERATED from elegant.template.yaml by @cvgs/resume-templates' template compiler.
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
  ElegantCustomEntry,
  ElegantEducationEntry,
  ElegantExperienceEntry,
} from './entries.js';
import '../../kit/layout.css';
import '../../kit/contact-icons.css';
import './elegant.css';
import { useEditorText, useDocumentText } from '../../i18n/index.js';

export interface ElegantDocumentProps {
  resume: ResumeObject;
}

export function ElegantDocument({ resume }: ElegantDocumentProps) {
  const { placeholder } = useEditorText();
  const doc = useDocumentText();
  const style = useDocumentStyle();
  const authoring = useAuthoring() !== null;

  const contact = useContactLines(resume.contact, ['phone'], authoring);
  const contact2 = useContactLines(resume.contact, ['email'], authoring);
  const contact3 = useContactLines(resume.contact, ['location'], authoring);

  return (
    <article
      className="tpl-elegant"
      style={documentStyle('el', style)}
      aria-label={doc.t.resume}
      lang={doc.locale}
    >
      <div className="tpl-elegant__body tpl-sheet-tall" data-layout="row">
        <div className="tpl-elegant__main" data-flow>
          <header className="tpl-elegant__head-block" data-block>
            <div className="tpl-elegant__identity">
              <Heading level={1} className="tpl-elegant__name">
                <EditableText path="name" value={resume.name} />
              </Heading>

              {(resume.headline || authoring) && (
                <p className="tpl-elegant__headline">
                  <EditableText
                    path="headline"
                    value={resume.headline ?? ''}
                    placeholder={placeholder('headline')}
                  />
                </p>
              )}

              <div className="tpl-elegant__contact" data-layout="row">
                {contact.length > 0 && (
                  <p className="tpl-elegant__phone tpl-contact--phone tpl-contact-icons">
                    {contact.map(({ path, value, placeholder }) => (
                      <EditableText
                        key={path}
                        path={path}
                        value={value}
                        placeholder={placeholder}
                      />
                    ))}
                  </p>
                )}

                {contact2.length > 0 && (
                  <p className="tpl-elegant__email tpl-contact--email tpl-contact-icons">
                    {contact2.map(({ path, value, placeholder }) => (
                      <EditableText
                        key={path}
                        path={path}
                        value={value}
                        placeholder={placeholder}
                      />
                    ))}
                  </p>
                )}

                {(resume.links.length > 0 || authoring) && (
                  <div className="tpl-elegant__link-line">
                    <ul
                      className="tpl-elegant__links tpl-contact-icons"
                      data-block
                    >
                      <Collection
                        section="links"
                        items={resume.links}
                        gap={false}
                      >
                        {({ item, path, chrome, itemProps, justAdded }) => (
                          <li
                            {...itemProps}
                            className="tpl-elegant__link tpl-contact--link"
                          >
                            {chrome}
                            <LinkField
                              item={item}
                              path={path}
                              justAdded={justAdded}
                            />
                          </li>
                        )}
                      </Collection>
                    </ul>
                  </div>
                )}

                {contact3.length > 0 && (
                  <p className="tpl-elegant__place tpl-contact--location tpl-contact-icons">
                    {contact3.map(({ path, value, placeholder }) => (
                      <EditableText
                        key={path}
                        path={path}
                        value={value}
                        placeholder={placeholder}
                      />
                    ))}
                  </p>
                )}
              </div>
            </div>
          </header>

          {(resume.summary || authoring) && (
            <DocumentSection
              id="summary"
              heading={resume.section_headings?.summary}
              title={doc.t.sections.summary}
              className="tpl-elegant__section"
              headingClassName="tpl-elegant__heading"
            >
              <p className="tpl-elegant__prose" data-block>
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
              className="tpl-elegant__section"
              headingClassName="tpl-elegant__heading"
            >
              <Collection section="experience" items={resume.experience}>
                {({ item, path, chrome, itemProps }) => (
                  <ElegantExperienceEntry
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
              className="tpl-elegant__section"
              headingClassName="tpl-elegant__heading"
            >
              <Collection section="education" items={resume.education}>
                {({ item, path, chrome, itemProps }) => (
                  <ElegantEducationEntry
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
            className="tpl-elegant__section"
            headingClassName="tpl-elegant__heading"
            rowClassName="tpl-elegant__language"
          />
        </div>

        <aside className="tpl-elegant__aside" data-flow>
          <InitialsAvatar name={resume.name} className="tpl-elegant__avatar" />

          <DescribedEntries
            id="achievements"
            heading={resume.section_headings?.achievements}
            title={doc.t.sections.achievements}
            className="tpl-elegant__section tpl-described--marked"
            headingClassName="tpl-elegant__heading"
            items={resume.achievements}
            entryClassName="tpl-elegant__described"
          />

          <CustomSections
            sections={resume.custom_sections}
            sectionClass="tpl-elegant__section"
            headingClass="tpl-elegant__heading"
            Entry={ElegantCustomEntry}
          />

          {(resume.skills.length > 0 || authoring) && (
            <DocumentSection
              id="skills"
              heading={resume.section_headings?.skills}
              title={doc.t.sections.skills}
              className="tpl-elegant__section"
              headingClassName="tpl-elegant__heading"
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
            className="tpl-elegant__section"
            headingClassName="tpl-elegant__heading"
            items={resume.courses}
            entryClassName="tpl-elegant__described"
          />

          {resume.certifications.length > 0 && (
            <DocumentSection
              id="certifications"
              heading={resume.section_headings?.certifications}
              title={doc.t.sections.certifications}
              className="tpl-elegant__section"
              headingClassName="tpl-elegant__heading"
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
            className="tpl-elegant__section tpl-described--marked"
            headingClassName="tpl-elegant__heading"
            items={resume.passions}
            entryClassName="tpl-elegant__described"
          />
        </aside>
      </div>
    </article>
  );
}
