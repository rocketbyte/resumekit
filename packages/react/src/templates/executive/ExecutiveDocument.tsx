import type { CSSProperties } from 'react';
import { Element, useNode } from '@craftjs/core';
import {
  DENSITIES,
  DOCUMENT_FONTS,
  INK_COLORS,
  type DocumentStyle,
  type ResumeObject,
  type SkillGroup,
} from '@cvgs/core';
import { EditableText } from '../../nodes/EditableText.js';
import { EditableBulletList } from '../../nodes/EditableBulletList.js';
import { LOCKED_RULES } from '../../nodes/locked.js';
import { useDocumentStyle } from '../../presentation-context.js';
import './executive.css';

/**
 * The Executive template.
 *
 * Same contract as Harvard: one Craft node for the whole document, structure as
 * plain JSX inside this render (so it is not addressable), and every editable
 * field declared as an `<Element id=…>` linked node carrying its **domain path**.
 * The paths are identical to Harvard's, which is what makes an overlay written
 * under one template apply unchanged under this one.
 *
 * The reference prints two things this résumé cannot hold — a location per
 * experience entry, and languages as a first-class list. Neither is invented
 * here: entry locations are omitted, and Languages is read from the skills group
 * that names them. See `design.md`, decision 1.
 */

/** Which skills group, if any, is the languages one. */
function isLanguages(group: SkillGroup): boolean {
  return /^\s*languages?\b/i.test(group.category);
}

/**
 * The monogram, derived from the name rather than stored.
 *
 * Not separately editable on purpose: a monogram that can disagree with the name
 * printed beside it is a defect waiting to be shipped.
 */
function monogram(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  const first = parts[0][0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? '') : '';
  return (first + last).toUpperCase();
}

function documentStyle(style: DocumentStyle | undefined): CSSProperties {
  if (!style) return {};
  return {
    '--e-font': DOCUMENT_FONTS[style.font].stack,
    '--e-ink': INK_COLORS[style.ink].hex,
    '--e-scale': String(style.scale),
    /*
     * Absent means the template's own — `document-styling` (#36) requires a
     * document that sets neither to render exactly as the template defines it,
     * so these are written only when the candidate has chosen.
     */
    ...(style.accent ? { '--e-accent': INK_COLORS[style.accent].hex } : {}),
    ...(style.density
      ? { '--e-density': String(DENSITIES[style.density].factor) }
      : {}),
  } as CSSProperties;
}

export interface ExecutiveDocumentProps {
  resume: ResumeObject;
}

