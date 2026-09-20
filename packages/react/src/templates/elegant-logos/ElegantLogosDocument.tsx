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
  ElegantLogosCustomEntry,
  ElegantLogosEducationEntry,
  ElegantLogosExperienceEntry,
} from './entries.js';
import './elegant-logos.css';

/**
 * The Elegant with Logos template.
 *
 * Elegant's painted rail, with a mark beside every employer. A résumé stores
 * no logos and the renderer resolves no URLs, so the mark is the employer's
 * own INITIALS — see `InitialsChip`.
 */
export interface ElegantLogosDocumentProps {
  resume: ResumeObject;
}

export function ElegantLogosDocument({ resume }: ElegantLogosDocumentProps) {
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
      className="tpl-ell"
      style={documentStyle('ell', style)}
      aria-label="Resume document"
    >
      <div className="tpl-ell__body">
        <div className="tpl-ell__main" data-flow>
          <header className="tpl-ell__head-block" data-block>
            <div className="tpl-ell__identity">
              <h1 className="tpl-ell__name">
                <EditableText path="name" value={resume.name} />
              </h1>

              {(resume.headline || authoring) && (
                <p className="tpl-ell__headline">
                  <EditableText
                    path="headline"
                    value={resume.headline ?? ''}
                    placeholder={PLACEHOLDERS['headline']}
                  />
                </p>
              )}

              {(contact.length > 0 || resume.links.length > 0 || authoring) && (
                <p className="tpl-ell__contact">
                  {contact.map(({ path, value, placeholder }) => (
                    <span key={path} className="tpl-ell__contact-item">
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
                      <span className="tpl-ell__contact-item">
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
              className="tpl-ell__section"
              headingClassName="tpl-ell__heading"
            >
              <Collection section="experience" items={resume.experience}>
                {({ item, path, chrome, itemProps }) => (
                  <ElegantLogosExperienceEntry
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
              className="tpl-ell__section"
              headingClassName="tpl-ell__heading"
            >
              <Collection section="education" items={resume.education}>
                {({ item, path, chrome, itemProps }) => (
                  <ElegantLogosEducationEntry
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
            <section className="tpl-ell__section">
              <h2 className="tpl-ell__heading" data-block data-keep-with-next>
                Languages
              </h2>
              <p className="tpl-ell__prose" data-block>
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
        <aside className="tpl-ell__aside" data-flow>
          {/* No photograph is stored, and none is invented: the initials ride
              the top of the rail, where the reference puts a portrait. */}
          <InitialsAvatar name={resume.name} className="tpl-ell__avatar" />
          {(resume.summary || authoring) && (
            <DocumentSection
              id="summary"
              title="Summary"
              className="tpl-ell__section"
              headingClassName="tpl-ell__heading"
            >
              <p className="tpl-ell__prose" data-block>
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
            sectionClass="tpl-ell__section"
            headingClass="tpl-ell__heading"
            Entry={ElegantLogosCustomEntry}
          />

          {(resume.skills.length > languages.length || authoring) && (
            <DocumentSection
              id="skills"
              title="Skills"
              className="tpl-ell__section"
              headingClassName="tpl-ell__heading"
            >
              {/* Chips, and every chip is a list ITEM: a parser reads them one
                  per line rather than as one run of joined words. */}
              <div className="tpl-ell__chips" data-block data-split>
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
              className="tpl-ell__section"
              headingClassName="tpl-ell__heading"
            >
              <p className="tpl-ell__prose" data-block>
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
