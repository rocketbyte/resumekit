import type { CoverLetter } from '@cvgs/core';
import { useDocumentText } from '../i18n/index.js';
import './letter.css';

export interface LetterDocumentProps {
  letter: CoverLetter;
  /** The date line, already written — see `letterDate`. */
  date: string;
}

/**
 * A cover letter as the page it is sent as: US Letter, one-inch margins,
 * business block format. The one definition the letter view on screen and the
 * exported file both draw.
 */
export function LetterDocument({ letter, date }: LetterDocumentProps) {
  const doc = useDocumentText();
  return (
    <article className="tpl-letter" aria-label={doc.t.letter} lang={doc.locale}>
      <p className="tpl-letter__sender">{letter.signature}</p>
      <p className="tpl-letter__date">{date}</p>
      {letter.recipient && (
        <p className="tpl-letter__recipient">{letter.recipient}</p>
      )}
      <p>{letter.greeting}</p>
      {letter.paragraphs.map((paragraph, i) => (
        <p key={i}>{paragraph}</p>
      ))}
      <p className="tpl-letter__closing">{letter.closing}</p>
      <p className="tpl-letter__signature">{letter.signature}</p>
    </article>
  );
}
