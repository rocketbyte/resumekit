import {
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import {
  additionPaths,
  collectionOrder,
  dateIssuesInDrawnOrder,
  type AppendableSection,
  type DateIssueKind,
} from '@resumekit/schema';
import { useFieldRegistry } from './field-registry.js';
import { useDocumentOverlay } from '../collections/overlay-context.js';

/** The sections whose entries carry a start and an end to compare. */
const DATED: AppendableSection[] = ['experience', 'education'];

/**
 * Which fields disagree with the résumé's chronological order, by PATH.
 *
 * Keyed by path because that is the address a field already knows itself by, so
 * `EditableText` can ask "is there anything about me?" without knowing the
 * résumé's shape. That is what lets every template carry this without being
 * edited, and a template added later get it for free.
 *
 * Absent by default, and that is the whole of how this stays out of the export:
 * only the editor mounts the provider, so the read-only preview and the render
 * container see an empty map and draw exactly what they drew before.
 */
const DateIssuesContext = createContext<ReadonlyMap<string, DateIssueKind>>(
  new Map(),
);

export interface DateIssuesProviderProps {
  children: ReactNode;
}

const noSubscribe = () => () => undefined;

/**
 * Computes the issues once per change and hands them to the fields.
 *
 * Reads the registry's LIVE values, the same way `EditsReporter` does: the
 * revision is the signal and the values are the input. The mounted résumé would
 * be the wrong source — a warning that stayed on a date the candidate had
 * already corrected is worse than no warning at all.
 *
 * One computation per change rather than one per field: the check is cheap, but
 * there is one of it and dozens of fields asking.
 */
export function DateIssuesProvider({ children }: DateIssuesProviderProps) {
  const registry = useFieldRegistry();
  const { base, edits } = useDocumentOverlay();
  const revision = useSyncExternalStore(
    registry?.revision.subscribe ?? noSubscribe,
    () => registry?.revision.get() ?? 0,
    () => 0,
  );

  const issues = useMemo(() => {
    /* Read on the revision, which is the whole reason it is a dependency —
       the values live in a ref and are mutated in place. */
    void revision;
    if (!registry || !base) return new Map<string, DateIssueKind>();

    /*
     * The order the document is DRAWN in, from the same `collectionOrder` the
     * document lays itself out with — never the order the paths are numbered
     * in. A path follows the job: a reordered résumé renders `experience.2`
     * first and its fields keep saying `experience.2.*`, so the index says
     * where an entry STARTED and the check is about where it is NOW. Deriving
     * the order here from the same source is what stops the check and the page
     * disagreeing about which entry is above which.
     */
    const overlay = edits ?? [];
    const additions = additionPaths(base, overlay);
    const sections = DATED.map((section) =>
      collectionOrder(base, overlay, section)
        .map((slot) =>
          'base' in slot ? `${section}.${slot.base}` : additions.get(slot.ref),
        )
        .filter((path): path is string => path !== undefined),
    );

    const values = registry.values.current;
    return dateIssuesInDrawnOrder(sections, (path) => {
      const value = values.get(path);
      return typeof value === 'string' ? value : undefined;
    });
  }, [registry, revision, base, edits]);

  return (
    <DateIssuesContext.Provider value={issues}>
      {children}
    </DateIssuesContext.Provider>
  );
}

/** What was noticed about this field's date, if anything. */
export function useDateIssue(path: string): DateIssueKind | undefined {
  return useContext(DateIssuesContext).get(path);
}
