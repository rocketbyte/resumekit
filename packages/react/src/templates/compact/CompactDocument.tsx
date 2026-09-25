import type { ResumeObject } from '@cvgs/core';
import { Collection } from '../../collections/Collection.js';
import { useAuthoring } from '../../collections/authoring-context.js';
import { CustomSections } from '../../nodes/CustomSections.js';
import { EditableInlineList } from '../../nodes/EditableInlineList.js';
import { EditableText } from '../../nodes/EditableText.js';
import { LinkField } from '../../nodes/LinkField.js';
import { useDocumentStyle } from '../../presentation-context.js';
import { BulletSkillGroup } from '../../kit/BulletSkillGroup.js';
import { DocumentSection } from '../../kit/DocumentSection.js';
import { DescribedEntries } from '../../kit/DescribedEntries.js';
import { LanguageList } from '../../kit/LanguageList.js';
import { useContactLines } from '../../kit/contact.js';
import { documentStyle } from '../../kit/documentStyle.js';
import {
  CompactCustomEntry,
  CompactEducationEntry,
  CompactExperienceEntry,
} from './entries.js';
import './compact.css';
import { useEditorText, useDocumentText } from '../../i18n/index.js';

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
  const { placeholder } = useEditorText();
  const doc = useDocumentText();
  const style = useDocumentStyle();
  const authoring = useAuthoring() !== null;

  const contact = useContactLines(
    resume.contact,
    ['phone', 'email', 'location'],
    authoring,
  );

  return (
    <article
      className="tpl-compact"
      style={documentStyle('cp', style)}
      aria-label={doc.t.resume}
      lang={doc.locale}
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
              placeholder={placeholder('headline')}
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
              heading={resume.section_headings?.summary}
              title={doc.t.sections.summary}
              className="tpl-compact__section"
              headingClassName="tpl-compact__heading"
            >
              <p className="tpl-compact__prose" data-block>
                <EditableText
                  path="summary"
                  value={resume.summary ?? ''}
                  placeholder={placeholder('summary')}
                  multiline
                />
              </p>
            </DocumentSection>
          )}

          {(resume.experience.length > 0 || authoring) && (
            <DocumentSection
              id="experience"
              heading={resume.section_headings?.experience}
              title={doc.t.sections.experience}
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
              heading={resume.section_headings?.education}
              title={doc.t.sections.education}
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

          {/* Languages: read from `resume.languages`, so each one carries a level
              and the section carries a gap of its own. */}
          <LanguageList
            items={resume.languages}
            heading={resume.section_headings?.languages}
            className="tpl-compact__section"
            headingClassName="tpl-compact__heading"
            rowClassName="tpl-compact__language"
          />
        </div>

        {/* ── The rail: what a reader scans ─────────────────────────────── */}
        <aside className="tpl-compact__aside" data-flow>
          <DescribedEntries
            id="achievements"
            heading={resume.section_headings?.achievements}
            title={doc.t.sections.achievements}
            items={resume.achievements}
            className="tpl-compact__section tpl-described--marked"
            headingClassName="tpl-compact__heading"
            entryClassName="tpl-compact__described"
          />
          <CustomSections
            sections={resume.custom_sections}
            sectionClass="tpl-compact__section"
            headingClass="tpl-compact__heading"
            Entry={CompactCustomEntry}
          />

          {(resume.skills.length > 0 || authoring) && (
            <DocumentSection
              id="skills"
              heading={resume.section_headings?.skills}
              title={doc.t.sections.skills}
              className="tpl-compact__section"
              headingClassName="tpl-compact__heading"
            >
              {/* Keywords over a rule, one to a line, and every one a list ITEM:
                  a parser reads them one per line rather than as a run. */}
              <div className="tpl-keywords" data-block data-split>
                <Collection
                  section="skills"
                  items={resume.skills}
                  noun="skill"
                  gap={false}
                >
                  {({ item, path }) => (
                    <BulletSkillGroup item={item} path={path} />
                  )}
                </Collection>
              </div>
            </DocumentSection>
          )}

          <DescribedEntries
            id="courses"
            heading={resume.section_headings?.courses}
            title={doc.t.sections.courses}
            items={resume.courses}
            className="tpl-compact__section"
            headingClassName="tpl-compact__heading"
            entryClassName="tpl-compact__described"
          />
          {resume.certifications.length > 0 && (
            <DocumentSection
              id="certifications"
              heading={resume.section_headings?.certifications}
              title={doc.t.sections.certifications}
              className="tpl-compact__section"
              headingClassName="tpl-compact__heading"
            >
              <p className="tpl-compact__prose" data-block>
                <EditableInlineList
                  path="certifications"
                  items={resume.certifications}
                  placeholder={placeholder('certifications')}
                />
              </p>
            </DocumentSection>
          )}
          <DescribedEntries
            id="passions"
            heading={resume.section_headings?.passions}
            title={doc.t.sections.passions}
            items={resume.passions}
            className="tpl-compact__section tpl-described--marked"
            headingClassName="tpl-compact__heading"
            entryClassName="tpl-compact__described"
          />
        </aside>
      </div>
    </article>
  );
}
