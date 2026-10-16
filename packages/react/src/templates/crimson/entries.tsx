/*
 * GENERATED from crimson.template.yaml by @resumekit/react's template compiler.
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

export function CrimsonExperienceEntry({
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
    <article {...itemProps} className="tpl-crimson__entry" data-block>
      {chrome}
      <div className="tpl-crimson__entry-head">
        <p className="tpl-crimson__org">
          <EditableText
            path={`${path}.company`}
            value={item.company}
            placeholder={placeholder('company')}
          />
        </p>
        <p className="tpl-crimson__where">
          <EditableText
            path={`${path}.location`}
            value={item.location ?? ''}
            placeholder={placeholder('location')}
          />
        </p>
        <p className="tpl-crimson__role">
          <EditableText
            path={`${path}.title`}
            value={item.title}
            placeholder={placeholder('title')}
          />
        </p>
        <p className="tpl-crimson__dates">
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
      </div>
      <EditableBulletList path={`${path}.bullets`} items={item.bullets} />
    </article>
  );
}

export function CrimsonEducationEntry({
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
    <article {...itemProps} className="tpl-crimson__entry" data-block>
      {chrome}
      <div className="tpl-crimson__entry-head">
        <p className="tpl-crimson__org">
          <EditableText
            path={`${path}.school`}
            value={item.school}
            placeholder={placeholder('school')}
          />
        </p>
        <p className="tpl-crimson__where">
          <EditableText
            path={`${path}.location`}
            value={item.location ?? ''}
            placeholder={placeholder('location')}
          />
        </p>
        <p className="tpl-crimson__role">
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
        <p className="tpl-crimson__dates">
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
      </div>
    </article>
  );
}

export function CrimsonCustomEntry({
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
    <article {...itemProps} className="tpl-crimson__entry" data-block>
      {chrome}
      <div className="tpl-crimson__entry-head">
        <p className="tpl-crimson__org">
          <EditableText
            path={`${path}.title`}
            value={item.title}
            placeholder={placeholder('heading')}
          />
        </p>
        <p className="tpl-crimson__role">
          <EditableText
            path={`${path}.detail`}
            value={item.detail ?? ''}
            placeholder={placeholder('detail')}
          />
        </p>
      </div>
      <EditableBulletList path={`${path}.bullets`} items={item.bullets} />
    </article>
  );
}
