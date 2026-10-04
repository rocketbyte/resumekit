import type { ReactNode } from 'react';
import type { SkillGroup } from '@cvgs/core';
import type { ItemRootProps } from '../collections/CollectionItems.js';
import { useAuthoring } from '../collections/authoring-context.js';
import { useEditorText } from '../i18n/index.js';
import { EditableText } from '../nodes/EditableText.js';
import { EditableBulletList } from '../nodes/EditableBulletList.js';

/**
 * A skills group as one row of an invisible table: its category in the label
 * column, its skills in cells. The shape is `skill-grid.css`; drawn inside a
 * `tpl-skill-grid` list.
 *
 * Unlike `BulletSkillGroup`, the group is something the page shows — it has a
 * heading — so it is an addressable entry with a rail of its own.
 *
 * The skills are list items with no separator between them. Chromium drops a
 * hidden separator from the PDF it prints, so what a parser can see is the
 * cell: one skill per cell reads as one skill per line.
 */
export function GridSkillGroup({
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
  const authoring = useAuthoring() !== null;
  const labelled = item.category.length > 0 || authoring;
  return (
    <div
      {...itemProps}
      className={
        labelled
          ? 'tpl-skill-grid__group'
          : 'tpl-skill-grid__group tpl-skill-grid__group--bare'
      }
      data-block
    >
      {chrome}
      {labelled && (
        <span className="tpl-skill-grid__label">
          <EditableText
            path={`${path}.category`}
            value={item.category}
            placeholder={placeholder('category')}
          />
        </span>
      )}
      <EditableBulletList
        path={`${path}.items`}
        items={item.items}
        placeholder={placeholder('item')}
      />
    </div>
  );
}
