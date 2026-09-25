import type { SkillGroup } from '@cvgs/core';
import { useEditorText } from '../i18n/index.js';
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
  const { placeholder } = useEditorText();
  return (
    <EditableBulletList
      path={`${path}.items`}
      items={item.items}
      /* A skills row wants a KEYWORD. Guided as a bullet, an empty one asked
         for "what you did, and what changed because of it" — a sentence, in a
         list the page prints as single words. */
      placeholder={placeholder('item')}
    />
  );
}
