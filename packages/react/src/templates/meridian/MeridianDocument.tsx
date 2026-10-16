/*
 * GENERATED from meridian.template.yaml by @resumekit/react's template compiler.
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
  MeridianCustomEntry,
  MeridianEducationEntry,
  MeridianExperienceEntry,
} from './entries.js';
import '../../kit/layout.css';
import './meridian.css';
import { useEditorText, useDocumentText } from '../../i18n/index.js';

export interface MeridianDocumentProps {
  resume: ResumeObject;
}

export function MeridianDocument({ resume }: MeridianDocumentProps) {
  const { placeholder } = useEditorText();
  const doc = useDocumentText();
  const style = useDocumentStyle();
  const authoring = useAuthoring() !== null;

  const contact = useContactLines(
    resume.contact,
    ['location', 'phone', 'email'],
    authoring,
  );

  return (
    <article
      className="tpl-mer"
      style={documentStyle('m', style)}
      aria-label={doc.t.resume}
      lang={doc.locale}
    >
      <header className="tpl-mer__crown" data-block>
        <p className="tpl-mer__monogram" aria-hidden="true">
          <span>{monogram(resume.name)}</span>
        </p>

        <Heading level={1} className="tpl-mer__name">
          <EditableText path="name" value={resume.name} />
        </Heading>
      </header>

      {contact.length > 0 && (
        <p className="tpl-mer__contact" data-block>
          {contact.map(({ field, path, value, placeholder }) => (
            <span
              key={path}
              className={`tpl-mer__contact-item tpl-contact--${field}`}
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

      <div className="tpl-mer__body" data-layout="row">
        <div className="tpl-mer__main" data-flow>
          {(resume.summary || authoring) && (
            <DocumentSection
              id="summary"
              heading={resume.section_headings?.summary}
              title={doc.t.sections.professionalSummary}
              className="tpl-mer__section"
              headingClassName="tpl-mer__heading"
            >
              <p className="tpl-mer__prose" data-block>
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
            className="tpl-mer__section tpl-described--marked"
            headingClassName="tpl-mer__heading"
            items={resume.achievements}
            entryClassName="tpl-mer__described"
          />

          {(resume.experience.length > 0 || authoring) && (
            <DocumentSection
              id="experience"
              heading={resume.section_headings?.experience}
              title={doc.t.sections.experience}
              className="tpl-mer__section"
              headingClassName="tpl-mer__heading"
            >
              <Collection section="experience" items={resume.experience}>
                {({ item, path, chrome, itemProps }) => (
                  <MeridianExperienceEntry
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
              className="tpl-mer__section"
              headingClassName="tpl-mer__heading"
            >
              <Collection section="education" items={resume.education}>
                {({ item, path, chrome, itemProps }) => (
                  <MeridianEducationEntry
                    item={item}
                    path={path}
                    chrome={chrome}
                    itemProps={itemProps}
                  />
                )}
              </Collection>
            </DocumentSection>
          )}

          {resume.certifications.length > 0 && (
            <DocumentSection
              id="certifications"
              heading={resume.section_headings?.certifications}
              title={doc.t.sections.certifications}
              className="tpl-mer__section"
              headingClassName="tpl-mer__heading"
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
            id="courses"
            heading={resume.section_headings?.courses}
            title={doc.t.sections.courses}
            className="tpl-mer__section"
            headingClassName="tpl-mer__heading"
            items={resume.courses}
            entryClassName="tpl-mer__described"
          />

          <LanguageList
            items={resume.languages}
            heading={resume.section_headings?.languages}
            className="tpl-mer__section"
            headingClassName="tpl-mer__heading"
            rowClassName="tpl-mer__language"
          />

          <DescribedEntries
            id="passions"
            heading={resume.section_headings?.passions}
            title={doc.t.sections.passions}
            className="tpl-mer__section tpl-described--marked"
            headingClassName="tpl-mer__heading"
            items={resume.passions}
            entryClassName="tpl-mer__described"
          />

          {(resume.headline || authoring) && (
            <section className="tpl-mer__section">
              <Heading
                level={2}
                className="tpl-mer__heading"
                data-block
                data-keep-with-next
              >
                {doc.t.panels.personalInformation}
              </Heading>
              {(resume.headline || authoring) && (
                <p className="tpl-mer__prose" data-block>
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
            <section className="tpl-mer__section">
              <Heading
                level={2}
                className="tpl-mer__heading"
                data-block
                data-keep-with-next
              >
                {doc.t.panels.locations}
              </Heading>
              <p className="tpl-mer__prose" data-block>
                {resume.contact.location}
              </p>
            </section>
          )}

          <CustomSections
            sections={resume.custom_sections}
            sectionClass="tpl-mer__section"
            headingClass="tpl-mer__heading"
            Entry={MeridianCustomEntry}
          />
        </div>

        <aside className="tpl-mer__aside" data-flow>
          {(resume.skills.length > 0 || authoring) && (
            <DocumentSection
              id="skills"
              heading={resume.section_headings?.skills}
              title={doc.t.sections.technicalSkills}
              className="tpl-mer__section"
              headingClassName="tpl-mer__heading tpl-mer__heading--marked"
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

          {(resume.links.length > 0 || authoring) && (
            <section className="tpl-mer__section">
              <Heading
                level={2}
                className="tpl-mer__heading tpl-mer__heading--marked"
                data-block
                data-keep-with-next
              >
                {doc.t.panels.websites}
              </Heading>
              <ul className="tpl-mer__links" data-block data-split>
                <Collection section="links" items={resume.links} gap={false}>
                  {({ item, path, chrome, itemProps, justAdded }) => (
                    <li
                      {...itemProps}
                      className="tpl-mer__link tpl-contact--link"
                    >
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
        </aside>
      </div>
    </article>
  );
}
