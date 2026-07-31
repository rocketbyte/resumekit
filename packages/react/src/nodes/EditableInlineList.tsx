import { useEffect, useRef, useState } from 'react';
import { useNode } from '@craftjs/core';
import { LOCKED_RULES } from './locked.js';

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
  const {
    connectors: { connect },
    selected,
    actions: { setProp },
  } = useNode((node) => ({ selected: node.events.selected }));

  const [buffer, setBuffer] = useState<string | null>(null);
  const field = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!selected) setBuffer(null);
    else field.current?.focus();
  }, [selected]);

  const text = buffer ?? items.join(SEPARATOR);

  const change = (next: string) => {
    setBuffer(next);
    setProp((props: EditableInlineListProps) => {
      props.items = split(next);
    }, 500);
  };

  return (
    <span
      ref={(ref) => {
        if (ref) connect(ref);
      }}
      className={selected ? 'tpl-text tpl-grow' : 'tpl-text'}
      data-path={path}
      data-value={selected ? text : undefined}
    >
      {selected ? (
        <textarea
          ref={field}
          className="tpl-input"
          value={text}
          rows={1}
          aria-label={path}
          onChange={(e) => change(e.target.value)}
        />
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
