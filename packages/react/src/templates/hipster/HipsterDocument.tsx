/*
 * GENERATED from hipster.template.yaml by @cvgs/resume-templates' template compiler.
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
import { nameParts } from '../../kit/textShapes.js';
import { useContactLines } from '../../kit/contact.js';
import { documentStyle } from '../../kit/documentStyle.js';
import { Heading } from '../../kit/Heading.js';
import { LinkField } from '../../nodes/LinkField.js';
import {
  HipsterCustomEntry,
  HipsterEducationEntry,
  HipsterExperienceEntry,
} from './entries.js';
import '../../kit/layout.css';
import '../../kit/contact-icons.css';
import './hipster.css';
import { useEditorText, useDocumentText } from '../../i18n/index.js';

export interface HipsterDocumentProps {
  resume: ResumeObject;
}

export function HipsterDocument({ resume }: HipsterDocumentProps) {
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
      className="tpl-hipster"
      style={documentStyle('hp', style)}
      aria-label={doc.t.resume}
      lang={doc.locale}
    >
      <header className="tpl-hipster__head" data-block>
        <Heading level={1} className="tpl-hipster__name">
          <EditableText
            path="name"
            value={resume.name}
            shape={nameParts(
              'tpl-hipster__name-first',
              'tpl-hipster__name-last',
            )}
          />
        </Heading>

        {(resume.headline || authoring) && (
          <p className="tpl-hipster__headline">
            <EditableText
              path="headline"
              value={resume.headline ?? ''}
              placeholder={placeholder('headline')}
            />
          </p>
        )}
      </header>

      <div className="tpl-hipster__body tpl-sheet-tall" data-layout="row">
        <aside className="tpl-hipster__aside" data-flow>
          <InitialsAvatar name={resume.name} className="tpl-hipster__avatar" />

          {(resume.summary || authoring) && (
            <DocumentSection
              id="summary"
              heading={resume.section_headings?.summary}
              title={doc.t.sections.summary}
              className="tpl-hipster__section"
              headingClassName="tpl-hipster__heading"
            >
              <p className="tpl-hipster__prose" data-block>
                <EditableText
                  path="summary"
                  value={resume.summary ?? ''}
                  placeholder={placeholder('summary')}
                  multiline
                />
              </p>
            </DocumentSection>
          )}

          {(contact.length > 0 || resume.links.length > 0 || authoring) && (
            <section className="tpl-hipster__section">
              <Heading
                level={2}
                className="tpl-hipster__heading"
                data-block
                data-keep-with-next
              >
                {doc.t.panels.contacts}
              </Heading>
              {(contact.length > 0 || resume.links.length > 0 || authoring) && (
                <div className="tpl-hipster__contact tpl-contact-icons">
                  {contact.map(({ field, path, value, placeholder }) => (
                    <p
                      key={path}
                      className={`tpl-hipster__contact-item tpl-contact--${field}`}
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
                      <p className="tpl-hipster__contact-item tpl-contact--link">
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

          <DescribedEntries
            id="passions"
            heading={resume.section_headings?.passions}
            title={doc.t.sections.interests}
            className="tpl-hipster__section"
            headingClassName="tpl-hipster__heading"
            items={resume.passions}
            entryClassName="tpl-hipster__described"
          />
        </aside>

        <div className="tpl-hipster__main" data-flow>
          {(resume.experience.length > 0 || authoring) && (
            <DocumentSection
              id="experience"
              heading={resume.section_headings?.experience}
              title={doc.t.sections.experience}
              className="tpl-hipster__section tpl-hipster__spine"
              headingClassName="tpl-hipster__heading"
            >
              <Collection section="experience" items={resume.experience}>
                {({ item, path, chrome, itemProps }) => (
                  <HipsterExperienceEntry
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
              className="tpl-hipster__section"
              headingClassName="tpl-hipster__heading"
            >
              <Collection section="education" items={resume.education}>
                {({ item, path, chrome, itemProps }) => (
                  <HipsterEducationEntry
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
            className="tpl-hipster__section"
            headingClassName="tpl-hipster__heading"
            items={resume.achievements}
            entryClassName="tpl-hipster__described"
          />

          <DescribedEntries
            id="courses"
            heading={resume.section_headings?.courses}
            title={doc.t.sections.courses}
            className="tpl-hipster__section"
            headingClassName="tpl-hipster__heading"
            items={resume.courses}
            entryClassName="tpl-hipster__described"
          />

          <CustomSections
            sections={resume.custom_sections}
            sectionClass="tpl-hipster__section"
            headingClass="tpl-hipster__heading"
            Entry={HipsterCustomEntry}
          />

          <div className="tpl-hipster__pair" data-layout="row">
            <div className="tpl-hipster__half" data-flow>
              {(resume.certifications.length > 0 || authoring) && (
                <DocumentSection
                  id="certifications"
                  heading={resume.section_headings?.certifications}
                  title={doc.t.sections.certifications}
                  className="tpl-hipster__section"
                  headingClassName="tpl-hipster__heading"
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

              <LanguageList
                items={resume.languages}
                heading={resume.section_headings?.languages}
                className="tpl-hipster__section"
                headingClassName="tpl-hipster__heading"
                rowClassName="tpl-hipster__language"
              />
            </div>

            <div className="tpl-hipster__half" data-flow>
              {(resume.skills.length > 0 || authoring) && (
                <DocumentSection
                  id="skills"
                  heading={resume.section_headings?.skills}
                  title={doc.t.sections.skills}
                  className="tpl-hipster__section"
                  headingClassName="tpl-hipster__heading"
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
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
