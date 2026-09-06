import { isSafeLinkTarget } from '@cvgs/core';
import { useField } from '../fields/field-registry.js';
import { formatClass, formatInk, inkAttr } from './formatting.js';
import { useFieldFormat } from '../presentation-context.js';
import { PlainTextField } from './PlainTextField.js';
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
  value: given,
  placeholder,
  multiline,
  href,
}: EditableTextProps) {
  // Read live, so a formatting change shows the instant it is made — a field's
  // value is the text, and only the text.
  const format = useFieldFormat(path);
  /*
   * The field, by its path in the résumé.
   *
   * `editing` decides what a click on a link means. In the editor a click must
   * select the field — following the link would navigate away from the document
   * the candidate is working on. In a read-only preview there is nothing to
   * select, so the link behaves like a link. The anchor is in the DOM either
   * way, which is what matters for the export: printing emits a Link annotation
   * from the markup, not from the click handler.
   */
  const { value, editing, selected, select, set } = useField(path, given);

  /*
   * Typing, so the DEFERRED request: this fires per character, and a field that
   * stored itself on every keystroke would send one write per letter of a job
   * title. `saveSoon` coalesces the burst into the one write the candidate
   * actually meant — the sentence they finished.
   */
  const { saveSoon } = useAutosave();

  const change = (next: string) => {
    // A line stays a line. Pasting three lines of a signature block into a job
    // title should give a job title, not a résumé with a hole in it.
    set(multiline ? next : next.replace(/\s*\n\s*/g, ' '));
    saveSoon();
  };

  /*
   * A press selects the field. Craft's `connect` used to attach this; without
   * it the element is ordinary markup and has to say so itself.
   *
   * `mousedown` rather than `click`, and NOT prevented: the browser places the
   * caret where the candidate pressed, and this puts the field in the state
   * where that caret is inside a real editable box.
   */
  const onMouseDown = editing ? () => select() : undefined;

  if (!selected) {
    /*
     * The value, and ONLY the value.
     *
     * The placeholder used to stand in here when the field was empty, and it
     * was a real text node — so "Degree", "Field of study" and "YYYY-MM" were
     * painted into the exported PDF and extracted by anything reading it. A
     * résumé that tells a screening system the candidate's degree is "Degree"
     * is worse than one that omits the line.
     *
     * It is drawn by CSS now instead: guidance for a candidate looking at an
     * editor, switched off for the read-only document and for paper, and never
     * part of the text at all.
     */
    const text = value;
    /*
     * The résumé's own link wins over a candidate-applied one: a `links[]` entry
     * IS the address for that field, and a format that disagreed with it would
     * be two answers to one question.
     */
    const raw = href ?? format?.href;
    const target = raw && isSafeLinkTarget(raw) ? raw : undefined;
    return (
      <span
        onMouseDown={onMouseDown}
        className={formatClass(format, 'tpl-text')}
        style={formatInk(format)}
        data-ink={inkAttr(format)}
        data-empty={value.length === 0 || undefined}
        data-placeholder={placeholder}
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
      onMouseDown={onMouseDown}
      /*
       * A plain inline box, and nothing more. The field inside it flows and
       * wraps on its own now, so there is no mirror to measure it and no grid
       * to hold the two of them in the same cell.
       */
      className={formatClass(format, 'tpl-text')}
      style={formatInk(format)}
      data-ink={inkAttr(format)}
      data-path={path}
    >
      <PlainTextField
        value={value}
        placeholder={placeholder}
        multiline={multiline}
        label={path}
        onChange={change}
      />
    </span>
  );
}
