import { PLACEHOLDERS, type ResumeObject } from '@cvgs/core';
import { Collection } from '../../collections/Collection.js';
import { useAuthoring } from '../../collections/authoring-context.js';
import { CustomSections } from '../../nodes/CustomSections.js';
import { EditableInlineList } from '../../nodes/EditableInlineList.js';
import { EditableText } from '../../nodes/EditableText.js';
import { LinkField } from '../../nodes/LinkField.js';
import { useDocumentStyle } from '../../presentation-context.js';
import { DocumentSection } from '../../kit/DocumentSection.js';
import { InlineSkillGroup } from '../../kit/InlineSkillGroup.js';
import { contactLines } from '../../kit/contact.js';
import { documentStyle } from '../../kit/documentStyle.js';
import { isLanguages } from '../skills.js';
import {
  ClassicCustomEntry,
  ClassicEducationEntry,
  ClassicExperienceEntry,
} from './entries.js';
import './classic.css';

/**
 * The Classic template.
 *
 * A plain left-aligned page whose only ornament is the accent on the line that
 * names the employer. Headings are set small and uppercase with no rule, and
 * each entry leads with what was done — the role over the employer, with place
 * and dates kept in a quiet column at the right.
 *
 * Single column, so the extracted text is the document's own order.
 */
export interface ClassicDocumentProps {
  resume: ResumeObject;
}

export function ClassicDocument({ resume }: ClassicDocumentProps) {
  const style = useDocumentStyle();
  const authoring = useAuthoring() !== null;

  const languages = resume.skills.filter(isLanguages);
  const contact = contactLines(
    resume.contact,
    ['phone', 'email', 'location'],
    authoring,
  );

  return (
    <article
      className="tpl-classic"
      style={documentStyle('cl', style)}
      aria-label="Resume document"
    >
      <header className="tpl-classic__head-block" data-block>
        <h1 className="tpl-classic__name">
          <EditableText path="name" value={resume.name} />
        </h1>

        {(resume.headline || authoring) && (
          <p className="tpl-classic__headline">
            <EditableText
              path="headline"
              value={resume.headline ?? ''}
              placeholder={PLACEHOLDERS['headline']}
            />
          </p>
        )}

        {(contact.length > 0 || resume.links.length > 0 || authoring) && (
          <p className="tpl-classic__contact">
            {contact.map(({ path, value, placeholder }) => (
              <span key={path} className="tpl-classic__contact-item">
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
                <span className="tpl-classic__contact-item">
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
          title="Summary"
          className="tpl-classic__section"
          headingClassName="tpl-classic__heading"
        >
          <p className="tpl-classic__prose" data-block>
            <EditableText
              path="summary"
              value={resume.summary ?? ''}
              placeholder={PLACEHOLDERS['summary']}
              multiline
            />
          </p>
        </DocumentSection>
      )}

      {(resume.experience.length > 0 || authoring) && (
        <DocumentSection
          id="experience"
          title="Experience"
          className="tpl-classic__section"
          headingClassName="tpl-classic__heading"
        >
          <Collection section="experience" items={resume.experience}>
            {({ item, path, chrome, itemProps }) => (
              <ClassicExperienceEntry
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
          title="Education"
          className="tpl-classic__section"
          headingClassName="tpl-classic__heading"
        >
          <Collection section="education" items={resume.education}>
            {({ item, path, chrome, itemProps }) => (
              <ClassicEducationEntry
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
        sectionClass="tpl-classic__section"
        headingClass="tpl-classic__heading"
        Entry={ClassicCustomEntry}
      />

      {(resume.skills.length > languages.length || authoring) && (
        <DocumentSection
          id="skills"
          title="Skills"
          className="tpl-classic__section"
          headingClassName="tpl-classic__heading"
        >
          <p className="tpl-classic__keywords" data-block>
            <Collection
              section="skills"
              items={resume.skills}
              noun="skill"
              gap={false}
            >
              {({ item, path, index }) =>
                isLanguages(item) ? null : (
                  <InlineSkillGroup
                    item={item}
                    path={path}
                    first={index === 0}
                  />
                )
              }
            </Collection>
          </p>
        </DocumentSection>
      )}

      {/* A plain section: "the space above Languages" is not a stored gap, and
          reusing the skills key would give two sections one rail. */}
      {languages.length > 0 && (
        <section className="tpl-classic__section">
          <h2 className="tpl-classic__heading" data-block data-keep-with-next>
            Languages
          </h2>
          <p className="tpl-classic__keywords" data-block>
            {languages.map((group) => {
              const index = resume.skills.indexOf(group);
              return (
                <EditableInlineList
                  key={index}
                  path={`skills.${index}.items`}
                  items={group.items}
                  placeholder={PLACEHOLDERS['items']}
                />
              );
            })}
          </p>
        </section>
      )}

      {resume.certifications.length > 0 && (
        <DocumentSection
          id="certifications"
          title="Certifications"
          className="tpl-classic__section"
          headingClassName="tpl-classic__heading"
        >
          <p className="tpl-classic__keywords" data-block>
            <EditableInlineList
              path="certifications"
              items={resume.certifications}
              placeholder={PLACEHOLDERS['certifications']}
            />
          </p>
        </DocumentSection>
      )}
    </article>
  );
}
