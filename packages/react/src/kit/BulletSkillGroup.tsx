import type { ReactNode } from 'react';
import type { SkillGroup } from '@cvgs/core';
import type { ItemRootProps } from '../collections/CollectionItems.js';
import { EditableBulletList } from '../nodes/EditableBulletList.js';

/**
 * A skills group drawn as its bullets alone, for the templates whose keyword
 * lists print no category. Still an item of the skills collection, so it
 * carries the same rail — add, move, remove — as a group that shows one.
 */
export function BulletSkillGroup({
  item,
  path,
  chrome,
  itemProps,
  className,
}: {
  item: SkillGroup;
  path: string;
  chrome: ReactNode;
  itemProps: ItemRootProps;
  className?: string;
}) {
  return (
    <div {...itemProps} className={className}>
      {chrome}
      <EditableBulletList path={`${path}.items`} items={item.items} />
    </div>
  );
}
