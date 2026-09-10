import type { CSSProperties } from 'react';
import {
  DENSITIES,
  DOCUMENT_FONTS,
  INK_COLORS,
  PLACEHOLDERS,
  type DocumentStyle,
  type ResumeObject,
} from '@cvgs/core';
import { useDocumentStyle } from '../../presentation-context.js';
import { useAuthoring } from '../../collections/authoring-context.js';
import { EditableText } from '../../nodes/EditableText.js';
import { EditableInlineList } from '../../nodes/EditableInlineList.js';
import { CustomSections } from '../../nodes/CustomSections.js';
import { Collection } from '../../collections/Collection.js';
import { useSpaceSlot } from '../../spacing/SpaceHandle.js';
import { LinkField } from '../../nodes/LinkField.js';
import {
  HarvardCustomEntry,
  HarvardEducationEntry,
  HarvardExperienceEntry,
  HarvardSkillGroup,
} from './entries.js';
import './harvard.css';

/**
 * The Harvard template.
 *
 * The whole document is ONE Craft.js node. Its structure — the header block, the
 * rule-underlined headings, the two-column entry rows — is plain JSX inside this
 * render, which means it is not merely locked but **not addressable**: there is
 * no node to select, no rule to relax, and no serialized entry for a layout the
 * candidate could change.
 *
 * Editable text is declared with `<Element id=…>`, which makes each field a
 * Craft.js **linked node** with its own selection state and props. The `id` is
 * the field's own domain path, so the tree cannot contain two nodes claiming to
 * edit the same thing, and `serialize.ts` can read the overlay straight off it.
 *
 * A section the resume has no data for is omitted, never rendered empty.
 */
export interface HarvardDocumentProps {
  resume: ResumeObject;
}

/**
 * The document style reaches the page as three custom properties on ONE element
 * — the template root — which every rule in `harvard.css` already reads. So the
 * stylesheet stays the only definition of how a Harvard resume looks, and no node
 * has to be handed a style to make a typeface change.
 */
function documentStyle(style: DocumentStyle | undefined): CSSProperties {
  if (!style) return {};
  return {
    '--h-font': DOCUMENT_FONTS[style.font].stack,
    '--h-ink': INK_COLORS[style.ink].hex,
    '--h-scale': String(style.scale),
    /*
     * Absent means the template's own — `document-styling` (#36) requires a
     * document that sets neither to render exactly as the template defines it,
     * so these are written only when the candidate has chosen.
     */
    ...(style.accent ? { '--h-accent': INK_COLORS[style.accent].hex } : {}),
    ...(style.density
      ? { '--h-density': String(DENSITIES[style.density].factor) }
      : {}),
  } as CSSProperties;
}

