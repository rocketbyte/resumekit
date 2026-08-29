import type { ReactNode } from 'react';
import type { ItemRootProps } from '../../collections/CollectionItems.js';
import { Element } from '@craftjs/core';
import {
  PLACEHOLDERS,
  type CustomEntry,
  type Education,
  type Experience,
} from '@cvgs/core';
import { EditableText } from '../../nodes/EditableText.js';
import { EditableBulletList } from '../../nodes/EditableBulletList.js';

/**
 * Cobalt's entry components: the markup for one item of each shape.
 *
 * This is the whole of what a template supplies to a collection. None of
 * these can add, remove, hide or move anything — they are handed an item and
 * the path that addresses it, and `collections.spec.tsx` asserts that no file
 * in this directory can reach a mutator.
 *
 * `path` is the item's own path in the résumé, which is NOT where it is drawn:
 * a reordered document renders `experience.2` in first place, and the fields
 * inside it must keep saying `experience.2.*` so a stored edit follows the job
 * rather than the position.
 *
 * `chrome` is the item's controls. A template decides WHERE they sit in its own
 * markup — it owns the layout — and cannot decide what they are: the value is
 * opaque, and no template can reach the operations behind it. It is `null` on a
 * document that is only being read, so the markup is the same either way and no
 * template asks which mode it is in.
 */

export function CobaltExperienceEntry({
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
    <article {...itemProps} className="tpl-cob__entry" data-block>
      {chrome}
      <p className="tpl-cob__entry-lead">
        <Element
          id={`${path}.company`}
          is={EditableText}
          path={`${path}.company`}
          value={item.company}
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
            id={`${path}.title`}
            is={EditableText}
            path={`${path}.title`}
            value={item.title}
          />
        </em>
        <span className="tpl-cob__dates">
          <Element
            id={`${path}.start`}
            is={EditableText}
            path={`${path}.start`}
            value={item.start}
          />
          {' - '}
          <Element
            id={`${path}.end`}
            is={EditableText}
            path={`${path}.end`}
            value={item.end}
          />
        </span>
      </p>
      <Element
        id={`${path}.bullets`}
        is={EditableBulletList}
        path={`${path}.bullets`}
        items={item.bullets}
      />
    </article>
  );
}

export function CobaltEducationEntry({
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
  return (
    <article {...itemProps} className="tpl-cob__entry" data-block>
      {chrome}
      <p className="tpl-cob__entry-lead">
        <Element
          id={`${path}.degree`}
          is={EditableText}
          path={`${path}.degree`}
          value={item.degree ?? ''}
          placeholder="Degree"
        />
      </p>
      {/* The reference prints the school's city on its own line.
          `EducationSchema` has no such field, so the school stands
          alone rather than a place being invented for it. */}
      <p className="tpl-cob__entry-org">
        <Element
          id={`${path}.school`}
          is={EditableText}
          path={`${path}.school`}
          value={item.school}
        />
      </p>
      {(item.field || item.end) && (
        <p className="tpl-cob__entry-when">
          {item.field && (
            <Element
              id={`${path}.field`}
              is={EditableText}
              path={`${path}.field`}
              value={item.field}
            />
          )}
          {item.field && item.end && ', '}
          {item.end && (
            <Element
              id={`${path}.end`}
              is={EditableText}
              path={`${path}.end`}
              value={item.end}
            />
          )}
        </p>
      )}
    </article>
  );
}

/**
 * A candidate's own section entry, in Cobalt's own pattern.
 *
 * `CustomSections` drew these in a shared neutral layout because "borrowing one
 * template's entry markup would render as debris in the other three" — true
 * while entry markup was inline in a document's JSX, and false now that each
 * template names a component for it.
 */
export function CobaltCustomEntry({
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
    <article {...itemProps} className="tpl-cob__entry" data-block>
      {chrome}
      <p className="tpl-cob__entry-lead">
        <Element
          id={`${path}.title`}
          is={EditableText}
          path={`${path}.title`}
          value={item.title}
          placeholder={PLACEHOLDERS['heading']}
        />
      </p>
      <p className="tpl-cob__entry-meta">
        <em className="tpl-cob__role">
          <Element
            id={`${path}.detail`}
            is={EditableText}
            path={`${path}.detail`}
            value={item.detail ?? ''}
            placeholder={PLACEHOLDERS['detail']}
          />
        </em>
      </p>
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
