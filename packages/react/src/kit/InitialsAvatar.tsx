import { monogram } from './monogram.js';
import './avatar.css';

/**
 * The candidate's initials, where a design shows a portrait.
 *
 * A résumé stores no photograph, and one cannot be invented — but the slot is
 * part of the design, and leaving it empty is a hole in the page. So the
 * initials are drawn there, derived from the name printed beside them, which
 * means they can never disagree with it.
 *
 * `aria-hidden`, and no text of its own that a parser would read: the name is
 * real text a few millimetres away, and an extracted "IW" between it and the
 * headline would be noise in the one place a screening system is strictest.
 */
export function InitialsAvatar({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  return (
    <p
      className={['tpl-avatar', className].filter(Boolean).join(' ')}
      aria-hidden="true"
    >
      {monogram(name)}
    </p>
  );
}
