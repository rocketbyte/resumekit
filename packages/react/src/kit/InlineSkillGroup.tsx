import { PLACEHOLDERS, type SkillGroup } from '@cvgs/core';
import { EditableInlineList } from '../nodes/EditableInlineList.js';

/**
 * A skills group as its items on a line, for the templates that print skills
 * as one run of keywords.
 *
 * Like `BulletSkillGroup`, not an addressable container: the group is storage,
 * the skills are what the page shows. Its separator is a real character, so a
 * parser reading the exported PDF gets "React · TypeScript" rather than two
 * words run together.
 */
export function InlineSkillGroup({
  item,
  path,
  separator = ', ',
  first,
}: {
  item: SkillGroup;
  path: string;
  /**
   * Written between groups, as text — the same separator the items inside a
   * group use, so several groups read as the one run of keywords the page
   * shows rather than as a list of lists.
   */
  separator?: string;
  first: boolean;
}) {
  return (
    <>
      {!first && separator}
      <EditableInlineList
        path={`${path}.items`}
        items={item.items}
        placeholder={PLACEHOLDERS['items']}
      />
    </>
  );
}