export function ExecutiveDocument({ resume }: ExecutiveDocumentProps) {
  const {
    connectors: { connect },
  } = useNode();
  const style = useDocumentStyle();

  const languages = resume.skills.filter(isLanguages);
  const technical = resume.skills
    .map((group, index) => ({ group, index }))
    .filter(({ group }) => !isLanguages(group));

  const contact = [
    resume.contact.email && { path: 'contact.email' as const },
    resume.contact.phone && { path: 'contact.phone' as const },
  ].filter(Boolean) as { path: 'contact.email' | 'contact.phone' }[];

  return (
    <article
      ref={(ref) => {
        if (ref) connect(ref);
      }}
      className="tpl-exec"
      style={documentStyle(style)}
      aria-label="Resume document"
    >
      {/* ── Header band ──────────────────────────────────────────────────── */}
      <header className="tpl-exec__band" data-block>
        <span className="tpl-exec__monogram" aria-hidden="true">
          {monogram(resume.name)}
        </span>

        <div className="tpl-exec__identity">
          <h1 className="tpl-exec__name">
            <Element
              id="name"
              is={EditableText}
              path="name"
              value={resume.name}
            />
          </h1>

          {resume.contact.location && (
            <p className="tpl-exec__where">
              <Element
                id="contact.location"
                is={EditableText}
                path="contact.location"
                value={resume.contact.location}
              />
            </p>
          )}

          {contact.length > 0 && (
            <p className="tpl-exec__contact">
              {contact.map(({ path }) => (
                <span key={path} className="tpl-exec__contact-item">
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
        </div>
      </header>

      <div className="tpl-exec__body">
        {resume.summary && (
          <section className="tpl-exec__section">
            <h2 className="tpl-exec__heading" data-block data-keep-with-next>
              Professional Summary
            </h2>
            <p className="tpl-exec__prose" data-block>
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
          <section className="tpl-exec__section">
            <h2 className="tpl-exec__heading" data-block data-keep-with-next>
              Technical Skills
            </h2>
            {/*
             * Two VISUAL columns over one list per group: CSS columns leave the
             * DOM — and therefore the text a parser extracts — in document
             * order. Structural columns would not.
             */}
            <div className="tpl-exec__columns" data-block>
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

        {resume.experience.length > 0 && (
          <section className="tpl-exec__section">
            <h2 className="tpl-exec__heading" data-block data-keep-with-next>
              Experience
            </h2>
            {resume.experience.map((role, i) => (
              <article key={i} className="tpl-exec__entry" data-block>
                <div className="tpl-exec__entry-head">
                  <span className="tpl-exec__role">
                    <strong>
                      <Element
                        id={`experience.${i}.title`}
                        is={EditableText}
                        path={`experience.${i}.title`}
                        value={role.title}
                      />
                    </strong>
                    <span className="tpl-exec__sep">/</span>
                    <Element
                      id={`experience.${i}.company`}
                      is={EditableText}
                      path={`experience.${i}.company`}
                      value={role.company}
                    />
                  </span>
                  <span className="tpl-exec__dates">
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
          <section className="tpl-exec__section">
            <h2 className="tpl-exec__heading" data-block data-keep-with-next>
              Education
            </h2>
            {resume.education.map((school, i) => (
              <article key={i} className="tpl-exec__entry" data-block>
                <div className="tpl-exec__entry-head">
                  <span className="tpl-exec__role">
                    <strong>
                      <Element
                        id={`education.${i}.degree`}
                        is={EditableText}
                        path={`education.${i}.degree`}
                        value={school.degree ?? ''}
                        placeholder="Degree"
                      />
                    </strong>
                    {school.field && (
                      <>
                        {': '}
                        <Element
                          id={`education.${i}.field`}
                          is={EditableText}
                          path={`education.${i}.field`}
                          value={school.field}
                        />
                      </>
                    )}
                  </span>
                  <span className="tpl-exec__dates">
                    <Element
                      id={`education.${i}.end`}
                      is={EditableText}
                      path={`education.${i}.end`}
                      value={school.end ?? ''}
                      placeholder="—"
                    />
                  </span>
                </div>
                <p className="tpl-exec__school">
                  <Element
                    id={`education.${i}.school`}
                    is={EditableText}
                    path={`education.${i}.school`}
                    value={school.school}
                  />
                </p>
              </article>
            ))}
          </section>
        )}

        {languages.length > 0 && (
          <section className="tpl-exec__section">
            <h2 className="tpl-exec__heading" data-block data-keep-with-next>
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

        {resume.certifications.length > 0 && (
          <section className="tpl-exec__section">
            <h2 className="tpl-exec__heading" data-block data-keep-with-next>
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

        {resume.headline && (
          <section className="tpl-exec__section">
            <h2 className="tpl-exec__heading" data-block data-keep-with-next>
              Personal Information
            </h2>
            <p className="tpl-exec__prose" data-block>
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
          <section className="tpl-exec__section">
            <h2 className="tpl-exec__heading" data-block data-keep-with-next>
              Locations
            </h2>
            <p className="tpl-exec__prose" data-block>
              {/* The same field the header shows: one location, two places it
                  is printed, never two values that can disagree. */}
              {resume.contact.location}
            </p>
          </section>
        )}

        {resume.links.length > 0 && (
          <section className="tpl-exec__section">
            <h2 className="tpl-exec__heading" data-block data-keep-with-next>
              Websites, Portfolios, Profiles
            </h2>
            <ul className="tpl-exec__links" data-block>
              {resume.links.map((link, i) => (
                <li key={i} className="tpl-exec__link">
                  <Element
                    id={`links.${i}.url`}
                    is={EditableText}
                    path={`links.${i}.url`}
                    value={link.url}
                  />
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </article>
  );
}

ExecutiveDocument.craft = {
  displayName: 'ExecutiveDocument',
  rules: LOCKED_RULES,
};
