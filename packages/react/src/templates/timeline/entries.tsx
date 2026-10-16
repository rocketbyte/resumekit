/*
 * GENERATED from timeline.template.yaml by @cvgs/resume-templates' template compiler.
 * Do not edit: change the description and run the package's
 * `generate-templates` script. `check-templates` fails when they disagree.
 */
import type { ReactNode } from 'react';
import type { ItemRootProps } from '../../collections/CollectionItems.js';
import { type CustomEntry, type Education, type Experience } from '@cvgs/core';
import { EditableText } from '../../nodes/EditableText.js';
import { EditableBulletList } from '../../nodes/EditableBulletList.js';
import { useEditorText } from '../../i18n/index.js';
import { Separator } from '../../kit/Separator.js';

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
  const { placeholder } = useEditorText();
  return (
    <article {...itemProps} className="tpl-timeline__entry" data-block>
      {chrome}
      <div className="tpl-timeline__when">
        <p className="tpl-timeline__dates">
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
        </p>
        <p className="tpl-timeline__place">
          <EditableText
            path={`${path}.location`}
            value={item.location ?? ''}
            placeholder={placeholder('location')}
          />
        </p>
      </div>
      <div className="tpl-timeline__spine" aria-hidden="true" />
      <div className="tpl-timeline__what">
        <p className="tpl-timeline__role">
          <EditableText
            path={`${path}.title`}
            value={item.title}
            placeholder={placeholder('title')}
          />
        </p>
        <p className="tpl-timeline__org">
          <EditableText
            path={`${path}.company`}
            value={item.company}
            placeholder={placeholder('company')}
          />
        </p>
        <EditableBulletList path={`${path}.bullets`} items={item.bullets} />
      </div>
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
  const { placeholder } = useEditorText();
  return (
    <article {...itemProps} className="tpl-timeline__entry" data-block>
      {chrome}
      <div className="tpl-timeline__when">
        <p className="tpl-timeline__dates">
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
        </p>
        <p className="tpl-timeline__place">
          <EditableText
            path={`${path}.location`}
            value={item.location ?? ''}
            placeholder={placeholder('location')}
          />
        </p>
      </div>
      <div className="tpl-timeline__spine" aria-hidden="true" />
      <div className="tpl-timeline__what">
        <p className="tpl-timeline__role">
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
        </p>
        <p className="tpl-timeline__org">
          <EditableText
            path={`${path}.school`}
            value={item.school}
            placeholder={placeholder('school')}
          />
        </p>
      </div>
    </article>
  );
}

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
  const { placeholder } = useEditorText();
  return (
    <article {...itemProps} className="tpl-timeline__note" data-block>
      {chrome}
      <p className="tpl-timeline__note-title">
        <EditableText
          path={`${path}.title`}
          value={item.title}
          placeholder={placeholder('heading')}
        />
      </p>
      <p className="tpl-timeline__note-detail">
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
