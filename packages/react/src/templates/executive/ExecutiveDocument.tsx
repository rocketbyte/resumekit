/*
 * GENERATED from executive.template.yaml by @resumekit/react's template compiler.
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
import { BulletSkillGroup } from '../../kit/BulletSkillGroup.js';
import { monogram } from '../../kit/monogram.js';
import { useContactLines } from '../../kit/contact.js';
import { documentStyle } from '../../kit/documentStyle.js';
import { Heading } from '../../kit/Heading.js';
import { LinkField } from '../../nodes/LinkField.js';
import {
  ExecutiveCustomEntry,
  ExecutiveEducationEntry,
  ExecutiveExperienceEntry,
} from './entries.js';
import '../../kit/layout.css';
import './executive.css';
import { useEditorText, useDocumentText } from '../../i18n/index.js';

export interface ExecutiveDocumentProps {
  resume: ResumeObject;
}

export function ExecutiveDocument({ resume }: ExecutiveDocumentProps) {
  const { placeholder } = useEditorText();
  const doc = useDocumentText();
  const style = useDocumentStyle();
  const authoring = useAuthoring() !== null;

  const contact = useContactLines(resume.contact, ['location'], authoring);
  const contact2 = useContactLines(
    resume.contact,
    ['email', 'phone'],
    authoring,
  );

  return (
    <article
      className="tpl-exec"
      style={documentStyle('e', style)}
      aria-label={doc.t.resume}
      lang={doc.locale}
    >
      <header className="tpl-exec__band" data-layout="row" data-block>
        <span className="tpl-exec__monogram" aria-hidden="true">
          {monogram(resume.name)}
        </span>

        <div className="tpl-exec__identity">
          <Heading level={1} className="tpl-exec__name">
            <EditableText path="name" value={resume.name} />
          </Heading>

          {contact.length > 0 && (
            <p className="tpl-exec__where tpl-contact--location">
              {contact.map(({ path, value, placeholder }) => (
                <EditableText
                  key={path}
                  path={path}
                  value={value}
                  placeholder={placeholder}
                />
              ))}
            </p>
          )}

          {contact2.length > 0 && (
            <p className="tpl-exec__contact">
              {contact2.map(({ field, path, value, placeholder }) => (
                <span
                  key={path}
                  className={`tpl-exec__contact-item tpl-contact--${field}`}
                >
                  <EditableText
                    path={path}
                    value={value}
                    placeholder={placeholder}
                  />
                </span>
              ))}
            </p>
          )}
        </div>
      </header>

      <div className="tpl-exec__body">
        {(resume.summary || authoring) && (
          <DocumentSection
            id="summary"
            heading={resume.section_headings?.summary}
            title={doc.t.sections.professionalSummary}
            className="tpl-exec__section"
            headingClassName="tpl-exec__heading"
          >
            <p className="tpl-exec__prose" data-block>
              <EditableText
                path="summary"
                value={resume.summary ?? ''}
                placeholder={placeholder('summary')}
                multiline
              />
            </p>
          </DocumentSection>
        )}

        <DescribedEntries
          id="achievements"
          heading={resume.section_headings?.achievements}
          title={doc.t.sections.achievements}
          className="tpl-exec__section tpl-described--marked"
          headingClassName="tpl-exec__heading"
          items={resume.achievements}
          entryClassName="tpl-exec__described"
        />

        {(resume.skills.length > 0 || authoring) && (
          <DocumentSection
            id="skills"
            heading={resume.section_headings?.skills}
            title={doc.t.sections.technicalSkills}
            className="tpl-exec__section"
            headingClassName="tpl-exec__heading"
          >
            <div className="tpl-exec__columns" data-block>
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

        {(resume.experience.length > 0 || authoring) && (
          <DocumentSection
            id="experience"
            heading={resume.section_headings?.experience}
            title={doc.t.sections.experience}
            className="tpl-exec__section"
            headingClassName="tpl-exec__heading"
          >
            <Collection section="experience" items={resume.experience}>
              {({ item, path, chrome, itemProps }) => (
                <ExecutiveExperienceEntry
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
            className="tpl-exec__section"
            headingClassName="tpl-exec__heading"
          >
            <Collection section="education" items={resume.education}>
              {({ item, path, chrome, itemProps }) => (
                <ExecutiveEducationEntry
                  item={item}
                  path={path}
                  chrome={chrome}
                  itemProps={itemProps}
                />
              )}
            </Collection>
          </DocumentSection>
        )}

        <DescribedEntries
          id="courses"
          heading={resume.section_headings?.courses}
          title={doc.t.sections.courses}
          className="tpl-exec__section"
          headingClassName="tpl-exec__heading"
          items={resume.courses}
          entryClassName="tpl-exec__described"
        />

        <LanguageList
          items={resume.languages}
          heading={resume.section_headings?.languages}
          className="tpl-exec__section"
          headingClassName="tpl-exec__heading"
          rowClassName="tpl-exec__language"
        />

        {resume.certifications.length > 0 && (
          <DocumentSection
            id="certifications"
            heading={resume.section_headings?.certifications}
            title={doc.t.sections.certifications}
            className="tpl-exec__section"
            headingClassName="tpl-exec__heading"
          >
            <div data-block>
              <EditableBulletList
                path="certifications"
                items={resume.certifications}
                placeholder={placeholder('certification')}
              />
            </div>
          </DocumentSection>
        )}

        <DescribedEntries
          id="passions"
          heading={resume.section_headings?.passions}
          title={doc.t.sections.passions}
          className="tpl-exec__section tpl-described--marked"
          headingClassName="tpl-exec__heading"
          items={resume.passions}
          entryClassName="tpl-exec__described"
        />

        {(resume.headline || authoring) && (
          <section className="tpl-exec__section">
            <Heading
              level={2}
              className="tpl-exec__heading"
              data-block
              data-keep-with-next
            >
              {doc.t.panels.personalInformation}
            </Heading>
            {(resume.headline || authoring) && (
              <p className="tpl-exec__prose" data-block>
                {doc.t.labels.title}
                <EditableText
                  path="headline"
                  value={resume.headline ?? ''}
                  placeholder={placeholder('headline')}
                />
              </p>
            )}
          </section>
        )}

        {resume.contact.location && (
          <section className="tpl-exec__section">
            <Heading
              level={2}
              className="tpl-exec__heading"
              data-block
              data-keep-with-next
            >
              {doc.t.panels.locations}
            </Heading>
            <p className="tpl-exec__prose" data-block>
              {resume.contact.location}
            </p>
          </section>
        )}

        {(resume.links.length > 0 || authoring) && (
          <section className="tpl-exec__section">
            <Heading
              level={2}
              className="tpl-exec__heading"
              data-block
              data-keep-with-next
            >
              {doc.t.panels.websites}
            </Heading>
            <ul className="tpl-exec__links" data-block>
              <Collection section="links" items={resume.links} gap={false}>
                {({ item, path, chrome, itemProps, justAdded }) => (
                  <li
                    {...itemProps}
                    className="tpl-exec__link tpl-contact--link"
                  >
                    {chrome}
                    <LinkField item={item} path={path} justAdded={justAdded} />
                  </li>
                )}
              </Collection>
            </ul>
          </section>
        )}

        <CustomSections
          sections={resume.custom_sections}
          sectionClass="tpl-exec__section"
          headingClass="tpl-exec__heading"
          Entry={ExecutiveCustomEntry}
        />
      </div>
    </article>
  );
}
