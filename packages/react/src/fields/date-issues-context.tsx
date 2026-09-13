import {
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { dateIssuesByFieldFromValues, type DateIssueKind } from '@cvgs/core';
import { useFieldRegistry } from './field-registry.js';

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
  const revision = useSyncExternalStore(
    registry?.revision.subscribe ?? noSubscribe,
    () => registry?.revision.get() ?? 0,
    () => 0,
  );

  const issues = useMemo(() => {
    /* Read on the revision, which is the whole reason it is a dependency —
       the values live in a ref and are mutated in place. */
    void revision;
    if (!registry) return new Map<string, DateIssueKind>();
    return dateIssuesByFieldFromValues(registry.values.current);
  }, [registry, revision]);

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
