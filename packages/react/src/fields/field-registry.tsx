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

/**
 * "Something changed", as a number.
 *
 * The values are a ref, so nothing re-renders when one is written — which is
 * the point, and also means the things that watch the DOCUMENT rather than a
 * field need a signal of their own. The overlay reporter and the paginator both
 * subscribe here: one rebuilds the overlay, the other re-measures, and neither
 * should run because a pointer crossed a field.
 *
 * A counter rather than the map itself, because the map is mutated in place —
 * its identity never changes, so it cannot be a dependency.
 */
export interface RevisionStore {
  get: () => number;
  bump: () => void;
  subscribe: (listener: () => void) => () => void;
}

function createRevisionStore(): RevisionStore {
  let revision = 0;
  const listeners = new Set<() => void>();
  return {
    get: () => revision,
    bump: () => {
      revision += 1;
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
  /** Each mounted field's setter, keyed by path. Read through {@link write}. */
  setters: MutableRefObject<Map<string, (next: EditValue) => void>>;
  /**
   * What a field holds because the TEMPLATE supplied it, by path.
   *
   * Only a field that HAS such a value registers one — today, a section
   * heading, which prints "Experience" on a résumé nobody has renamed. The save
   * hands this to `presentationEdits`, which refuses to record a value equal to
   * its default, so opening a document does not look like nine edits and
   * renaming a section back to its own name leaves no trace.
   */
  defaults: MutableRefObject<Map<string, string>>;
  selection: SelectionStore;
  /** Bumped whenever any value changes — see {@link RevisionStore}. */
  revision: RevisionStore;
  /**
   * Set a field's value from OUTSIDE it, by path.
   *
   * One caller: a link's popover, which edits a field the candidate is not
   * typing into. It replaces `setProp(nodeId, …)`, and the difference is the
   * whole point of this change — a path is something a component already knows,
   * where a node id had to be found by scanning the tree for the node carrying
   * the path it wanted.
   *
   * Writes through the field's own setter rather than into the map, so the
   * field re-renders. A write to the map alone would save correctly and show
   * nothing, which is the worse of the two failures.
   */
  write: (path: string, next: EditValue) => void;
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
  const [revision] = useState(createRevisionStore);
  /* Each mounted field's setter, so one field can be written by another. */
  const setters = useRef(new Map<string, (next: EditValue) => void>());
  const defaults = useRef(new Map<string, string>());
  const write = useCallback((path: string, next: EditValue) => {
    setters.current.get(path)?.(next);
  }, []);

  /* Stable, so a document being typed into never re-renders because its
     registry object is new. `values` is a ref and the store a fixed reference;
     only `enabled` can change it, and it does not change. */
  const registry = useMemo<FieldRegistry>(
    () => ({ enabled, values, setters, defaults, selection, revision, write }),
    [enabled, selection, revision, write],
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

/**
 * Everything one field needs.
 *
 * Generic over what the field HOLDS, because `EditValue` is a union — a line of
 * text or a list of them — and a field is only ever one of the two. Without it
 * every caller would narrow a union it already knew the answer to, at each of
 * the four places it reads the value.
 */
export interface Field<T extends EditValue> {
  /** The value now — local state, so a keystroke re-renders this field alone. */
  value: T;
  /** Whether this document can be edited at all. */
  editing: boolean;
  /** Whether THIS field is the one being edited. */
  selected: boolean;
  select: () => void;
  set: (next: T) => void;
}

/**
 * Register a field at `path`, and read its state back.
 *
 * `initial` seeds the value and is adopted when it changes UPSTREAM — a template
 * switch, a reload, an entry inserted above this one. That is what ordinary
 * props give and Craft's frozen node props did not.
 */
export function useField<T extends EditValue>(
  path: string,
  initial: T,
  /**
   * What this field holds when the candidate has written nothing — the
   * template's own word, not a placeholder. See `FieldRegistry.defaults`.
   */
  templateDefault?: string,
): Field<T> {
  const registry = useFieldRegistry();
  const [value, setValue] = useState<T>(initial);

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
  const revision = registry?.revision;

  /* Published for as long as the field is mounted, and withdrawn with it, so a
     default cannot outlive the template that supplied it. */
  const defaults = registry?.defaults;
  useEffect(() => {
    if (!defaults || templateDefault === undefined) return;
    defaults.current.set(path, templateDefault);
    return () => {
      defaults.current.delete(path);
    };
  }, [defaults, path, templateDefault]);
  useEffect(() => {
    if (!map) return;
    map.current.set(path, value);
    revision?.bump();
    return () => {
      map.current.delete(path);
      /* A removed entry's fields must leave the overlay, so their going is a
         change like any other. */
      revision?.bump();
    };
  }, [map, revision, path, value]);

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
    (next: T) => {
      setValue(next);
      /* Written to the map synchronously as well as through state: the save
         reads the map, and a save racing a render must not read the previous
         character. */
      map?.current.set(path, next);
      revision?.bump();
    },
    [map, revision, path],
  );

  const select = useCallback(() => selection?.set(path), [selection, path]);

  /*
   * Publish this field's setter so another component can write it by path — see
   * `FieldRegistry.write`. Registered for as long as the field is mounted, and
   * withdrawn with it, so a write to a field that has gone is a no-op rather
   * than a state update on an unmounted component.
   */
  const setters = registry?.setters;
  useEffect(() => {
    if (!setters) return;
    setters.current.set(path, set as (next: EditValue) => void);
    return () => {
      setters.current.delete(path);
    };
  }, [setters, path, set]);

  return {
    value,
    editing: registry?.enabled ?? false,
    selected: Boolean(registry?.enabled) && isSelected,
    select,
    set,
  };
}

/**
 * WATCH a field somebody else owns.
 *
 * `useField` REGISTERS a field: it holds the value in local state and publishes
 * a setter. Calling it twice for one path is therefore two fields wearing one
 * name — two pieces of state, one setter overwriting the other, and a write
 * that updates a copy nobody renders. That is a real bug this hook exists to
 * make unavailable: a link's popover edits the text its own document renders,
 * so it must not be a second owner of it.
 *
 * So: read through the registry's map, re-render on the revision, and write
 * through {@link FieldRegistry.write}, which reaches the field that does own it.
 */
export function useFieldValue(path: string): EditValue | undefined {
  const registry = useFieldRegistry();
  const revision = registry?.revision;
  const subscribe = useCallback(
    (listener: () => void) =>
      revision?.subscribe(listener) ?? (() => undefined),
    [revision],
  );
  return useSyncExternalStore(
    subscribe,
    () => registry?.values.current.get(path),
    () => undefined,
  );
}
