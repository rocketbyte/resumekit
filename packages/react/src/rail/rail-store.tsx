import {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';

/** The attribute a container carries to host a rail. Its value is the key. */
export const RAIL_KEY = 'data-rail-key';

type Slot = 'hovered' | 'focused' | 'pinned';

/**
 * Which container is pointed at, which holds focus, and which is pinned by a
 * drag under way — the only state the rails need, held once for the document.
 *
 * A store rather than state in a provider: a container subscribes to whether
 * IT is active, so moving the pointer re-renders the container losing the
 * rail and the one gaining it, and nothing else in the document.
 */
export class RailStore {
  private keys: Record<Slot, string | null> = {
    hovered: null,
    focused: null,
    pinned: null,
  };
  private readonly listeners = new Set<() => void>();

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  set(slot: Slot, key: string | null) {
    if (this.keys[slot] === key) return;
    this.keys[slot] = key;
    for (const listener of this.listeners) listener();
  }

  /** 0 none · 1 hovered · 2 strong (focused or pinned). */
  levelOf(key: string): number {
    const { hovered, focused, pinned } = this.keys;
    if (focused === key || pinned === key) return 2;
    if (pinned !== null) return 0;
    return hovered === key ? 1 : 0;
  }

  pin(key: string) {
    this.set('pinned', key);
  }

  unpin(key: string) {
    if (this.keys.pinned === key) this.set('pinned', null);
  }
}

/* An inert store: a document being read has no rails, and nothing subscribes. */
const RailContext = createContext<RailStore | null>(null);

const hostOf = (target: EventTarget | null): string | null => {
  const element = target instanceof Element ? target : null;
  return element?.closest(`[${RAIL_KEY}]`)?.getAttribute(RAIL_KEY) ?? null;
};

/**
 * Installs the document's rail state, once. A provider below one that already
 * exists adds nothing, so the spacing and authoring layers can both ask for it.
 */
export function RailProvider({ children }: { children: ReactNode }) {
  const outer = useContext(RailContext);
  const [store] = useState(() => outer ?? new RailStore());

  useEffect(() => {
    if (outer) return;
    /* Delegated: one listener for every container in the document. */
    const onOver = (e: PointerEvent) => store.set('hovered', hostOf(e.target));
    const onLeave = () => store.set('hovered', null);
    const onFocusIn = (e: FocusEvent) => store.set('focused', hostOf(e.target));
    const onFocusOut = (e: FocusEvent) => {
      if (hostOf(e.relatedTarget) === null) store.set('focused', null);
    };
    document.addEventListener('pointerover', onOver);
    document.documentElement.addEventListener('pointerleave', onLeave);
    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('focusout', onFocusOut);
    return () => {
      document.removeEventListener('pointerover', onOver);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('focusout', onFocusOut);
    };
  }, [outer, store]);

  if (outer) return <>{children}</>;
  return <RailContext.Provider value={store}>{children}</RailContext.Provider>;
}

const NONE = () => 0;
const noSubscribe = () => () => undefined;

/**
 * How present this container's rail is: 0 absent, 1 faint (pointed at), 2
 * solid (focused, or a drag it started is under way). Always 0 outside a
 * provider, which is every document that is only being read.
 */
export function useRailLevel(key: string): number {
  const store = useContext(RailContext);
  return useSyncExternalStore(
    store?.subscribe ?? noSubscribe,
    store ? () => store.levelOf(key) : NONE,
    NONE,
  );
}

/** Pin and release this container's rail around a drag. */
export function useRailPin(key: string) {
  const store = useContext(RailContext);
  return {
    pin: () => store?.pin(key),
    unpin: () => store?.unpin(key),
  };
}
