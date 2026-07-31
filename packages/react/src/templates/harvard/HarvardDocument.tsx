import { Element, useNode } from '@craftjs/core';
import type { ResumeObject } from '@cvgs/core';
import { EditableText } from '../../nodes/EditableText.js';
import { EditableBulletList } from '../../nodes/EditableBulletList.js';
import { EditableInlineList } from '../../nodes/EditableInlineList.js';
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
export function HarvardDocument({ resume }: { resume: ResumeObject }) {
  const {
    connectors: { connect },
  } = useNode();

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
      aria-label="Resume document"
    >
      <header className="tpl-harvard__head">
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
                />
              </span>
            ))}
          </p>
        )}
      </header>

      {resume.summary && (
        <section className="tpl-harvard__section">
          <h2 className="tpl-harvard__section-title">Professional Summary</h2>
          <p className="tpl-harvard__summary">
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
          <h2 className="tpl-harvard__section-title">Experience</h2>
          {resume.experience.map((role, i) => (
            <article key={i} className="tpl-harvard__entry">
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
          <h2 className="tpl-harvard__section-title">Education</h2>
          {resume.education.map((school, i) => (
            <article key={i} className="tpl-harvard__entry">
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
          <h2 className="tpl-harvard__section-title">Technical Skills</h2>
          <ul className="tpl-harvard__skills">
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
          <h2 className="tpl-harvard__section-title">Certifications</h2>
          <p className="tpl-harvard__inline-list">
            <Element
              id="certifications"
              is={EditableInlineList}
              path="certifications"
              items={resume.certifications}
            />
          </p>
        </section>
      )}
    </article>
  );
}

HarvardDocument.craft = {
  displayName: 'HarvardDocument',
  rules: LOCKED_RULES,
};
