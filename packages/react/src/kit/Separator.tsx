import { useAuthoring } from '../collections/authoring-context.js';
import { useDocumentText, type DocumentMessages } from '../i18n/index.js';

type JoinWord = keyof DocumentMessages['joins'];

/**
 * What stands between two fields on one line — ", ", " – ", " in ".
 *
 * Printed only when BOTH sides have a value, so a qualification with no field
 * does not end in a dangling comma. While authoring it is always there: each
 * empty side shows its guidance, and two guidances with nothing between them
 * run together into one unreadable word.
 *
 * `text` is punctuation, the same in every language. `word` is a word, which
 * prints in the document's language.
 */
export function Separator({
  between,
  text,
  word,
}: {
  between: readonly [unknown, unknown];
  text?: string;
  word?: JoinWord;
}) {
  const authoring = useAuthoring() !== null;
  const joins = useDocumentText().t.joins;
  if (!authoring && !(between[0] && between[1])) return null;
  return <>{word ? ` ${joins[word]} ` : text}</>;
}
