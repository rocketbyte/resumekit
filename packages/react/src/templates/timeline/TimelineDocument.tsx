import { PLACEHOLDERS, type ResumeObject } from '@cvgs/core';
import { Collection } from '../../collections/Collection.js';
import { useAuthoring } from '../../collections/authoring-context.js';
import { CustomSections } from '../../nodes/CustomSections.js';
import { EditableInlineList } from '../../nodes/EditableInlineList.js';
import { EditableText } from '../../nodes/EditableText.js';
import { LinkField } from '../../nodes/LinkField.js';
import { useDocumentStyle } from '../../presentation-context.js';
import { DocumentSection } from '../../kit/DocumentSection.js';
import { BulletSkillGroup } from '../../kit/BulletSkillGroup.js';
import { contactLines } from '../../kit/contact.js';
import { documentStyle } from '../../kit/documentStyle.js';
import { isLanguages } from '../skills.js';
import {
  TimelineCustomEntry,
  TimelineEducationEntry,
  TimelineExperienceEntry,
} from './entries.js';
import './timeline.css';

/**
 * The Timeline template.
 *
 * One column, with every entry hung off a dated spine: the dates and the place
 * at the left, a ruled line with a dot, then the role over the employer in the
 * accent. The spine is the design's whole idea, and it is drawn as a border on
 * the entry's own middle column so that it exists exactly where entries do.
 *
 * Skills are chips — boxes by appearance, list items by structure — and the
 * candidate's own sections are set two to a row.
 */
export interface TimelineDocumentProps {
  resume: ResumeObject;
}

export function TimelineDocument({ resume }: TimelineDocumentProps) {
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
      className="tpl-timeline"
      style={documentStyle('tl', style)}
      aria-label="Resume document"
    >
      <header className="tpl-timeline__head-block" data-block>
        <h1 className="tpl-timeline__name">
          <EditableText path="name" value={resume.name} />
        </h1>

        {(resume.headline || authoring) && (
          <p className="tpl-timeline__headline">
            <EditableText
              path="headline"
              value={resume.headline ?? ''}
              placeholder={PLACEHOLDERS['headline']}
            />
          </p>
        )}

        {(contact.length > 0 || resume.links.length > 0 || authoring) && (
          <p className="tpl-timeline__contact">
            {contact.map(({ path, value, placeholder }) => (
              <span key={path} className="tpl-timeline__contact-item">
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
                <span className="tpl-timeline__contact-item">
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
          className="tpl-timeline__section"
          headingClassName="tpl-timeline__heading"
        >
          <p className="tpl-timeline__prose" data-block>
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
          className="tpl-timeline__section"
          headingClassName="tpl-timeline__heading"
        >
          <Collection section="experience" items={resume.experience}>
            {({ item, path, chrome, itemProps }) => (
              <TimelineExperienceEntry
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
          className="tpl-timeline__section"
          headingClassName="tpl-timeline__heading"
        >
          <Collection section="education" items={resume.education}>
            {({ item, path, chrome, itemProps }) => (
              <TimelineEducationEntry
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
        sectionClass="tpl-timeline__section"
        headingClass="tpl-timeline__heading"
        Entry={TimelineCustomEntry}
      />

      {(resume.skills.length > languages.length || authoring) && (
        <DocumentSection
          id="skills"
          title="Skills"
          className="tpl-timeline__section"
          headingClassName="tpl-timeline__heading"
        >
          {/* Keywords over a rule, one to a line, and every one a list ITEM:
              a parser reads them one per line rather than as a run. */}
          <div
            className="tpl-keywords tpl-keywords--inline"
            data-block
            data-split
          >
            <Collection
              section="skills"
              items={resume.skills}
              noun="skill"
              gap={false}
            >
              {({ item, path }) =>
                isLanguages(item) ? null : (
                  <BulletSkillGroup item={item} path={path} />
                )
              }
            </Collection>
          </div>
        </DocumentSection>
      )}

      {/* A plain section: "the space above Languages" is not a stored gap, and
          reusing the skills key would give two sections one rail. */}
      {languages.length > 0 && (
        <section className="tpl-timeline__section">
          <h2 className="tpl-timeline__heading" data-block data-keep-with-next>
            Languages
          </h2>
          <p className="tpl-timeline__keywords" data-block>
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
          className="tpl-timeline__section"
          headingClassName="tpl-timeline__heading"
        >
          <p className="tpl-timeline__keywords" data-block>
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
