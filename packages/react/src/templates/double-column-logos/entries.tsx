import type { ReactNode } from 'react';
import { type CustomEntry, type Education, type Experience } from '@cvgs/core';
import type { ItemRootProps } from '../../collections/CollectionItems.js';
import { EditableText } from '../../nodes/EditableText.js';
import { EditableBulletList } from '../../nodes/EditableBulletList.js';
import { InitialsChip } from '../../kit/InitialsChip.js';
import { useEditorText } from '../../i18n/index.js';

/**
 * Double Column with Logos' entries: a mark beside the employer, then the
 * role, then the employer in the accent with the dates and the place.
 *
 * The mark is the employer's initials — see `InitialsChip`, which explains why
 * it cannot be a logo.
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
    <p className="tpl-dcl__meta">
      <span className="tpl-dcl__org">{org}</span>
      {/* Real characters between the facts, so the extracted line reads as
          three things rather than as one run-on. */}
      <span className="tpl-dcl__meta-item">{dates}</span>
      <span className="tpl-dcl__meta-item">{place}</span>
    </p>
  );
}

export function DoubleColumnLogosExperienceEntry({
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
    <article {...itemProps} className="tpl-dcl__entry" data-block>
      {chrome}
      <InitialsChip name={item.company} className="tpl-dcl__mark" />
      <p className="tpl-dcl__role">
        <EditableText
          path={`${path}.title`}
          value={item.title}
          placeholder={placeholder('title')}
        />
      </p>
      <MetaLine
        org={
          <EditableText
            path={`${path}.company`}
            value={item.company}
            placeholder={placeholder('company')}
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
        place={
          <EditableText
            path={`${path}.location`}
            value={item.location ?? ''}
            placeholder={placeholder('location')}
          />
        }
      />
      <EditableBulletList path={`${path}.bullets`} items={item.bullets} />
    </article>
  );
}

export function DoubleColumnLogosEducationEntry({
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
    <article {...itemProps} className="tpl-dcl__entry" data-block>
      {chrome}
      <InitialsChip name={item.school} className="tpl-dcl__mark" />
      <p className="tpl-dcl__role">
        <EditableText
          path={`${path}.degree`}
          value={item.degree ?? ''}
          placeholder={placeholder('degree')}
        />
        {item.degree && item.field ? ' in ' : ''}
        <EditableText
          path={`${path}.field`}
          value={item.field ?? ''}
          placeholder={placeholder('field')}
        />
      </p>
      <MetaLine
        org={
          <EditableText
            path={`${path}.school`}
            value={item.school}
            placeholder={placeholder('school')}
          />
        }
        dates={
          <>
            <EditableText
              path={`${path}.start`}
              value={item.start ?? ''}
              placeholder={placeholder('start')}
            />
            {item.start && item.end ? ' - ' : ''}
            <EditableText
              path={`${path}.end`}
              value={item.end ?? ''}
              placeholder={placeholder('end')}
            />
          </>
        }
        place={
          <EditableText
            path={`${path}.location`}
            value={item.location ?? ''}
            placeholder={placeholder('location')}
          />
        }
      />
    </article>
  );
}

/** A section the candidate declared: a titled note, as the rail sets them. */
export function DoubleColumnLogosCustomEntry({
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
    <article {...itemProps} className="tpl-dcl__note" data-block>
      {chrome}
      <p className="tpl-dcl__note-title">
        <EditableText
          path={`${path}.title`}
          value={item.title}
          placeholder={placeholder('heading')}
        />
      </p>
      <p className="tpl-dcl__note-detail">
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
