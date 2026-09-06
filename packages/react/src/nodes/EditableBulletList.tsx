import { Suspense, lazy, useMemo } from 'react';
import { useField } from '../fields/field-registry.js';
import { formatClass, formatInk, inkAttr } from './formatting.js';
import { useFieldFormat } from '../presentation-context.js';
import {
  movedTo,
  useCollection,
  type CollectionStore,
} from '../collections/useCollection.js';
import { useAuthoring } from '../collections/authoring-context.js';
import { useAutosave } from '../autosave-context.js';
import type { AuthoredBulletsProps } from './AuthoredBullets.js';

export interface EditableBulletListProps {
  /** Where this list lives in the `ResumeObject` — e.g. `experience.0.bullets`. */
  path: string;
  items: string[];
}

/**
 * A list of bullets, and the same collection rules everything else obeys.
 *
 * A bullet rewords work the résumé already claims, so retyping it is the
 * candidate speaking about their own experience.
 *
 * What is different here is only the STORE. A bullet is text, and text lives in
 * the editor's own node props — so add, remove and move write there rather than
 * into the presentation overlay, where an appended entry lives. Every rule
 * around them (that a list has a minimum, what the refusal says when it is
 * reached, what a move means) comes from `useCollection`, which is the same
 * source `experience` and `education` read. Before `document-collections` (#57)
 * those rules were written out again here, and the minimum was a constant this
 * file owned.
 *
 * Its controls live in `AuthoredBullets`, reached through a dynamic import, so
 * a document that is only being read carries neither them nor the drag library
 * they use. What is left here is the list itself, which is the same list either
 * way.
 */

/*
 * Loaded on demand — see `AuthoredBullets`. The read-only fallback below is
 * rendered until it arrives, so the bullets are on screen before their controls
 * rather than after them.
 */
const AuthoredBullets = lazy(() => import('./AuthoredBullets.js')) as (
  props: AuthoredBulletsProps,
) => React.ReactElement;
export function EditableBulletList({ path, items }: EditableBulletListProps) {
  const format = useFieldFormat(path);
  const authoring = useAuthoring();
  /*
   * Only the TEXT is asked for here. Adding, removing and reordering a bullet
   * are stored by `useCollection`, which is where all three actually happen —
   * this component would be a second, drifting opinion about the same events.
   * What it owns is the one thing `useCollection` cannot see: a keystroke.
   */
  const { saveSoon } = useAutosave();
  const { value: live, editing, selected, select, set } = useField(path, items);

  /*
   * COPIES, where this used to `splice` an Immer draft inside `setProp`.
   *
   * That draft was the one place Craft's Immer integration was load-bearing
   * rather than incidental, and it is the line to read twice in this file: a
   * mutating call was correct there because nothing outside `setProp` ever
   * touched those props. Here the value is ordinary state, so a mutation would
   * be a mutation — the array is rebuilt instead, which is what React expects
   * and what makes an edit and a reorder the same kind of operation.
   */
  const store = useMemo<CollectionStore<string>>(
    () => ({
      items: live,
      insert: (index, item) =>
        set([...live.slice(0, index), item, ...live.slice(index)]),
      removeAt: (index) => set(live.filter((_, at) => at !== index)),
      reorder: (from, to) => set(movedTo([...live], from, to)),
    }),
    [live, set],
  );

  const bullets = useCollection<string>('experience_bullets', store);

  const edit = (index: number, next: string) => {
    set(live.map((item, at) => (at === index ? next : item)));
    saveSoon();
  };

  /* A press selects the field — Craft's `connect` used to attach this. */
  const onMouseDown = editing ? () => select() : undefined;

  const plain = live.map((item, index) => (
    // Bullets have no identity of their own — they are strings the candidate
    // reorders and deletes — so the index is the only honest key.
    <li key={index} className="tpl-bullet">
      <span className="tpl-text">{item}</span>
    </li>
  ));

  return (
    <ul
      onMouseDown={onMouseDown}
      className={formatClass(format, 'tpl-bullets')}
      style={formatInk(format)}
      data-ink={inkAttr(format)}
      data-path={path}
      data-editing={selected || undefined}
    >
      {/*
        A plain list, and the only thing rendered when the document is being
        read. It is also the fallback while the editing chunk loads, so the two
        states differ by the controls and by nothing else.
      */}
      {authoring ? (
        <Suspense fallback={plain}>
          <AuthoredBullets
            path={path}
            items={live}
            bullets={bullets}
            editing={selected}
            onEdit={edit}
          />
        </Suspense>
      ) : (
        plain
      )}
    </ul>
  );
}
