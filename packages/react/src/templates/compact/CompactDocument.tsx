import { PLACEHOLDERS, type ResumeObject } from '@cvgs/core';
import { Collection } from '../../collections/Collection.js';
import { useAuthoring } from '../../collections/authoring-context.js';
import { CustomSections } from '../../nodes/CustomSections.js';
import { EditableInlineList } from '../../nodes/EditableInlineList.js';
import { EditableText } from '../../nodes/EditableText.js';
import { LinkField } from '../../nodes/LinkField.js';
import { useDocumentStyle } from '../../presentation-context.js';
import { BulletSkillGroup } from '../../kit/BulletSkillGroup.js';
import { DocumentSection } from '../../kit/DocumentSection.js';
import { contactLines } from '../../kit/contact.js';
import { documentStyle } from '../../kit/documentStyle.js';
import { isLanguages } from '../skills.js';
import {
  CompactCustomEntry,
  CompactEducationEntry,
  CompactExperienceEntry,
} from './entries.js';
import './compact.css';

/**
 * The Compact template.
 *
 * Two columns, and the résumé is in the wide one: summary, experience and
 * education are written FIRST, so the extracted text reads the work history
 * through before it reaches the rail. That ordering is the only ATS property a
 * two-column layout can honestly offer, so it is the one the catalog states.
 *
 * Density comes from the entry's shape rather than from small type — the role
 * on its own line, then employer, dates and place sharing the next — and from
 * the rail, which carries what a reader scans: the candidate's own sections,
 * the skills and the certifications.
 *
 * Each column is `data-flow`, so `PagedSheet` breaks it by its own height.
 */
export interface CompactDocumentProps {
  resume: ResumeObject;
}

export function CompactDocument({ resume }: CompactDocumentProps) {
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
      className="tpl-compact"
      style={documentStyle('cp', style)}
      aria-label="Resume document"
    >
      <header className="tpl-compact__head-block" data-block>
        <h1 className="tpl-compact__name">
          <EditableText path="name" value={resume.name} />
        </h1>

        {(resume.headline || authoring) && (
          <p className="tpl-compact__headline">
            <EditableText
              path="headline"
              value={resume.headline ?? ''}
              placeholder={PLACEHOLDERS['headline']}
            />
          </p>
        )}

        {(contact.length > 0 || resume.links.length > 0 || authoring) && (
          <p className="tpl-compact__contact">
            {contact.map(({ path, value, placeholder }) => (
              <span key={path} className="tpl-compact__contact-item">
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
                <span className="tpl-compact__contact-item">
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

      <div className="tpl-compact__body">
        <div className="tpl-compact__main" data-flow>
          {(resume.summary || authoring) && (
            <DocumentSection
              id="summary"
              title="Summary"
              className="tpl-compact__section"
              headingClassName="tpl-compact__heading"
            >
              <p className="tpl-compact__prose" data-block>
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
              className="tpl-compact__section"
              headingClassName="tpl-compact__heading"
            >
              <Collection section="experience" items={resume.experience}>
                {({ item, path, chrome, itemProps }) => (
                  <CompactExperienceEntry
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
              className="tpl-compact__section"
              headingClassName="tpl-compact__heading"
            >
              <Collection section="education" items={resume.education}>
                {({ item, path, chrome, itemProps }) => (
                  <CompactEducationEntry
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
            <section className="tpl-compact__section">
              <h2
                className="tpl-compact__heading"
                data-block
                data-keep-with-next
              >
                Languages
              </h2>
              <p className="tpl-compact__prose" data-block>
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
        <aside className="tpl-compact__aside" data-flow>
          <CustomSections
            sections={resume.custom_sections}
            sectionClass="tpl-compact__section"
            headingClass="tpl-compact__heading"
            Entry={CompactCustomEntry}
          />

          {(resume.skills.length > languages.length || authoring) && (
            <DocumentSection
              id="skills"
              title="Skills"
              className="tpl-compact__section"
              headingClassName="tpl-compact__heading"
            >
              {/* Chips, and every chip is a list ITEM: a parser reads them one
                  per line rather than as one run of joined words. */}
              <div className="tpl-compact__chips" data-block data-split>
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
              className="tpl-compact__section"
              headingClassName="tpl-compact__heading"
            >
              <p className="tpl-compact__prose" data-block>
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
