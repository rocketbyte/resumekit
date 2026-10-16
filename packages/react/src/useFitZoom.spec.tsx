import { act, render } from '@testing-library/react';
import { useRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useFitZoom } from './useFitZoom.js';

/**
 * WHEN the page is fitted, which is a different question from what it fits to.
 *
 * `fitZoom`'s arithmetic is covered in `pagination.spec.ts`. What is asserted
 * here is the timing the editor depends on: a surface that renders a document
 * is fitted before anything is painted, and a surface that arrives on a screen
 * still settling waits, so its one deliberate movement is not lost among the
 * rest.
 */
function Probe({ delay }: { delay: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const zoom = useFitZoom(ref, 1.15, delay);
  return (
    <div style={{ width: 1200 }}>
      <div ref={ref} data-zoom={zoom} />
    </div>
  );
}

const zoomOf = (c: HTMLElement) =>
  c.querySelector('[data-zoom]')?.getAttribute('data-zoom');

beforeEach(() => {
  vi.useFakeTimers();
  /* jsdom lays nothing out, so `clientWidth` is 0 and every measurement would
     floor to 1. Stubbed to a width that fits the full 1.15, which is what makes
     "did it measure yet" observable at all. */
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1200);
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('useFitZoom timing', () => {
  it('fits before the first paint when no delay is asked for', () => {
    const { container } = render(<Probe delay={0} />);
    // Measured in the layout pass, so the page is never seen at 1.
    expect(zoomOf(container)).toBe('1.15');
  });

  it('leaves the page at its own size until the delay is up', () => {
    const { container } = render(<Probe delay={1000} />);
    expect(zoomOf(container)).toBe('1');

    act(() => void vi.advanceTimersByTime(999));
    expect(zoomOf(container)).toBe('1');

    act(() => void vi.advanceTimersByTime(1));
    expect(zoomOf(container)).toBe('1.15');
  });

  it('still answers a resize while the first fit is waiting', () => {
    // A candidate dragging a window edge wants to see the result, and must not
    // be told to wait out a delay that exists for a screen arriving.
    const { container } = render(<Probe delay={1000} />);
    expect(zoomOf(container)).toBe('1');

    act(() => void window.dispatchEvent(new Event('resize')));
    expect(zoomOf(container)).toBe('1.15');
  });

  it('does not fit after unmounting inside the delay', () => {
    // Leaving the editor before the page ever grew must not set state on a
    // component that is gone.
    const { container, unmount } = render(<Probe delay={1000} />);
    expect(zoomOf(container)).toBe('1');

    unmount();
    expect(() => act(() => void vi.advanceTimersByTime(1000))).not.toThrow();
  });
});
