import { monogram } from './monogram.js';

/**
 * An employer's initials, where a design shows its logo.
 *
 * A résumé stores no logos, and fetching one would mean a network request from
 * a renderer that resolves no URLs — the property that keeps a crafted résumé
 * from steering it anywhere. So the chip carries the initials of the name the
 * entry already prints.
 *
 * `aria-hidden`, and nothing for a parser to read: the employer's name is real
 * text beside it.
 */
export function InitialsChip({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  return (
    <span
      className={['tpl-chip', className].filter(Boolean).join(' ')}
      aria-hidden="true"
    >
      {monogram(name)}
    </span>
  );
}
