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
 * Compact's entries.
 *
 * The reference spends no vertical space on an entry's facts: the role sits on
 * its own line, and the employer, the dates and the place share the next one.
 * That single meta line is what makes the page dense without making it small.
 */
function MetaLine({
  org,
  dates,
  place,
}: {
  org: ReactNode;
  dates: ReactNode;
  place: ReactNode;
}) {
  return (
    <p className="tpl-compact__meta">
      <span className="tpl-compact__org">{org}</span>
      {/* Real characters between the facts, so the extracted line reads as
          three things rather than as one run-on. */}
      <span className="tpl-compact__meta-item">{dates}</span>
      <span className="tpl-compact__meta-item">{place}</span>
    </p>
  );
}

export function CompactExperienceEntry({
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
    <article {...itemProps} className="tpl-compact__entry" data-block>
      {chrome}
      <p className="tpl-compact__role">
        <EditableText
          path={`${path}.title`}
          value={item.title}
          placeholder={PLACEHOLDERS['title']}
        />
      </p>
      <MetaLine
        org={
          <EditableText
            path={`${path}.company`}
            value={item.company}
            placeholder={PLACEHOLDERS['company']}
          />
        }
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
      />
      <EditableBulletList path={`${path}.bullets`} items={item.bullets} />
    </article>
  );
}

export function CompactEducationEntry({
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
    <article {...itemProps} className="tpl-compact__entry" data-block>
      {chrome}
      <p className="tpl-compact__role">
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
      <MetaLine
        org={
          <EditableText
            path={`${path}.school`}
            value={item.school}
            placeholder={PLACEHOLDERS['school']}
          />
        }
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
      />
    </article>
  );
}

/** A section the candidate declared: a titled note, as the rail sets them. */
export function CompactCustomEntry({
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
    <article {...itemProps} className="tpl-compact__note" data-block>
      {chrome}
      <p className="tpl-compact__note-title">
        <EditableText
          path={`${path}.title`}
          value={item.title}
          placeholder={PLACEHOLDERS['heading']}
        />
      </p>
      <p className="tpl-compact__note-detail">
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
