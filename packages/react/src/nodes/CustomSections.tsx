import { Element } from '@craftjs/core';
import type { CustomSection } from '@cvgs/core';
import { EditableText } from './EditableText.js';
import { EditableBulletList } from './EditableBulletList.js';

export interface CustomSectionsProps {
  /*
   * OPTIONAL, and that is not defensive padding.
   *
   * `custom_sections` is defaulted by `ResumeObjectSchema`, but a résumé only
   * carries the default if it was PARSED. A writer résumé read straight out of
   * storage and handed to a template has never been through the schema, so the
   * field is genuinely absent — and a template that assumed otherwise crashed
   * every document written before this change. Tolerated here, once, rather
   * than guarded at four call sites.
   */
  sections: readonly CustomSection[] | undefined;
  /** The template's own section wrapper class. */
  sectionClass: string;
  /** The template's own heading class, so the heading matches its neighbours. */
  headingClass: string;
}

/**
 * The sections a candidate added, rendered in whichever template is mounted.
 *
 * SHARED rather than written four times, and the split is deliberate. The
 * **section wrapper and the heading take the template's own class names**, so a
 * custom heading is set in the same face, size and rule as the headings above
 * it — which is what "styled as that template styles its own sections"
 * actually requires. The **entry internals do not**: the four templates lay
 * their entries out differently (Harvard grids `org`/`dates`/`role`, Meridian
 * uses `entry-line`, Cobalt `entry-lead`/`entry-meta`), so borrowing one
 * template's entry markup would render as debris in the other three. Entries
 * get one neutral layout of their own that inherits typography from the
 * template root, where the document's font, ink and scale already live.
 *
 * Every field is a Craft.js linked node addressed by its DOMAIN path, exactly
 * as the writer-produced fields are, so `serialize.ts` reads them with the walk
 * it already has and nothing here needs to know a custom section is special.
 *
 * Nothing is a canvas and nothing takes a drag connector: an authored section
 * is as locked as a written one.
 */
export function CustomSections({
  sections = [],
  sectionClass,
  headingClass,
}: CustomSectionsProps) {
  return (
    <>
      {sections.map((section, i) => (
        <section className={sectionClass} key={section.id}>
          <h2 className={headingClass} data-block data-keep-with-next>
            <Element
              id={`custom_sections.${i}.heading`}
              is={EditableText}
              path={`custom_sections.${i}.heading`}
              value={section.heading}
            />
          </h2>

          {section.entries.map((entry, j) => (
            <article key={j} className="tpl-custom__entry" data-block>
              <div className="tpl-custom__entry-head">
                <span className="tpl-custom__title">
                  <Element
                    id={`custom_sections.${i}.entries.${j}.title`}
                    is={EditableText}
                    path={`custom_sections.${i}.entries.${j}.title`}
                    value={entry.title}
                  />
                </span>
                {/*
                 * Omitted rather than rendered empty, matching the rule every
                 * template already follows for an absent section.
                 */}
                {entry.detail !== undefined && (
                  <span className="tpl-custom__detail">
                    <Element
                      id={`custom_sections.${i}.entries.${j}.detail`}
                      is={EditableText}
                      path={`custom_sections.${i}.entries.${j}.detail`}
                      value={entry.detail}
                    />
                  </span>
                )}
              </div>

              {entry.bullets.length > 0 && (
                <Element
                  id={`custom_sections.${i}.entries.${j}.bullets`}
                  is={EditableBulletList}
                  path={`custom_sections.${i}.entries.${j}.bullets`}
                  items={entry.bullets}
                />
              )}
            </article>
          ))}
        </section>
      ))}
    </>
  );
}
