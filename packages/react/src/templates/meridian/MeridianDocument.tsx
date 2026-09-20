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
import { contactLines } from '../../kit/contact.js';
import { documentStyle } from '../../kit/documentStyle.js';
import { monogram } from '../../kit/monogram.js';
import { isLanguages } from '../skills.js';
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
 * The reference prints two things this résumé cannot hold — a location per
 * experience entry, and languages as a first-class list. Neither is invented
 * here: entry locations are omitted, and Languages is read from the skills group
 * that names them. See #32's `design.md`, decision 1.
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

  const languages = resume.skills.filter(isLanguages);

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

          {(resume.experience.length > 0 || authoring) && (
            <DocumentSection
              id="experience"
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

          {languages.length > 0 && (
            <section className="tpl-mer__section">
              <h2 className="tpl-mer__heading" data-block data-keep-with-next>
                Languages
              </h2>
              <div data-block>
                {languages.map((group) => {
                  const index = resume.skills.indexOf(group);
                  return (
                    <EditableBulletList
                      key={index}
                      path={`skills.${index}.items`}
                      items={group.items}
                    />
                  );
                })}
              </div>
            </section>
          )}

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
          {(resume.skills.length > languages.length || authoring) && (
            <DocumentSection
              id="skills"
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
                  {({ item, path }) =>
                    isLanguages(item) ? null : (
                      <BulletSkillGroup item={item} path={path} />
                    )
                  }
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
