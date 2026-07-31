import { useEffect, useRef } from 'react';
import { useNode } from '@craftjs/core';
import { LOCKED_RULES } from './locked.js';
import { formatClass, formatInk, inkAttr } from './formatting.js';
import { useFieldFormat } from '../presentation-context.js';

export interface EditableTextProps {
  /** Where this text lives in the `ResumeObject` — e.g. `experience.0.title`. */
  path: string;
  value: string;
  /** Shown when the writer had nothing for this field. Never saved. */
  placeholder?: string;
  /**
   * Whether the text wraps. A content property, not a style one: the summary is
   * a paragraph and a job title is a line, and that is true in every template.
   */
  multiline?: boolean;
}

/**
 * One editable string in a template.
 *
 * Unselected it is ordinary document text — semantic, selectable, copyable, and
 * exactly what prints. Selected it becomes a borderless field **in the same
 * box**: `font`, `line-height`, `padding` and `border` are all inherited or
 * zeroed, so nothing on the page moves when the candidate clicks into it.
 *
 * The wrapping variant grows with its content through the grid + `::after`
 * mirror in `template-node.css` rather than through measured `scrollHeight`,
 * which means the field cannot be one pixel off from the text it replaced.
 */
export function EditableText({
  path,
  value,
  placeholder,
  multiline,
}: EditableTextProps) {
  // Read live, so a formatting change shows the instant it is made — Craft's
  // node props are the text, and only the text.
  const format = useFieldFormat(path);
  const {
    connectors: { connect },
    selected,
    actions: { setProp },
  } = useNode((node) => ({ selected: node.events.selected }));

  const field = useRef<HTMLInputElement & HTMLTextAreaElement>(null);

  // Selection is what reveals the field, so the click that selected it has to
  // land in it — otherwise editing takes two clicks everywhere.
  useEffect(() => {
    if (selected) field.current?.focus();
  }, [selected]);

  const change = (next: string) =>
    setProp((props: EditableTextProps) => {
      props.value = next;
    }, 500);

  if (!selected) {
    return (
      <span
        ref={(ref) => {
          if (ref) connect(ref);
        }}
        className={formatClass(format, 'tpl-text')}
        style={formatInk(format)}
        data-ink={inkAttr(format)}
        data-empty={value.length === 0 || undefined}
        data-path={path}
      >
        {value.length > 0 ? value : (placeholder ?? '')}
      </span>
    );
  }

  return (
    <span
      ref={(ref) => {
        if (ref) connect(ref);
      }}
      className={formatClass(
        format,
        multiline ? 'tpl-text tpl-grow' : 'tpl-text',
      )}
      style={formatInk(format)}
      data-ink={inkAttr(format)}
      data-path={path}
      // The grow mirror renders this text invisibly behind the textarea, so the
      // box is always exactly as tall as the content it holds.
      data-value={multiline ? value : undefined}
    >
      {multiline ? (
        <textarea
          ref={field}
          className="tpl-input"
          value={value}
          rows={1}
          placeholder={placeholder}
          aria-label={path}
          onChange={(e) => change(e.target.value)}
        />
      ) : (
        <input
          ref={field}
          className="tpl-input"
          type="text"
          value={value}
          placeholder={placeholder}
          aria-label={path}
          onChange={(e) => change(e.target.value)}
        />
      )}
    </span>
  );
}

EditableText.craft = {
  displayName: 'EditableText',
  rules: LOCKED_RULES,
};
