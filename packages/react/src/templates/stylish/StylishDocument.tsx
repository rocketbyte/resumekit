import { PLACEHOLDERS, type ResumeObject } from '@cvgs/core';
import { Collection } from '../../collections/Collection.js';
import { useAuthoring } from '../../collections/authoring-context.js';
import { CustomSections } from '../../nodes/CustomSections.js';
import { EditableInlineList } from '../../nodes/EditableInlineList.js';
import { EditableText } from '../../nodes/EditableText.js';
import { LinkField } from '../../nodes/LinkField.js';
import { useDocumentStyle } from '../../presentation-context.js';
import { BulletSkillGroup } from '../../kit/BulletSkillGroup.js';
import { InitialsAvatar } from '../../kit/InitialsAvatar.js';
import { DocumentSection } from '../../kit/DocumentSection.js';
import { contactLines } from '../../kit/contact.js';
import { documentStyle } from '../../kit/documentStyle.js';
import { isLanguages } from '../skills.js';
import {
  StylishCustomEntry,
  StylishEducationEntry,
  StylishExperienceEntry,
} from './entries.js';
import './stylish.css';

/**
 * The Stylish template.
 *
 * Two columns with the rail on the LEFT, and it is written first because it is
 * drawn first: document order is the page's order, so the extracted text, the
 * printed text layer and the keyboard's path through the fields are one order
 * by construction. That makes the catalog's claim a statement about what a
 * parser actually receives — the highlights and the skills, then the work
 * history — rather than about a column's width.
 *
 * Each column is `data-flow`, so `PagedSheet` breaks it by its own height.
 */
export interface StylishDocumentProps {
  resume: ResumeObject;
}

export function StylishDocument({ resume }: StylishDocumentProps) {
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
      className="tpl-stylish"
      style={documentStyle('st', style)}
      aria-label="Resume document"
    >
      <header className="tpl-stylish__head-block" data-block>
        <div className="tpl-stylish__identity">
          <h1 className="tpl-stylish__name">
            <EditableText path="name" value={resume.name} />
          </h1>

          {(resume.headline || authoring) && (
            <p className="tpl-stylish__headline">
              <EditableText
                path="headline"
                value={resume.headline ?? ''}
                placeholder={PLACEHOLDERS['headline']}
              />
            </p>
          )}

          {(contact.length > 0 || resume.links.length > 0 || authoring) && (
            <p className="tpl-stylish__contact">
              {contact.map(({ path, value, placeholder }) => (
                <span key={path} className="tpl-stylish__contact-item">
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
                  <span className="tpl-stylish__contact-item">
                    <span {...itemProps}>
                      {chrome}
                      <LinkField
                        item={item}
                        path={path}
                        justAdded={justAdded}
                      />
                    </span>
                  </span>
                )}
              </Collection>
            </p>
          )}
        </div>
        {/* No photograph is stored, and none is invented: the initials stand
            in the slot the design gives a portrait. */}
        <InitialsAvatar name={resume.name} className="tpl-stylish__avatar" />
      </header>

      <div className="tpl-stylish__body">
        {/* ── The rail: what a reader scans ─────────────────────────────── */}
        <aside className="tpl-stylish__aside" data-flow>
          <CustomSections
            sections={resume.custom_sections}
            sectionClass="tpl-stylish__section"
            headingClass="tpl-stylish__heading"
            Entry={StylishCustomEntry}
          />

          {(resume.skills.length > languages.length || authoring) && (
            <DocumentSection
              id="skills"
              title="Skills"
              className="tpl-stylish__section"
              headingClassName="tpl-stylish__heading"
            >
              {/* Chips, and every chip is a list ITEM: a parser reads them one
                  per line rather than as one run of joined words. */}
              <div className="tpl-stylish__chips" data-block data-split>
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

          {resume.certifications.length > 0 && (
            <DocumentSection
              id="certifications"
              title="Certifications"
              className="tpl-stylish__section"
              headingClassName="tpl-stylish__heading"
            >
              <p className="tpl-stylish__prose" data-block>
                <EditableInlineList
                  path="certifications"
                  items={resume.certifications}
                  placeholder={PLACEHOLDERS['certifications']}
                />
              </p>
            </DocumentSection>
          )}
        </aside>
        <div className="tpl-stylish__main" data-flow>
          {(resume.summary || authoring) && (
            <DocumentSection
              id="summary"
              title="Summary"
              className="tpl-stylish__section"
              headingClassName="tpl-stylish__heading"
            >
              <p className="tpl-stylish__prose" data-block>
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
              className="tpl-stylish__section"
              headingClassName="tpl-stylish__heading"
            >
              <Collection section="experience" items={resume.experience}>
                {({ item, path, chrome, itemProps }) => (
                  <StylishExperienceEntry
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
              className="tpl-stylish__section"
              headingClassName="tpl-stylish__heading"
            >
              <Collection section="education" items={resume.education}>
                {({ item, path, chrome, itemProps }) => (
                  <StylishEducationEntry
                    item={item}
                    path={path}
                    chrome={chrome}
                    itemProps={itemProps}
                  />
                )}
              </Collection>
            </DocumentSection>
          )}

          {/* A plain section: Languages is read from the skills group that
              names them, and has no stored gap of its own. */}
          {languages.length > 0 && (
            <section className="tpl-stylish__section">
              <h2
                className="tpl-stylish__heading"
                data-block
                data-keep-with-next
              >
                Languages
              </h2>
              <p className="tpl-stylish__prose" data-block>
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
        </div>
      </div>
    </article>
  );
}
