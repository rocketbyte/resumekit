/*
 * GENERATED from prism.template.yaml by @resumekit/react's template compiler.
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
import { leadLetters, nameParts } from '../../kit/textShapes.js';
import { useContactLines } from '../../kit/contact.js';
import { documentStyle } from '../../kit/documentStyle.js';
import { Heading } from '../../kit/Heading.js';
import { LinkField } from '../../nodes/LinkField.js';
import {
  PrismCustomEntry,
  PrismEducationEntry,
  PrismExperienceEntry,
} from './entries.js';
import '../../kit/layout.css';
import './prism.css';
import { useEditorText, useDocumentText } from '../../i18n/index.js';

export interface PrismDocumentProps {
  resume: ResumeObject;
}

export function PrismDocument({ resume }: PrismDocumentProps) {
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

  const headingLead = { count: 3, className: 'tpl-prism__heading-lead' };

  return (
    <article
      className="tpl-prism"
      style={documentStyle('pr', style)}
      aria-label={doc.t.resume}
      lang={doc.locale}
    >
      <header className="tpl-prism__head" data-block>
        <Heading level={1} className="tpl-prism__name">
          <EditableText
            path="name"
            value={resume.name}
            shape={nameParts('tpl-prism__name-first', 'tpl-prism__name-last')}
          />
        </Heading>

        {(resume.headline || authoring) && (
          <p className="tpl-prism__headline">
            <EditableText
              path="headline"
              value={resume.headline ?? ''}
              placeholder={placeholder('headline')}
            />
          </p>
        )}
      </header>

      <div className="tpl-prism__body" data-layout="row">
        <aside className="tpl-prism__aside" data-flow>
          {(contact.length > 0 ||
            contact2.length > 0 ||
            resume.links.length > 0 ||
            authoring) && (
            <section className="tpl-prism__section">
              <Heading
                level={2}
                className="tpl-prism__heading"
                data-block
                data-keep-with-next
              >
                {leadLetters(headingLead)(doc.t.panels.contacts)}
              </Heading>
              {contact.length > 0 && (
                <p className="tpl-prism__address tpl-contact--location">
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

              {(contact2.length > 0 ||
                resume.links.length > 0 ||
                authoring) && (
                <div className="tpl-prism__contact">
                  {contact2.map(({ field, path, value, placeholder }) => (
                    <p
                      key={path}
                      className={`tpl-prism__contact-item tpl-contact--${field}`}
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
                      <p className="tpl-prism__contact-item tpl-contact--link">
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

          {(resume.skills.length > 0 || authoring) && (
            <DocumentSection
              id="skills"
              heading={resume.section_headings?.skills}
              title={doc.t.sections.skills}
              className="tpl-prism__section"
              headingClassName="tpl-prism__heading"
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
            className="tpl-prism__section"
            headingClassName="tpl-prism__heading"
            headingLead={headingLead}
            rowClassName="tpl-prism__language"
          />

          {(resume.certifications.length > 0 || authoring) && (
            <DocumentSection
              id="certifications"
              heading={resume.section_headings?.certifications}
              title={doc.t.sections.certifications}
              className="tpl-prism__section"
              headingClassName="tpl-prism__heading"
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
            title={doc.t.sections.passions}
            className="tpl-prism__section"
            headingClassName="tpl-prism__heading"
            headingLead={headingLead}
            items={resume.passions}
            entryClassName="tpl-prism__described"
          />
        </aside>

        <div className="tpl-prism__main" data-flow>
          {(resume.summary || authoring) && (
            <DocumentSection
              id="summary"
              heading={resume.section_headings?.summary}
              title={doc.t.sections.summary}
              className="tpl-prism__section"
              headingClassName="tpl-prism__heading tpl-prism__hue-blue"
              headingLead={headingLead}
            >
              <p className="tpl-prism__prose" data-block>
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
              className="tpl-prism__section"
              headingClassName="tpl-prism__heading tpl-prism__hue-red"
              headingLead={headingLead}
            >
              <Collection section="experience" items={resume.experience}>
                {({ item, path, chrome, itemProps }) => (
                  <PrismExperienceEntry
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
              className="tpl-prism__section"
              headingClassName="tpl-prism__heading tpl-prism__hue-orange"
              headingLead={headingLead}
            >
              <Collection section="education" items={resume.education}>
                {({ item, path, chrome, itemProps }) => (
                  <PrismEducationEntry
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
            className="tpl-prism__section"
            headingClassName="tpl-prism__heading tpl-prism__hue-green"
            headingLead={headingLead}
            items={resume.achievements}
            entryClassName="tpl-prism__described"
          />

          <DescribedEntries
            id="courses"
            heading={resume.section_headings?.courses}
            title={doc.t.sections.courses}
            className="tpl-prism__section"
            headingClassName="tpl-prism__heading tpl-prism__hue-purple"
            headingLead={headingLead}
            items={resume.courses}
            entryClassName="tpl-prism__described"
          />

          <CustomSections
            sections={resume.custom_sections}
            sectionClass="tpl-prism__section"
            headingClass="tpl-prism__heading tpl-prism__hue-blue"
            headingLead={headingLead}
            Entry={PrismCustomEntry}
          />
        </div>
      </div>
    </article>
  );
}
