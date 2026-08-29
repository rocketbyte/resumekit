import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

/**
 * Which entry the candidate is working on.
 *
 * Separate from Craft.js's own selection, and deliberately: Craft selects a
 * FIELD — the string being typed into — while this selects a REGION, the role or
 * qualification that field belongs to. Both are true at once when somebody
 * clicks a job title, and each drives its own controls: the formatting rail acts
 * on the field, the overlay acts on the entry.
 *
 * One selection for the whole document rather than one per collection, so
 * clicking a qualification puts away the role's overlay. That is the behaviour
 * every direct-manipulation editor has, and it only works if the state sits
 * above every collection.
 */
interface EntrySelection {
  active: string | null;
  select: (key: string | null) => void;
}

const SelectionContext = createContext<EntrySelection>({
  active: null,
  select: () => undefined,
});

export function EntrySelectionProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<string | null>(null);

  const select = useCallback((key: string | null) => setActive(key), []);

  useEffect(() => {
    if (active === null) return;

    /*
     * A click outside any entry puts the overlay away. Captured on `pointerdown`
     * rather than `click` so the overlay is gone before a new selection paints,
     * and it never flickers through a frame showing two.
     */
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('[data-entry]') || target?.closest('[data-chrome]')) {
        return;
      }
      setActive(null);
    };

    /* Escape is the way out that needs no aim, and the one a keyboard user has. */
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setActive(null);
    };

    /*
     * And it is put away before printing, for the same reason the field
     * selection is: what is on paper is the document, never the tools.
     */
    const onBeforePrint = () => setActive(null);

    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('beforeprint', onBeforePrint);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('beforeprint', onBeforePrint);
    };
  }, [active]);

  const value = useMemo(() => ({ active, select }), [active, select]);

  return (
    <SelectionContext.Provider value={value}>
      {children}
    </SelectionContext.Provider>
  );
}

export function useEntrySelection(): EntrySelection {
  return useContext(SelectionContext);
}
