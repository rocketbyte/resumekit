import type { ReactNode } from 'react';
import { type CustomEntry, type Education, type Experience } from '@cvgs/core';
import type { ItemRootProps } from '../../collections/CollectionItems.js';
import { EditableText } from '../../nodes/EditableText.js';
import { EditableBulletList } from '../../nodes/EditableBulletList.js';
import { useEditorText } from '../../i18n/index.js';
import { Separator } from '../../kit/Separator.js';

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
  const { placeholder } = useEditorText();
  return (
    <article {...itemProps} className="tpl-ivy__entry" data-block>
      {chrome}
      <EntryHead
        lead={
          <EditableText
            path={`${path}.company`}
            value={item.company}
            placeholder={placeholder('company')}
          />
        }
        trailing={
          <EditableText
            path={`${path}.location`}
            value={item.location ?? ''}
            placeholder={placeholder('location')}
          />
        }
        role={
          <EditableText
            path={`${path}.title`}
            value={item.title}
            placeholder={placeholder('title')}
          />
        }
        dates={
          <>
            <EditableText
              path={`${path}.start`}
              value={item.start}
              placeholder={placeholder('start')}
            />
            {' - '}
            <EditableText
              path={`${path}.end`}
              value={item.end}
              placeholder={placeholder('end')}
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
  const { placeholder } = useEditorText();
  return (
    <article {...itemProps} className="tpl-ivy__entry" data-block>
      {chrome}
      <EntryHead
        lead={
          <EditableText
            path={`${path}.school`}
            value={item.school}
            placeholder={placeholder('school')}
          />
        }
        trailing={
          <EditableText
            path={`${path}.location`}
            value={item.location ?? ''}
            placeholder={placeholder('location')}
          />
        }
        role={
          <>
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
          </>
        }
        dates={
          <>
            <EditableText
              path={`${path}.start`}
              value={item.start ?? ''}
              placeholder={placeholder('start')}
            />
            <Separator between={[item.start, item.end]} text=" - " />
            <EditableText
              path={`${path}.end`}
              value={item.end ?? ''}
              placeholder={placeholder('end')}
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
  const { placeholder } = useEditorText();
  return (
    <article {...itemProps} className="tpl-ivy__entry" data-block>
      {chrome}
      <p className="tpl-ivy__role">
        <EditableText
          path={`${path}.title`}
          value={item.title}
          placeholder={placeholder('heading')}
        />
      </p>
      <p className="tpl-ivy__detail">
        <EditableText
          path={`${path}.detail`}
          value={item.detail ?? ''}
          placeholder={placeholder('detail')}
        />
      </p>
      <EditableBulletList path={`${path}.bullets`} items={item.bullets} />
    </article>
  );
}
