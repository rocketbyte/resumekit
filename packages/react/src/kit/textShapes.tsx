import type { ReactNode } from 'react';

/**
 * How a field's text is drawn when it is not being typed into: the same
 * characters, in spans a stylesheet can set apart. `EditableText` applies it
 * to the value it prints, so reading and editing draw the same thing, and the
 * field stays one field: one path, one value, one caret while it is selected.
 *
 * A shape never adds or drops a character. Extraction, copying and a screen
 * reader see the text exactly as typed.
 */
export type TextShape = (text: string) => ReactNode;

/**
 * A name as given names and surname (`name: { split: true }`): everything
 * before the last word, the space, then the last word, so a design can set the
 * two at different weights. One word is drawn as the surname alone.
 */
export function nameParts(first: string, last: string): TextShape {
  return (text) => {
    const m = /^(\s*)(.*\S)(\s+)(\S+)(\s*)$/s.exec(text);
    if (!m) return <span className={last}>{text}</span>;
    const [, before, given, gap, surname, after] = m;
    return (
      <>
        {before}
        <span className={first}>{given}</span>
        {gap}
        <span className={last}>{surname}</span>
        {after}
      </>
    );
  };
}

/** The first `count` letters of a heading, set apart (`headingAccent: n`). */
export interface HeadingLead {
  count: number;
  className: string;
}

/*
 * Counted in code points, so an accented or astral letter is never cut in
 * half. Whitespace is not counted as a letter of the lead.
 */
export function leadLetters({ count, className }: HeadingLead): TextShape {
  return (text) => {
    const chars = Array.from(text);
    let end = 0;
    for (let seen = 0; end < chars.length && seen < count; end++) {
      if (/\S/.test(chars[end] as string)) seen++;
    }
    if (end === 0) return text;
    return (
      <>
        <span className={className}>{chars.slice(0, end).join('')}</span>
        {chars.slice(end).join('')}
      </>
    );
  };
}
