import {
  LabelledSkillGroup,
  type SkillGroupProps,
} from './LabelledSkillGroup.js';

/**
 * A skills group as one row of an invisible table: its category in the label
 * column, its skills in cells. The shape is `skill-grid.css`; drawn inside a
 * `tpl-skill-grid` list.
 *
 * The skills are list items with no separator between them. Chromium drops a
 * hidden separator from the PDF it prints, so what a parser can see is the
 * cell: one skill per cell reads as one skill per line.
 */
export function GridSkillGroup(props: SkillGroupProps) {
  return <LabelledSkillGroup {...props} block="tpl-skill-grid" />;
}
