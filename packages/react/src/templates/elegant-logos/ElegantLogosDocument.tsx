import type { ResumeObject } from '@cvgs/core';
import { Collection } from '../../collections/Collection.js';
import { useAuthoring } from '../../collections/authoring-context.js';
import { CustomSections } from '../../nodes/CustomSections.js';
import { EditableInlineList } from '../../nodes/EditableInlineList.js';
import { EditableText } from '../../nodes/EditableText.js';
import { LinkField } from '../../nodes/LinkField.js';
import { useDocumentStyle } from '../../presentation-context.js';
import { InlineSkillGroup } from '../../kit/InlineSkillGroup.js';
import { InitialsAvatar } from '../../kit/InitialsAvatar.js';
import { DocumentSection } from '../../kit/DocumentSection.js';
import { DescribedEntries } from '../../kit/DescribedEntries.js';
import { LanguageList } from '../../kit/LanguageList.js';
import { useContactLines } from '../../kit/contact.js';
import { documentStyle } from '../../kit/documentStyle.js';
import {
  ElegantLogosCustomEntry,
  ElegantLogosEducationEntry,
  ElegantLogosExperienceEntry,
} from './entries.js';
import './elegant-logos.css';
import { useEditorText, useDocumentText } from '../../i18n/index.js';

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
      className="tpl-ell"
      style={documentStyle('ell', style)}
      aria-label={doc.t.resume}
      lang={doc.locale}
    >
      <div className="tpl-ell__body tpl-sheet-tall">
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
                    placeholder={placeholder('headline')}
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

          {(resume.summary || authoring) && (
            <DocumentSection
              id="summary"
              heading={resume.section_headings?.summary}
              title={doc.t.sections.summary}
              className="tpl-ell__section"
              headingClassName="tpl-ell__heading"
            >
              <p className="tpl-ell__prose" data-block>
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
              heading={resume.section_headings?.education}
              title={doc.t.sections.education}
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

          {/* Languages: read from `resume.languages`, so each one carries a level
              and the section carries a gap of its own. */}
          <LanguageList
            items={resume.languages}
            heading={resume.section_headings?.languages}
            className="tpl-ell__section"
            headingClassName="tpl-ell__heading"
            rowClassName="tpl-ell__language"
          />
        </div>

        {/* ── The rail: what a reader scans ─────────────────────────────── */}
        <aside className="tpl-ell__aside" data-flow>
          {/* No photograph is stored, and none is invented: the initials ride
              the top of the rail, where the reference puts a portrait. */}
          <InitialsAvatar name={resume.name} className="tpl-ell__avatar" />

          <DescribedEntries
            id="achievements"
            heading={resume.section_headings?.achievements}
            title={doc.t.sections.keyAchievements}
            items={resume.achievements}
            className="tpl-ell__section tpl-described--marked"
            headingClassName="tpl-ell__heading"
            entryClassName="tpl-ell__described"
          />
          <CustomSections
            sections={resume.custom_sections}
            sectionClass="tpl-ell__section"
            headingClass="tpl-ell__heading"
            Entry={ElegantLogosCustomEntry}
          />

          {(resume.skills.length > 0 || authoring) && (
            <DocumentSection
              id="skills"
              heading={resume.section_headings?.skills}
              title={doc.t.sections.skills}
              className="tpl-ell__section"
              headingClassName="tpl-ell__heading"
            >
              {/* One run of keywords, as this reference sets them — and still a
                  field per group, so a parser reads the separators as characters. */}
              <p className="tpl-ell__keywords" data-block>
                <Collection
                  section="skills"
                  items={resume.skills}
                  noun="skill"
                  gap={false}
                >
                  {({ item, path, index }) => (
                    <InlineSkillGroup
                      item={item}
                      path={path}
                      first={index === 0}
                    />
                  )}
                </Collection>
              </p>
            </DocumentSection>
          )}

          <DescribedEntries
            id="courses"
            heading={resume.section_headings?.courses}
            title={doc.t.sections.courses}
            items={resume.courses}
            className="tpl-ell__section"
            headingClassName="tpl-ell__heading"
            entryClassName="tpl-ell__described"
          />
          {resume.certifications.length > 0 && (
            <DocumentSection
              id="certifications"
              heading={resume.section_headings?.certifications}
              title={doc.t.sections.certifications}
              className="tpl-ell__section"
              headingClassName="tpl-ell__heading"
            >
              <p className="tpl-ell__prose" data-block>
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
            title={doc.t.sections.interests}
            items={resume.passions}
            className="tpl-ell__section tpl-described--marked"
            headingClassName="tpl-ell__heading"
            entryClassName="tpl-ell__described"
          />
        </aside>
      </div>
    </article>
  );
}
