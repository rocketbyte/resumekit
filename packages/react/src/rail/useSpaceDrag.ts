import { useRef, useState, type PointerEvent, type KeyboardEvent } from 'react';
import {
  SECTION_SPACES,
  SPACE_MAX_STEPS,
  SPACE_QUANTUM,
  spaceAtStep,
} from '@cvgs/core';
import { useAutosave } from '../autosave-context.js';
import { useSpace, type SpaceTarget } from '../spacing/spacing-context.js';
import { useRailPin } from './rail-store.js';

/** One step on screen when nothing can be measured — a test renderer only. */
const FALLBACK_UNIT = 8;
/** How many units the probe is tall, so a sub-pixel unit measures precisely. */
const PROBE_UNITS = 10;
/** How far the pointer must travel, in steps, before the value moves at all. */
const DEAD_ZONE = SPACE_QUANTUM;

/**
 * One step of this template's rhythm, in SCREEN pixels — measured by a probe
 * laid out inside the zoomed sheet, so the zoom needs no separate correction.
 * A custom property cannot simply be read: it comes back as the literal
 * `calc(...)` text. Once per press, not per frame: it forces a layout.
 */
function unitOf(element: HTMLElement | null): number {
  if (!element?.ownerDocument) return FALLBACK_UNIT;
  const probe = element.ownerDocument.createElement('span');
  probe.style.cssText = `position:absolute;visibility:hidden;pointer-events:none;width:0;height:calc(var(--tpl-space-unit, 8px) * ${PROBE_UNITS})`;
  element.append(probe);
  const measured = probe.getBoundingClientRect().height / PROBE_UNITS;
  probe.remove();
  return measured > 0 ? measured : FALLBACK_UNIT;
}

/**
 * The gap above a container, as a drag and as a keyboard slider.
 *
 * Every position it can reach is a step of the catalog's scale, which is what
 * keeps the ATS guarantee enumerable. A drag lasts exactly as long as the
 * press — it ends wherever the pointer is released, in or out of the window —
 * and it pins the container's rail, so leaving the container mid-drag does
 * not take the control away from under the pointer.
 */
export function useSpaceDrag(
  target: SpaceTarget,
  label: string,
  railKey: string,
) {
  const { steps, adjustable, setSteps } = useSpace(target);
  const { saveNow } = useAutosave();
  const { pin, unpin } = useRailPin(railKey);
  const [dragging, setDragging] = useState<number | null>(null);
  const shown = dragging ?? steps;

  /*
   * What has been ASKED for, as against what has come back. A repeated key
   * arrives before the previous value has made the round trip through the
   * screen's state, so the handler must add to the pending figure, not to
   * `steps`. A render carrying a value not seen from upstream adopts it.
   */
  const latest = useRef(steps);
  const seen = useRef(steps);
  if (steps !== seen.current) {
    seen.current = steps;
    latest.current = steps;
  }

  const commit = (next: number) => {
    const wanted = Math.round(next / SPACE_QUANTUM) * SPACE_QUANTUM;
    const clamped = Number(
      Math.max(0, Math.min(SPACE_MAX_STEPS, wanted)).toFixed(1),
    );
    latest.current = clamped;
    if (clamped !== steps) setSteps(clamped);
    return clamped;
  };

  const onPointerDown = (event: PointerEvent<HTMLElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();

    const startY = event.clientY;
    const startSteps = latest.current;
    const perStep = unitOf(event.currentTarget);
    const element = event.currentTarget;
    const view = element.ownerDocument.defaultView ?? window;

    element.setPointerCapture?.(event.pointerId);
    setDragging(startSteps);
    pin();
    /* A drag passes over text; it must not select it on the way. */
    const root = element.ownerDocument.documentElement;
    const selecting = root.style.userSelect;
    root.style.userSelect = 'none';

    /* On the WINDOW, torn down as one, so a release anywhere ends the drag. */
    const drag = new AbortController();
    const { signal } = drag;

    const move = (e: globalThis.PointerEvent) => {
      if (e.pointerId !== event.pointerId) return;
      // A move with no button held is a release nobody reported.
      if (e.buttons === 0) {
        end();
        return;
      }
      const travelled = (e.clientY - startY) / perStep;
      if (Math.abs(travelled) < DEAD_ZONE && latest.current === startSteps) {
        return;
      }
      setDragging(commit(startSteps + travelled));
    };

    const end = () => {
      if (signal.aborted) return;
      drag.abort();
      element.releasePointerCapture?.(event.pointerId);
      setDragging(null);
      unpin();
      root.style.userSelect = selecting;
      saveNow();
    };

    view.addEventListener('pointermove', move, { signal });
    view.addEventListener('pointerup', end, { signal });
    view.addEventListener('pointercancel', end, { signal });
    view.addEventListener('blur', end, { signal });
  };

  /* The same, from the keyboard: a quantum per arrow, a unit per page. */
  const onKeyDown = (event: KeyboardEvent) => {
    const by = {
      ArrowUp: -SPACE_QUANTUM,
      ArrowDown: SPACE_QUANTUM,
      PageUp: -1,
      PageDown: 1,
    }[event.key];
    const to =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? SPACE_MAX_STEPS
          : undefined;
    if (by === undefined && to === undefined) return;
    event.preventDefault();
    commit(to ?? latest.current + (by as number));
    saveNow();
  };

  return {
    adjustable,
    shown,
    dragging: dragging !== null,
    sliderProps: {
      role: 'slider',
      tabIndex: 0,
      'aria-label': `Space above ${label}`,
      'aria-orientation': 'vertical' as const,
      'aria-valuemin': 0,
      'aria-valuemax': SPACE_MAX_STEPS,
      'aria-valuenow': shown,
      // The scale is fifths, so the announced value has to be too.
      'aria-valuetext': SECTION_SPACES[spaceAtStep(shown)]?.name ?? 'None',
      title: `Drag up or down to change the space above ${label}`,
      onPointerDown,
      onKeyDown,
    },
  };
}
