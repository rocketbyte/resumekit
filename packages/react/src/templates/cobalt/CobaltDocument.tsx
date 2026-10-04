/*
 * GENERATED from cobalt.template.yaml by @cvgs/resume-templates' template compiler.
 * Do not edit: change the description and run the package's
 * `generate-templates` script. `check-templates` fails when they disagree.
 */
import type { ResumeObject } from '@cvgs/core';
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
import { useContactLines } from '../../kit/contact.js';
import { documentStyle } from '../../kit/documentStyle.js';
import { Heading } from '../../kit/Heading.js';
import { LinkField } from '../../nodes/LinkField.js';
import {
  CobaltCustomEntry,
  CobaltEducationEntry,
  CobaltExperienceEntry,
} from './entries.js';
import { CobaltCrest } from './crest.js';
import '../../kit/layout.css';
import './cobalt.css';
import { useEditorText, useDocumentText } from '../../i18n/index.js';

export interface CobaltDocumentProps {
  resume: ResumeObject;
}

export function CobaltDocument({ resume }: CobaltDocumentProps) {
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
      className="tpl-cob"
      style={documentStyle('c', style)}
      aria-label={doc.t.resume}
      lang={doc.locale}
    >
      <header className="tpl-cob__head" data-block>
        <CobaltCrest resume={resume} />

        <Heading level={1} className="tpl-cob__name">
          <EditableText path="name" value={resume.name} />
        </Heading>

        {contact.length > 0 && (
          <div className="tpl-cob__contact">
            {contact.map(({ path, value, placeholder }) => (
              <p key={path} className="tpl-cob__contact-item">
                <EditableText
                  path={path}
                  value={value}
                  placeholder={placeholder}
                />
              </p>
            ))}
          </div>
        )}
      </header>

      <div className="tpl-cob__body" data-layout="row">
        <div className="tpl-cob__rail" data-flow>
          {(resume.summary || authoring) && (
            <DocumentSection
              id="summary"
              heading={resume.section_headings?.summary}
              title={doc.t.sections.professionalSummary}
              className="tpl-cob__section"
              headingClassName="tpl-cob__heading"
            >
              <p className="tpl-cob__prose" data-block>
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
            className="tpl-cob__section tpl-described--marked"
            headingClassName="tpl-cob__heading"
            items={resume.achievements}
            entryClassName="tpl-cob__described"
          />

          {(resume.skills.length > 0 || authoring) && (
            <DocumentSection
              id="skills"
              heading={resume.section_headings?.skills}
              title={doc.t.sections.technicalSkills}
              className="tpl-cob__section"
              headingClassName="tpl-cob__heading"
            >
              <div data-block data-split>
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

          {(resume.education.length > 0 || authoring) && (
            <DocumentSection
              id="education"
              heading={resume.section_headings?.education}
              title={doc.t.sections.education}
              className="tpl-cob__section"
              headingClassName="tpl-cob__heading"
            >
              <Collection section="education" items={resume.education}>
                {({ item, path, chrome, itemProps }) => (
                  <CobaltEducationEntry
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
            className="tpl-cob__section"
            headingClassName="tpl-cob__heading"
            items={resume.courses}
            entryClassName="tpl-cob__described"
          />

          {resume.certifications.length > 0 && (
            <DocumentSection
              id="certifications"
              heading={resume.section_headings?.certifications}
              title={doc.t.sections.certifications}
              className="tpl-cob__section"
              headingClassName="tpl-cob__heading"
            >
              <div data-block data-split>
                <EditableBulletList
                  path="certifications"
                  items={resume.certifications}
                />
              </div>
            </DocumentSection>
          )}

          <DescribedEntries
            id="passions"
            heading={resume.section_headings?.passions}
            title={doc.t.sections.passions}
            className="tpl-cob__section tpl-described--marked"
            headingClassName="tpl-cob__heading"
            items={resume.passions}
            entryClassName="tpl-cob__described"
          />
        </div>

        <div className="tpl-cob__main" data-flow>
          {(resume.experience.length > 0 || authoring) && (
            <DocumentSection
              id="experience"
              heading={resume.section_headings?.experience}
              title={doc.t.sections.experience}
              className="tpl-cob__section"
              headingClassName="tpl-cob__heading"
            >
              <Collection section="experience" items={resume.experience}>
                {({ item, path, chrome, itemProps }) => (
                  <CobaltExperienceEntry
                    item={item}
                    path={path}
                    chrome={chrome}
                    itemProps={itemProps}
                  />
                )}
              </Collection>
            </DocumentSection>
          )}

          <LanguageList
            items={resume.languages}
            heading={resume.section_headings?.languages}
            className="tpl-cob__section"
            headingClassName="tpl-cob__heading"
            rowClassName="tpl-cob__language"
          />

          {(resume.headline || authoring) && (
            <section className="tpl-cob__section">
              <Heading
                level={2}
                className="tpl-cob__heading"
                data-block
                data-keep-with-next
              >
                {doc.t.panels.personalInformation}
              </Heading>
              {(resume.headline || authoring) && (
                <p className="tpl-cob__prose" data-block>
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
            <section className="tpl-cob__section">
              <Heading
                level={2}
                className="tpl-cob__heading"
                data-block
                data-keep-with-next
              >
                {doc.t.panels.locations}
              </Heading>
              <p className="tpl-cob__prose" data-block>
                {resume.contact.location}
              </p>
            </section>
          )}

          {(resume.links.length > 0 || authoring) && (
            <section className="tpl-cob__section">
              <Heading
                level={2}
                className="tpl-cob__heading"
                data-block
                data-keep-with-next
              >
                {doc.t.panels.websites}
              </Heading>
              <ul className="tpl-cob__links" data-block data-split>
                <Collection section="links" items={resume.links} gap={false}>
                  {({ item, path, chrome, itemProps, justAdded }) => (
                    <li {...itemProps} className="tpl-cob__link">
                      {chrome}
                      <LinkField
                        item={item}
                        path={path}
                        justAdded={justAdded}
                      />
                    </li>
                  )}
                </Collection>
              </ul>
            </section>
          )}

          <CustomSections
            sections={resume.custom_sections}
            sectionClass="tpl-cob__section"
            headingClass="tpl-cob__heading"
            Entry={CobaltCustomEntry}
          />
        </div>
      </div>
    </article>
  );
}
