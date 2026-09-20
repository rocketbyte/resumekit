import { LANGUAGE_LEVELS, PLACEHOLDERS, type Language } from '@cvgs/core';
import { DocumentSection } from './DocumentSection.js';
import { Collection } from '../collections/Collection.js';
import { useAuthoring } from '../collections/authoring-context.js';
import { EditableText } from '../nodes/EditableText.js';
import { useField } from '../fields/field-registry.js';

/** How a stored level is written on the page. */
const LEVEL_WORDS: Record<string, string> = {
  native: 'Native',
  fluent: 'Fluent',
  advanced: 'Advanced',
  intermediate: 'Intermediate',
  beginner: 'Beginner',
};

/** How many of the five steps a level fills. `native` fills all five. */
function filled(level: string): number {
  const index = LANGUAGE_LEVELS.indexOf(
    level as (typeof LANGUAGE_LEVELS)[number],
  );
  return index < 0 ? 0 : LANGUAGE_LEVELS.length - index;
}

/**
 * The level: a word, and — where the template draws one — a five-step meter.
 *
 * The WORD is the content and the meter is the decoration, which is the whole
 * reason this meter is allowed to exist. `docs/template-contract.md` refuses a
 * proficiency meter whose proportions nothing recorded; this one renders one
 * step per stored enum value, and the word beside it carries the meaning for a
 * parser, for a reader, and for a page that prints no marks it was not given.
 *
 * The meter is `aria-hidden` because the word is already the accessible
 * content, and five announced circles are noise.
 *
 * A level with no value yet — a row the candidate has just added — renders no
 * meter and no word. An unchosen level is not a sixth level.
 */
function LevelChoice({ path, value }: { path: string; value: string }) {
  const { value: live, editing, set } = useField(path, value);
  const word = LEVEL_WORDS[live] ?? '';

  return (
    <>
      {editing ? (
        <select
          className="tpl-language__choice"
          value={live}
          aria-label="Level"
          onChange={(e) => set(e.target.value)}
        >
          <option value="">Level…</option>
          {LANGUAGE_LEVELS.map((level) => (
            <option key={level} value={level}>
              {LEVEL_WORDS[level]}
            </option>
          ))}
        </select>
      ) : (
        <span className="tpl-language__level">{word}</span>
      )}

      {word && (
        <span className="tpl-language__meter" aria-hidden="true">
          {LANGUAGE_LEVELS.map((_, i) => (
            <span
              key={i}
              className={
                i < filled(live)
                  ? 'tpl-language__step tpl-language__step--on'
                  : 'tpl-language__step'
              }
            />
          ))}
        </span>
      )}
    </>
  );
}

export interface LanguageListProps {
  /** Optional for the reason `DescribedEntries` states: an unparsed résumé
   *  genuinely lacks the field. */
  items: readonly Language[] | undefined;
  /** The template's own section, heading and row classes. */
  className: string;
  headingClassName: string;
  rowClassName: string;
  /** The heading's default, as printed when the candidate has not renamed it. */
  title?: string;
  /** What the candidate renamed it to, from `resume.section_headings.languages`. */
  heading?: string;
}

/**
 * The languages the candidate speaks, each with a level.
 *
 * Read from `resume.languages`. Before that field existed every template found
 * languages by filtering the skills groups for one whose category matched
 * `/^languages?/i` — so the section had no level and therefore no meter, no
 * `RESUME_SECTIONS` member and therefore no adjustable gap, and it rendered
 * nothing at all for the candidate who had not guessed the magic category name.
 */
export function LanguageList({
  items,
  className,
  headingClassName,
  rowClassName,
  title = 'Languages',
  heading,
}: LanguageListProps) {
  const authoring = useAuthoring() !== null;
  const entries = items ?? [];
  if (entries.length === 0 && !authoring) return null;

  return (
    <DocumentSection
      id="languages"
      title={title}
      heading={heading}
      className={`tpl-languages ${className}`}
      headingClassName={headingClassName}
    >
      <Collection section="languages" items={entries}>
        {({ item, path, chrome, itemProps }) => (
          <div
            {...itemProps}
            className={`tpl-language ${rowClassName}`}
            data-block
          >
            {chrome}
            <span className="tpl-language__name">
              <EditableText
                path={`${path}.name`}
                value={item.name}
                placeholder={PLACEHOLDERS['language']}
              />
            </span>
            <LevelChoice path={`${path}.level`} value={item.level} />
          </div>
        )}
      </Collection>
    </DocumentSection>
  );
}
