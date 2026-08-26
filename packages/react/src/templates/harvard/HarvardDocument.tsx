import type { CSSProperties } from 'react';
import { Element, useNode } from '@craftjs/core';
import {
  DENSITIES,
  DOCUMENT_FONTS,
  INK_COLORS,
  type DocumentStyle,
  type ResumeObject,
} from '@cvgs/core';
import { useDocumentStyle } from '../../presentation-context.js';
import { EditableText } from '../../nodes/EditableText.js';
import { EditableBulletList } from '../../nodes/EditableBulletList.js';
import { EditableInlineList } from '../../nodes/EditableInlineList.js';
import { CustomSections } from '../../nodes/CustomSections.js';
import { LOCKED_RULES } from '../../nodes/locked.js';
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
  const {
    connectors: { connect },
  } = useNode();
  // Live, for the reason `presentation-context.tsx` explains: a node prop would
  // be frozen at mount and no style change would ever appear.
  const style = useDocumentStyle();

  const contact = [
    resume.contact.location && { path: 'contact.location' },
    resume.contact.email && { path: 'contact.email' },
    resume.contact.phone && { path: 'contact.phone' },
  ].filter(Boolean) as { path: string }[];

  return (
    <article
      ref={(ref) => {
        if (ref) connect(ref);
      }}
      className="tpl-harvard"
      style={documentStyle(style)}
      aria-label="Resume document"
    >
      <header className="tpl-harvard__head" data-block>
        <h1 className="tpl-harvard__name">
          <Element
            id="name"
            is={EditableText}
            path="name"
            value={resume.name}
          />
        </h1>

        {resume.headline && (
          <p className="tpl-harvard__headline">
            <Element
              id="headline"
              is={EditableText}
              path="headline"
              value={resume.headline}
            />
          </p>
        )}

        {(contact.length > 0 || resume.links.length > 0) && (
          <p className="tpl-harvard__contact">
            {/* The separator is drawn by CSS between siblings, so a detail the
                writer did not have cannot leave a stray bar behind it. */}
            {contact.map(({ path }) => (
              <span key={path} className="tpl-harvard__contact-item">
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
            {resume.links.map((link, i) => (
              <span key={`link-${i}`} className="tpl-harvard__contact-item">
                <Element
                  id={`links.${i}.label`}
                  is={EditableText}
                  path={`links.${i}.label`}
                  value={link.label ?? link.url}
                  href={link.url}
                />
              </span>
            ))}
          </p>
        )}
      </header>

      {resume.summary && (
        <section className="tpl-harvard__section">
          <h2
            className="tpl-harvard__section-title"
            data-block
            data-keep-with-next
          >
            Professional Summary
          </h2>
          <p className="tpl-harvard__summary" data-block>
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

      {resume.experience.length > 0 && (
        <section className="tpl-harvard__section">
          <h2
            className="tpl-harvard__section-title"
            data-block
            data-keep-with-next
          >
            Experience
          </h2>
          {resume.experience.map((role, i) => (
            <article key={i} className="tpl-harvard__entry" data-block>
              <div className="tpl-harvard__entry-head">
                <span className="tpl-harvard__org">
                  <Element
                    id={`experience.${i}.company`}
                    is={EditableText}
                    path={`experience.${i}.company`}
                    value={role.company}
                  />
                </span>
                <span className="tpl-harvard__dates">
                  <Element
                    id={`experience.${i}.start`}
                    is={EditableText}
                    path={`experience.${i}.start`}
                    value={role.start}
                  />
                  {' – '}
                  <Element
                    id={`experience.${i}.end`}
                    is={EditableText}
                    path={`experience.${i}.end`}
                    value={role.end}
                  />
                </span>
                <span className="tpl-harvard__role">
                  <Element
                    id={`experience.${i}.title`}
                    is={EditableText}
                    path={`experience.${i}.title`}
                    value={role.title}
                  />
                </span>
                <span className="tpl-harvard__where" />
              </div>
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

      {resume.education.length > 0 && (
        <section className="tpl-harvard__section">
          <h2
            className="tpl-harvard__section-title"
            data-block
            data-keep-with-next
          >
            Education
          </h2>
          {resume.education.map((school, i) => (
            <article key={i} className="tpl-harvard__entry" data-block>
              <div className="tpl-harvard__entry-head">
                <span className="tpl-harvard__org">
                  <Element
                    id={`education.${i}.school`}
                    is={EditableText}
                    path={`education.${i}.school`}
                    value={school.school}
                  />
                </span>
                <span className="tpl-harvard__dates">
                  {[school.start, school.end].filter(Boolean).join(' – ')}
                </span>
                <span className="tpl-harvard__role">
                  {[school.degree, school.field].filter(Boolean).join(', ')}
                </span>
                <span className="tpl-harvard__where" />
              </div>
            </article>
          ))}
        </section>
      )}

      {resume.skills.length > 0 && (
        <section className="tpl-harvard__section">
          <h2
            className="tpl-harvard__section-title"
            data-block
            data-keep-with-next
          >
            Technical Skills
          </h2>
          <ul className="tpl-harvard__skills" data-block>
            {resume.skills.map((group, i) => (
              <li key={i} className="tpl-harvard__skill-group">
                <span className="tpl-harvard__skill-label">
                  <Element
                    id={`skills.${i}.category`}
                    is={EditableText}
                    path={`skills.${i}.category`}
                    value={group.category}
                  />
                  :
                </span>
                <Element
                  id={`skills.${i}.items`}
                  is={EditableInlineList}
                  path={`skills.${i}.items`}
                  items={group.items}
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      {resume.certifications.length > 0 && (
        <section className="tpl-harvard__section">
          <h2
            className="tpl-harvard__section-title"
            data-block
            data-keep-with-next
          >
            Certifications
          </h2>
          <p className="tpl-harvard__inline-list" data-block>
            <Element
              id="certifications"
              is={EditableInlineList}
              path="certifications"
              items={resume.certifications}
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
      />
    </article>
  );
}

HarvardDocument.craft = {
  displayName: 'HarvardDocument',
  rules: LOCKED_RULES,
};
