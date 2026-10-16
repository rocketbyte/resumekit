/*
 * GENERATED from curve.template.yaml by @resumekit/react's template compiler.
 * Do not edit: change the description and run the package's
 * `generate-templates` script. `check-templates` fails when they disagree.
 */
import type { ResumeObject } from '@resumekit/schema';
import { useDocumentStyle } from '../../presentation-context.js';
import { useAuthoring } from '../../collections/authoring-context.js';
import { EditableText } from '../../nodes/EditableText.js';
import { EditableBulletList } from '../../nodes/EditableBulletList.js';
import { CustomSections } from '../../nodes/CustomSections.js';
import { Collection } from '../../collections/Collection.js';
import { DocumentSection } from '../../kit/DocumentSection.js';
import { DescribedEntries } from '../../kit/DescribedEntries.js';
import { LanguageList } from '../../kit/LanguageList.js';
import { GridSkillGroup } from '../../kit/GridSkillGroup.js';
import { InitialsAvatar } from '../../kit/InitialsAvatar.js';
import { useContactLines } from '../../kit/contact.js';
import { documentStyle } from '../../kit/documentStyle.js';
import { Heading } from '../../kit/Heading.js';
import { LinkField } from '../../nodes/LinkField.js';
import {
  CurveCustomEntry,
  CurveEducationEntry,
  CurveExperienceEntry,
} from './entries.js';
import '../../kit/layout.css';
import '../../kit/contact-icons.css';
import './curve.css';
import { useEditorText, useDocumentText } from '../../i18n/index.js';

export interface CurveDocumentProps {
  resume: ResumeObject;
}

export function CurveDocument({ resume }: CurveDocumentProps) {
  const { placeholder } = useEditorText();
  const doc = useDocumentText();
  const style = useDocumentStyle();
  const authoring = useAuthoring() !== null;

  const contact = useContactLines(
    resume.contact,
    ['email', 'phone', 'location'],
    authoring,
  );

  return (
    <article
      className="tpl-curve"
      style={documentStyle('cv', style)}
      aria-label={doc.t.resume}
      lang={doc.locale}
    >
      <header className="tpl-curve__head" data-layout="row" data-block>
        <div className="tpl-curve__identity">
          <Heading level={1} className="tpl-curve__name">
            <EditableText path="name" value={resume.name} />
          </Heading>

          {(resume.headline || authoring) && (
            <p className="tpl-curve__headline">
              <EditableText
                path="headline"
                value={resume.headline ?? ''}
                placeholder={placeholder('headline')}
              />
            </p>
          )}

          {(contact.length > 0 || resume.links.length > 0 || authoring) && (
            <div className="tpl-curve__contact tpl-contact-icons">
              {contact.map(({ field, path, value, placeholder }) => (
                <span
                  key={path}
                  className={`tpl-curve__contact-item tpl-contact--${field}`}
                >
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
                  <span className="tpl-curve__contact-item tpl-contact--link">
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
            </div>
          )}
        </div>

        <InitialsAvatar name={resume.name} className="tpl-curve__avatar" />
      </header>

      {(resume.summary || authoring) && (
        <DocumentSection
          id="summary"
          heading={resume.section_headings?.summary}
          title={doc.t.sections.summary}
          className="tpl-curve__section"
          headingClassName="tpl-curve__heading"
        >
          <p className="tpl-curve__prose" data-block>
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
          className="tpl-curve__section"
          headingClassName="tpl-curve__heading"
        >
          <Collection section="experience" items={resume.experience}>
            {({ item, path, chrome, itemProps }) => (
              <CurveExperienceEntry
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
          className="tpl-curve__section"
          headingClassName="tpl-curve__heading"
        >
          <Collection section="education" items={resume.education}>
            {({ item, path, chrome, itemProps }) => (
              <CurveEducationEntry
                item={item}
                path={path}
                chrome={chrome}
                itemProps={itemProps}
              />
            )}
          </Collection>
        </DocumentSection>
      )}

      {(resume.skills.length > 0 || authoring) && (
        <DocumentSection
          id="skills"
          heading={resume.section_headings?.skills}
          title={doc.t.sections.skills}
          className="tpl-curve__section"
          headingClassName="tpl-curve__heading"
        >
          <div className="tpl-skill-grid">
            <Collection section="skills" items={resume.skills}>
              {({ item, path, chrome, itemProps }) => (
                <GridSkillGroup
                  item={item}
                  path={path}
                  chrome={chrome}
                  itemProps={itemProps}
                />
              )}
            </Collection>
          </div>
        </DocumentSection>
      )}

      <DescribedEntries
        id="achievements"
        heading={resume.section_headings?.achievements}
        title={doc.t.sections.achievements}
        className="tpl-curve__section tpl-curve__section--numbered"
        headingClassName="tpl-curve__heading"
        items={resume.achievements}
        entryClassName="tpl-curve__described"
      />

      <DescribedEntries
        id="courses"
        heading={resume.section_headings?.courses}
        title={doc.t.sections.courses}
        className="tpl-curve__section tpl-curve__section--marked"
        headingClassName="tpl-curve__heading"
        items={resume.courses}
        entryClassName="tpl-curve__described"
      />

      {(resume.certifications.length > 0 || authoring) && (
        <DocumentSection
          id="certifications"
          heading={resume.section_headings?.certifications}
          title={doc.t.sections.certifications}
          className="tpl-curve__section"
          headingClassName="tpl-curve__heading"
        >
          <div className="tpl-curve__hung" data-block data-split>
            <EditableBulletList
              path="certifications"
              items={resume.certifications}
              placeholder={placeholder('certification')}
            />
          </div>
        </DocumentSection>
      )}

      <LanguageList
        items={resume.languages}
        heading={resume.section_headings?.languages}
        className="tpl-curve__section"
        headingClassName="tpl-curve__heading"
        rowClassName="tpl-curve__language"
      />

      <DescribedEntries
        id="passions"
        heading={resume.section_headings?.passions}
        title={doc.t.sections.passions}
        className="tpl-curve__section tpl-curve__section--marked"
        headingClassName="tpl-curve__heading"
        items={resume.passions}
        entryClassName="tpl-curve__described"
      />

      <CustomSections
        sections={resume.custom_sections}
        sectionClass="tpl-curve__section"
        headingClass="tpl-curve__heading"
        Entry={CurveCustomEntry}
      />
    </article>
  );
}
