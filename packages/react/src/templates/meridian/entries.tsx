/*
 * GENERATED from meridian.template.yaml by @resumekit/react's template compiler.
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

export function MeridianExperienceEntry({
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
    <article {...itemProps} className="tpl-mer__entry" data-block>
      {chrome}
      <p className="tpl-mer__entry-line">
        <strong className="tpl-mer__role">
          <EditableText path={`${path}.title`} value={item.title} />
        </strong>
        <span className="tpl-mer__dates">
          {', '}
          <EditableText path={`${path}.start`} value={item.start} />
          {' - '}
          <EditableText path={`${path}.end`} value={item.end} />
        </span>
      </p>
      <p className="tpl-mer__entry-org">
        <EditableText path={`${path}.company`} value={item.company} />
        <Separator between={[item.company, item.location]} text=" - " />
        <EditableText
          path={`${path}.location`}
          value={item.location ?? ''}
          placeholder={placeholder('location')}
        />
      </p>
      <EditableBulletList path={`${path}.bullets`} items={item.bullets} />
    </article>
  );
}

export function MeridianEducationEntry({
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
    <article {...itemProps} className="tpl-mer__entry" data-block>
      {chrome}
      {item.end && (
        <p className="tpl-mer__entry-when">
          <EditableText path={`${path}.end`} value={item.end} />
        </p>
      )}
      <p className="tpl-mer__entry-line">
        <strong className="tpl-mer__role">
          <EditableText
            path={`${path}.degree`}
            value={item.degree ?? ''}
            placeholder={placeholder('degree')}
          />
        </strong>
        {item.field && (
          <>
            {', '}
            <EditableText path={`${path}.field`} value={item.field} />
          </>
        )}
      </p>
      <p className="tpl-mer__entry-org">
        <EditableText path={`${path}.school`} value={item.school} />
        <Separator between={[item.school, item.location]} text=" - " />
        <EditableText
          path={`${path}.location`}
          value={item.location ?? ''}
          placeholder={placeholder('location')}
        />
      </p>
    </article>
  );
}

export function MeridianCustomEntry({
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
    <article {...itemProps} className="tpl-mer__entry" data-block>
      {chrome}
      <p className="tpl-mer__entry-line">
        <strong className="tpl-mer__role">
          <EditableText
            path={`${path}.title`}
            value={item.title}
            placeholder={placeholder('heading')}
          />
        </strong>
        <span className="tpl-mer__dates">
          <EditableText
            path={`${path}.detail`}
            value={item.detail ?? ''}
            placeholder={placeholder('detail')}
          />
        </span>
      </p>
      <EditableBulletList path={`${path}.bullets`} items={item.bullets} />
    </article>
  );
}
