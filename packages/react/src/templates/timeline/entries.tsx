import type { ReactNode } from 'react';
import {
  PLACEHOLDERS,
  type CustomEntry,
  type Education,
  type Experience,
} from '@cvgs/core';
import type { ItemRootProps } from '../../collections/CollectionItems.js';
import { EditableText } from '../../nodes/EditableText.js';
import { EditableBulletList } from '../../nodes/EditableBulletList.js';

/**
 * Timeline's entries: a dated column, the spine, and the work.
 *
 * The spine is a BORDER on the middle column and a dot drawn on it, so the
 * line exists wherever an entry does and cannot drift from one — there is no
 * absolute rule measured against the column's height to keep in step.
 */
function Dated({
  dates,
  place,
  children,
}: {
  dates: ReactNode;
  place: ReactNode;
  children: ReactNode;
}) {
  return (
    <>
      <div className="tpl-timeline__when">
        <p className="tpl-timeline__dates">{dates}</p>
        <p className="tpl-timeline__place">{place}</p>
      </div>
      <div className="tpl-timeline__spine" aria-hidden="true" />
      <div className="tpl-timeline__what">{children}</div>
    </>
  );
}

export function TimelineExperienceEntry({
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
    <article {...itemProps} className="tpl-timeline__entry" data-block>
      {chrome}
      <Dated
        dates={
          <>
            <EditableText
              path={`${path}.start`}
              value={item.start}
              placeholder={PLACEHOLDERS['start']}
            />
            {' - '}
            <EditableText
              path={`${path}.end`}
              value={item.end}
              placeholder={PLACEHOLDERS['end']}
            />
          </>
        }
        place={
          <EditableText
            path={`${path}.location`}
            value={item.location ?? ''}
            placeholder={PLACEHOLDERS['location']}
          />
        }
      >
        <p className="tpl-timeline__role">
          <EditableText
            path={`${path}.title`}
            value={item.title}
            placeholder={PLACEHOLDERS['title']}
          />
        </p>
        <p className="tpl-timeline__org">
          <EditableText
            path={`${path}.company`}
            value={item.company}
            placeholder={PLACEHOLDERS['company']}
          />
        </p>
        <EditableBulletList path={`${path}.bullets`} items={item.bullets} />
      </Dated>
    </article>
  );
}

export function TimelineEducationEntry({
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
    <article {...itemProps} className="tpl-timeline__entry" data-block>
      {chrome}
      <Dated
        dates={
          <>
            <EditableText
              path={`${path}.start`}
              value={item.start ?? ''}
              placeholder={PLACEHOLDERS['start']}
            />
            {item.start && item.end ? ' - ' : ''}
            <EditableText
              path={`${path}.end`}
              value={item.end ?? ''}
              placeholder={PLACEHOLDERS['end']}
            />
          </>
        }
        place={
          <EditableText
            path={`${path}.location`}
            value={item.location ?? ''}
            placeholder={PLACEHOLDERS['location']}
          />
        }
      >
        <p className="tpl-timeline__role">
          <EditableText
            path={`${path}.degree`}
            value={item.degree ?? ''}
            placeholder={PLACEHOLDERS['degree']}
          />
          {item.degree && item.field ? ' in ' : ''}
          <EditableText
            path={`${path}.field`}
            value={item.field ?? ''}
            placeholder={PLACEHOLDERS['field']}
          />
        </p>
        <p className="tpl-timeline__org">
          <EditableText
            path={`${path}.school`}
            value={item.school}
            placeholder={PLACEHOLDERS['school']}
          />
        </p>
      </Dated>
    </article>
  );
}

/** A section the candidate declared: a titled note, two to a row. */
export function TimelineCustomEntry({
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
    <article {...itemProps} className="tpl-timeline__note" data-block>
      {chrome}
      <p className="tpl-timeline__note-title">
        <EditableText
          path={`${path}.title`}
          value={item.title}
          placeholder={PLACEHOLDERS['heading']}
        />
      </p>
      <p className="tpl-timeline__note-detail">
        <EditableText
          path={`${path}.detail`}
          value={item.detail ?? ''}
          placeholder={PLACEHOLDERS['detail']}
        />
      </p>
      <EditableBulletList path={`${path}.bullets`} items={item.bullets} />
    </article>
  );
}
