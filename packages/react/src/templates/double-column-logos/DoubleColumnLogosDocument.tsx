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
  DoubleColumnLogosCustomEntry,
  DoubleColumnLogosEducationEntry,
  DoubleColumnLogosExperienceEntry,
} from './entries.js';
import './double-column-logos.css';

/**
 * The Double Column with Logos template.
 *
 * Double Column's page with a mark beside every employer. A résumé stores no
 * logos and the renderer resolves no URLs, so the mark is the employer's own
 * INITIALS — derived from the name printed beside it, which is the only
 * version of this design that can be true of every résumé.
 *
 * Everything else is Double Column's: the work history in the wide column and
 * written first, headings at reading size over a heavy rule, and a rail whose
 * highlights are divided by a dotted rule.
 */
export interface DoubleColumnLogosDocumentProps {
  resume: ResumeObject;
}

export function DoubleColumnLogosDocument({
  resume,
}: DoubleColumnLogosDocumentProps) {
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
      className="tpl-dcl"
      style={documentStyle('dcl', style)}
      aria-label="Resume document"
    >
      <header className="tpl-dcl__head-block" data-block>
        <div className="tpl-dcl__identity">
          <h1 className="tpl-dcl__name">
            <EditableText path="name" value={resume.name} />
          </h1>

          {(resume.headline || authoring) && (
            <p className="tpl-dcl__headline">
              <EditableText
                path="headline"
                value={resume.headline ?? ''}
                placeholder={PLACEHOLDERS['headline']}
              />
            </p>
          )}

          {(contact.length > 0 || resume.links.length > 0 || authoring) && (
            <p className="tpl-dcl__contact">
              {contact.map(({ path, value, placeholder }) => (
                <span key={path} className="tpl-dcl__contact-item">
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
                  <span className="tpl-dcl__contact-item">
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
        <InitialsAvatar name={resume.name} className="tpl-dcl__avatar" />
      </header>

      <div className="tpl-dcl__body">
        <div className="tpl-dcl__main" data-flow>
          {(resume.summary || authoring) && (
            <DocumentSection
              id="summary"
              title="Summary"
              className="tpl-dcl__section"
              headingClassName="tpl-dcl__heading"
            >
              <p className="tpl-dcl__prose" data-block>
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
              className="tpl-dcl__section"
              headingClassName="tpl-dcl__heading"
            >
              <Collection section="experience" items={resume.experience}>
                {({ item, path, chrome, itemProps }) => (
                  <DoubleColumnLogosExperienceEntry
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
              className="tpl-dcl__section"
              headingClassName="tpl-dcl__heading"
            >
              <Collection section="education" items={resume.education}>
                {({ item, path, chrome, itemProps }) => (
                  <DoubleColumnLogosEducationEntry
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
            <section className="tpl-dcl__section">
              <h2 className="tpl-dcl__heading" data-block data-keep-with-next>
                Languages
              </h2>
              <p className="tpl-dcl__prose" data-block>
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
        <aside className="tpl-dcl__aside" data-flow>
          <CustomSections
            sections={resume.custom_sections}
            sectionClass="tpl-dcl__section"
            headingClass="tpl-dcl__heading"
            Entry={DoubleColumnLogosCustomEntry}
          />

          {(resume.skills.length > languages.length || authoring) && (
            <DocumentSection
              id="skills"
              title="Skills"
              className="tpl-dcl__section"
              headingClassName="tpl-dcl__heading"
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
              className="tpl-dcl__section"
              headingClassName="tpl-dcl__heading"
            >
              <p className="tpl-dcl__prose" data-block>
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
