import type { SkillGroup } from '@cvgs/core';
import { EditableBulletList } from '../nodes/EditableBulletList.js';

/**
 * A skills group as its bullets alone, for the templates that print no
 * category.
 *
 * Deliberately NOT an addressable container: it carries no outline and no
 * rail, because on these pages a group is not a thing a candidate can see. The
 * skills are, and the bullet list edits, adds and removes them one by one.
 * Drawing a box per group here put unlabelled boxes down the section that
 * matched nothing on the page.
 *
 * The group still exists in the collection, so a section with none offers an
 * add — which mints a group with no category, and the new skill simply joins
 * the list.
 */
export function BulletSkillGroup({
  item,
  path,
}: {
  item: SkillGroup;
  path: string;
}) {
  return <EditableBulletList path={`${path}.items`} items={item.items} />;
}
