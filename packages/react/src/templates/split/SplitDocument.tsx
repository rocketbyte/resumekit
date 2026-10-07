/*
 * GENERATED from split.template.yaml by @cvgs/resume-templates' template compiler.
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
import { nameParts } from '../../kit/textShapes.js';
import { useContactLines } from '../../kit/contact.js';
import { documentStyle } from '../../kit/documentStyle.js';
import { Heading } from '../../kit/Heading.js';
import { LinkField } from '../../nodes/LinkField.js';
import {
  SplitCustomEntry,
  SplitEducationEntry,
  SplitExperienceEntry,
} from './entries.js';
import '../../kit/layout.css';
import './split.css';
import { useEditorText, useDocumentText } from '../../i18n/index.js';

export interface SplitDocumentProps {
  resume: ResumeObject;
}

export function SplitDocument({ resume }: SplitDocumentProps) {
  const { placeholder } = useEditorText();
  const doc = useDocumentText();
  const style = useDocumentStyle();
  const authoring = useAuthoring() !== null;

  const contact = useContactLines(resume.contact, ['location'], authoring);
  const contact2 = useContactLines(
    resume.contact,
    ['email', 'phone'],
    authoring,
  );

  return (
    <article
      className="tpl-split"
      style={documentStyle('sp', style)}
      aria-label={doc.t.resume}
      lang={doc.locale}
    >
      <header className="tpl-split__head" data-block>
        <Heading level={1} className="tpl-split__name">
          <EditableText
            path="name"
            value={resume.name}
            shape={nameParts('tpl-split__name-first', 'tpl-split__name-last')}
          />
        </Heading>

        {(resume.headline || authoring) && (
          <p className="tpl-split__headline">
            <EditableText
              path="headline"
              value={resume.headline ?? ''}
              placeholder={placeholder('headline')}
            />
          </p>
        )}

        {contact.length > 0 && (
          <p className="tpl-split__contact">
            {contact.map(({ field, path, value, placeholder }) => (
              <span
                key={path}
                className={`tpl-split__contact-item tpl-contact--${field}`}
              >
                <EditableText
                  path={path}
                  value={value}
                  placeholder={placeholder}
                />
              </span>
            ))}
          </p>
        )}

        {contact2.length > 0 && (
          <p className="tpl-split__contact">
            {contact2.map(({ field, path, value, placeholder }) => (
              <span
                key={path}
                className={`tpl-split__contact-item tpl-contact--${field}`}
              >
                <EditableText
                  path={path}
                  value={value}
                  placeholder={placeholder}
                />
              </span>
            ))}
          </p>
        )}
      </header>

      <div className="tpl-split__body" data-layout="row">
        <aside className="tpl-split__aside" data-flow>
          {(resume.education.length > 0 || authoring) && (
            <DocumentSection
              id="education"
              heading={resume.section_headings?.education}
              title={doc.t.sections.education}
              className="tpl-split__section"
              headingClassName="tpl-split__heading"
            >
              <Collection section="education" items={resume.education}>
                {({ item, path, chrome, itemProps }) => (
                  <SplitEducationEntry
                    item={item}
                    path={path}
                    chrome={chrome}
                    itemProps={itemProps}
                  />
                )}
              </Collection>
            </DocumentSection>
          )}

          {(resume.links.length > 0 || authoring) && (
            <section className="tpl-split__section">
              <Heading
                level={2}
                className="tpl-split__heading"
                data-block
                data-keep-with-next
              >
                {doc.t.panels.links}
              </Heading>
              <ul className="tpl-split__links" data-block data-split>
                <Collection section="links" items={resume.links} gap={false}>
                  {({ item, path, chrome, itemProps, justAdded }) => (
                    <li
                      {...itemProps}
                      className="tpl-split__link tpl-contact--link"
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
            </section>
          )}

          <DescribedEntries
            id="courses"
            heading={resume.section_headings?.courses}
            title={doc.t.sections.courses}
            className="tpl-split__section tpl-split__courses"
            headingClassName="tpl-split__heading"
            items={resume.courses}
            entryClassName="tpl-split__described"
          />

          {(resume.skills.length > 0 || authoring) && (
            <DocumentSection
              id="skills"
              heading={resume.section_headings?.skills}
              title={doc.t.sections.skills}
              className="tpl-split__section"
              headingClassName="tpl-split__heading"
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
            className="tpl-split__section"
            headingClassName="tpl-split__heading"
            rowClassName="tpl-split__language"
          />

          {(resume.certifications.length > 0 || authoring) && (
            <DocumentSection
              id="certifications"
              heading={resume.section_headings?.certifications}
              title={doc.t.sections.certifications}
              className="tpl-split__section"
              headingClassName="tpl-split__heading"
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
            className="tpl-split__section"
            headingClassName="tpl-split__heading"
            items={resume.passions}
            entryClassName="tpl-split__described"
          />
        </aside>

        <div className="tpl-split__main" data-flow>
          {(resume.summary || authoring) && (
            <DocumentSection
              id="summary"
              heading={resume.section_headings?.summary}
              title={doc.t.sections.summary}
              className="tpl-split__section"
              headingClassName="tpl-split__heading"
            >
              <p className="tpl-split__prose" data-block>
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
              className="tpl-split__section"
              headingClassName="tpl-split__heading"
            >
              <Collection section="experience" items={resume.experience}>
                {({ item, path, chrome, itemProps }) => (
                  <SplitExperienceEntry
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
            className="tpl-split__section"
            headingClassName="tpl-split__heading"
            items={resume.achievements}
            entryClassName="tpl-split__described"
          />

          <CustomSections
            sections={resume.custom_sections}
            sectionClass="tpl-split__section"
            headingClass="tpl-split__heading"
            Entry={SplitCustomEntry}
          />
        </div>
      </div>
    </article>
  );
}
