/*
 * GENERATED from hipster.template.yaml by @resumekit/react's template compiler.
 * Do not edit: change the description and run the package's
 * `generate-templates` script. `check-templates` fails when they disagree.
 */
import type { ReactNode } from 'react';
import type { ItemRootProps } from '../../collections/CollectionItems.js';
import {
  type CustomEntry,
  type Education,
  type Experience,
} from '@resumekit/schema';
import { EditableText } from '../../nodes/EditableText.js';
import { EditableBulletList } from '../../nodes/EditableBulletList.js';
import { useEditorText } from '../../i18n/index.js';
import { Separator } from '../../kit/Separator.js';

export function HipsterExperienceEntry({
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
    <article {...itemProps} className="tpl-hipster__entry" data-block>
      {chrome}
      <p className="tpl-hipster__when">
        <EditableText
          path={`${path}.start`}
          value={item.start}
          placeholder={placeholder('start')}
        />
        {'–'}
        <EditableText
          path={`${path}.end`}
          value={item.end}
          placeholder={placeholder('end')}
        />
      </p>
      <div className="tpl-hipster__event">
        <p className="tpl-hipster__title">
          <EditableText
            path={`${path}.title`}
            value={item.title}
            placeholder={placeholder('title')}
          />
        </p>
        <p className="tpl-hipster__meta">
          <span className="tpl-hipster__org">
            <EditableText
              path={`${path}.company`}
              value={item.company}
              placeholder={placeholder('company')}
            />
          </span>
          <Separator between={[item.company, item.location]} text=" · " />
          <span className="tpl-hipster__place">
            <EditableText
              path={`${path}.location`}
              value={item.location ?? ''}
              placeholder={placeholder('location')}
            />
          </span>
        </p>
        <EditableBulletList path={`${path}.bullets`} items={item.bullets} />
      </div>
    </article>
  );
}

export function HipsterEducationEntry({
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
    <article {...itemProps} className="tpl-hipster__entry" data-block>
      {chrome}
      <p className="tpl-hipster__when">
        <EditableText
          path={`${path}.start`}
          value={item.start ?? ''}
          placeholder={placeholder('start')}
        />
        <Separator between={[item.start, item.end]} text="–" />
        <EditableText
          path={`${path}.end`}
          value={item.end ?? ''}
          placeholder={placeholder('end')}
        />
      </p>
      <div className="tpl-hipster__event">
        <p className="tpl-hipster__title">
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
        <p className="tpl-hipster__meta">
          <span className="tpl-hipster__school">
            <EditableText
              path={`${path}.school`}
              value={item.school}
              placeholder={placeholder('school')}
            />
          </span>
          <Separator between={[item.school, item.location]} text=" · " />
          <span className="tpl-hipster__place">
            <EditableText
              path={`${path}.location`}
              value={item.location ?? ''}
              placeholder={placeholder('location')}
            />
          </span>
        </p>
      </div>
    </article>
  );
}

export function HipsterCustomEntry({
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
    <article {...itemProps} className="tpl-hipster__entry" data-block>
      {chrome}
      <div className="tpl-hipster__event">
        <p className="tpl-hipster__title">
          <EditableText
            path={`${path}.title`}
            value={item.title}
            placeholder={placeholder('heading')}
          />
        </p>
        <p className="tpl-hipster__meta">
          <EditableText
            path={`${path}.detail`}
            value={item.detail ?? ''}
            placeholder={placeholder('detail')}
          />
        </p>
        <EditableBulletList path={`${path}.bullets`} items={item.bullets} />
      </div>
    </article>
  );
}
