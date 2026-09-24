import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './library.css';

/** One thing that can be chosen, with the sub-items that come with it. */
export interface PickerOption {
  title: string;
  detail?: string;
  /** Chosen with the option and all on by default — a role's bullets. */
  parts?: readonly string[];
}

/** A titled list of options. A picker with one group draws no heading. */
export interface PickerGroup {
  id: string;
  heading?: string;
  options: readonly PickerOption[];
}

export interface PickedOption {
  index: number;
  /** Indices of the option's parts that stayed chosen. */
  parts: number[];
}

/** What was chosen, per group id, in the order the options are listed. */
export type PickerSelection = Record<string, PickedOption[]>;

export interface LibraryPickerProps {
  title: string;
  groups: readonly PickerGroup[];
  /** Said when there is nothing to choose. */
  empty: string;
  /** The add button's words for the current selection, e.g. "Add 3 bullets". */
  addLabel: (selection: PickerSelection) => string;
  onAdd: (selection: PickerSelection) => void;
  onClose: () => void;
}

const keyOf = (group: string, index: number) => `${group}:${index}`;

/** The drawn box for a visually hidden checkbox; the input stays the control. */
function Check({ small = false }: { small?: boolean }) {
  return (
    <span
      className="tpl-library__check"
      data-small={small ? '' : undefined}
      aria-hidden="true"
    >
      <svg viewBox="0 0 16 16">
        <path d="M3.5 8.5 6.5 11.5 12.5 5" />
      </svg>
    </span>
  );
}

/**
 * A dialog of grouped checklists. Presentational: it knows options, parts and
 * a selection — nothing about resumes — so each caller decides what an option
 * is and what adding means. Portalled out of the page, so it is chrome and is
 * never printed.
 */
export function LibraryPicker({
  title,
  groups,
  empty,
  addLabel,
  onAdd,
  onClose,
}: LibraryPickerProps) {
  const [chosen, setChosen] = useState<
    ReadonlyMap<string, ReadonlySet<number>>
  >(new Map());
  const panel = useRef<HTMLDivElement>(null);
  const titleId = useId();

  /* Focus the dialog, not its first option: a ring on an item nobody chose
     reads as a selection. Tab reaches the options from here. */
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    panel.current?.focus({ preventScroll: true });
    return () => previous?.focus?.();
  }, []);

  const allParts = (option: PickerOption | undefined) =>
    new Set(option?.parts?.map((_, p) => p) ?? []);

  const toggle = (group: PickerGroup, index: number) =>
    setChosen((current) => {
      const next = new Map(current);
      const key = keyOf(group.id, index);
      if (next.has(key)) next.delete(key);
      else next.set(key, allParts(group.options[index]));
      return next;
    });

  const togglePart = (group: PickerGroup, index: number, part: number) =>
    setChosen((current) => {
      const next = new Map(current);
      const key = keyOf(group.id, index);
      const parts = new Set(next.get(key) ?? []);
      if (parts.has(part)) parts.delete(part);
      else parts.add(part);
      next.set(key, parts);
      return next;
    });

  const allChosen = (group: PickerGroup) =>
    group.options.every((_, i) => chosen.has(keyOf(group.id, i)));

  const toggleAll = (group: PickerGroup) =>
    setChosen((current) => {
      const next = new Map(current);
      const clear = allChosen(group);
      group.options.forEach((option, i) => {
        const key = keyOf(group.id, i);
        if (clear) next.delete(key);
        else if (!next.has(key)) next.set(key, allParts(option));
      });
      return next;
    });

  const selection: PickerSelection = Object.fromEntries(
    groups.map((group) => [
      group.id,
      group.options.flatMap((_, index) => {
        const parts = chosen.get(keyOf(group.id, index));
        return parts
          ? [{ index, parts: [...parts].sort((a, b) => a - b) }]
          : [];
      }),
    ]),
  );
  const nothing = groups.every((group) => group.options.length === 0);

  return createPortal(
    <div
      className="tpl-library__scrim"
      data-chrome
      onMouseDown={(e) => {
        e.stopPropagation();
        if (e.target === e.currentTarget) onClose();
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        ref={panel}
        className="tpl-library"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === 'Escape') onClose();
        }}
      >
        <header className="tpl-library__head">
          <span className="tpl-library__mark" aria-hidden="true">
            <svg viewBox="0 0 16 16">
              <path d="M8 2.5v6.5M5.5 6.5 8 9l2.5-2.5M3 9.5v3h10v-3" />
            </svg>
          </span>
          <h2 id={titleId} className="tpl-library__title">
            {title}
          </h2>
        </header>

        {nothing ? (
          <p className="tpl-library__empty">{empty}</p>
        ) : (
          <div className="tpl-library__body">
            {groups
              .filter((group) => group.options.length > 0)
              .map((group) => (
                <section
                  key={group.id}
                  className="tpl-library__group"
                  aria-label={group.heading ?? title}
                >
                  {(group.heading || group.options.length > 1) && (
                    <div className="tpl-library__group-head">
                      {group.heading && (
                        <h3 className="tpl-library__group-title">
                          {group.heading}
                          <span className="tpl-library__count">
                            {group.options.length}
                          </span>
                        </h3>
                      )}
                      {group.options.length > 1 && (
                        <button
                          type="button"
                          className="tpl-library__all"
                          onClick={() => toggleAll(group)}
                        >
                          {allChosen(group) ? 'Clear' : 'Select all'}
                        </button>
                      )}
                    </div>
                  )}
                  <ul className="tpl-library__list">
                    {group.options.map((option, i) => {
                      const parts = chosen.get(keyOf(group.id, i));
                      const on = parts !== undefined;
                      return (
                        <li key={i}>
                          <label
                            className="tpl-library__option"
                            data-on={on ? '' : undefined}
                          >
                            <input
                              type="checkbox"
                              className="tpl-library__input"
                              checked={on}
                              onChange={() => toggle(group, i)}
                            />
                            <Check />
                            <span className="tpl-library__text">
                              <span className="tpl-library__name">
                                {option.title}
                              </span>
                              {option.detail && (
                                <span className="tpl-library__detail">
                                  {option.detail}
                                </span>
                              )}
                            </span>
                          </label>
                          {on && option.parts && option.parts.length > 0 && (
                            <ul
                              className="tpl-library__parts"
                              aria-label={`Bullets of ${option.title}`}
                            >
                              {option.parts.map((part, p) => (
                                <li key={p}>
                                  <label className="tpl-library__part">
                                    <input
                                      type="checkbox"
                                      className="tpl-library__input"
                                      checked={parts.has(p)}
                                      onChange={() => togglePart(group, i, p)}
                                    />
                                    <Check small />
                                    <span>{part}</span>
                                  </label>
                                </li>
                              ))}
                            </ul>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))}
          </div>
        )}

        <footer className="tpl-library__actions">
          <button type="button" className="tpl-library__btn" onClick={onClose}>
            {nothing ? 'Close' : 'Cancel'}
          </button>
          {!nothing && (
            <button
              type="button"
              className="tpl-library__btn tpl-library__btn--primary"
              disabled={chosen.size === 0}
              onClick={() => onAdd(selection)}
            >
              {chosen.size === 0 ? 'Add' : addLabel(selection)}
            </button>
          )}
        </footer>
      </div>
    </div>,
    document.body,
  );
}
