import { Suspense, lazy, useMemo } from 'react';
import { useNode } from '@craftjs/core';
import { LOCKED_RULES } from './locked.js';
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
  const {
    connectors: { connect },
    selected,
    actions: { setProp },
  } = useNode((node) => ({ selected: node.events.selected }));

  /*
   * `splice` inside `setProp` mutates an Immer draft, so the mutating call is
   * the correct idiom here rather than a violation of one. Nothing outside
   * `setProp` ever touches these props.
   */
  const store = useMemo<CollectionStore<string>>(
    () => ({
      items,
      insert: (index, item) =>
        setProp((props: EditableBulletListProps) => {
          props.items.splice(index, 0, item);
        }),
      removeAt: (index) =>
        setProp((props: EditableBulletListProps) => {
          props.items.splice(index, 1);
        }),
      reorder: (from, to) =>
        setProp((props: EditableBulletListProps) => {
          props.items = movedTo(props.items, from, to);
        }),
    }),
    [items, setProp],
  );

  const bullets = useCollection<string>('experience_bullets', store);

  const edit = (index: number, next: string) => {
    setProp((props: EditableBulletListProps) => {
      props.items[index] = next;
    }, 500);
    saveSoon();
  };

  const plain = items.map((item, index) => (
    // Bullets have no identity of their own — they are strings the candidate
    // reorders and deletes — so the index is the only honest key.
    <li key={index} className="tpl-bullet">
      <span className="tpl-text">{item}</span>
    </li>
  ));

  return (
    <ul
      ref={(ref) => {
        if (ref) connect(ref);
      }}
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
            items={items}
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

EditableBulletList.craft = {
  displayName: 'EditableBulletList',
  rules: LOCKED_RULES,
};
