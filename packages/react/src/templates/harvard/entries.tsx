import type { ReactNode } from 'react';
import type { ItemRootProps } from '../../collections/CollectionItems.js';
import { Element } from '@craftjs/core';
import {
  PLACEHOLDERS,
  type CustomEntry,
  type Education,
  type Experience,
  type SkillGroup,
} from '@cvgs/core';
import { useAuthoring } from '../../collections/authoring-context.js';
import { EditableText } from '../../nodes/EditableText.js';
import { EditableBulletList } from '../../nodes/EditableBulletList.js';
import { EditableInlineList } from '../../nodes/EditableInlineList.js';

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
  return (
    <article {...itemProps} className="tpl-harvard__entry" data-block>
      {chrome}
      <div className="tpl-harvard__entry-head">
        <span className="tpl-harvard__org">
          <Element
            id={`${path}.company`}
            is={EditableText}
            path={`${path}.company`}
            value={item.company}
            placeholder={PLACEHOLDERS['company']}
          />
        </span>
        <span className="tpl-harvard__dates">
          <Element
            id={`${path}.start`}
            is={EditableText}
            path={`${path}.start`}
            value={item.start}
            placeholder={PLACEHOLDERS['start']}
          />
          {' – '}
          <Element
            id={`${path}.end`}
            is={EditableText}
            path={`${path}.end`}
            value={item.end}
            placeholder={PLACEHOLDERS['end']}
          />
        </span>
        <span className="tpl-harvard__role">
          <Element
            id={`${path}.title`}
            is={EditableText}
            path={`${path}.title`}
            value={item.title}
            placeholder={PLACEHOLDERS['title']}
          />
        </span>
        <span className="tpl-harvard__where" />
      </div>
      <Element
        id={`${path}.bullets`}
        is={EditableBulletList}
        path={`${path}.bullets`}
        items={item.bullets}
      />
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
  const authoring = useAuthoring() !== null;

  return (
    <article {...itemProps} className="tpl-harvard__entry" data-block>
      {chrome}
      <div className="tpl-harvard__entry-head">
        <span className="tpl-harvard__org">
          <Element
            id={`${path}.school`}
            is={EditableText}
            path={`${path}.school`}
            value={item.school}
            placeholder={PLACEHOLDERS['school']}
          />
        </span>
        {/*
         * WHERE on the school's line, WHEN on the qualification's — the order
         * the grid places them in is the order they are written here.
         *
         * The opposite of the experience entry above, and deliberately: a
         * degree is identified by its institution and the place is part of
         * naming it, where a role is identified by what you did and the dates
         * are what a reader scans for. It is also the order the reference
         * résumés use.
         */}
        <span className="tpl-harvard__where">
          <Element
            id={`${path}.location`}
            is={EditableText}
            path={`${path}.location`}
            value={item.location ?? ''}
            placeholder={PLACEHOLDERS['location']}
          />
        </span>
        <span className="tpl-harvard__role">
          <Element
            id={`${path}.degree`}
            is={EditableText}
            path={`${path}.degree`}
            value={item.degree ?? ''}
            placeholder={PLACEHOLDERS['degree']}
          />
          {item.degree && item.field ? ', ' : ''}
          <Element
            id={`${path}.field`}
            is={EditableText}
            path={`${path}.field`}
            value={item.field ?? ''}
            placeholder={PLACEHOLDERS['field']}
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
          <Element
            id={`${path}.start`}
            is={EditableText}
            path={`${path}.start`}
            value={item.start ?? ''}
            placeholder={PLACEHOLDERS['start']}
          />
          {/*
           * The dash is REAL TEXT, so it only belongs where there is a range
           * to punctuate. Unlike a role, a qualification may carry no dates at
           * all, and an unconditional separator printed a lone "–" on the
           * degree's line. In the editor it stays, because the two guided
           * fields either side of it run together without it.
           */}
          {authoring || (item.start && item.end) ? ' – ' : ''}
          <Element
            id={`${path}.end`}
            is={EditableText}
            path={`${path}.end`}
            value={item.end ?? ''}
            placeholder={PLACEHOLDERS['end']}
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
  return (
    <li {...itemProps} className="tpl-harvard__skill-group">
      {chrome}
      <span className="tpl-harvard__skill-label">
        <Element
          id={`${path}.category`}
          is={EditableText}
          path={`${path}.category`}
          value={item.category}
          placeholder={PLACEHOLDERS['category']}
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
      <Element
        id={`${path}.items`}
        is={EditableInlineList}
        path={`${path}.items`}
        items={item.items}
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
  return (
    <article {...itemProps} className="tpl-harvard__entry" data-block>
      {chrome}
      <div className="tpl-harvard__entry-head">
        <span className="tpl-harvard__org">
          <Element
            id={`${path}.title`}
            is={EditableText}
            path={`${path}.title`}
            value={item.title}
            placeholder={PLACEHOLDERS['heading']}
          />
        </span>
        <span className="tpl-harvard__dates" />
        <span className="tpl-harvard__role">
          <Element
            id={`${path}.detail`}
            is={EditableText}
            path={`${path}.detail`}
            value={item.detail ?? ''}
            placeholder={PLACEHOLDERS['detail']}
          />
        </span>
        <span className="tpl-harvard__where" />
      </div>
      {item.bullets.length > 0 && (
        <Element
          id={`${path}.bullets`}
          is={EditableBulletList}
          path={`${path}.bullets`}
          items={item.bullets}
        />
      )}
    </article>
  );
}
