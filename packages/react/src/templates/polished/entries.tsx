/*
 * GENERATED from polished.template.yaml by @cvgs/resume-templates' template compiler.
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

export function PolishedExperienceEntry({
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
    <article {...itemProps} className="tpl-polished__entry" data-block>
      {chrome}
      <div className="tpl-polished__head">
        <span className="tpl-polished__role">
          <EditableText
            path={`${path}.title`}
            value={item.title}
            placeholder={placeholder('title')}
          />
        </span>
        <span className="tpl-polished__dates">
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
        </span>
        <span className="tpl-polished__org">
          <EditableText
            path={`${path}.company`}
            value={item.company}
            placeholder={placeholder('company')}
          />
        </span>
        <span className="tpl-polished__where">
          <EditableText
            path={`${path}.location`}
            value={item.location ?? ''}
            placeholder={placeholder('location')}
          />
        </span>
      </div>
      <EditableBulletList path={`${path}.bullets`} items={item.bullets} />
    </article>
  );
}

export function PolishedEducationEntry({
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
    <article {...itemProps} className="tpl-polished__entry" data-block>
      {chrome}
      <div className="tpl-polished__head">
        <span className="tpl-polished__role">
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
        </span>
        <span className="tpl-polished__dates">
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
        </span>
        <span className="tpl-polished__org">
          <EditableText
            path={`${path}.school`}
            value={item.school}
            placeholder={placeholder('school')}
          />
        </span>
        <span className="tpl-polished__where">
          <EditableText
            path={`${path}.location`}
            value={item.location ?? ''}
            placeholder={placeholder('location')}
          />
        </span>
      </div>
    </article>
  );
}

export function PolishedCustomEntry({
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
    <article {...itemProps} className="tpl-polished__note" data-block>
      {chrome}
      <p className="tpl-polished__note-title">
        <EditableText
          path={`${path}.title`}
          value={item.title}
          placeholder={placeholder('heading')}
        />
      </p>
      <p className="tpl-polished__note-detail">
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
