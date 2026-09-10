import type { ReactNode } from 'react';
import type { ItemRootProps } from '../../collections/CollectionItems.js';
import {
  PLACEHOLDERS,
  type CustomEntry,
  type Education,
  type Experience,
} from '@cvgs/core';
import { EditableText } from '../../nodes/EditableText.js';
import { EditableBulletList } from '../../nodes/EditableBulletList.js';

/**
 * Exec's entry components: the markup for one item of each shape.
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

export function ExecExperienceEntry({
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
    <article {...itemProps} className="tpl-exec__entry" data-block>
      {chrome}
      <div className="tpl-exec__entry-head">
        <span className="tpl-exec__role">
          <strong>
            <EditableText path={`${path}.title`} value={item.title} />
          </strong>
          <span className="tpl-exec__sep">/</span>
          <EditableText path={`${path}.company`} value={item.company} />
        </span>
        <span className="tpl-exec__dates">
          <EditableText path={`${path}.start`} value={item.start} />
          {' - '}
          <EditableText path={`${path}.end`} value={item.end} />
        </span>
      </div>
      <EditableBulletList path={`${path}.bullets`} items={item.bullets} />
    </article>
  );
}

export function ExecEducationEntry({
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
    <article {...itemProps} className="tpl-exec__entry" data-block>
      {chrome}
      <div className="tpl-exec__entry-head">
        <span className="tpl-exec__role">
          <strong>
            <EditableText
              path={`${path}.degree`}
              value={item.degree ?? ''}
              placeholder="Degree"
            />
          </strong>
          {item.field && (
            <>
              {': '}
              <EditableText path={`${path}.field`} value={item.field} />
            </>
          )}
        </span>
        <span className="tpl-exec__dates">
          <EditableText
            path={`${path}.end`}
            value={item.end ?? ''}
            placeholder="—"
          />
        </span>
      </div>
      <p className="tpl-exec__school">
        <EditableText path={`${path}.school`} value={item.school} />
      </p>
    </article>
  );
}

/**
 * A candidate's own section entry, in Exec's own pattern.
 *
 * `CustomSections` drew these in a shared neutral layout because "borrowing one
 * template's entry markup would render as debris in the other three" — true
 * while entry markup was inline in a document's JSX, and false now that each
 * template names a component for it.
 */
export function ExecCustomEntry({
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
    <article {...itemProps} className="tpl-exec__entry" data-block>
      {chrome}
      <div className="tpl-exec__entry-head">
        <span className="tpl-exec__role">
          <strong>
            <EditableText
              path={`${path}.title`}
              value={item.title}
              placeholder={PLACEHOLDERS['heading']}
            />
          </strong>
        </span>
        <span className="tpl-exec__dates">
          <EditableText
            path={`${path}.detail`}
            value={item.detail ?? ''}
            placeholder={PLACEHOLDERS['detail']}
          />
        </span>
      </div>
      {/* The list renders itself empty while the document is being authored —
          see `EditableBulletList`. Gating it here on having bullets was the
          same defect one level up: an entry with none had no list, so there was
          nowhere to put the first one. */}
      <EditableBulletList path={`${path}.bullets`} items={item.bullets} />
    </article>
  );
}
