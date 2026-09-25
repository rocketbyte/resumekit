import type { ReactNode } from 'react';
import type { ItemRootProps } from '../../collections/CollectionItems.js';
import {
  type CustomEntry,
  type Education,
  type Experience,
  type SkillGroup,
} from '@cvgs/core';
import { EditableText } from '../../nodes/EditableText.js';
import { EditableBulletList } from '../../nodes/EditableBulletList.js';
import { EditableInlineList } from '../../nodes/EditableInlineList.js';
import { useEditorText } from '../../i18n/index.js';
import { Separator } from '../../kit/Separator.js';

/**
 * Harvard's entry components: the markup for one item of each shape.
 *
 * This is the whole of what a template supplies to a collection. None of these
 * can add, remove, hide or move anything — they are handed an item and the path
 * that addresses it, and `collections.spec.tsx` asserts that no file in this
 * directory can reach a mutator.
 *
 * `path` is the item's own path in the résumé, which is NOT where it is drawn: a
 * reordered document renders `experience.2` in first place, and the fields
 * inside it must keep saying `experience.2.*` so a stored edit follows the job
 * rather than the position.
 *
 * `chrome` is the item's controls. A template decides WHERE they sit in its own
 * markup — it owns the layout — and cannot decide what they are: the value is
 * opaque, and no template can reach the operations behind it. It is `null` on a
 * document that is only being read, so the markup is the same either way and no
 * template asks which mode it is in.
 */

export function HarvardExperienceEntry({
  item,
  path,
  chrome,
  itemProps,
}: {
  item: Experience;
  path: string;
  chrome: ReactNode;
  itemProps: ItemRootProps;
}) {
  const { placeholder } = useEditorText();
  return (
    <article {...itemProps} className="tpl-harvard__entry" data-block>
      {chrome}
      <div className="tpl-harvard__entry-head">
        <span className="tpl-harvard__org">
          <EditableText
            path={`${path}.company`}
            value={item.company}
            placeholder={placeholder('company')}
          />
        </span>
        {/*
         * WHERE on the employer's line, WHEN on the role's — the order the grid
         * places them in is the order they are written here, and the same order
         * the education entry below uses.
         *
         * This slot was `<span className="tpl-harvard__where" />`: drawn, sized
         * by the grid, and permanently empty, because `Experience` had no
         * `location` to put in it. Every résumé printed a blank quarter beside
         * every job and no candidate could type there.
         *
         * The two entries used to be deliberately opposite, on the argument
         * that a role is identified by its dates where a degree is identified
         * by its institution. Checked against a real résumé, that is not how
         * they are set: `Doral Health & Wellness  New York, NY` over
         * `Senior Software Engineer  Feb 2024 – Present`. Place beside the
         * organisation, dates beside what you did there, in both.
         */}
        <span className="tpl-harvard__where">
          <EditableText
            path={`${path}.location`}
            value={item.location ?? ''}
            placeholder={placeholder('location')}
          />
        </span>
        <span className="tpl-harvard__role">
          <EditableText
            path={`${path}.title`}
            value={item.title}
            placeholder={placeholder('title')}
          />
        </span>
        <span className="tpl-harvard__dates">
          <EditableText
            path={`${path}.start`}
            value={item.start}
            placeholder={placeholder('start')}
          />
          {' – '}
          <EditableText
            path={`${path}.end`}
            value={item.end}
            placeholder={placeholder('end')}
          />
        </span>
      </div>
      <EditableBulletList path={`${path}.bullets`} items={item.bullets} />
    </article>
  );
}

/**
 * Education, and every field of it editable.
 *
 * It was static text before this change, which was survivable while an
 * education entry could only ever be one the writer produced. A candidate who
 * can ADD one and not type into it has been given a control that does nothing,
 * so the fields become editable in the same pass that makes the section
 * addable.
 */
