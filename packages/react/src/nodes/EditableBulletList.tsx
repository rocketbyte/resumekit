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
import { useEditorText } from '../i18n/index.js';

export interface EditableBulletListProps {
  /**
   * What an empty row says it wants.
   *
   * A list of achievements and a list of skills are the same control and not
   * the same field: a skills row guided by "what you did, and what changed
   * because of it" asks for a sentence where the page wants a keyword.
   */
  placeholder?: string;
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
export function EditableBulletList({
  path,
  items,
  placeholder: givenPlaceholder,
}: EditableBulletListProps) {
  const { t } = useEditorText();
  const placeholder = givenPlaceholder ?? t.placeholders.bullet;
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

  /*
   * One empty bullet, drawn but not STORED, for a list that has none.
   *
   * An entry with no bullets rendered an empty `<ul>`: nothing on the page, and
   * every control that adds or edits a bullet hangs off a bullet ROW, so the
   * list a candidate needed to start was the one thing they could not reach.
   * A minted role carries a bullet for this reason; an entry the writer
   * produced without one, or an authored section's first entry, does not.
   *
   * Drawn rather than stored, because storing it would put an empty bullet into
   * every such entry the moment the editor opened — a change to the document
   * that the candidate did not make and would have to undo. It becomes real on
   * the first keystroke, which is the moment they meant it.
   *
   * Only while AUTHORING. A document being read has nothing to fill in, and an
   * empty `<li>` under a role is a bullet in the exported file.
   */
  const guided = authoring !== null && live.length === 0;
  const shown = guided ? [''] : live;

  const edit = (index: number, next: string) => {
    /* The guide row has no entry behind it yet, so typing into it CREATES the
       list rather than replacing a member of an empty one — `map` over `[]`
       yields `[]`, and the first thing typed would be dropped. */
    set(guided ? [next] : live.map((item, at) => (at === index ? next : item)));
    saveSoon();
  };

  /* A press selects the field — Craft's `connect` used to attach this. */
  const onMouseDown = editing ? () => select() : undefined;

  const plain = shown.map((item, index) => (
    // Bullets have no identity of their own — they are strings the candidate
    // reorders and deletes — so the index is the only honest key.
    <li key={index} className="tpl-bullet">
      {/*
       * An empty bullet says what belongs in it, like every other empty field.
       *
       * Without this it was a span with no text and therefore no width: a role
       * added to a blank résumé comes with one bullet, per its `mint`, and that
       * bullet was invisible. Everything that types into it, adds another or
       * removes it hangs off the row — so a candidate saw a marker with nothing
       * beside it and had nothing to aim at. Drawn by CSS from the attribute,
       * never a text node, so it stays out of the résumé's own text.
       */}
      <span
        className="tpl-text"
        data-empty={item.length === 0 || undefined}
        data-placeholder={placeholder}
      >
        {item}
      </span>
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
            items={shown}
            bullets={bullets}
            editing={selected}
            onEdit={edit}
            placeholder={placeholder}
          />
        </Suspense>
      ) : (
        plain
      )}
    </ul>
  );
}
