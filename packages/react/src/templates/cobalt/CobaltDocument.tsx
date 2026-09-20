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
  CobaltCustomEntry,
  CobaltEducationEntry,
  CobaltExperienceEntry,
} from './entries.js';
import './cobalt.css';

/**
 * The Cobalt template.
 *
 * Same contract as the three before it: one Craft node for the whole document,
 * structure as plain JSX inside this render (so it is not addressable), and
 * every editable field declared as an `<Element id=…>` linked node carrying its
 * **domain path**. The paths are identical to Harvard's, which is what makes an
 * overlay written under any template apply unchanged under this one.
 *
 * Two things here are this template's own, and both are load-bearing.
 *
 *   - **The rail is written FIRST, because the rail is on the left.** Meridian
 *     writes its main column first and that is also its left column, so "main
 *     first" and "left first" were one instruction there. Here they are not,
 *     and the property that matters is that document order is the page's order:
 *     the extracted text, the printed PDF's text layer, and the order the
 *     keyboard walks the fields are then all the same order by construction.
 *     This rail carries the candidate's DEGREES, so that is not a formality —
 *     see `design.md`, decision 1. `cobalt.spec.tsx` holds this file to it.
 *   - **Nothing on this page is a background.** The crest is a stroked SVG
 *     outline, the hairlines are borders, the bullets are glyphs. That is what
 *     lets the catalog entry promise the document prints complete with the
 *     browser's background graphics disabled — a promise about paper rather
 *     than about `print-color-adjust`, which the other two coloured templates
 *     can only make about a hint. See `design.md`, decision 2.
 *
 * Each column is marked `data-flow`, which is how `PagedSheet` knows to break it
 * by its own height (#45). No pagination attribute here is new: needing none is
 * the evidence that #45's generalisation was the right shape.
 *
 * The reference prints two things this résumé cannot hold — a location on every
 * entry, and languages as a first-class list. Neither is invented: entry
 * locations are omitted. Languages is read from `resume.languages`.
 */

/**
 * The crest: a regular hexagon, flat top and bottom, 107 × 93pt — measured off
 * the reference, where its top edge runs 53pt and its left and right vertices
 * are 107pt apart.
 *
 * A **stroked, unfilled** `<svg>` rather than a `clip-path` ring or a raster.
 * A stroke is foreground, so it prints whether or not the browser paints
 * backgrounds; it is vector, so it is exact at any `--c-scale`; and it carries
 * no text, so it changes nothing a parser extracts. The polygon is inset by
 * half the stroke width, because a stroke is centred on its path and the outer
 * half would otherwise be clipped by the viewBox.
 *
 * `aria-hidden` with no accessible name: the initials over it are real HTML
 * text, and the crest itself says nothing.
 */
const CREST_POLYGON =
  '27.18,0.92 79.82,0.92 106.13,46.5 79.82,92.08 27.18,92.08 0.87,46.5';

export interface CobaltDocumentProps {
  resume: ResumeObject;
}

export function CobaltDocument({ resume }: CobaltDocumentProps) {
  const style = useDocumentStyle();
  /*
   * A section with nothing in it is omitted from the DOCUMENT and offered in
   * the EDITOR, because a candidate cannot add their first role to a section
   * that is not drawn. The read-only page is unchanged: with no authoring
   * context this is false and an empty section stays absent.
   */
  const authoring = useAuthoring() !== null;

  // The reference stacks email, phone, location, in that order.
  const contact = contactLines(
    resume.contact,
    ['email', 'phone', 'location'],
    authoring,
  );

  return (
    <article
      className="tpl-cob"
      style={documentStyle('c', style)}
      aria-label="Resume document"
    >
      {/* ── Header: crest, name, contact ─────────────────────────────────── */}
      <header className="tpl-cob__head" data-block>
        <div className="tpl-cob__crest">
          <svg
            className="tpl-cob__crest-shape"
            viewBox="0 0 107 93"
            aria-hidden="true"
            focusable="false"
          >
            <polygon
              points={CREST_POLYGON}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </svg>
          {/* Real HTML text over the outline, not `<text>` inside it — so the
              initials are selectable and extract with the rest of the page. */}
          <p className="tpl-cob__initials" aria-hidden="true">
            {monogram(resume.name)}
          </p>
        </div>

        <h1 className="tpl-cob__name">
          <EditableText path="name" value={resume.name} />
        </h1>

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

      <div className="tpl-cob__body">
        {/*
         * The rail, and it is written FIRST because it is drawn first. Its
         * position here is the template's ATS guarantee, so it is not an
         * ordering that may be swapped for a visual reason later.
         */}
        <div className="tpl-cob__rail" data-flow>
          {(resume.summary || authoring) && (
            <DocumentSection
              id="summary"
              heading={resume.section_headings?.summary}
              title="Professional Summary"
              className="tpl-cob__section"
              headingClassName="tpl-cob__heading"
            >
              <p className="tpl-cob__prose" data-block>
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
            className="tpl-cob__section tpl-described--marked"
            headingClassName="tpl-cob__heading"
            entryClassName="tpl-cob__described"
          />
          {(resume.skills.length > 0 || authoring) && (
            <DocumentSection
              id="skills"
              heading={resume.section_headings?.skills}
              title="Technical Skills"
              className="tpl-cob__section"
              headingClassName="tpl-cob__heading"
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

          {(resume.education.length > 0 || authoring) && (
            <DocumentSection
              id="education"
              heading={resume.section_headings?.education}
              title="Education"
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
            title="Courses"
            items={resume.courses}
            className="tpl-cob__section"
            headingClassName="tpl-cob__heading"
            entryClassName="tpl-cob__described"
          />
          {resume.certifications.length > 0 && (
            <DocumentSection
              id="certifications"
              heading={resume.section_headings?.certifications}
              title="Certifications"
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
            title="Passions"
            items={resume.passions}
            className="tpl-cob__section tpl-described--marked"
            headingClassName="tpl-cob__heading"
            entryClassName="tpl-cob__described"
          />
        </div>

        {/* ── The wide column ──────────────────────────────────────────── */}
        <div className="tpl-cob__main" data-flow>
          {(resume.experience.length > 0 || authoring) && (
            <DocumentSection
              id="experience"
              heading={resume.section_headings?.experience}
              title="Experience"
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
              <h2 className="tpl-cob__heading" data-block data-keep-with-next>
                Personal Information
              </h2>
              <p className="tpl-cob__prose" data-block>
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
            <section className="tpl-cob__section">
              <h2 className="tpl-cob__heading" data-block data-keep-with-next>
                Locations
              </h2>
              <p className="tpl-cob__prose" data-block>
                {/* The same field the header prints: one location, two places
                    it appears, never two values that can disagree. */}
                {resume.contact.location}
              </p>
            </section>
          )}

          {(resume.links.length > 0 || authoring) && (
            <section className="tpl-cob__section">
              <h2 className="tpl-cob__heading" data-block data-keep-with-next>
                Websites, Portfolios, Profiles
              </h2>
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
          {/*
           * The candidate's own sections, inside the column that carries the
           * résumé — not after the body. A section outside it inherits none of
           * the page's side padding, so it ran to the paper's edge and its
           * rail fell outside the flow, where nothing can click it.
           */}
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
