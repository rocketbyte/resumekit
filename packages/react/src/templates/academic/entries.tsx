/*
 * GENERATED from academic.template.yaml by @cvgs/resume-templates' template compiler.
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

export function AcademicExperienceEntry({
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
    <article {...itemProps} className="tpl-academic__entry" data-block>
      {chrome}
      <p className="tpl-academic__when">
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
      <div className="tpl-academic__what">
        <p className="tpl-academic__lead">
          <strong className="tpl-academic__title">
            <EditableText
              path={`${path}.title`}
              value={item.title}
              placeholder={placeholder('title')}
            />
          </strong>
          <Separator between={[item.title, item.company]} text=", " />
          <em className="tpl-academic__org">
            <EditableText
              path={`${path}.company`}
              value={item.company}
              placeholder={placeholder('company')}
            />
          </em>
          <Separator between={[item.company, item.location]} text=", " />
          <EditableText
            path={`${path}.location`}
            value={item.location ?? ''}
            placeholder={placeholder('location')}
          />
        </p>
        <EditableBulletList path={`${path}.bullets`} items={item.bullets} />
      </div>
    </article>
  );
}

export function AcademicEducationEntry({
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
    <article {...itemProps} className="tpl-academic__entry" data-block>
      {chrome}
      <p className="tpl-academic__when">
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
      <div className="tpl-academic__what">
        <p className="tpl-academic__lead">
          <strong className="tpl-academic__title">
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
          </strong>
          <Separator between={[item.degree, item.school]} text=", " />
          <em className="tpl-academic__org">
            <EditableText
              path={`${path}.school`}
              value={item.school}
              placeholder={placeholder('school')}
            />
          </em>
          <Separator between={[item.school, item.location]} text=", " />
          <EditableText
            path={`${path}.location`}
            value={item.location ?? ''}
            placeholder={placeholder('location')}
          />
        </p>
      </div>
    </article>
  );
}

export function AcademicCustomEntry({
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
    <article {...itemProps} className="tpl-academic__entry" data-block>
      {chrome}
      <div className="tpl-academic__what">
        <p className="tpl-academic__lead">
          <strong className="tpl-academic__title">
            <EditableText
              path={`${path}.title`}
              value={item.title}
              placeholder={placeholder('heading')}
            />
          </strong>
          <Separator between={[item.title, item.detail]} text=", " />
          <em className="tpl-academic__org">
            <EditableText
              path={`${path}.detail`}
              value={item.detail ?? ''}
              placeholder={placeholder('detail')}
            />
          </em>
        </p>
        <EditableBulletList path={`${path}.bullets`} items={item.bullets} />
      </div>
    </article>
  );
}
