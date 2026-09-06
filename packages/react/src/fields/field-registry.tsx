import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type MutableRefObject,
  type ReactNode,
} from 'react';
import type { EditValue } from '@cvgs/core';

/**
 * The editor's own field model, keyed by the résumé's own paths.
 *
 * This is what replaced Craft.js (`retire-craftjs`, #69). Craft is a
 * page-builder library and this is deliberately the opposite of one — the design
 * that introduced it said its whole job was "to take what Craft.js gives (node
 * tree, per-node props, selection state, serialization) and refuse what it also
 * gives (drag, drop, layout manipulation, style props)". What was actually
 * consumed was a ref connector, a selected flag, a prop writer, an enabled flag,
 * and a walk of the node map to save. All of it is below, in one file.
 *
 * The tree went with it and nothing was lost: a template's structure is plain
 * JSX and has never been addressable, so Craft was modelling a tree the product
 * refuses to let anyone edit. And every use of a node id here immediately
 * translated it back to a résumé path — `valuesFromNodes` looked for nodes
 * carrying `path`; `LinkField` scanned for the node whose `path` it already
 * knew. **The path was always the identity.** So the path is the key.
 *
 * Two consequences, both of which were bugs before:
 *
 *   - A field's props are ordinary props again. Craft froze them at mount, which
 *     is why an address typed into a link's popover left the document pointing
 *     at the old URL, and why presentation had to travel by context.
 *   - There is nothing to configure into a page builder. `LOCKED_RULES` refused
 *     four movement predicates; a refusal is configuration, and configuration is
 *     one upgrade away from meaning something else. There is now no capability
 *     to refuse.
 */

/**
 * Selection, as the smallest external store that does the job.
 *
 * Deliberately not React state. In context, one selection change is a new
 * context value and therefore a re-render of every field in the document —
 * hundreds, on every click. With a store a field subscribes to the one question
 * it cares about, `am I selected?`, and re-renders only when that answer
 * changes. `useSyncExternalStore` is React's own way to do this and needs no
 * library.
 */
export interface SelectionStore {
  get: () => string | null;
  set: (path: string | null) => void;
  subscribe: (listener: () => void) => () => void;
}

function createSelectionStore(): SelectionStore {
  let selected: string | null = null;
  const listeners = new Set<() => void>();
  return {
    get: () => selected,
    set: (path) => {
      if (path === selected) return;
      selected = path;
      for (const listener of listeners) listener();
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

/** What every field needs, and what the save reads. */
export interface FieldRegistry {
  /** Whether this document is being edited, or only displayed. */
  enabled: boolean;
  /**
   * The live values, by path. A REF rather than state: it is read when the
   * document saves and written on every keystroke, and a re-render of every
   * field per character is the cost this shape avoids.
   */
  values: MutableRefObject<Map<string, EditValue>>;
  selection: SelectionStore;
}

const FieldRegistryContext = createContext<FieldRegistry | null>(null);

export interface FieldRegistryProviderProps {
  /** `false` for the preview and the export renderer — see `TemplateDocument`. */
  enabled?: boolean;
  children: ReactNode;
}

export function FieldRegistryProvider({
  enabled = false,
  children,
}: FieldRegistryProviderProps) {
  const values = useRef(new Map<string, EditValue>());
  const [selection] = useState(createSelectionStore);

  /* Stable, so a document being typed into never re-renders because its
     registry object is new. `values` is a ref and the store a fixed reference;
     only `enabled` can change it, and it does not change. */
  const registry = useMemo<FieldRegistry>(
    () => ({ enabled, values, selection }),
    [enabled, selection],
  );

  return (
    <FieldRegistryContext.Provider value={registry}>
      {children}
    </FieldRegistryContext.Provider>
  );
}

/**
 * The registry, for what acts on the document as a whole — reading every value
 * to save it, or clearing the selection before printing.
 *
 * `null` outside a provider, which is a document being READ: the saved-résumé
 * view and the export renderer mount none, so every field renders as text and
 * neither has to remember to turn anything off.
 */
export const useFieldRegistry = (): FieldRegistry | null =>
  useContext(FieldRegistryContext);

/** Everything one field needs. */
export interface Field {
  /** The value now — local state, so a keystroke re-renders this field alone. */
  value: EditValue;
  /** Whether this document can be edited at all. */
  editing: boolean;
  /** Whether THIS field is the one being edited. */
  selected: boolean;
  select: () => void;
  set: (next: EditValue) => void;
}

/**
 * Register a field at `path`, and read its state back.
 *
 * `initial` seeds the value and is adopted when it changes UPSTREAM — a template
 * switch, a reload, an entry inserted above this one. That is what ordinary
 * props give and Craft's frozen node props did not.
 */
export function useField(path: string, initial: EditValue): Field {
  const registry = useFieldRegistry();
  const [value, setValue] = useState(initial);

  /*
   * Adopt an upstream change, and only an upstream change.
   *
   * `seen` is what makes it safe: a render carrying an `initial` we have not
   * seen is the document moving underneath us and is adopted; a render that
   * merely repeats what we already knew leaves the candidate's typing alone.
   * The same guard `SpaceHandle` keeps, for the same reason — a value travels a
   * long way round and comes back late.
   */
  const seen = useRef(initial);
  if (initial !== seen.current) {
    seen.current = initial;
    if (initial !== value) setValue(initial);
  }

  const map = registry?.values;
  useEffect(() => {
    if (!map) return;
    map.current.set(path, value);
    return () => {
      map.current.delete(path);
    };
  }, [map, path, value]);

  const selection = registry?.selection;
  const subscribe = useCallback(
    (listener: () => void) =>
      selection?.subscribe(listener) ?? (() => undefined),
    [selection],
  );
  const isSelected = useSyncExternalStore(
    subscribe,
    () => selection?.get() === path,
    () => false,
  );

  const set = useCallback(
    (next: EditValue) => {
      setValue(next);
      /* Written to the map synchronously as well as through state: the save
         reads the map, and a save racing a render must not read the previous
         character. */
      map?.current.set(path, next);
    },
    [map, path],
  );

  const select = useCallback(() => selection?.set(path), [selection, path]);

  return {
    value,
    editing: registry?.enabled ?? false,
    selected: Boolean(registry?.enabled) && isSelected,
    select,
    set,
  };
}
