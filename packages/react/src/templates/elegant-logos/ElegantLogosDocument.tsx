/*
 * GENERATED from elegant-logos.template.yaml by @cvgs/resume-templates' template compiler.
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
  ElegantLogosCustomEntry,
  ElegantLogosEducationEntry,
  ElegantLogosExperienceEntry,
} from './entries.js';
import '../../kit/layout.css';
import '../../kit/contact-icons.css';
import './elegant-logos.css';
import { useEditorText, useDocumentText } from '../../i18n/index.js';

export interface ElegantLogosDocumentProps {
  resume: ResumeObject;
}

export function ElegantLogosDocument({ resume }: ElegantLogosDocumentProps) {
  const { placeholder } = useEditorText();
  const doc = useDocumentText();
  const style = useDocumentStyle();
  const authoring = useAuthoring() !== null;

  const contact = useContactLines(resume.contact, ['phone'], authoring);
  const contact2 = useContactLines(resume.contact, ['email'], authoring);
  const contact3 = useContactLines(resume.contact, ['location'], authoring);

  return (
    <article
      className="tpl-ell"
      style={documentStyle('ell', style)}
      aria-label={doc.t.resume}
      lang={doc.locale}
    >
      <div className="tpl-ell__body tpl-sheet-tall" data-layout="row">
        <div className="tpl-ell__main" data-flow>
          <header className="tpl-ell__head-block" data-block>
            <div className="tpl-ell__identity">
              <Heading level={1} className="tpl-ell__name">
                <EditableText path="name" value={resume.name} />
              </Heading>

              {(resume.headline || authoring) && (
                <p className="tpl-ell__headline">
                  <EditableText
                    path="headline"
                    value={resume.headline ?? ''}
                    placeholder={placeholder('headline')}
                  />
                </p>
              )}

              <div className="tpl-ell__contact" data-layout="row">
                {contact.length > 0 && (
                  <p className="tpl-ell__phone tpl-contact--phone tpl-contact-icons">
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
                  <p className="tpl-ell__email tpl-contact--email tpl-contact-icons">
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
                  <div className="tpl-ell__link-line">
                    <ul className="tpl-ell__links tpl-contact-icons" data-block>
                      <Collection
                        section="links"
                        items={resume.links}
                        gap={false}
                      >
                        {({ item, path, chrome, itemProps, justAdded }) => (
                          <li
                            {...itemProps}
                            className="tpl-ell__link tpl-contact--link"
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
                  <p className="tpl-ell__place tpl-contact--location tpl-contact-icons">
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
              className="tpl-ell__section"
              headingClassName="tpl-ell__heading"
            >
              <p className="tpl-ell__prose" data-block>
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
              className="tpl-ell__section"
              headingClassName="tpl-ell__heading"
            >
              <Collection section="experience" items={resume.experience}>
                {({ item, path, chrome, itemProps }) => (
                  <ElegantLogosExperienceEntry
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
              className="tpl-ell__section"
              headingClassName="tpl-ell__heading"
            >
              <Collection section="education" items={resume.education}>
                {({ item, path, chrome, itemProps }) => (
                  <ElegantLogosEducationEntry
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
            className="tpl-ell__section"
            headingClassName="tpl-ell__heading"
            rowClassName="tpl-ell__language"
          />
        </div>

        <aside className="tpl-ell__aside" data-flow>
          <DescribedEntries
            id="achievements"
            heading={resume.section_headings?.achievements}
            title={doc.t.sections.keyAchievements}
            className="tpl-ell__section tpl-described--marked"
            headingClassName="tpl-ell__heading"
            items={resume.achievements}
            entryClassName="tpl-ell__described"
          />

          <CustomSections
            sections={resume.custom_sections}
            sectionClass="tpl-ell__section"
            headingClass="tpl-ell__heading"
            Entry={ElegantLogosCustomEntry}
          />

          {(resume.skills.length > 0 || authoring) && (
            <DocumentSection
              id="skills"
              heading={resume.section_headings?.skills}
              title={doc.t.sections.skills}
              className="tpl-ell__section"
              headingClassName="tpl-ell__heading"
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
            className="tpl-ell__section"
            headingClassName="tpl-ell__heading"
            items={resume.courses}
            entryClassName="tpl-ell__described"
          />

          {resume.certifications.length > 0 && (
            <DocumentSection
              id="certifications"
              heading={resume.section_headings?.certifications}
              title={doc.t.sections.certifications}
              className="tpl-ell__section"
              headingClassName="tpl-ell__heading"
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
            className="tpl-ell__section tpl-described--marked"
            headingClassName="tpl-ell__heading"
            items={resume.passions}
            entryClassName="tpl-ell__described"
          />
        </aside>
      </div>
    </article>
  );
}
