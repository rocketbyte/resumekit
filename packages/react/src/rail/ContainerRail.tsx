import { useCallback, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type { SpaceTarget } from '../spacing/spacing-context.js';
import { useRailLevel } from './rail-store.js';
import { useSpaceDrag } from './useSpaceDrag.js';
import './rail.css';
import { useEditorText } from '../i18n/index.js';

/** Up-and-down through a bar: the space above can be opened or closed. */
const SpaceIcon = () => (
  <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
    <path d="M8 1.75v4M5.75 3.75 8 1.5l2.25 2.25M8 14.25v-4M5.75 12.25 8 14.5l2.25-2.25M3 8h10" />
  </svg>
);

/**
 * The space control: a slider in the rail, and — while it is pointed at or
 * dragged — the gap it acts on, tinted, with its value. The gap is drawn in
 * the CONTAINER (portalled), because that is where the space is; the rail is
 * only where the hand is.
 */
function SpaceControl({
  target,
  label,
  railKey,
  host,
}: {
  target: SpaceTarget;
  label: string;
  railKey: string;
  host: HTMLElement | null;
}) {
  const { adjustable, shown, dragging, sliderProps } = useSpaceDrag(
    target,
    label,
    railKey,
  );
  const [looking, setLooking] = useState(false);
  const { t, locale } = useEditorText();
  if (!adjustable) return null;

  return (
    <>
      <span
        className="tpl-rail__btn tpl-rail__space"
        data-dragging={dragging ? '' : undefined}
        onPointerEnter={() => setLooking(true)}
        onPointerLeave={() => setLooking(false)}
        onFocus={() => setLooking(true)}
        onBlur={() => setLooking(false)}
        {...sliderProps}
      >
        <SpaceIcon />
      </span>
      {host &&
        (looking || dragging) &&
        createPortal(
          <span
            className="tpl-rail-gap"
            data-chrome
            aria-hidden="true"
            data-open={shown > 0 ? '' : undefined}
            /* An attribute the stylesheet draws, never a text node: a word in
               here would be a word in the résumé's own text. */
            data-readout={
              shown > 0
                ? `+${shown.toLocaleString(locale, {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1,
                  })}`
                : t.space.dragToAdd
            }
          />,
          host,
        )}
    </>
  );
}

export interface ContainerRailProps {
  /** The container's `data-rail-key`. */
  railKey: string;
  /** Names the toolbar for assistive technology. */
  toolbarLabel: string;
  /** Selected containers keep a solid rail wherever the pointer is. */
  selected?: boolean;
  /** The gap above this container, when it can be adjusted. */
  space?: { target: SpaceTarget; label: string } | null;
  /** The container's own actions, below the space control. */
  children?: ReactNode;
}

/**
 * One container's controls, as a single vertical pill beside the sheet,
 * centred on the container.
 *
 * It exists only while the container is pointed at, focused, selected or being
 * adjusted — a document at rest carries no control at all — and it is faint
 * until the candidate commits to the container by selecting, focusing or
 * reaching for it. Chrome: absolutely positioned, never printed, and moving
 * nothing in the document by appearing.
 */
export function ContainerRail({
  railKey,
  toolbarLabel,
  selected = false,
  space,
  children,
}: ContainerRailProps) {
  const level = useRailLevel(railKey);
  const [host, setHost] = useState<HTMLElement | null>(null);
  /* Stable, or every render would detach and re-attach it — two state updates
     per render, and a loop. */
  const attach = useCallback(
    (node: HTMLSpanElement | null) => setHost(node?.parentElement ?? null),
    [],
  );
  if (level === 0 && !selected) return null;

  return (
    <span
      ref={attach}
      className="tpl-rail"
      data-chrome
      contentEditable={false}
      role="toolbar"
      aria-orientation="vertical"
      aria-label={toolbarLabel}
      data-strong={level === 2 || selected ? '' : undefined}
    >
      {space && (
        <SpaceControl
          target={space.target}
          label={space.label}
          railKey={railKey}
          host={host}
        />
      )}
      {space && children && (
        <span className="tpl-rail__divider" aria-hidden="true" />
      )}
      {children}
    </span>
  );
}
