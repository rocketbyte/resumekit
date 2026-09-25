import type { ResumeObject } from '@cvgs/core';
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
import { DescribedEntries } from '../../kit/DescribedEntries.js';
import { LanguageList } from '../../kit/LanguageList.js';
import { useContactLines } from '../../kit/contact.js';
import { documentStyle } from '../../kit/documentStyle.js';
import {
  StylishCustomEntry,
  StylishEducationEntry,
  StylishExperienceEntry,
} from './entries.js';
import './stylish.css';
import { useEditorText, useDocumentText } from '../../i18n/index.js';

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
      className="tpl-stylish"
      style={documentStyle('st', style)}
      aria-label={doc.t.resume}
      lang={doc.locale}
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
                placeholder={placeholder('headline')}
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
          <DescribedEntries
            id="achievements"
            heading={resume.section_headings?.achievements}
            title={doc.t.sections.achievements}
            items={resume.achievements}
            className="tpl-stylish__section tpl-described--marked"
            headingClassName="tpl-stylish__heading"
            entryClassName="tpl-stylish__described"
          />
          <CustomSections
            sections={resume.custom_sections}
            sectionClass="tpl-stylish__section"
            headingClass="tpl-stylish__heading"
            Entry={StylishCustomEntry}
          />

          {(resume.skills.length > 0 || authoring) && (
            <DocumentSection
              id="skills"
              heading={resume.section_headings?.skills}
              title={doc.t.sections.skills}
              className="tpl-stylish__section"
              headingClassName="tpl-stylish__heading"
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
            className="tpl-stylish__section"
            headingClassName="tpl-stylish__heading"
            entryClassName="tpl-stylish__described"
          />
          {resume.certifications.length > 0 && (
            <DocumentSection
              id="certifications"
              heading={resume.section_headings?.certifications}
              title={doc.t.sections.certifications}
              className="tpl-stylish__section"
              headingClassName="tpl-stylish__heading"
            >
              <p className="tpl-stylish__prose" data-block>
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
            className="tpl-stylish__section tpl-described--marked"
            headingClassName="tpl-stylish__heading"
            entryClassName="tpl-stylish__described"
          />
        </aside>
        <div className="tpl-stylish__main" data-flow>
          {(resume.summary || authoring) && (
            <DocumentSection
              id="summary"
              heading={resume.section_headings?.summary}
              title={doc.t.sections.summary}
              className="tpl-stylish__section"
              headingClassName="tpl-stylish__heading"
            >
              <p className="tpl-stylish__prose" data-block>
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
              heading={resume.section_headings?.education}
              title={doc.t.sections.education}
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

          {/* Languages: read from `resume.languages`, so each one carries a level
              and the section carries a gap of its own. */}
          <LanguageList
            items={resume.languages}
            heading={resume.section_headings?.languages}
            className="tpl-stylish__section"
            headingClassName="tpl-stylish__heading"
            rowClassName="tpl-stylish__language"
          />
        </div>
      </div>
    </article>
  );
}
