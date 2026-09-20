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
  CreativeCustomEntry,
  CreativeEducationEntry,
  CreativeExperienceEntry,
} from './entries.js';
import './creative.css';

/**
 * The Creative template.
 *
 * A full-width band carrying the name, the headline, the contact details and
 * the candidate's initials, over two columns with the work history in the wide
 * one — written FIRST, which is the only ATS property this shape can honestly
 * offer.
 *
 * The band is the one thing on the page that needs a background to print, so
 * the catalog says so rather than claiming what Cobalt can: `print-color-
 * adjust` is a hint, and reversed type on an unpainted band does not degrade,
 * it disappears — which is why the band's own rule forces it.
 *
 * Each column is `data-flow`, so `PagedSheet` breaks it by its own height.
 */
export interface CreativeDocumentProps {
  resume: ResumeObject;
}

export function CreativeDocument({ resume }: CreativeDocumentProps) {
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
      className="tpl-creative"
      style={documentStyle('cr', style)}
      aria-label="Resume document"
    >
      <header className="tpl-creative__band" data-block>
        <div className="tpl-creative__identity">
          <h1 className="tpl-creative__name">
            <EditableText path="name" value={resume.name} />
          </h1>

          {(resume.headline || authoring) && (
            <p className="tpl-creative__headline">
              <EditableText
                path="headline"
                value={resume.headline ?? ''}
                placeholder={PLACEHOLDERS['headline']}
              />
            </p>
          )}

          {(contact.length > 0 || resume.links.length > 0 || authoring) && (
            <p className="tpl-creative__contact">
              {contact.map(({ path, value, placeholder }) => (
                <span key={path} className="tpl-creative__contact-item">
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
                  <span className="tpl-creative__contact-item">
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
        <InitialsAvatar name={resume.name} className="tpl-creative__avatar" />
      </header>

      <div className="tpl-creative__body">
        <div className="tpl-creative__main" data-flow>
          {(resume.experience.length > 0 || authoring) && (
            <DocumentSection
              id="experience"
              title="Experience"
              className="tpl-creative__section"
              headingClassName="tpl-creative__heading"
            >
              <Collection section="experience" items={resume.experience}>
                {({ item, path, chrome, itemProps }) => (
                  <CreativeExperienceEntry
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
              className="tpl-creative__section"
              headingClassName="tpl-creative__heading"
            >
              <Collection section="education" items={resume.education}>
                {({ item, path, chrome, itemProps }) => (
                  <CreativeEducationEntry
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
            <section className="tpl-creative__section">
              <h2
                className="tpl-creative__heading"
                data-block
                data-keep-with-next
              >
                Languages
              </h2>
              <p className="tpl-creative__prose" data-block>
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
        <aside className="tpl-creative__aside" data-flow>
          {(resume.summary || authoring) && (
            <DocumentSection
              id="summary"
              title="Summary"
              className="tpl-creative__section"
              headingClassName="tpl-creative__heading"
            >
              <p className="tpl-creative__prose" data-block>
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
            sectionClass="tpl-creative__section"
            headingClass="tpl-creative__heading"
            Entry={CreativeCustomEntry}
          />

          {(resume.skills.length > languages.length || authoring) && (
            <DocumentSection
              id="skills"
              title="Skills"
              className="tpl-creative__section"
              headingClassName="tpl-creative__heading"
            >
              {/* Keywords in boxes, as this reference draws them — and every one a
                  list ITEM, so a parser still reads one skill per line. */}
              <div
                className="tpl-keywords tpl-keywords--boxed"
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

          {resume.certifications.length > 0 && (
            <DocumentSection
              id="certifications"
              title="Certifications"
              className="tpl-creative__section"
              headingClassName="tpl-creative__heading"
            >
              <p className="tpl-creative__prose" data-block>
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
