import { useState } from 'react';
import { useNode } from '@craftjs/core';
import { LOCKED_RULES } from './locked.js';
import { formatClass, formatInk, inkAttr } from './formatting.js';
import { useFieldFormat } from '../presentation-context.js';
import { useAutosave } from '../autosave-context.js';
import { PlainTextField } from './PlainTextField.js';

export interface EditableInlineListProps {
  /** Where this list lives in the `ResumeObject` — e.g. `skills.0.items`. */
  path: string;
  items: string[];
}

/** How a keyword list reads on the page, and how the candidate types it. */
const SEPARATOR = ', ';

function split(text: string): string[] {
  return text
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

/**
 * A keyword list rendered inline — `Node.js, TypeScript, NestJS` — which is how
 * the knowledge base says skills belong on a resume: a flat comma-separated
 * list, no rating bars, no years-per-skill, no grid.
 *
 * While it is being edited the raw text is held locally and the split array is
 * written through to the node on every keystroke. Deriving the displayed text
 * from the array instead would delete the comma the moment it was typed.
 */
export function EditableInlineList({ path, items }: EditableInlineListProps) {
  const format = useFieldFormat(path);
  const {
    connectors: { connect },
    selected,
    actions: { setProp },
  } = useNode((node) => ({ selected: node.events.selected }));

  /* Typing, so deferred — the same bargain `EditableText` makes. */
  const { saveSoon } = useAutosave();

  /*
   * The raw text, held locally while it is being typed.
   *
   * Deriving the displayed text from the array instead would delete the comma
   * the moment it was typed. The field itself is uncontrolled — see
   * `PlainTextField` — so this is only what the UNSELECTED text is read from
   * once the candidate leaves.
   */
  const [buffer, setBuffer] = useState<string | null>(null);

  const text = buffer ?? items.join(SEPARATOR);

  const change = (next: string) => {
    setBuffer(next);
    setProp((props: EditableInlineListProps) => {
      props.items = split(next);
    }, 500);
    saveSoon();
  };

  return (
    <span
      ref={(ref) => {
        if (ref) connect(ref);
      }}
      className={formatClass(format, 'tpl-text')}
      style={formatInk(format)}
      data-ink={inkAttr(format)}
      data-path={path}
    >
      {selected ? (
        /*
         * Keyed on nothing and mounted only while selected, so it re-reads the
         * list each time it is opened and holds its own text in between.
         */
        <PlainTextField value={text} label={path} onChange={change} />
      ) : (
        text
      )}
    </span>
  );
}

EditableInlineList.craft = {
  displayName: 'EditableInlineList',
  rules: LOCKED_RULES,
};
