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
 * Ivy League's entries: the markup for one item of each shape.
 *
 * Two lines per entry, each a pair — the organisation over the role, the place
 * over the dates. That is the reference's whole structure, and it is why every
 * entry here shares one head: an education entry differs from a job only in
 * which fields fill the four corners.
 */

function EntryHead({
  lead,
  trailing,
  role,
  dates,
}: {
  lead: ReactNode;
  trailing: ReactNode;
  role: ReactNode;
  dates: ReactNode;
}) {
  return (
    <div className="tpl-ivy__head">
      <span className="tpl-ivy__org">{lead}</span>
      <span className="tpl-ivy__where">{trailing}</span>
      <span className="tpl-ivy__role">{role}</span>
      <span className="tpl-ivy__dates">{dates}</span>
    </div>
  );
}

export function IvyExperienceEntry({
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
    <article {...itemProps} className="tpl-ivy__entry" data-block>
      {chrome}
      <EntryHead
        lead={
          <EditableText
            path={`${path}.company`}
            value={item.company}
            placeholder={PLACEHOLDERS['company']}
          />
        }
        trailing={
          <EditableText
            path={`${path}.location`}
            value={item.location ?? ''}
            placeholder={PLACEHOLDERS['location']}
          />
        }
        role={
          <EditableText
            path={`${path}.title`}
            value={item.title}
            placeholder={PLACEHOLDERS['title']}
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
      />
      <EditableBulletList path={`${path}.bullets`} items={item.bullets} />
    </article>
  );
}

export function IvyEducationEntry({
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
    <article {...itemProps} className="tpl-ivy__entry" data-block>
      {chrome}
      <EntryHead
        lead={
          <EditableText
            path={`${path}.school`}
            value={item.school}
            placeholder={PLACEHOLDERS['school']}
          />
        }
        trailing={
          <EditableText
            path={`${path}.location`}
            value={item.location ?? ''}
            placeholder={PLACEHOLDERS['location']}
          />
        }
        role={
          <>
            <EditableText
              path={`${path}.degree`}
              value={item.degree ?? ''}
              placeholder={PLACEHOLDERS['degree']}
            />
            {item.degree && item.field ? ', ' : ''}
            <EditableText
              path={`${path}.field`}
              value={item.field ?? ''}
              placeholder={PLACEHOLDERS['field']}
            />
          </>
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
      />
    </article>
  );
}

/** A section the candidate declared, in Ivy League's own pattern. */
export function IvyCustomEntry({
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
    <article {...itemProps} className="tpl-ivy__entry" data-block>
      {chrome}
      <p className="tpl-ivy__role">
        <EditableText
          path={`${path}.title`}
          value={item.title}
          placeholder={PLACEHOLDERS['heading']}
        />
      </p>
      <p className="tpl-ivy__detail">
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
