import type { CSSProperties } from 'react';
import { Element, useNode } from '@craftjs/core';
import {
  DENSITIES,
  DOCUMENT_FONTS,
  INK_COLORS,
  type DocumentStyle,
  type ResumeObject,
} from '@cvgs/core';
import { EditableText } from '../../nodes/EditableText.js';
import { EditableBulletList } from '../../nodes/EditableBulletList.js';
import { CustomSections } from '../../nodes/CustomSections.js';
import { LOCKED_RULES } from '../../nodes/locked.js';
import { useDocumentStyle } from '../../presentation-context.js';
import { isLanguages } from '../skills.js';
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
 * locations are omitted, and Languages is read from the skills group that names
 * them.
 */

/**
 * The crest's initials, derived from the name rather than stored.
 *
 * Not separately editable, for the reason Executive and Meridian both give: a
 * monogram that can disagree with the name beside it is a defect waiting to be
 * shipped.
 */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  const first = parts[0][0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? '') : '';
  return (first + last).toUpperCase();
}

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

/**
 * The document style reaches the page as custom properties on the template
 * root, which every rule in `cobalt.css` already reads.
 *
 * `--c-font` is the BODY face only. The display face is the template's own
 * serif and is not written here, because the serif-over-sans pairing is the
 * design rather than a default — see `design.md`, decision 4.
 *
 * `accent` and `density` are resolved here from the start rather than
 * retrofitted: `document-styling` (#36) requires a template to resolve them
 * through its own stylesheet, and because #36 is ordered first it can only name
 * the templates that existed when it was written. Absent means the template's
 * own values, which is what every stored document carries today.
 */
function documentStyle(style: DocumentStyle | undefined): CSSProperties {
  if (!style) return {};
  return {
    '--c-font': DOCUMENT_FONTS[style.font].stack,
    '--c-ink': INK_COLORS[style.ink].hex,
    '--c-scale': String(style.scale),
    ...(style.accent ? { '--c-accent': INK_COLORS[style.accent].hex } : {}),
    ...(style.density
      ? { '--c-density': String(DENSITIES[style.density].factor) }
      : {}),
  } as CSSProperties;
}

export interface CobaltDocumentProps {
  resume: ResumeObject;
}

