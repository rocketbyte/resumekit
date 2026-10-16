import { createContext, useContext, useMemo, type ReactNode } from 'react';
import {
  formatFor,
  spaceAtStep,
  spaceSteps,
  spacingFor,
  type ResumeSectionId,
  type ResumeSectionSpacing,
  type SectionSpaceId,
} from '@cvgs/core';
import { useDocumentFormats } from '../presentation-context.js';
import { RailProvider } from '../rail/rail-store.js';

/**
 * Which gap is being talked about.
 *
 * Two arms because the document stores them in two places, and it stores them
 * in two places because they answer different questions. A SECTION is a fixed
 * part of every résumé — "the space above Experience" is true of a document
 * whose experience the writer has rewritten twice — so it is keyed by name. An
 * ENTRY is one of many and moves when the candidate reorders it, so it is keyed
 * by its own path, on the same per-field record its bolding travels on. Naming
 * an entry by position would leave the space behind when the job moved.
 */
export type SpaceTarget =
  { readonly section: ResumeSectionId } | { readonly path: string };

export interface DocumentSpacingValue {
  /** Space above each named section, as stored. */
  sections?: ResumeSectionSpacing;
  /**
   * Record a new space above `target`.
   *
   * Absent means the document is being READ — the saved-résumé view, the export
   * renderer, the printed page — and no handle is drawn at all. Same rule as
   * the authoring context: a surface that only displays a résumé gets a
   * document with no controls in it without asking for one.
   */
  onChange?: (target: SpaceTarget, space: SectionSpaceId) => void;
}

const SpacingContext = createContext<DocumentSpacingValue>({});

export function DocumentSpacingProvider({
  value,
  children,
}: {
  value: DocumentSpacingValue;
  children: ReactNode;
}) {
  const { sections, onChange } = value;
  // Keyed on the values themselves: this is read by every gap in the document,
  // and a fresh object per render of the screen above would re-render all of
  // them for a change none of them can see.
  const published = useMemo(
    () => ({ sections, onChange }),
    [sections, onChange],
  );
  return (
    <SpacingContext.Provider value={published}>
      {/* Adjustable gaps are reached through their containers' rails. */}
      {onChange ? <RailProvider>{children}</RailProvider> : children}
    </SpacingContext.Provider>
  );
}

export interface SpaceHandleState {
  /** How many steps of the template's own unit sit above this target. */
  steps: number;
  /** Whether this document offers the control at all. */
  adjustable: boolean;
  /** Record a number of steps. Clamped to the catalog on the way in. */
  setSteps: (steps: number) => void;
}

/**
 * The space above one target, and the means of changing it.
 *
 * Reads the two stores through the one hook so a caller never has to know which
 * of them holds its answer — a section handle and an entry handle are the same
 * control, and the difference between them is a detail of where the value is
 * written down.
 */
export function useSpace(target: SpaceTarget): SpaceHandleState {
  const { sections, onChange } = useContext(SpacingContext);
  const formats = useDocumentFormats();

  const stored =
    'section' in target
      ? spacingFor(sections, target.section)?.space
      : formatFor(formats, target.path)?.space;

  return {
    steps: spaceSteps(stored),
    adjustable: onChange !== undefined,
    // `spaceAtStep` is what stops a drag — arithmetic on a pointer — from
    // expressing anything the catalog does not hold.
    setSteps: (steps: number) => onChange?.(target, spaceAtStep(steps)),
  };
}
