/*
 * GENERATED from executive.template.yaml by @cvgs/resume-templates' template compiler.
 * Do not edit: change the description and run the package's
 * `generate-templates` script. `check-templates` fails when they disagree.
 */
import type { ReactNode } from 'react';
import type { ItemRootProps } from '../../collections/CollectionItems.js';
import { type CustomEntry, type Education, type Experience } from '@cvgs/core';
import { EditableText } from '../../nodes/EditableText.js';
import { EditableBulletList } from '../../nodes/EditableBulletList.js';
import { useEditorText } from '../../i18n/index.js';

export function ExecutiveExperienceEntry({
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
  return (
    <article {...itemProps} className="tpl-exec__entry" data-block>
      {chrome}
      <div className="tpl-exec__entry-head">
        <span className="tpl-exec__role">
          <strong>
            <EditableText path={`${path}.title`} value={item.title} />
          </strong>
          <span className="tpl-exec__sep">{'/'}</span>
          <EditableText path={`${path}.company`} value={item.company} />
        </span>
        <span className="tpl-exec__dates">
          <EditableText path={`${path}.start`} value={item.start} />
          {' - '}
          <EditableText path={`${path}.end`} value={item.end} />
        </span>
      </div>
      <EditableBulletList path={`${path}.bullets`} items={item.bullets} />
    </article>
  );
}

export function ExecutiveEducationEntry({
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
    <article {...itemProps} className="tpl-exec__entry" data-block>
      {chrome}
      <div className="tpl-exec__entry-head">
        <span className="tpl-exec__role">
          <strong>
            <EditableText
              path={`${path}.degree`}
              value={item.degree ?? ''}
              placeholder={placeholder('degree')}
            />
          </strong>
          {item.field && (
            <>
              {': '}
              <EditableText path={`${path}.field`} value={item.field} />
            </>
          )}
        </span>
        <span className="tpl-exec__dates">
          <EditableText
            path={`${path}.end`}
            value={item.end ?? ''}
            placeholder={placeholder('end')}
          />
        </span>
      </div>
      <p className="tpl-exec__school">
        <EditableText path={`${path}.school`} value={item.school} />
      </p>
    </article>
  );
}

export function ExecutiveCustomEntry({
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
    <article {...itemProps} className="tpl-exec__entry" data-block>
      {chrome}
      <div className="tpl-exec__entry-head">
        <span className="tpl-exec__role">
          <strong>
            <EditableText
              path={`${path}.title`}
              value={item.title}
              placeholder={placeholder('heading')}
            />
          </strong>
        </span>
        <span className="tpl-exec__dates">
          <EditableText
            path={`${path}.detail`}
            value={item.detail ?? ''}
            placeholder={placeholder('detail')}
          />
        </span>
      </div>
      <EditableBulletList path={`${path}.bullets`} items={item.bullets} />
    </article>
  );
}
