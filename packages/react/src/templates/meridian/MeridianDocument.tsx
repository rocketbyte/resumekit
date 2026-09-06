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
import { Collection } from '../../collections/Collection.js';
import { LinkField } from '../../nodes/LinkField.js';
import { useAuthoring } from '../../collections/authoring-context.js';
import {
  MeridianCustomEntry,
  MeridianEducationEntry,
  MeridianExperienceEntry,
} from './entries.js';
import { LOCKED_RULES } from '../../nodes/locked.js';
import { useDocumentStyle } from '../../presentation-context.js';
import { isLanguages } from '../skills.js';
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

/**
 * The monogram, derived from the name rather than stored.
 *
 * Not separately editable, for the reason Executive gives: a monogram that can
 * disagree with the name printed below it is a defect waiting to be shipped.
 */
function monogram(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  const first = parts[0][0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? '') : '';
  return (first + last).toUpperCase();
}

/**
 * The document style reaches the page as three custom properties on the template
 * root, which every rule in `meridian.css` already reads.
 *
 * `--m-font` is the BODY face only. The display face is the template's own serif
 * and is not written here, because the serif-over-sans pairing is the design
 * rather than a default — see `design.md`, decision 4.
 */
function documentStyle(style: DocumentStyle | undefined): CSSProperties {
  if (!style) return {};
  return {
    '--m-font': DOCUMENT_FONTS[style.font].stack,
    '--m-ink': INK_COLORS[style.ink].hex,
    '--m-scale': String(style.scale),
    /*
     * Absent means the template's own — `document-styling` (#36) requires a
     * document that sets neither to render exactly as the template defines it,
     * so these are written only when the candidate has chosen.
     */
    ...(style.accent ? { '--m-accent': INK_COLORS[style.accent].hex } : {}),
    ...(style.density
      ? { '--m-density': String(DENSITIES[style.density].factor) }
      : {}),
  } as CSSProperties;
}

export interface MeridianDocumentProps {
  resume: ResumeObject;
}

export function MeridianDocument({ resume }: MeridianDocumentProps) {
  const {
    connectors: { connect },
  } = useNode();
  const style = useDocumentStyle();
  /*
   * A section with nothing in it is omitted from the DOCUMENT and offered in
   * the EDITOR, because a candidate cannot add their first role to a section
   * that is not drawn. The read-only page is unchanged: with no authoring
   * context this is false and an empty section stays absent.
   */
  const authoring = useAuthoring() !== null;

  const languages = resume.skills.filter(isLanguages);
  const technical = resume.skills
    .map((group, index) => ({ group, index }))
    .filter(({ group }) => !isLanguages(group));

  const contact = (
    [
      resume.contact.location && ('contact.location' as const),
      resume.contact.phone && ('contact.phone' as const),
      resume.contact.email && ('contact.email' as const),
    ] as const
  ).filter(Boolean) as (
    'contact.location' | 'contact.phone' | 'contact.email'
  )[];

  return (
    <article
      ref={(ref) => {
        if (ref) connect(ref);
      }}
      className="tpl-mer"
      style={documentStyle(style)}
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
          <Element
            id="name"
            is={EditableText}
            path="name"
            value={resume.name}
          />
        </h1>
      </header>

      {/* ── Contact rule ─────────────────────────────────────────────────── */}
      {contact.length > 0 && (
        <p className="tpl-mer__contact" data-block>
          {contact.map((path) => (
            <span key={path} className="tpl-mer__contact-item">
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
          {resume.summary && (
            <section className="tpl-mer__section">
              <h2 className="tpl-mer__heading" data-block data-keep-with-next>
                Professional Summary
              </h2>
              <p className="tpl-mer__prose" data-block>
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

          {(resume.experience.length > 0 || authoring) && (
            <section className="tpl-mer__section">
              <h2 className="tpl-mer__heading" data-block data-keep-with-next>
                Experience
              </h2>
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
            </section>
          )}

          {(resume.education.length > 0 || authoring) && (
            <section className="tpl-mer__section">
              <h2 className="tpl-mer__heading" data-block data-keep-with-next>
                Education
              </h2>
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
            </section>
          )}

          {resume.certifications.length > 0 && (
            <section className="tpl-mer__section">
              <h2 className="tpl-mer__heading" data-block data-keep-with-next>
                Certifications
              </h2>
              <div data-block>
                <Element
                  id="certifications"
                  is={EditableBulletList}
                  path="certifications"
                  items={resume.certifications}
                />
              </div>
            </section>
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
            <section className="tpl-mer__section">
              <h2 className="tpl-mer__heading" data-block data-keep-with-next>
                Personal Information
              </h2>
              <p className="tpl-mer__prose" data-block>
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
        </div>

        {/* ── The rail ───────────────────────────────────────────────────── */}
        <aside className="tpl-mer__aside" data-flow>
          {technical.length > 0 && (
            <section className="tpl-mer__section">
              <h2
                className="tpl-mer__heading tpl-mer__heading--marked"
                data-block
                data-keep-with-next
              >
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
                  {({ item, path, chrome, itemProps, onAdd }) => (
                    <li {...itemProps} className="tpl-mer__link">
                      {chrome}
                      <LinkField item={item} path={path} onAdd={onAdd} />
                    </li>
                  )}
                </Collection>
              </ul>
            </section>
          )}
        </aside>
      </div>
      {/*
       * The candidate's own sections, after every section this template
       * knows. Heading in the template's own style; entries in the shared
       * neutral layout — see `CustomSections.tsx`.
       */}
      <CustomSections
        sections={resume.custom_sections}
        sectionClass="tpl-mer__section"
        headingClass="tpl-mer__heading"
        Entry={MeridianCustomEntry}
      />
    </article>
  );
}

MeridianDocument.craft = {
  displayName: 'MeridianDocument',
  rules: LOCKED_RULES,
};
