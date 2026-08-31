import { useEffect, useRef } from 'react';
import { useEditor, useNode } from '@craftjs/core';
import { isSafeLinkTarget } from '@cvgs/core';
import { LOCKED_RULES } from './locked.js';
import { formatClass, formatInk, inkAttr } from './formatting.js';
import { useFieldFormat } from '../presentation-context.js';
import { useAutosave } from '../autosave-context.js';

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
  /**
   * Where this text points, supplied by the DOCUMENT rather than by the
   * candidate's formatting.
   *
   * The résumé already carries `links[]` — a label and a URL — and the templates
   * rendered the label as dead text, so "GitHub" reached an employer as a word
   * they had to retype. This is that URL. A target the candidate attaches to an
   * arbitrary field still arrives through the per-path format; this one is the
   * résumé's own data and needs no candidate action.
   */
  href?: string;
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
  href,
}: EditableTextProps) {
  // Read live, so a formatting change shows the instant it is made — Craft's
  // node props are the text, and only the text.
  const format = useFieldFormat(path);
  /*
   * Whether this tree is being EDITED or merely displayed.
   *
   * It decides what a click on a link means. In the editor a click must select
   * the field — following the link would navigate away from the document the
   * candidate is working on. In a read-only preview there is nothing to select,
   * so the link behaves like a link. The anchor is in the DOM either way, which
   * is what matters for the export: printing emits a Link annotation from the
   * markup, not from the click handler.
   */
  const { editing } = useEditor((state) => ({
    editing: state.options.enabled,
  }));
  const {
    connectors: { connect },
    selected,
    actions: { setProp },
  } = useNode((node) => ({ selected: node.events.selected }));

  /*
   * Typing, so the DEFERRED request: this fires per character, and a field that
   * stored itself on every keystroke would send one write per letter of a job
   * title. `saveSoon` coalesces the burst into the one write the candidate
   * actually meant — the sentence they finished.
   */
  const { saveSoon } = useAutosave();

  const field = useRef<HTMLInputElement & HTMLTextAreaElement>(null);

  // Selection is what reveals the field, so the click that selected it has to
  // land in it — otherwise editing takes two clicks everywhere.
  useEffect(() => {
    if (selected) field.current?.focus();
  }, [selected]);

  const change = (next: string) => {
    setProp((props: EditableTextProps) => {
      // A line stays a line. Pasting three lines of a signature block into a
      // job title should give a job title, not a résumé with a hole in it.
      props.value = multiline ? next : next.replace(/\s*\n\s*/g, ' ');
    }, 500);
    saveSoon();
  };

  if (!selected) {
    const text = value.length > 0 ? value : (placeholder ?? '');
    /*
     * The résumé's own link wins over a candidate-applied one: a `links[]` entry
     * IS the address for that field, and a format that disagreed with it would
     * be two answers to one question.
     */
    const raw = href ?? format?.href;
    const target = raw && isSafeLinkTarget(raw) ? raw : undefined;
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
        {/*
         * An ANCHOR when the field points somewhere.
         *
         * Rendered in the unselected state, which is the state that prints —
         * the editor clears selection before `beforeprint` precisely so the
         * document on paper is plain semantic markup. That is what makes the
         * link followable in the exported PDF: browsers emit a Link annotation
         * for an `<a href>` when printing, so the export path needs no PDF
         * library and no second rendering.
         *
         * `rel` is set because the exported document is opened in readers this
         * product does not control. The target is validated in `libs/core`, so
         * a `javascript:` URL never reaches this element.
         */}
        {target ? (
          <a
            className="tpl-text__link"
            href={target}
            rel="noopener noreferrer"
            onClick={(e) => {
              if (editing) e.preventDefault();
            }}
          >
            {text}
          </a>
        ) : (
          text
        )}
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
        multiline ? 'tpl-text tpl-grow' : 'tpl-text tpl-grow tpl-grow--inline',
      )}
      style={formatInk(format)}
      data-ink={inkAttr(format)}
      data-path={path}
      /*
       * What the grow mirror renders invisibly behind the field, so the box is
       * exactly the size of the content it holds — height for a paragraph,
       * WIDTH for a line.
       *
       * A line's mirror falls back to the placeholder, because an empty field
       * whose box is the width of its (empty) value is a two-pixel target with
       * a placeholder spilling out of it. What the candidate is invited to
       * click is the words, so the words are what the box is cut to.
       */
      data-value={multiline ? value : value.length > 0 ? value : placeholder}
    >
      {/*
       * A TEXTAREA for every field, a line as much as a paragraph.
       *
       * A line used to be an `<input>`, and an input cannot wrap. That was
       * invisible while every field was full-width, and became the defect the
       * moment they were not: three of the templates put a link's URL into a
       * 153pt rail where the static text wraps to three lines, and clicking it
       * collapsed the text to the one line an input can show. Same box, edited
       * or not, is the rule this file exists for — and only a textarea can keep
       * it for text that wraps.
       *
       * What made an input the right element was that it holds one line. That
       * is a RULE about the value, not a reason to pick a widget, so it is
       * enforced as one: Enter is refused, and a pasted newline is flattened in
       * `change` above.
       *
       * `cols`, like the `size` it replaces, is what stops the widget having an
       * opinion about its own width — a textarea's intrinsic width is twenty
       * characters, and in an inline grid that is what would size the column
       * rather than the mirror.
       */}
      <textarea
        ref={field}
        className="tpl-input"
        value={value}
        rows={1}
        cols={1}
        placeholder={placeholder}
        aria-label={path}
        onChange={(e) => change(e.target.value)}
        onKeyDown={(e) => {
          if (!multiline && e.key === 'Enter') e.preventDefault();
        }}
      />
    </span>
  );
}

EditableText.craft = {
  displayName: 'EditableText',
  rules: LOCKED_RULES,
};