export function CobaltDocument({ resume }: CobaltDocumentProps) {
  const {
    connectors: { connect },
  } = useNode();
  const style = useDocumentStyle();

  const languages = resume.skills.filter(isLanguages);
  const technical = resume.skills
    .map((group, index) => ({ group, index }))
    .filter(({ group }) => !isLanguages(group));

  // The reference stacks email, phone, location, in that order.
  const contact = (
    [
      resume.contact.email && ('contact.email' as const),
      resume.contact.phone && ('contact.phone' as const),
      resume.contact.location && ('contact.location' as const),
    ] as const
  ).filter(Boolean) as (
    'contact.email' | 'contact.phone' | 'contact.location'
  )[];

  return (
    <article
      ref={(ref) => {
        if (ref) connect(ref);
      }}
      className="tpl-cob"
      style={documentStyle(style)}
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
            {initials(resume.name)}
          </p>
        </div>

        <h1 className="tpl-cob__name">
          <Element
            id="name"
            is={EditableText}
            path="name"
            value={resume.name}
          />
        </h1>

        {contact.length > 0 && (
          <div className="tpl-cob__contact">
            {contact.map((path) => (
              <p key={path} className="tpl-cob__contact-item">
                <Element
                  id={path}
                  is={EditableText}
                  path={path}
                  value={String(
                    resume.contact[
                      path.split('.')[1] as keyof typeof resume.contact
                    ] ?? '',
                  )}
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
          {resume.summary && (
            <section className="tpl-cob__section">
              <h2 className="tpl-cob__heading" data-block data-keep-with-next>
                Professional Summary
              </h2>
              <p className="tpl-cob__prose" data-block>
                <Element
                  id="summary"
                  is={EditableText}
                  path="summary"
                  value={resume.summary}
                  multiline
                />
              </p>
            </section>
          )}

          {technical.length > 0 && (
            <section className="tpl-cob__section">
              <h2 className="tpl-cob__heading" data-block data-keep-with-next>
                Technical Skills
              </h2>
              {/* Split: a keyword rail is a list, and it breaks between two
                  skills. As one block it is taller than the paper. */}
              <div data-block data-split>
                {technical.map(({ group, index }) => (
                  <Element
                    key={index}
                    id={`skills.${index}.items`}
                    is={EditableBulletList}
                    path={`skills.${index}.items`}
                    items={group.items}
                  />
                ))}
              </div>
            </section>
          )}

          {resume.education.length > 0 && (
            <section className="tpl-cob__section">
              <h2 className="tpl-cob__heading" data-block data-keep-with-next>
                Education
              </h2>
              {resume.education.map((school, i) => (
                <article key={i} className="tpl-cob__entry" data-block>
                  <p className="tpl-cob__entry-lead">
                    <Element
                      id={`education.${i}.degree`}
                      is={EditableText}
                      path={`education.${i}.degree`}
                      value={school.degree ?? ''}
                      placeholder="Degree"
                    />
                  </p>
                  {/* The reference prints the school's city on its own line.
                      `EducationSchema` has no such field, so the school stands
                      alone rather than a place being invented for it. */}
                  <p className="tpl-cob__entry-org">
                    <Element
                      id={`education.${i}.school`}
                      is={EditableText}
                      path={`education.${i}.school`}
                      value={school.school}
                    />
                  </p>
                  {(school.field || school.end) && (
                    <p className="tpl-cob__entry-when">
                      {school.field && (
                        <Element
                          id={`education.${i}.field`}
                          is={EditableText}
                          path={`education.${i}.field`}
                          value={school.field}
                        />
                      )}
                      {school.field && school.end && ', '}
                      {school.end && (
                        <Element
                          id={`education.${i}.end`}
                          is={EditableText}
                          path={`education.${i}.end`}
                          value={school.end}
                        />
                      )}
                    </p>
                  )}
                </article>
              ))}
            </section>
          )}

          {resume.certifications.length > 0 && (
            <section className="tpl-cob__section">
              <h2 className="tpl-cob__heading" data-block data-keep-with-next>
                Certifications
              </h2>
              <div data-block data-split>
                <Element
                  id="certifications"
                  is={EditableBulletList}
                  path="certifications"
                  items={resume.certifications}
                />
              </div>
            </section>
          )}
        </div>

        {/* ── The wide column ──────────────────────────────────────────── */}
        <div className="tpl-cob__main" data-flow>
          {resume.experience.length > 0 && (
            <section className="tpl-cob__section">
              <h2 className="tpl-cob__heading" data-block data-keep-with-next>
                Experience
              </h2>
              {resume.experience.map((role, i) => (
                <article key={i} className="tpl-cob__entry" data-block>
                  <p className="tpl-cob__entry-lead">
                    <Element
                      id={`experience.${i}.company`}
                      is={EditableText}
                      path={`experience.${i}.company`}
                      value={role.company}
                    />
                  </p>
                  {/*
                   * The reference sets the role, a rule, the entry's location,
                   * then the dates after a constant 25pt gap — measured across
                   * every entry, and NOT flush to the right margin. The
                   * location has no field, so what is left is the role and the
                   * dates, still set apart by that gap and still one wrapping
                   * run. See `design.md`, decision 6.
                   */}
                  <p className="tpl-cob__entry-meta">
                    <em className="tpl-cob__role">
                      <Element
                        id={`experience.${i}.title`}
                        is={EditableText}
                        path={`experience.${i}.title`}
                        value={role.title}
                      />
                    </em>
                    <span className="tpl-cob__dates">
                      <Element
                        id={`experience.${i}.start`}
                        is={EditableText}
                        path={`experience.${i}.start`}
                        value={role.start}
                      />
                      {' - '}
                      <Element
                        id={`experience.${i}.end`}
                        is={EditableText}
                        path={`experience.${i}.end`}
                        value={role.end}
                      />
                    </span>
                  </p>
                  <Element
                    id={`experience.${i}.bullets`}
                    is={EditableBulletList}
                    path={`experience.${i}.bullets`}
                    items={role.bullets}
                  />
                </article>
              ))}
            </section>
          )}

          {languages.length > 0 && (
            <section className="tpl-cob__section">
              <h2 className="tpl-cob__heading" data-block data-keep-with-next>
                Languages
              </h2>
              <div data-block>
                {languages.map((group) => {
                  const index = resume.skills.indexOf(group);
                  return (
                    <Element
                      key={index}
                      id={`skills.${index}.items`}
                      is={EditableBulletList}
                      path={`skills.${index}.items`}
                      items={group.items}
                    />
                  );
                })}
              </div>
            </section>
          )}

          {resume.headline && (
            <section className="tpl-cob__section">
              <h2 className="tpl-cob__heading" data-block data-keep-with-next>
                Personal Information
              </h2>
              <p className="tpl-cob__prose" data-block>
                {'Title: '}
                <Element
                  id="headline"
                  is={EditableText}
                  path="headline"
                  value={resume.headline}
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

          {resume.links.length > 0 && (
            <section className="tpl-cob__section">
              <h2 className="tpl-cob__heading" data-block data-keep-with-next>
                Websites, Portfolios, Profiles
              </h2>
              <ul className="tpl-cob__links" data-block data-split>
                {resume.links.map((link, i) => (
                  <li key={i} className="tpl-cob__link">
                    <Element
                      id={`links.${i}.url`}
                      is={EditableText}
                      path={`links.${i}.url`}
                      value={link.url}
                      href={link.url}
                    />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
      {/*
       * The candidate's own sections, after every section this template
       * knows. Heading in the template's own style; entries in the shared
       * neutral layout — see `CustomSections.tsx`.
       */}
      <CustomSections
        sections={resume.custom_sections}
        sectionClass="tpl-cob__section"
        headingClass="tpl-cob__heading"
      />
    </article>
  );
}

CobaltDocument.craft = {
  displayName: 'CobaltDocument',
  rules: LOCKED_RULES,
};