export function HarvardEducationEntry({
  item,
  path,
  chrome,
  itemProps,
}: {
  item: Education;
  path: string;
  chrome: ReactNode;
  itemProps: ItemRootProps;
}) {
  const { placeholder } = useEditorText();

  return (
    <article {...itemProps} className="tpl-harvard__entry" data-block>
      {chrome}
      <div className="tpl-harvard__entry-head">
        <span className="tpl-harvard__org">
          <EditableText
            path={`${path}.school`}
            value={item.school}
            placeholder={placeholder('school')}
          />
        </span>
        {/*
         * WHERE on the school's line, WHEN on the qualification's — the order
         * the grid places them in is the order they are written here.
         *
         * The same order the experience entry above now uses. It used to be the
         * opposite there, on the argument that a role is identified by its
         * dates; the reference résumé sets both the same way, so both are set
         * the same way here.
         */}
        <span className="tpl-harvard__where">
          <EditableText
            path={`${path}.location`}
            value={item.location ?? ''}
            placeholder={placeholder('location')}
          />
        </span>
        <span className="tpl-harvard__role">
          <EditableText
            path={`${path}.degree`}
            value={item.degree ?? ''}
            placeholder={placeholder('degree')}
          />
          <Separator between={[item.degree, item.field]} text=", " />
          <EditableText
            path={`${path}.field`}
            value={item.field ?? ''}
            placeholder={placeholder('field')}
          />
        </span>
        {/*
         * EDITABLE, which they were not. These were a joined string —
         * `[start, end].filter(Boolean).join(' – ')` — so a qualification whose
         * dates the writer missed showed nothing, and there was no field to
         * type them into. The experience entry above has always used real
         * fields here; this one was reading its own data and printing it.
         */}
        <span className="tpl-harvard__dates">
          <EditableText
            path={`${path}.start`}
            value={item.start ?? ''}
            placeholder={placeholder('start')}
          />
          {/*
           * The dash is REAL TEXT, so it only belongs where there is a range
           * to punctuate. Unlike a role, a qualification may carry no dates at
           * all, and an unconditional separator printed a lone "–" on the
           * degree's line. In the editor it stays, because the two guided
           * fields either side of it run together without it.
           */}
          <Separator between={[item.start, item.end]} text=" – " />
          <EditableText
            path={`${path}.end`}
            value={item.end ?? ''}
            placeholder={placeholder('end')}
          />
        </span>
      </div>
    </article>
  );
}

export function HarvardSkillGroup({
  item,
  path,
  chrome,
  itemProps,
}: {
  item: SkillGroup;
  path: string;
  chrome: ReactNode;
  itemProps: ItemRootProps;
}) {
  const { placeholder } = useEditorText();
  return (
    <li {...itemProps} className="tpl-harvard__skill-group">
      {chrome}
      <span className="tpl-harvard__skill-label">
        <EditableText
          path={`${path}.category`}
          value={item.category}
          placeholder={placeholder('category')}
        />
        :
      </span>{' '}
      {/*
       * A REAL space, not a gap made of CSS.
       *
       * The two used to be cells of a grid and the gap was `column-gap`, which
       * a parser reading the exported PDF cannot see: it extracts the words in
       * order and gets "Backend:Node.js". A résumé is written to be read by a
       * machine first, so the separator between a category and its skills has
       * to be a character.
       */}
      <EditableInlineList
        path={`${path}.items`}
        items={item.items}
        placeholder={placeholder('items')}
      />
    </li>
  );
}

/**
 * A candidate's own section entry, in Harvard's own pattern.
 *
 * `CustomSections` drew these in a shared neutral layout because "borrowing one
 * template's entry markup would render as debris in the other three" — true
 * while entry markup was inline in a document's JSX, and false now that each
 * template names a component for it. A section the candidate declared is set in
 * the same grid as the sections above it.
 */
export function HarvardCustomEntry({
  item,
  path,
  chrome,
  itemProps,
}: {
  item: CustomEntry;
  path: string;
  chrome: ReactNode;
  itemProps: ItemRootProps;
}) {
  const { placeholder } = useEditorText();
  return (
    <article {...itemProps} className="tpl-harvard__entry" data-block>
      {chrome}
      <div className="tpl-harvard__entry-head">
        <span className="tpl-harvard__org">
          <EditableText
            path={`${path}.title`}
            value={item.title}
            placeholder={placeholder('heading')}
          />
        </span>
        <span className="tpl-harvard__dates" />
        <span className="tpl-harvard__role">
          <EditableText
            path={`${path}.detail`}
            value={item.detail ?? ''}
            placeholder={placeholder('detail')}
          />
        </span>
        <span className="tpl-harvard__where" />
      </div>
      {/* The list renders itself empty while the document is being authored —
          see `EditableBulletList`. Gating it here on having bullets was the
          same defect one level up: an entry with none had no list, so there was
          nowhere to put the first one. */}
      <EditableBulletList path={`${path}.bullets`} items={item.bullets} />
    </article>
  );
}
