/*
 * GENERATED from prism.template.yaml by @cvgs/resume-templates' template compiler.
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

export function PrismExperienceEntry({
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
    <article {...itemProps} className="tpl-prism__entry" data-block>
      {chrome}
      <p className="tpl-prism__when">
        <EditableText
          path={`${path}.start`}
          value={item.start}
          placeholder={placeholder('start')}
        />
        <Separator between={[item.start, item.end]} text="–" />
        <EditableText
          path={`${path}.end`}
          value={item.end}
          placeholder={placeholder('end')}
        />
      </p>
      <div className="tpl-prism__what">
        <div className="tpl-prism__top">
          <p className="tpl-prism__lead">
            <EditableText
              path={`${path}.company`}
              value={item.company}
              placeholder={placeholder('company')}
            />
            <Separator between={[item.company, item.location]} text=", " />
            <EditableText
              path={`${path}.location`}
              value={item.location ?? ''}
              placeholder={placeholder('location')}
            />
          </p>
          <p className="tpl-prism__aside-note">
            <EditableText
              path={`${path}.title`}
              value={item.title}
              placeholder={placeholder('title')}
            />
          </p>
        </div>
        <EditableBulletList path={`${path}.bullets`} items={item.bullets} />
      </div>
    </article>
  );
}

export function PrismEducationEntry({
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
    <article {...itemProps} className="tpl-prism__entry" data-block>
      {chrome}
      <p className="tpl-prism__when">
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
      <div className="tpl-prism__what">
        <div className="tpl-prism__top">
          <p className="tpl-prism__lead">
            <strong className="tpl-prism__degree">
              <EditableText
                path={`${path}.degree`}
                value={item.degree ?? ''}
                placeholder={placeholder('degree')}
              />
            </strong>
            <Separator between={[item.degree, item.field]} word="degreeField" />
            <EditableText
              path={`${path}.field`}
              value={item.field ?? ''}
              placeholder={placeholder('field')}
            />
          </p>
          <p className="tpl-prism__aside-note">
            <EditableText
              path={`${path}.school`}
              value={item.school}
              placeholder={placeholder('school')}
            />
            <Separator between={[item.school, item.location]} text=", " />
            <EditableText
              path={`${path}.location`}
              value={item.location ?? ''}
              placeholder={placeholder('location')}
            />
          </p>
        </div>
      </div>
    </article>
  );
}

export function PrismCustomEntry({
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
    <article {...itemProps} className="tpl-prism__entry" data-block>
      {chrome}
      <div className="tpl-prism__what">
        <div className="tpl-prism__top">
          <p className="tpl-prism__lead">
            <EditableText
              path={`${path}.title`}
              value={item.title}
              placeholder={placeholder('heading')}
            />
          </p>
          <p className="tpl-prism__aside-note">
            <EditableText
              path={`${path}.detail`}
              value={item.detail ?? ''}
              placeholder={placeholder('detail')}
            />
          </p>
        </div>
        <EditableBulletList path={`${path}.bullets`} items={item.bullets} />
      </div>
    </article>
  );
}
