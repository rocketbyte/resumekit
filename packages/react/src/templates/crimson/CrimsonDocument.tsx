/*
 * GENERATED from crimson.template.yaml by @cvgs/resume-templates' template compiler.
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
import { nameParts } from '../../kit/textShapes.js';
import { useContactLines } from '../../kit/contact.js';
import { documentStyle } from '../../kit/documentStyle.js';
import { Heading } from '../../kit/Heading.js';
import { LinkField } from '../../nodes/LinkField.js';
import {
  CrimsonCustomEntry,
  CrimsonEducationEntry,
  CrimsonExperienceEntry,
} from './entries.js';
import '../../kit/contact-icons.css';
import './crimson.css';
import { useEditorText, useDocumentText } from '../../i18n/index.js';

export interface CrimsonDocumentProps {
  resume: ResumeObject;
}

export function CrimsonDocument({ resume }: CrimsonDocumentProps) {
  const { placeholder } = useEditorText();
  const doc = useDocumentText();
  const style = useDocumentStyle();
  const authoring = useAuthoring() !== null;

  const contact = useContactLines(resume.contact, ['location'], authoring);
  const contact2 = useContactLines(
    resume.contact,
    ['phone', 'email'],
    authoring,
  );

  const headingLead = { count: 3, className: 'tpl-crimson__heading-lead' };

  return (
    <article
      className="tpl-crimson"
      style={documentStyle('crm', style)}
      aria-label={doc.t.resume}
      lang={doc.locale}
    >
      <header className="tpl-crimson__head" data-block>
        <Heading level={1} className="tpl-crimson__name">
          <EditableText
            path="name"
            value={resume.name}
            shape={nameParts(
              'tpl-crimson__name-first',
              'tpl-crimson__name-last',
            )}
          />
        </Heading>

        {(resume.headline || authoring) && (
          <p className="tpl-crimson__headline">
            <EditableText
              path="headline"
              value={resume.headline ?? ''}
              placeholder={placeholder('headline')}
            />
          </p>
        )}

        {contact.length > 0 && (
          <p className="tpl-crimson__address tpl-contact--location">
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

        {(contact2.length > 0 || resume.links.length > 0 || authoring) && (
          <p className="tpl-crimson__contact tpl-contact-icons">
            {contact2.map(({ field, path, value, placeholder }) => (
              <span
                key={path}
                className={`tpl-crimson__contact-item tpl-contact--${field}`}
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
                <span className="tpl-crimson__contact-item tpl-contact--link">
                  <span {...itemProps}>
                    {chrome}
                    <LinkField item={item} path={path} justAdded={justAdded} />
                  </span>
                </span>
              )}
            </Collection>
          </p>
        )}
      </header>

      {(resume.summary || authoring) && (
        <DocumentSection
          id="summary"
          heading={resume.section_headings?.summary}
          title={doc.t.sections.summary}
          className="tpl-crimson__section"
          headingClassName="tpl-crimson__heading"
          headingLead={headingLead}
        >
          <p className="tpl-crimson__prose" data-block>
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
          className="tpl-crimson__section"
          headingClassName="tpl-crimson__heading"
          headingLead={headingLead}
        >
          <Collection section="experience" items={resume.experience}>
            {({ item, path, chrome, itemProps }) => (
              <CrimsonExperienceEntry
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
          className="tpl-crimson__section"
          headingClassName="tpl-crimson__heading"
          headingLead={headingLead}
        >
          <Collection section="education" items={resume.education}>
            {({ item, path, chrome, itemProps }) => (
              <CrimsonEducationEntry
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
          className="tpl-crimson__section"
          headingClassName="tpl-crimson__heading"
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

      <DescribedEntries
        id="achievements"
        heading={resume.section_headings?.achievements}
        title={doc.t.sections.achievements}
        className="tpl-crimson__section"
        headingClassName="tpl-crimson__heading"
        headingLead={headingLead}
        items={resume.achievements}
        entryClassName="tpl-crimson__described"
      />

      <DescribedEntries
        id="courses"
        heading={resume.section_headings?.courses}
        title={doc.t.sections.courses}
        className="tpl-crimson__section"
        headingClassName="tpl-crimson__heading"
        headingLead={headingLead}
        items={resume.courses}
        entryClassName="tpl-crimson__described"
      />

      <LanguageList
        items={resume.languages}
        heading={resume.section_headings?.languages}
        className="tpl-crimson__section tpl-crimson__languages"
        headingClassName="tpl-crimson__heading"
        headingLead={headingLead}
        rowClassName="tpl-crimson__language"
      />

      {(resume.certifications.length > 0 || authoring) && (
        <DocumentSection
          id="certifications"
          heading={resume.section_headings?.certifications}
          title={doc.t.sections.certifications}
          className="tpl-crimson__section"
          headingClassName="tpl-crimson__heading"
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
        className="tpl-crimson__section"
        headingClassName="tpl-crimson__heading"
        headingLead={headingLead}
        items={resume.passions}
        entryClassName="tpl-crimson__described"
      />

      <CustomSections
        sections={resume.custom_sections}
        sectionClass="tpl-crimson__section"
        headingClass="tpl-crimson__heading"
        headingLead={headingLead}
        Entry={CrimsonCustomEntry}
      />
    </article>
  );
}
