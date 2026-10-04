import {
  LabelledSkillGroup,
  type SkillGroupProps,
} from './LabelledSkillGroup.js';

/**
 * A skills group as its category over a run of underlined tags. The group's
 * shape is `skill-tags.css` and the tags are `tpl-keywords--tags`, the same
 * tags an unlabelled run draws; drawn inside a `tpl-skill-tags` list.
 */
export function TagSkillGroup(props: SkillGroupProps) {
  return (
    <LabelledSkillGroup
      {...props}
      block="tpl-skill-tags"
      list="tpl-keywords tpl-keywords--tags"
    />
  );
}
