import { act, render, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ReactNode } from 'react';
import {
  FieldRegistryProvider,
  useField,
  useFieldRegistry,
} from './field-registry.js';

/**
 * The model that replaced Craft's node tree.
 *
 * What matters here is what the SAVE reads: the overlay is rebuilt from these
 * values on every write, so a value that is missing, stale, or left behind by an
 * unmounted field is a field the candidate edited and lost.
 */
const wrap =
  (enabled = true) =>
  ({ children }: { children: ReactNode }) => (
    <FieldRegistryProvider enabled={enabled}>{children}</FieldRegistryProvider>
  );

describe('the field registry', () => {
  it('holds a field at its résumé path', () => {
    const { result } = renderHook(() => useField('name', 'Ada'), {
      wrapper: wrap(),
    });
    expect(result.current.value).toBe('Ada');
  });

  it('reads a write back immediately, not on the next render', () => {
    /*
     * The save reads the map, and a save racing a render must not see the
     * previous character — so a write lands in the map synchronously as well as
     * through state.
     */
    const { result } = renderHook(
      () => ({ field: useField('name', 'Ada'), registry: useFieldRegistry() }),
      { wrapper: wrap() },
    );
    act(() => result.current.field.set('Grace'));
    expect(result.current.registry?.values.current.get('name')).toBe('Grace');
    expect(result.current.field.value).toBe('Grace');
  });

  it('adopts a value that changed upstream', () => {
    // A template switch or a reload moves the document underneath the field.
    const { result, rerender } = renderHook(
      ({ initial }: { initial: string }) => useField('name', initial),
      { wrapper: wrap(), initialProps: { initial: 'Ada' } },
    );
    rerender({ initial: 'Grace' });
    expect(result.current.value).toBe('Grace');
  });

  it('leaves the candidate’s typing alone on a repeat render', () => {
    /*
     * The guard that makes the above safe. `initial` arrives again unchanged on
     * every parent render; adopting it would undo the sentence being typed.
     */
    const { result, rerender } = renderHook(
      ({ initial }: { initial: string }) => useField('name', initial),
      { wrapper: wrap(), initialProps: { initial: 'Ada' } },
    );
    act(() => result.current.set('Ada Lovelace'));
    rerender({ initial: 'Ada' });
    expect(result.current.value).toBe('Ada Lovelace');
  });

  it('forgets a field that unmounted', () => {
    // An entry the candidate removed must not be saved back by its own value
    // lingering in the map.
    function Field({ path }: { path: string }) {
      useField(path, 'x');
      return null;
    }
    let seen: Map<string, unknown> | undefined;
    function Probe() {
      seen = useFieldRegistry()?.values.current;
      return null;
    }
    const view = render(
      <FieldRegistryProvider enabled>
        <Probe />
        <Field path="skills.0.category" />
      </FieldRegistryProvider>,
    );
    expect(seen?.get('skills.0.category')).toBe('x');

    view.rerender(
      <FieldRegistryProvider enabled>
        <Probe />
      </FieldRegistryProvider>,
    );
    expect(seen?.has('skills.0.category')).toBe(false);
  });

  it('selects one field at a time', () => {
    const { result } = renderHook(
      () => ({ a: useField('a', ''), b: useField('b', '') }),
      { wrapper: wrap() },
    );
    expect(result.current.a.selected).toBe(false);

    act(() => result.current.a.select());
    expect(result.current.a.selected).toBe(true);
    expect(result.current.b.selected).toBe(false);

    act(() => result.current.b.select());
    expect(result.current.a.selected).toBe(false);
    expect(result.current.b.selected).toBe(true);
  });

  it('selects nothing in a document that is only being read', () => {
    // The preview and the export mount no provider; a field there is text.
    const { result } = renderHook(() => useField('name', 'Ada'));
    expect(result.current.editing).toBe(false);
    expect(result.current.selected).toBe(false);

    act(() => result.current.select());
    expect(result.current.selected).toBe(false);
  });

  it('is not editable merely because a provider exists', () => {
    // `enabled={false}` is how the saved-résumé view mounts one.
    const { result } = renderHook(() => useField('name', 'Ada'), {
      wrapper: wrap(false),
    });
    act(() => result.current.select());
    expect(result.current.editing).toBe(false);
    expect(result.current.selected).toBe(false);
  });
});
