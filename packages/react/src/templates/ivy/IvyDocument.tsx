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
  IvyCustomEntry,
  IvyEducationEntry,
  IvyExperienceEntry,
} from './entries.js';
import './ivy.css';

/**
 * The Ivy League template.
 *
 * A centred academic page: the name over its headline over one contact line,
 * then section headings centred with a rule under each. Every entry is two
 * lines of four corners — organisation and place, role and dates — which is
 * the reference's whole structure and the reason `entries.tsx` has one head.
 *
 * Single column, and the skills are a run of keywords rather than a grid, so
 * the extracted text is the document's own order throughout.
 */
export interface IvyDocumentProps {
  resume: ResumeObject;
}

export function IvyDocument({ resume }: IvyDocumentProps) {
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
      className="tpl-ivy"
      style={documentStyle('i', style)}
      aria-label="Resume document"
    >
      <header className="tpl-ivy__head-block" data-block>
        <h1 className="tpl-ivy__name">
          <EditableText path="name" value={resume.name} />
        </h1>

        {(resume.headline || authoring) && (
          <p className="tpl-ivy__headline">
            <EditableText
              path="headline"
              value={resume.headline ?? ''}
              placeholder={PLACEHOLDERS['headline']}
            />
          </p>
        )}

        {(contact.length > 0 || resume.links.length > 0 || authoring) && (
          <p className="tpl-ivy__contact">
            {/* The separator is drawn by CSS between siblings, so a detail the
                writer did not have leaves no stray bullet behind it. */}
            {contact.map(({ path, value, placeholder }) => (
              <span key={path} className="tpl-ivy__contact-item">
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
                <span className="tpl-ivy__contact-item">
                  {/* Two spans: the separator belongs to the LINE and the ring
                      to the LINK — see Harvard, which learned this. */}
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
          className="tpl-ivy__section"
          headingClassName="tpl-ivy__heading"
        >
          <p className="tpl-ivy__prose" data-block>
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
          className="tpl-ivy__section"
          headingClassName="tpl-ivy__heading"
        >
          <Collection section="experience" items={resume.experience}>
            {({ item, path, chrome, itemProps }) => (
              <IvyExperienceEntry
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
          className="tpl-ivy__section"
          headingClassName="tpl-ivy__heading"
        >
          <Collection section="education" items={resume.education}>
            {({ item, path, chrome, itemProps }) => (
              <IvyEducationEntry
                item={item}
                path={path}
                chrome={chrome}
                itemProps={itemProps}
              />
            )}
          </Collection>
        </DocumentSection>
      )}

      {(resume.skills.length > languages.length || authoring) && (
        <DocumentSection
          id="skills"
          title="Skills"
          className="tpl-ivy__section"
          headingClassName="tpl-ivy__heading"
        >
          <p className="tpl-ivy__keywords" data-block>
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

      {/*
       * A plain section: "the space above Languages" is not a gap the document
       * stores, and reusing the skills key would give two sections one rail —
       * pointing at either would light up both.
       */}
      {languages.length > 0 && (
        <section className="tpl-ivy__section">
          <h2 className="tpl-ivy__heading" data-block data-keep-with-next>
            Languages
          </h2>
          <p className="tpl-ivy__keywords" data-block>
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
          className="tpl-ivy__section"
          headingClassName="tpl-ivy__heading"
        >
          <p className="tpl-ivy__keywords" data-block>
            <EditableInlineList
              path="certifications"
              items={resume.certifications}
              placeholder={PLACEHOLDERS['certifications']}
            />
          </p>
        </DocumentSection>
      )}

      <CustomSections
        sections={resume.custom_sections}
        sectionClass="tpl-ivy__section"
        headingClass="tpl-ivy__heading"
        Entry={IvyCustomEntry}
      />
    </article>
  );
}
