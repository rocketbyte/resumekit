import { isSafeLinkTarget } from '@cvgs/core';
import { useField } from '../fields/field-registry.js';
import { formatClass, formatInk, inkAttr } from './formatting.js';
import { useFieldFormat } from '../presentation-context.js';
import { PlainTextField } from './PlainTextField.js';
import { useAutosave } from '../autosave-context.js';
import { useDateIssue } from '../fields/date-issues-context.js';
import { useEditorText } from '../i18n/index.js';
import { usePicture } from '../picture-context.js';
import type { TextShape } from '../kit/textShapes.js';

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
   * they had to retype. This is that URL, and it is now the only way a link is
   * MADE: the rail's per-field `href` control is gone, because a link is content
   * and two homes for one fact is what the ranking below exists to paper over.
   * A stored `format.href` is still read, for a document formatted while that
   * control existed.
   */
  href?: string;
  /**
   * Whether this text is typed into HERE.
   *
   * `false` — the default — is every ordinary field: pressing it places a caret
   * in it. `true` registers the field and draws its text exactly as before, and
   * refuses the caret, because the value is set by a control of its own.
   *
   * One caller: a link. A link is a text and an address, and only one of the
   * two is on the page — so typing into the visible half would let a candidate
   * write a label with no way to see or reach what it points at. The document
   * still needs the text to BE a field, though: it is what the save collects
   * and what carries the anchor, and a span outside the registry is neither.
   *
   * So it is not "an input that is disabled". It is the document's own text,
   * which happens to be edited somewhere else — and pressing it is how a
   * candidate gets to that somewhere else, which is the wrapper's business and
   * not this component's.
   */
  readOnly?: boolean;
  /**
   * What this text says when the candidate has written nothing — the
   * template's own word, not guidance.
   *
   * Distinct from `placeholder`, and the difference is the whole point: a
   * placeholder is never stored, never exported and never extractable, while
   * this PRINTS. A section heading is the case — "Experience" is on the page of
   * a résumé nobody has renamed — and declaring it keeps merely opening the
   * document from reading as an edit. See `FieldRegistry.defaults`.
   */
  defaultValue?: string;
  /**
   * How the printed text is divided into spans a stylesheet can set apart — a
   * surname in bold, a heading's first letters in the accent (`kit/textShapes`).
   *
   * Applied wherever the text is drawn, so the editor and the page agree; not
   * while the field is being typed into, where it is one plain run in the
   * field's own style. The characters never change.
   */
  shape?: TextShape;
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
  readOnly = false,
  defaultValue,
  shape,
}: EditableTextProps) {
  // Read live, so a formatting change shows the instant it is made — a field's
  // value is the text, and only the text.
  const format = useFieldFormat(path);
  const picture = usePicture();
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
  const { value, editing, selected, select, set } = useField(
    path,
    given,
    defaultValue,
  );

  /*
   * Typing, so the DEFERRED request: this fires per character, and a field that
   * stored itself on every keystroke would send one write per letter of a job
   * title. `saveSoon` coalesces the burst into the one write the candidate
   * actually meant — the sentence they finished.
   */
  const { saveSoon } = useAutosave();

  /*
   * Whether this field's date disagrees with the résumé's chronological order.
   *
   * Asked BY PATH, which is the address the field already knows itself by — so
   * no template passes anything, and a template added later is covered without
   * being told. Undefined everywhere the provider is not mounted, which is the
   * read-only preview and the export renderer: the marker is editor chrome and
   * must never print.
   */
  const dateIssue = useDateIssue(path);
  const { t } = useEditorText();
  const dateWarning = dateIssue ? t.dateIssues[dateIssue] : undefined;

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
  const onMouseDown = editing && !readOnly ? () => select() : undefined;

  /*
   * A read-only field never enters the typing state, even if something else
   * selected it. Checked here rather than trusted to the handler above: the
   * selection is document-wide and settable by any caller, and "this text is
   * not typed into" is a property of the field rather than of one press.
   */
  if (!selected || readOnly) {
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
    const text = shape && value.length > 0 ? shape(value) : value;
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
        data-placeholder={picture ? undefined : placeholder}
        data-path={picture ? undefined : path}
        /*
         * What was noticed about this date, as an attribute the stylesheet
         * draws and a reader can hear. Never a text node: a message painted
         * into the document would print into the PDF and be read by a parser as
         * the candidate's own words — the mistake `data-placeholder` exists to
         * avoid, made a second time.
         */
        data-issue={dateIssue}
        title={dateWarning}
        aria-description={dateWarning}
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
        {target && picture ? (
          <span className="tpl-text__link">{text}</span>
        ) : target ? (
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