export function HarvardDocument({ resume }: HarvardDocumentProps) {
  // Live, for the reason `presentation-context.tsx` explains: a node prop would
  // be frozen at mount and no style change would ever appear.
  const style = useDocumentStyle();
  /*
   * A section with nothing in it is omitted from the DOCUMENT and offered in
   * the EDITOR, because a candidate cannot add their first role to a section
   * that is not drawn. The read-only page is unchanged: with no authoring
   * context this is false and an empty section stays absent.
   */
  const authoring = useAuthoring() !== null;

  /**
   * The header's contact details.
   *
   * While the document is being AUTHORED all three are offered, filled or not,
   * because an absent field is one a candidate cannot add: a résumé the writer
   * produced without a phone number rendered no phone number, and there was
   * nothing on the page saying one belonged there. Empty, each shows its
   * placeholder — the same invitation an empty section gets.
   *
   * On paper only what was filled in survives, which is the same rule the
   * sections follow and the reason the two lists are built separately rather
   * than filtered at the point of rendering.
   */
  /*
   * The gap above each section. Declared together and unconditionally, because
   * a section is rendered only when it has something in it and a hook may not
   * be called behind that condition. With no space recorded a slot is a marker
   * and a handle that occupies no layout, so it costs nothing.
   */
  const sectionSpace = {
    summary: useSpaceSlot({ section: 'summary' }, 'Professional Summary'),
    experience: useSpaceSlot({ section: 'experience' }, 'Experience'),
    education: useSpaceSlot({ section: 'education' }, 'Education'),
    skills: useSpaceSlot({ section: 'skills' }, 'Technical Skills'),
    certifications: useSpaceSlot(
      { section: 'certifications' },
      'Certifications',
    ),
  };

  const CONTACT_FIELDS = ['location', 'email', 'phone'] as const;
  const contact = CONTACT_FIELDS.filter(
    (field) => authoring || resume.contact[field],
  ).map((field) => ({ path: `contact.${field}`, field }));

  return (
    <article
      className="tpl-harvard"
      style={documentStyle(style)}
      aria-label="Resume document"
    >
      <header className="tpl-harvard__head" data-block>
        <h1 className="tpl-harvard__name">
          <EditableText path="name" value={resume.name} />
        </h1>

        {(resume.headline || authoring) && (
          <p className="tpl-harvard__headline">
            <EditableText
              path="headline"
              value={resume.headline ?? ''}
              placeholder={PLACEHOLDERS['headline']}
            />
          </p>
        )}

        {(contact.length > 0 || resume.links.length > 0 || authoring) && (
          <p className="tpl-harvard__contact">
            {/* The separator is drawn by CSS between siblings, so a detail the
                writer did not have cannot leave a stray bar behind it. */}
            {contact.map(({ path, field }) => (
              <span key={path} className="tpl-harvard__contact-item">
                <EditableText
                  path={path}
                  value={String(resume.contact[field] ?? '')}
                  placeholder={PLACEHOLDERS[field]}
                />
              </span>
            ))}

            {/*
             * Links are a COLLECTION, like every other repeatable part of the
             * résumé, and for the reason the contact fields above are always
             * offered: a candidate whose writer produced none had no way to add
             * one. The collection brings the add control with it — including
             * the in-flow "+ Add link" it shows when there are none at all —
             * so LinkedIn and GitHub are a click away rather than absent.
             */}
            {/*
             * `inline`, because this collection lives INSIDE the contact line.
             * The block add control drew a dashed button on a second line the
             * preview does not have — see `CollectionItems`.
             */}
            <Collection
              section="links"
              items={resume.links}
              gap={false}
              emptyAdd="inline"
            >
              {({ item, path, chrome, itemProps, justAdded }) => (
                <span className="tpl-harvard__contact-item">
                  {/*
                   * Two spans, because the separator belongs to the LINE and
                   * the ring belongs to the LINK.
                   *
                   * The bar between contact details is drawn by
                   * `.tpl-harvard__contact-item + …::before`, which puts it
                   * inside this element's box, at its leading edge. The editor
                   * rings whichever element carries `itemProps` — so with both
                   * on one span the ring enclosed the bar that divides this
                   * link from the one before it, and reached back over the
                   * phone number. One span in, and it is round the link alone.
                   *
                   * It renders in both states, so the edited document and the
                   * read one still differ by nothing: an inline span with no
                   * styles of its own occupies exactly what its content does.
                   */}
                  <span {...itemProps}>
                    {chrome}
                    {/* The guidance is the field's own default now, so all four
                        templates read the same word. */}
                    <LinkField item={item} path={path} justAdded={justAdded} />
                  </span>
                </span>
              )}
            </Collection>
          </p>
        )}
      </header>

      {(resume.summary || authoring) && (
        <section
          className="tpl-harvard__section"
          {...sectionSpace.summary.rootProps}
        >
          {sectionSpace.summary.handle}
          <h2
            className="tpl-harvard__section-title"
            data-block
            data-keep-with-next
          >
            Professional Summary
          </h2>
          <p className="tpl-harvard__summary" data-block>
            <EditableText
              path="summary"
              value={resume.summary ?? ''}
              placeholder={PLACEHOLDERS['summary']}
              multiline
            />
          </p>
        </section>
      )}

      {(resume.experience.length > 0 || authoring) && (
        <section
          className="tpl-harvard__section"
          {...sectionSpace.experience.rootProps}
        >
          {sectionSpace.experience.handle}
          <h2
            className="tpl-harvard__section-title"
            data-block
            data-keep-with-next
          >
            Experience
          </h2>
          <Collection section="experience" items={resume.experience}>
            {({ item, path, chrome, itemProps }) => (
              <HarvardExperienceEntry
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
        <section
          className="tpl-harvard__section"
          {...sectionSpace.education.rootProps}
        >
          {sectionSpace.education.handle}
          <h2
            className="tpl-harvard__section-title"
            data-block
            data-keep-with-next
          >
            Education
          </h2>
          <Collection section="education" items={resume.education}>
            {({ item, path, chrome, itemProps }) => (
              <HarvardEducationEntry
                item={item}
                path={path}
                chrome={chrome}
                itemProps={itemProps}
              />
            )}
          </Collection>
        </section>
      )}

      {(resume.skills.length > 0 || authoring) && (
        <section
          className="tpl-harvard__section"
          {...sectionSpace.skills.rootProps}
        >
          {sectionSpace.skills.handle}
          <h2
            className="tpl-harvard__section-title"
            data-block
            data-keep-with-next
          >
            Technical Skills
          </h2>
          <ul className="tpl-harvard__skills" data-block>
            <Collection section="skills" items={resume.skills} gap={false}>
              {({ item, path, chrome, itemProps }) => (
                <HarvardSkillGroup
                  item={item}
                  path={path}
                  chrome={chrome}
                  itemProps={itemProps}
                />
              )}
            </Collection>
          </ul>
        </section>
      )}

      {resume.certifications.length > 0 && (
        <section
          className="tpl-harvard__section"
          {...sectionSpace.certifications.rootProps}
        >
          {sectionSpace.certifications.handle}
          <h2
            className="tpl-harvard__section-title"
            data-block
            data-keep-with-next
          >
            Certifications
          </h2>
          <p className="tpl-harvard__inline-list" data-block>
            <EditableInlineList
              path="certifications"
              items={resume.certifications}
              placeholder={PLACEHOLDERS['certifications']}
            />
          </p>
        </section>
      )}
      {/*
       * The candidate's own sections, after every section this template
       * knows. Heading in the template's own style; entries in the shared
       * neutral layout — see `CustomSections.tsx`.
       */}
      <CustomSections
        sections={resume.custom_sections}
        sectionClass="tpl-harvard__section"
        headingClass="tpl-harvard__section-title"
        Entry={HarvardCustomEntry}
      />
    </article>
  );
}
