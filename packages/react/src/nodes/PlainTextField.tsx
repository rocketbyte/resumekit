import { useEffect, useRef, useState } from 'react';

/**
 * The field a candidate types a line of the résumé into.
 *
 * It is a `contenteditable` span rather than an `<input>` or a `<textarea>`,
 * and that is the whole reason this component exists. A form control is an
 * ATOMIC inline box: it can be sized to its text and it can sit in the middle
 * of a line, but it cannot be **split across two of them**. On a résumé that is
 * fatal — "Architecture & Quality: Distributed Systems, …" is one line of text
 * that wraps, and a control asked to hold it had to move somewhere it fitted
 * whole, so clicking the skills dropped them below their own category. Sizing
 * the box more cleverly could not fix it; no amount of width makes a single box
 * occupy the end of one line and the start of the next.
 *
 * An editable span is not atomic. It flows, it wraps, and it breaks across
 * lines exactly where the static text it replaces did — which is the rule this
 * whole layer is built on: the same box, edited or not. It also deletes the
 * machinery that was standing in for this. There is no mirror measuring the
 * text, no `cols` neutralising a widget's opinion of its own width, and no
 * inline grid: an inline box is already the size of its content.
 *
 * `plaintext-only` is what keeps it a FIELD rather than a rich-text editor.
 * Pasting styled markup into a plain `contenteditable` brings the markup with
 * it, and a résumé that carries a paste's colours into the PDF is a résumé the
 * candidate cannot see is broken.
 */
export interface PlainTextFieldProps {
  /** The text the field opens with. Read ONCE — see `initial` below. */
  value: string;
  /** Shown while the field is empty. Never part of the value. */
  placeholder?: string;
  /** Whether Enter inserts a line break, or is refused. */
  multiline?: boolean;
  /** The field's accessible name — its path in the résumé. */
  label: string;
  onChange: (next: string) => void;
}

/** One line, flattened: what a multi-line paste becomes in a single-line field. */
const flatten = (text: string) => text.replace(/\s*\n\s*/g, ' ');

export function PlainTextField({
  value,
  placeholder,
  multiline,
  label,
  onChange,
}: PlainTextFieldProps) {
  const el = useRef<HTMLSpanElement>(null);

  /**
   * The text is written into the DOM ONCE, when the field opens, and React is
   * never allowed to write it again.
   *
   * This is the one rule a controlled `contenteditable` cannot break. Re-render
   * it from the value and every keystroke replaces the text node the caret is
   * standing in, so the caret jumps to the start of the field and the candidate
   * types their sentence backwards. Frozen in state, the child React holds is
   * identical on every subsequent render, so it reconciles to nothing and the
   * DOM the browser is editing is left alone.
   *
   * The field is mounted only while it is selected, so "once" means once per
   * visit: selecting it again re-reads whatever the value has become.
   */
  const [initial] = useState(value);
  /* Emptiness is tracked HERE and not read from the value, which arrives up to
     half a second late — the placeholder would still be sitting beside the
     first letter typed over it. */
  const [empty, setEmpty] = useState(value.length === 0);

  /*
   * Selection is what reveals the field, so the click that selected it has to
   * land in it — and the caret goes to the END, where a form control would have
   * put it. Without this the caret sits before the first character and typing
   * prepends.
   */
  useEffect(() => {
    const node = el.current;
    if (!node) return;
    node.focus();
    const selection = window.getSelection?.();
    if (!selection) return;
    const range = document.createRange();
    range.selectNodeContents(node);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  }, []);

  const read = (node: HTMLSpanElement) => {
    const text = node.textContent ?? '';
    setEmpty(text.length === 0);
    onChange(multiline ? text : flatten(text));
  };

  return (
    <span
      ref={el}
      className="tpl-input"
      /*
       * Typed as a plain string because `plaintext-only` is not in every
       * version of React's `contentEditable` union, and the browsers this
       * renders in — including the headless one that produces the PDF — have
       * supported it for years.
       */
      contentEditable={'plaintext-only' as unknown as boolean}
      suppressContentEditableWarning
      role="textbox"
      aria-multiline={multiline || undefined}
      aria-label={label}
      data-placeholder={placeholder}
      data-empty={empty || undefined}
      onInput={(e) => read(e.currentTarget)}
      onKeyDown={(e) => {
        // A line stays a line. The value is flattened too, for the paste that
        // gets a newline in anyway.
        if (!multiline && e.key === 'Enter') e.preventDefault();
      }}
    >
      {initial}
    </span>
  );
}
