import type { ReactNode } from 'react';
import type { SkillGroup } from '@resumekit/schema';
import type { ItemRootProps } from '../collections/CollectionItems.js';
import { useAuthoring } from '../collections/authoring-context.js';
import { useEditorText } from '../i18n/index.js';
import { EditableText } from '../nodes/EditableText.js';
import { EditableBulletList } from '../nodes/EditableBulletList.js';

export interface SkillGroupProps {
  item: SkillGroup;
  path: string;
  chrome: ReactNode;
  itemProps: ItemRootProps;
}

/**
 * A skills group the page shows as a group: its category, then its skills.
 * The grid and the tags differ only in their classes and stylesheet.
 *
 * Unlike `BulletSkillGroup`, the group has a heading, so it is an addressable
 * entry with a rail of its own. A group with no category prints no label while
 * read and offers one while authoring.
 */
export function LabelledSkillGroup({
  item,
  path,
  chrome,
  itemProps,
  block,
  list,
}: SkillGroupProps & {
  /** The kit's class for this layout: `tpl-skill-grid` or `tpl-skill-tags`. */
  block: string;
  /** Classes of a wrapper around the skills, when the layout needs one. */
  list?: string;
}) {
  const { placeholder } = useEditorText();
  const authoring = useAuthoring() !== null;
  const labelled = item.category.length > 0 || authoring;
  const skills = (
    <EditableBulletList
      path={`${path}.items`}
      items={item.items}
      placeholder={placeholder('item')}
    />
  );
  return (
    <div
      {...itemProps}
      className={
        labelled ? `${block}__group` : `${block}__group ${block}__group--bare`
      }
      data-block
    >
      {chrome}
      {labelled && (
        <span className={`${block}__label`}>
          <EditableText
            path={`${path}.category`}
            value={item.category}
            placeholder={placeholder('category')}
          />
        </span>
      )}
      {list ? <div className={list}>{skills}</div> : skills}
    </div>
  );
}
