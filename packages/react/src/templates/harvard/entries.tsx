/*
 * GENERATED from harvard.template.yaml by @cvgs/resume-templates' template compiler.
 * Do not edit: change the description and run the package's
 * `generate-templates` script. `check-templates` fails when they disagree.
 */
import type { ReactNode } from 'react';
import type { ItemRootProps } from '../../collections/CollectionItems.js';
import {
  type CustomEntry,
  type Education,
  type Experience,
  type SkillGroup,
} from '@cvgs/core';
import { EditableText } from '../../nodes/EditableText.js';
import { EditableBulletList } from '../../nodes/EditableBulletList.js';
import { EditableInlineList } from '../../nodes/EditableInlineList.js';
import { useEditorText } from '../../i18n/index.js';
import { Separator } from '../../kit/Separator.js';

export function HarvardExperienceEntry({
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
    <article {...itemProps} className="tpl-harvard__entry" data-block>
      {chrome}
      <div className="tpl-harvard__entry-head">
        <span className="tpl-harvard__org">
          <EditableText
            path={`${path}.company`}
            value={item.company}
            placeholder={placeholder('company')}
          />
        </span>
        <span className="tpl-harvard__where">
          <EditableText
            path={`${path}.location`}
            value={item.location ?? ''}
            placeholder={placeholder('location')}
          />
        </span>
        <span className="tpl-harvard__role">
          <EditableText
            path={`${path}.title`}
            value={item.title}
            placeholder={placeholder('title')}
          />
        </span>
        <span className="tpl-harvard__dates">
          <EditableText
            path={`${path}.start`}
            value={item.start}
            placeholder={placeholder('start')}
          />
          {' – '}
          <EditableText
            path={`${path}.end`}
            value={item.end}
            placeholder={placeholder('end')}
          />
        </span>
      </div>
      <EditableBulletList path={`${path}.bullets`} items={item.bullets} />
    </article>
  );
}

export function HarvardEducationEntry({
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
    <article {...itemProps} className="tpl-harvard__entry" data-block>
      {chrome}
      <div className="tpl-harvard__entry-head">
        <span className="tpl-harvard__org">
          <EditableText
            path={`${path}.school`}
            value={item.school}
            placeholder={placeholder('school')}
          />
        </span>
        <span className="tpl-harvard__where">
          <EditableText
            path={`${path}.location`}
            value={item.location ?? ''}
            placeholder={placeholder('location')}
          />
        </span>
        <span className="tpl-harvard__role">
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
        </span>
        <span className="tpl-harvard__dates">
          <EditableText
            path={`${path}.start`}
            value={item.start ?? ''}
            placeholder={placeholder('start')}
          />
          <Separator between={[item.start, item.end]} text=" – " />
          <EditableText
            path={`${path}.end`}
            value={item.end ?? ''}
            placeholder={placeholder('end')}
          />
        </span>
      </div>
    </article>
  );
}

export function HarvardSkillGroup({
  item,
  path,
  chrome,
  itemProps,
}: {
  item: SkillGroup;
  path: string;
  chrome: ReactNode;
  itemProps: ItemRootProps;
}) {
  const { placeholder } = useEditorText();
  return (
    <li {...itemProps} className="tpl-harvard__skill-group">
      {chrome}
      <span className="tpl-harvard__skill-label">
        <EditableText
          path={`${path}.category`}
          value={item.category}
          placeholder={placeholder('category')}
        />
        {':'}
      </span>{' '}
      <EditableInlineList
        path={`${path}.items`}
        items={item.items}
        placeholder={placeholder('items')}
      />
    </li>
  );
}

export function HarvardCustomEntry({
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
    <article {...itemProps} className="tpl-harvard__entry" data-block>
      {chrome}
      <div className="tpl-harvard__entry-head">
        <span className="tpl-harvard__org">
          <EditableText
            path={`${path}.title`}
            value={item.title}
            placeholder={placeholder('heading')}
          />
        </span>
        <span className="tpl-harvard__dates" />
        <span className="tpl-harvard__role">
          <EditableText
            path={`${path}.detail`}
            value={item.detail ?? ''}
            placeholder={placeholder('detail')}
          />
        </span>
        <span className="tpl-harvard__where" />
      </div>
      <EditableBulletList path={`${path}.bullets`} items={item.bullets} />
    </article>
  );
}
