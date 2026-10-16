import { useMemo, type CSSProperties, type ReactNode } from 'react';
import { ContainerRail } from '../rail/ContainerRail.js';
import { RAIL_KEY } from '../rail/rail-store.js';
import { useSpace, type SpaceTarget } from './spacing-context.js';
import './spacing.css';

/**
 * What an element needs in order to have a gap ABOVE it, and the control for it.
 *
 * Two halves, and neither of them is an element of its own. `rootProps` goes on
 * the résumé's own element — a marker and a step count, no box — and the space
 * itself is drawn by that element's own `margin-top`, which its template already
 * declares and which this only adds to. `handle` is absolutely positioned, so it
 * hangs in the margin above the element and occupies no layout at all.
 *
 * That is the whole point of the shape. A WRAPPER was the obvious way to hold a
 * gap and its control together, and it was wrong twice over: it is a real
 * element, present in the editor and absent from the preview, so the same
 * document measured differently in the two; and it made every entry an only
 * child, which quietly broke `:first-of-type` in Harvard and the `+` rule in
 * Cobalt — the editor drew 4pt above every role where the preview drew 7. A
 * control has no business changing what the document is.
 *
 * MARGIN and not padding: margin sits outside the border box, so the entry's
 * own selection outline is the same box whether or not there is space above it,
 * and the space reads as document between two entries rather than as part of the
 * one below.
 */
export interface SpaceSlot {
  /**
   * Spread onto the résumé element the space sits above.
   *
   * Two markers, because they answer two questions and are true at different
   * times. `data-gap` says this element HOSTS a control — it is what gives the
   * rail a positioning context, and it exists only where the document can be
   * edited. `data-spaced` says this element CARRIES space, which is a fact
   * about the document and so is identically true in the editor, the preview
   * and the export. Rolling them into one meant the editor styled every gap as
   * though it were open.
   */
  rootProps: {
    'data-gap'?: string;
    'data-spaced'?: string;
    'data-rail-key'?: string;
    style?: CSSProperties;
  };
  /**
   * Rendered INSIDE that element, as chrome: a section's rail, which appears
   * only while the section is pointed at or focused. `null` on a read-only
   * document, and for an entry — whose rail its authoring layer draws, with
   * the entry's own actions beside the space control.
   */
  handle: ReactNode;
}

export function useSpaceSlot(target: SpaceTarget, label: string): SpaceSlot {
  const { steps, adjustable } = useSpace(target);
  /*
   * `target` is written inline at nearly every call site — `{ section: 'skills' }`
   * — so it is a new object on every render. Keying the memo on what it SAYS
   * rather than on which object it is keeps the props stable for a document
   * being typed into.
   */
  const key = 'section' in target ? `s:${target.section}` : `p:${target.path}`;

  return useMemo(
    () => ({
      /*
       * A document being READ with no space gets neither marker, no property
       * and no handle — so the export renderer and the saved-résumé view
       * produce exactly the DOM they always did.
       */
      rootProps: {
        ...(adjustable ? { 'data-gap': '' } : {}),
        ...(adjustable && 'section' in target
          ? { [RAIL_KEY]: `s:${target.section}` }
          : {}),
        ...(steps > 0
          ? {
              'data-spaced': '',
              style: { '--tpl-space-steps': steps } as CSSProperties,
            }
          : {}),
      },
      handle:
        adjustable && 'section' in target ? (
          <ContainerRail
            railKey={`s:${target.section}`}
            toolbarLabel={`${label} — section actions`}
            space={{ target, label }}
          />
        ) : null,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [steps, adjustable, key, label],
  );
}
