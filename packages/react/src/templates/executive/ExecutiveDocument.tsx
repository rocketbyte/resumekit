import { PLACEHOLDERS, type ResumeObject } from '@cvgs/core';
import { EditableText } from '../../nodes/EditableText.js';
import { EditableBulletList } from '../../nodes/EditableBulletList.js';
import { CustomSections } from '../../nodes/CustomSections.js';
import { Collection } from '../../collections/Collection.js';
import { LinkField } from '../../nodes/LinkField.js';
import { useAuthoring } from '../../collections/authoring-context.js';
import { useDocumentStyle } from '../../presentation-context.js';
import { BulletSkillGroup } from '../../kit/BulletSkillGroup.js';
import { DocumentSection } from '../../kit/DocumentSection.js';
import { contactLines } from '../../kit/contact.js';
import { documentStyle } from '../../kit/documentStyle.js';
import { monogram } from '../../kit/monogram.js';
import { isLanguages } from '../skills.js';
import {
  ExecCustomEntry,
  ExecEducationEntry,
  ExecExperienceEntry,
} from './entries.js';
import './executive.css';

/**
 * The Executive template.
 *
 * Same contract as Harvard: one Craft node for the whole document, structure as
 * plain JSX inside this render (so it is not addressable), and every editable
 * field declared as an `<Element id=…>` linked node carrying its **domain path**.
 * The paths are identical to Harvard's, which is what makes an overlay written
 * under one template apply unchanged under this one.
 *
 * The reference prints two things this résumé cannot hold — a location per
 * experience entry, and languages as a first-class list. Neither is invented
 * here: entry locations are omitted, and Languages is read from the skills group
 * that names them. See `design.md`, decision 1.
 */

export interface ExecutiveDocumentProps {
  resume: ResumeObject;
}

