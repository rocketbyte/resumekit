import { PLACEHOLDERS, type ResumeObject } from '@cvgs/core';
import { EditableText } from '../../nodes/EditableText.js';
import { EditableBulletList } from '../../nodes/EditableBulletList.js';
import { CustomSections } from '../../nodes/CustomSections.js';
import { Collection } from '../../collections/Collection.js';
import { LinkField } from '../../nodes/LinkField.js';
import { useAuthoring } from '../../collections/authoring-context.js';
import { useDocumentStyle } from '../../presentation-context.js';
import { BulletSkillGroup } from '../../kit/BulletSkillGroup.js';
import { DocumentSection } from '../../kit/DocumentSection.js';
import { DescribedEntries } from '../../kit/DescribedEntries.js';
import { LanguageList } from '../../kit/LanguageList.js';
import { contactLines } from '../../kit/contact.js';
import { documentStyle } from '../../kit/documentStyle.js';
import { monogram } from '../../kit/monogram.js';
import {
  MeridianCustomEntry,
  MeridianEducationEntry,
  MeridianExperienceEntry,
} from './entries.js';
import './meridian.css';

/**
 * The Meridian template.
 *
 * Same contract as Harvard and Executive: one Craft node for the whole document,
 * structure as plain JSX inside this render (so it is not addressable), and
 * every editable field declared as an `<Element id=…>` linked node carrying its
 * **domain path**. The paths are identical to the other two, which is what makes
 * an overlay written under any of them apply unchanged under this one.
 *
 * What is new here is the **shape**: a body of two structural columns rather
 * than one. Two consequences, and both are load-bearing.
 *
 *   - The main column is written **first**, so reading the document in order
 *     yields the résumé in full and then the rail. That is the ONLY ATS property
 *     this layout can honestly offer, so it is the one the catalog entry states
 *     and the one `meridian.spec.tsx` holds this file to.
 *   - Each column is marked `data-flow`, which is how `PagedSheet` knows to
 *     break it by its own height. Without it a push in the main column would
 *     displace every measured position in the sidebar.
 *
 * The reference prints a location per experience entry, which this résumé
 * cannot hold, so entry locations are omitted rather than invented. Languages
 * WAS the other such gap; `resume.languages` closed it, and the section is now
 * a first-class list with a level per language. See #32's `design.md`, decision 1.
 */

export interface MeridianDocumentProps {
  resume: ResumeObject;
}

