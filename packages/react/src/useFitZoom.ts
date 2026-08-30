import { useLayoutEffect, useState, type RefObject } from 'react';
import { PAGE_WIDTH } from './pagination.js';

/**
 * How much room to leave beside the page.
 *
 * Not decoration: the whole point of this hook is that zooming must never be
 * what introduces a horizontal scrollbar, and a page measured to fit its
 * container exactly is one rounding error away from not fitting. The margin is
 * the width of that error plus the shadow the sheet casts.
 */
const CLEARANCE = 24;

/**
 * The zoom for a given amount of room, as arithmetic.
 *
 * A **view** zoom: it changes how big the document looks and nothing about the
 * document. The résumé's own type scale is a separate, stored control
 * (`document-styling`, #36) that changes the artifact — a candidate who shrank
 * the text to see the whole page would have altered what they send an employer,
 * which is the confusion `editor-usability` (#35) names.
 *
 * Computed rather than chosen. Asking for 15% and taking it would put the page
 * under a horizontal scrollbar on a narrow window, and a document you have to
 * scroll sideways to read is worse than a small one — so the answer is the
 * lesser of what was asked for and what fits, and it is 1 when nothing fits.
 *
 * Rounded DOWN to whole percent, so a resize settles on a value instead of
 * oscillating around a fraction of a pixel.
 *
 * Pure, and separate from the hook below, because this is the part that can be
 * wrong: the horizontal scrollbar this exists to prevent is a question about
 * numbers rather than about the DOM.
 */
export function fitZoom(availableWidth: number, max: number): number {
  if (max <= 1) return 1;
  const fits =
    Math.floor(((availableWidth - CLEARANCE) / PAGE_WIDTH) * 100) / 100;
  // Never below 1: this zooms IN when there is room and otherwise does nothing.
  // Shrinking to fit would make the résumé's own type scale ambiguous.
  return Math.min(max, Math.max(1, fits));
}

/**
 * {@link fitZoom}, kept current against the container the page is drawn in.
 *
 * Measured from the container rather than from the window, because the editor's
 * canvas sits beside a rail whose width is not this hook's business.
 */
export function useFitZoom(
  ref: RefObject<HTMLElement | null>,
  /** The most zoom to apply. `1` disables the hook entirely. */
  max: number,
): number {
  const [zoom, setZoom] = useState(1);

  useLayoutEffect(() => {
    if (max <= 1) {
      setZoom(1);
      return;
    }

    const measure = () => {
      const host = ref.current?.parentElement;
      if (!host) return;
      // `clientWidth` already excludes a vertical scrollbar.
      setZoom(fitZoom(host.clientWidth, max));
    };

    measure();

    /*
     * The WINDOW, not the container.
     *
     * Observing the container would be a feedback loop: zooming in makes the
     * document taller, a taller document can raise a vertical scrollbar, a
     * scrollbar narrows the container, and the next measurement would zoom back
     * out and drop the scrollbar again. The window's width is the input that
     * actually varies, and it is unaffected by anything this returns.
     */
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [ref, max]);

  return zoom;
}

/**
 * What the manual control may reach, and by how much at a time.
 *
 * It goes BELOW 1 where the automatic value will not. The automatic one refuses
 * to shrink because a page that quietly got smaller is indistinguishable from a
 * résumé whose type scale was changed; a candidate who pressed the button knows
 * which of the two they did.
 */
export const ZOOM_MIN = 0.5;
export const ZOOM_MAX = 2;
export const ZOOM_STEP = 0.1;

/**
 * How long the page takes to reach a new zoom, and therefore how long
 * pagination waits before believing what it measures.
 *
 * One number for both, because they are the same fact: the CSS transition and
 * the pause are describing the same animation, and two constants would be two
 * places to disagree. `paged.css` reads it as the transition duration.
 */
export const ZOOM_SETTLE_MS = 200;

/**
 * One press of a zoom control: the next round step in the direction pressed.
 *
 * Not "add 10%". The automatic value is whatever fits — 108%, 115% — and adding
 * to that would walk the control off the grid and leave the reader with 118%
 * and then 128%. Moving to the next MULTIPLE of the step means the numbers stay
 * round however the page was sized to begin with, and the first press from an
 * automatic value is a small one rather than a jump.
 *
 * The epsilon is not superstition: `1.2 / 0.1` is `12.000000000000002`, and
 * without it a press of − from exactly 120% would floor to itself and the
 * control would appear stuck.
 */
export function step(zoom: number, by: number): number {
  const grid = Math.round((zoom / ZOOM_STEP) * 1000) / 1000;
  const next =
    by > 0 ? Math.floor(grid + 1e-9) + 1 : Math.ceil(grid - 1e-9) - 1;
  const value = Math.round(next * ZOOM_STEP * 100) / 100;
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, value));
}
