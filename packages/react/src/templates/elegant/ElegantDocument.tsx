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
  ElegantCustomEntry,
  ElegantEducationEntry,
  ElegantExperienceEntry,
} from './entries.js';
import './elegant.css';

/**
 * The Elegant template.
 *
 * A painted rail down the right of the page, reversed out in white, beside a
 * work history written FIRST — the only ATS property this shape can honestly
 * offer.
 *
 * The rail runs the FULL height of every sheet, which is why the header lives
 * inside the wide column rather than above both: a header spanning the page
 * would cut the panel off at the top of page one and nowhere else.
 *
 * Reversed type is the one thing here that a browser may decline to print, so
 * the panel asks to be painted and the catalog says the rail is forced rather
 * than promising what an unpainted design can.
 */
export interface ElegantDocumentProps {
  resume: ResumeObject;
}

export function ElegantDocument({ resume }: ElegantDocumentProps) {
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
      className="tpl-elegant"
      style={documentStyle('el', style)}
      aria-label="Resume document"
    >
      <div className="tpl-elegant__body">
        <div className="tpl-elegant__main" data-flow>
          <header className="tpl-elegant__head-block" data-block>
            <div className="tpl-elegant__identity">
              <h1 className="tpl-elegant__name">
                <EditableText path="name" value={resume.name} />
              </h1>

              {(resume.headline || authoring) && (
                <p className="tpl-elegant__headline">
                  <EditableText
                    path="headline"
                    value={resume.headline ?? ''}
                    placeholder={PLACEHOLDERS['headline']}
                  />
                </p>
              )}

              {(contact.length > 0 || resume.links.length > 0 || authoring) && (
                <p className="tpl-elegant__contact">
                  {contact.map(({ path, value, placeholder }) => (
                    <span key={path} className="tpl-elegant__contact-item">
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
                      <span className="tpl-elegant__contact-item">
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
          </header>

          {(resume.experience.length > 0 || authoring) && (
            <DocumentSection
              id="experience"
              title="Experience"
              className="tpl-elegant__section"
              headingClassName="tpl-elegant__heading"
            >
              <Collection section="experience" items={resume.experience}>
                {({ item, path, chrome, itemProps }) => (
                  <ElegantExperienceEntry
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
              className="tpl-elegant__section"
              headingClassName="tpl-elegant__heading"
            >
              <Collection section="education" items={resume.education}>
                {({ item, path, chrome, itemProps }) => (
                  <ElegantEducationEntry
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
            <section className="tpl-elegant__section">
              <h2
                className="tpl-elegant__heading"
                data-block
                data-keep-with-next
              >
                Languages
              </h2>
              <p className="tpl-elegant__prose" data-block>
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

        {/* ── The rail: what a reader scans ─────────────────────────────── */}
        <aside className="tpl-elegant__aside" data-flow>
          {/* No photograph is stored, and none is invented: the initials ride
              the top of the rail, where the reference puts a portrait. */}
          <InitialsAvatar name={resume.name} className="tpl-elegant__avatar" />
          {(resume.summary || authoring) && (
            <DocumentSection
              id="summary"
              title="Summary"
              className="tpl-elegant__section"
              headingClassName="tpl-elegant__heading"
            >
              <p className="tpl-elegant__prose" data-block>
                <EditableText
                  path="summary"
                  value={resume.summary ?? ''}
                  placeholder={PLACEHOLDERS['summary']}
                  multiline
                />
              </p>
            </DocumentSection>
          )}

          <CustomSections
            sections={resume.custom_sections}
            sectionClass="tpl-elegant__section"
            headingClass="tpl-elegant__heading"
            Entry={ElegantCustomEntry}
          />

          {(resume.skills.length > languages.length || authoring) && (
            <DocumentSection
              id="skills"
              title="Skills"
              className="tpl-elegant__section"
              headingClassName="tpl-elegant__heading"
            >
              {/* Chips, and every chip is a list ITEM: a parser reads them one
                  per line rather than as one run of joined words. */}
              <div className="tpl-elegant__chips" data-block data-split>
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
              className="tpl-elegant__section"
              headingClassName="tpl-elegant__heading"
            >
              <p className="tpl-elegant__prose" data-block>
                <EditableInlineList
                  path="certifications"
                  items={resume.certifications}
                  placeholder={PLACEHOLDERS['certifications']}
                />
              </p>
            </DocumentSection>
          )}
        </aside>
      </div>
    </article>
  );
}