export function MeridianDocument({ resume }: MeridianDocumentProps) {
  const style = useDocumentStyle();
  /*
   * A section with nothing in it is omitted from the DOCUMENT and offered in
   * the EDITOR, because a candidate cannot add their first role to a section
   * that is not drawn. The read-only page is unchanged: with no authoring
   * context this is false and an empty section stays absent.
   */
  const authoring = useAuthoring() !== null;

  const contact = contactLines(
    resume.contact,
    ['location', 'phone', 'email'],
    authoring,
  );

  return (
    <article
      className="tpl-mer"
      style={documentStyle('m', style)}
      aria-label="Resume document"
    >
      {/* ── Crown band ───────────────────────────────────────────────────── */}
      <header className="tpl-mer__crown" data-block>
        {/* The rules are drawn either side of the monogram by CSS, so a name
            with no initials leaves no orphaned pair of lines. */}
        <p className="tpl-mer__monogram" aria-hidden="true">
          <span>{monogram(resume.name)}</span>
        </p>

        <h1 className="tpl-mer__name">
          <EditableText path="name" value={resume.name} />
        </h1>
      </header>

      {/* ── Contact rule ─────────────────────────────────────────────────── */}
      {contact.length > 0 && (
        <p className="tpl-mer__contact" data-block>
          {contact.map(({ path, value, placeholder }) => (
            <span key={path} className="tpl-mer__contact-item">
              <EditableText
                path={path}
                value={value}
                placeholder={placeholder}
              />
            </span>
          ))}
        </p>
      )}

      <div className="tpl-mer__body">
        {/*
         * The résumé, first in the document. Its position here is the template's
         * one ATS guarantee, so it is not an ordering that may be swapped for a
         * visual reason later.
         */}
        <div className="tpl-mer__main" data-flow>
          {(resume.summary || authoring) && (
            <DocumentSection
              id="summary"
              heading={resume.section_headings?.summary}
              title="Professional Summary"
              className="tpl-mer__section"
              headingClassName="tpl-mer__heading"
            >
              <p className="tpl-mer__prose" data-block>
                <EditableText
                  path="summary"
                  value={resume.summary ?? ''}
                  placeholder={PLACEHOLDERS['summary']}
                  multiline
                />
              </p>
            </DocumentSection>
          )}

          <DescribedEntries
            id="achievements"
            heading={resume.section_headings?.achievements}
            title="Achievements"
            items={resume.achievements}
            className="tpl-mer__section tpl-described--marked"
            headingClassName="tpl-mer__heading"
            entryClassName="tpl-mer__described"
          />
          {(resume.experience.length > 0 || authoring) && (
            <DocumentSection
              id="experience"
              heading={resume.section_headings?.experience}
              title="Experience"
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
              title="Education"
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
              title="Certifications"
              className="tpl-mer__section"
              headingClassName="tpl-mer__heading"
            >
              <div data-block>
                <EditableBulletList
                  path="certifications"
                  items={resume.certifications}
                />
              </div>
            </DocumentSection>
          )}

          <DescribedEntries
            id="courses"
            heading={resume.section_headings?.courses}
            title="Courses"
            items={resume.courses}
            className="tpl-mer__section"
            headingClassName="tpl-mer__heading"
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
            title="Passions"
            items={resume.passions}
            className="tpl-mer__section tpl-described--marked"
            headingClassName="tpl-mer__heading"
            entryClassName="tpl-mer__described"
          />

          {(resume.headline || authoring) && (
            <section className="tpl-mer__section">
              <h2 className="tpl-mer__heading" data-block data-keep-with-next>
                Personal Information
              </h2>
              <p className="tpl-mer__prose" data-block>
                {'Title: '}
                <EditableText
                  path="headline"
                  value={resume.headline ?? ''}
                  placeholder={PLACEHOLDERS['headline']}
                />
              </p>
            </section>
          )}

          {resume.contact.location && (
            <section className="tpl-mer__section">
              <h2 className="tpl-mer__heading" data-block data-keep-with-next>
                Locations
              </h2>
              <p className="tpl-mer__prose" data-block>
                {/* The same field the contact rule shows: one location, two
                    places it is printed, never two values that can disagree. */}
                {resume.contact.location}
              </p>
            </section>
          )}
          {/*
           * The candidate's own sections, inside the column that carries the
           * résumé — not after the body. A section outside it inherits none of
           * the page's side padding, so it ran to the paper's edge and its
           * rail fell outside the flow, where nothing can click it.
           */}
          <CustomSections
            sections={resume.custom_sections}
            sectionClass="tpl-mer__section"
            headingClass="tpl-mer__heading"
            Entry={MeridianCustomEntry}
          />
        </div>

        {/* ── The rail ───────────────────────────────────────────────────── */}
        <aside className="tpl-mer__aside" data-flow>
          {(resume.skills.length > 0 || authoring) && (
            <DocumentSection
              id="skills"
              heading={resume.section_headings?.skills}
              title="Technical Skills"
              className="tpl-mer__section"
              headingClassName="tpl-mer__heading tpl-mer__heading--marked"
            >
              {/* Split: a keyword rail is a list, and it breaks between two
                  skills. As one block it is taller than the paper. */}
              <div data-block data-split>
                {/* "skill", because this template prints no category: what a candidate
                    adds here is a skill, and the group it lands in is storage. */}
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
              <h2
                className="tpl-mer__heading tpl-mer__heading--marked"
                data-block
                data-keep-with-next
              >
                Websites, Portfolios, Profiles
              </h2>
              <ul className="tpl-mer__links" data-block data-split>
                <Collection section="links" items={resume.links} gap={false}>
                  {({ item, path, chrome, itemProps, justAdded }) => (
                    <li {...itemProps} className="tpl-mer__link">
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
