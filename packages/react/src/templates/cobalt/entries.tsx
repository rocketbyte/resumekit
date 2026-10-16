/*
 * GENERATED from cobalt.template.yaml by @cvgs/resume-templates' template compiler.
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

export function CobaltExperienceEntry({
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
    <article {...itemProps} className="tpl-cob__entry" data-block>
      {chrome}
      <p className="tpl-cob__entry-lead">
        <EditableText path={`${path}.company`} value={item.company} />
      </p>
      <p className="tpl-cob__entry-meta">
        <em className="tpl-cob__role">
          <EditableText path={`${path}.title`} value={item.title} />
        </em>
        <Separator between={[item.title, item.location]} text=" | " />
        <EditableText
          path={`${path}.location`}
          value={item.location ?? ''}
          placeholder={placeholder('location')}
        />
        <span className="tpl-cob__dates">
          <EditableText path={`${path}.start`} value={item.start} />
          {' - '}
          <EditableText path={`${path}.end`} value={item.end} />
        </span>
      </p>
      <EditableBulletList path={`${path}.bullets`} items={item.bullets} />
    </article>
  );
}

export function CobaltEducationEntry({
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
    <article {...itemProps} className="tpl-cob__entry" data-block>
      {chrome}
      <p className="tpl-cob__entry-lead">
        <EditableText
          path={`${path}.degree`}
          value={item.degree ?? ''}
          placeholder={placeholder('degree')}
        />
      </p>
      <p className="tpl-cob__entry-org">
        <EditableText path={`${path}.school`} value={item.school} />
      </p>
      <p className="tpl-cob__entry-where">
        <EditableText
          path={`${path}.location`}
          value={item.location ?? ''}
          placeholder={placeholder('location')}
        />
      </p>
      {(item.field || item.end) && (
        <p className="tpl-cob__entry-when">
          {item.field && (
            <EditableText path={`${path}.field`} value={item.field} />
          )}
          {item.field && item.end && ', '}
          {item.end && <EditableText path={`${path}.end`} value={item.end} />}
        </p>
      )}
    </article>
  );
}

export function CobaltCustomEntry({
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
    <article {...itemProps} className="tpl-cob__entry" data-block>
      {chrome}
      <p className="tpl-cob__entry-lead">
        <EditableText
          path={`${path}.title`}
          value={item.title}
          placeholder={placeholder('heading')}
        />
      </p>
      <p className="tpl-cob__entry-meta">
        <em className="tpl-cob__role">
          <EditableText
            path={`${path}.detail`}
            value={item.detail ?? ''}
            placeholder={placeholder('detail')}
          />
        </em>
      </p>
      <EditableBulletList path={`${path}.bullets`} items={item.bullets} />
    </article>
  );
}
