import type { ReactNode } from 'react';
import { type CustomEntry, type Education, type Experience } from '@cvgs/core';
import type { ItemRootProps } from '../../collections/CollectionItems.js';
import { EditableText } from '../../nodes/EditableText.js';
import { EditableBulletList } from '../../nodes/EditableBulletList.js';
import { useEditorText } from '../../i18n/index.js';
import { Separator } from '../../kit/Separator.js';

/**
 * Classic's entries.
 *
 * The reference leads with what was DONE — the role, then the employer in the
 * accent beneath it — and keeps place and dates in a quiet column at the right.
 * Education is the same shape with the qualification leading, so both share one
 * head.
 */
function EntryHead({
  lead,
  support,
  place,
  dates,
}: {
  lead: ReactNode;
  support: ReactNode;
  place: ReactNode;
  dates: ReactNode;
}) {
  return (
    <div className="tpl-classic__head">
      <div>
        <p className="tpl-classic__lead">{lead}</p>
        <p className="tpl-classic__support">{support}</p>
      </div>
      <div className="tpl-classic__aside">
        <p className="tpl-classic__place">{place}</p>
        <p className="tpl-classic__dates">{dates}</p>
      </div>
    </div>
  );
}

export function ClassicExperienceEntry({
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
    <article {...itemProps} className="tpl-classic__entry" data-block>
      {chrome}
      <EntryHead
        lead={
          <EditableText
            path={`${path}.title`}
            value={item.title}
            placeholder={placeholder('title')}
          />
        }
        support={
          <EditableText
            path={`${path}.company`}
            value={item.company}
            placeholder={placeholder('company')}
          />
        }
        place={
          <EditableText
            path={`${path}.location`}
            value={item.location ?? ''}
            placeholder={placeholder('location')}
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

export function ClassicEducationEntry({
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
    <article {...itemProps} className="tpl-classic__entry" data-block>
      {chrome}
      <EntryHead
        lead={
          <>
            <EditableText
              path={`${path}.degree`}
              value={item.degree ?? ''}
              placeholder={placeholder('degree')}
            />
            <Separator between={[item.degree, item.field]} word="degreeField" />
            <EditableText
              path={`${path}.field`}
              value={item.field ?? ''}
              placeholder={placeholder('field')}
            />
          </>
        }
        support={
          <EditableText
            path={`${path}.school`}
            value={item.school}
            placeholder={placeholder('school')}
          />
        }
        place={
          <EditableText
            path={`${path}.location`}
            value={item.location ?? ''}
            placeholder={placeholder('location')}
          />
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

/**
 * A section the candidate declared: the title in the accent over its detail,
 * two to a row. The grid is the template's own — see `classic.css`, which also
 * moves the right column's rail out to the right margin.
 */
export function ClassicCustomEntry({
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
    <article {...itemProps} className="tpl-classic__note" data-block>
      {chrome}
      <p className="tpl-classic__note-title">
        <EditableText
          path={`${path}.title`}
          value={item.title}
          placeholder={placeholder('heading')}
        />
      </p>
      <p className="tpl-classic__note-detail">
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