export function ExecutiveDocument({ resume }: ExecutiveDocumentProps) {
  const style = useDocumentStyle();
  /*
   * A section with nothing in it is omitted from the DOCUMENT and offered in
   * the EDITOR, because a candidate cannot add their first role to a section
   * that is not drawn. The read-only page is unchanged: with no authoring
   * context this is false and an empty section stays absent.
   */
  const authoring = useAuthoring() !== null;

  const languages = resume.skills.filter(isLanguages);
  const [location] = contactLines(resume.contact, ['location'], authoring);
  const contact = contactLines(resume.contact, ['email', 'phone'], authoring);

  return (
    <article
      className="tpl-exec"
      style={documentStyle('e', style)}
      aria-label="Resume document"
    >
      {/* ── Header band ──────────────────────────────────────────────────── */}
      <header className="tpl-exec__band" data-block>
        <span className="tpl-exec__monogram" aria-hidden="true">
          {monogram(resume.name)}
        </span>

        <div className="tpl-exec__identity">
          <h1 className="tpl-exec__name">
            <EditableText path="name" value={resume.name} />
          </h1>

          {location && (
            <p className="tpl-exec__where">
              <EditableText
                path={location.path}
                value={location.value}
                placeholder={location.placeholder}
              />
            </p>
          )}

          {contact.length > 0 && (
            <p className="tpl-exec__contact">
              {contact.map(({ path, value, placeholder }) => (
                <span key={path} className="tpl-exec__contact-item">
                  <EditableText
                    path={path}
                    value={value}
                    placeholder={placeholder}
                  />
                </span>
              ))}
            </p>
          )}
        </div>
      </header>

      <div className="tpl-exec__body">
        {(resume.summary || authoring) && (
          <DocumentSection
            id="summary"
            title="Professional Summary"
            className="tpl-exec__section"
            headingClassName="tpl-exec__heading"
          >
            <p className="tpl-exec__prose" data-block>
              <EditableText
                path="summary"
                value={resume.summary ?? ''}
                placeholder={PLACEHOLDERS['summary']}
                multiline
              />
            </p>
          </DocumentSection>
        )}

        {(resume.skills.length > languages.length || authoring) && (
          <DocumentSection
            id="skills"
            title="Technical Skills"
            className="tpl-exec__section"
            headingClassName="tpl-exec__heading"
          >
            {/*
             * Two VISUAL columns over one list per group: CSS columns leave the
             * DOM — and therefore the text a parser extracts — in document
             * order. Structural columns would not.
             */}
            <div className="tpl-exec__columns" data-block>
              <Collection section="skills" items={resume.skills} gap={false}>
                {({ item, path, chrome, itemProps }) =>
                  isLanguages(item) ? null : (
                    <BulletSkillGroup
                      item={item}
                      path={path}
                      chrome={chrome}
                      itemProps={itemProps}
                    />
                  )
                }
              </Collection>
            </div>
          </DocumentSection>
        )}

        {(resume.experience.length > 0 || authoring) && (
          <DocumentSection
            id="experience"
            title="Experience"
            className="tpl-exec__section"
            headingClassName="tpl-exec__heading"
          >
            <Collection section="experience" items={resume.experience}>
              {({ item, path, chrome, itemProps }) => (
                <ExecExperienceEntry
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
            className="tpl-exec__section"
            headingClassName="tpl-exec__heading"
          >
            <Collection section="education" items={resume.education}>
              {({ item, path, chrome, itemProps }) => (
                <ExecEducationEntry
                  item={item}
                  path={path}
                  chrome={chrome}
                  itemProps={itemProps}
                />
              )}
            </Collection>
          </DocumentSection>
        )}

        {languages.length > 0 && (
          <section className="tpl-exec__section">
            <h2 className="tpl-exec__heading" data-block data-keep-with-next>
              Languages
            </h2>
            <div data-block>
              {languages.map((group) => {
                const index = resume.skills.indexOf(group);
                return (
                  <EditableBulletList
                    key={index}
                    path={`skills.${index}.items`}
                    items={group.items}
                  />
                );
              })}
            </div>
          </section>
        )}

        {resume.certifications.length > 0 && (
          <DocumentSection
            id="certifications"
            title="Certifications"
            className="tpl-exec__section"
            headingClassName="tpl-exec__heading"
          >
            <div data-block>
              <EditableBulletList
                path="certifications"
                items={resume.certifications}
              />
            </div>
          </DocumentSection>
        )}

        {(resume.headline || authoring) && (
          <section className="tpl-exec__section">
            <h2 className="tpl-exec__heading" data-block data-keep-with-next>
              Personal Information
            </h2>
            <p className="tpl-exec__prose" data-block>
              {'Title: '}
              <EditableText
                path="headline"
                value={resume.headline ?? ''}
                placeholder={PLACEHOLDERS['headline']}
              />
            </p>
          </section>
        )}

        {resume.contact.location && (
          <section className="tpl-exec__section">
            <h2 className="tpl-exec__heading" data-block data-keep-with-next>
              Locations
            </h2>
            <p className="tpl-exec__prose" data-block>
              {/* The same field the header shows: one location, two places it
                  is printed, never two values that can disagree. */}
              {resume.contact.location}
            </p>
          </section>
        )}

        {(resume.links.length > 0 || authoring) && (
          <section className="tpl-exec__section">
            <h2 className="tpl-exec__heading" data-block data-keep-with-next>
              Websites, Portfolios, Profiles
            </h2>
            <ul className="tpl-exec__links" data-block>
              <Collection section="links" items={resume.links} gap={false}>
                {({ item, path, chrome, itemProps, justAdded }) => (
                  <li {...itemProps} className="tpl-exec__link">
                    {chrome}
                    <LinkField item={item} path={path} justAdded={justAdded} />
                  </li>
                )}
              </Collection>
            </ul>
          </section>
        )}
      </div>
      {/*
       * The candidate's own sections, after every section this template
       * knows. Heading in the template's own style; entries in the shared
       * neutral layout — see `CustomSections.tsx`.
       */}
      <CustomSections
        sections={resume.custom_sections}
        sectionClass="tpl-exec__section"
        headingClass="tpl-exec__heading"
        Entry={ExecCustomEntry}
      />
    </article>
  );
}
