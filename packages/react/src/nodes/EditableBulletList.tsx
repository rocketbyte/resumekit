import { useNode } from '@craftjs/core';
import { LOCKED_RULES } from './locked.js';

export interface EditableBulletListProps {
  /** Where this list lives in the `ResumeObject` — e.g. `experience.0.bullets`. */
  path: string;
  items: string[];
}

/** Removing the last bullet would collapse the entry it belongs to. */
const LAST_BULLET_REASON =
  'An experience entry needs at least one bullet — reword this one instead.';

/**
 * The one list whose length the candidate controls.
 *
 * A bullet rewords work the resume already claims, so retyping it is the
 * candidate speaking about their own experience. Adding a *job* is a new claim
 * about their history, which this product grounds through the interview rather
 * than through free typing — so there is no control for it here.
 *
 * The add/remove controls sit in the page's right margin, absolutely positioned
 * out of the document's flow, so revealing them cannot move a single line of the
 * document. See `design.md`, decision 4.
 */
export function EditableBulletList({ path, items }: EditableBulletListProps) {
  const {
    connectors: { connect },
    selected,
    actions: { setProp },
  } = useNode((node) => ({ selected: node.events.selected }));

  /*
   * `push` / `splice` inside `setProp` mutate an Immer draft, so the mutating
   * call is the correct idiom here rather than a violation of one. Nothing
   * outside `setProp` ever touches these props.
   */
  const insertAfter = (index: number) =>
    setProp((props: EditableBulletListProps) => {
      props.items.splice(index + 1, 0, '');
    });

  const remove = (index: number) =>
    setProp((props: EditableBulletListProps) => {
      if (props.items.length > 1) props.items.splice(index, 1);
    });

  const edit = (index: number, next: string) =>
    setProp((props: EditableBulletListProps) => {
      props.items[index] = next;
    }, 500);

  return (
    <ul
      ref={(ref) => {
        if (ref) connect(ref);
      }}
      className="tpl-bullets"
      data-path={path}
      data-editing={selected || undefined}
    >
      {items.map((item, index) => (
        // Bullets have no identity of their own — they are strings the candidate
        // reorders and deletes — so the index is the only honest key.
        <li key={index} className="tpl-bullet">
          {selected ? (
            <span className="tpl-text tpl-grow" data-value={item}>
              <textarea
                className="tpl-input"
                value={item}
                rows={1}
                aria-label={`${path}.${index}`}
                onChange={(e) => edit(index, e.target.value)}
              />
            </span>
          ) : (
            <span className="tpl-text">{item}</span>
          )}

          {selected && (
            <span className="tpl-bullet__tools" aria-hidden={false}>
              <button
                type="button"
                className="tpl-tool"
                title="Add a bullet below"
                aria-label={`Add a bullet after ${index + 1}`}
                onClick={() => insertAfter(index)}
              >
                +
              </button>
              <button
                type="button"
                className="tpl-tool"
                disabled={items.length === 1}
                // Disabled and explained rather than hidden: a rule the
                // candidate cannot see is a rule they run into.
                title={
                  items.length === 1 ? LAST_BULLET_REASON : 'Remove this bullet'
                }
                aria-label={`Remove bullet ${index + 1}`}
                onClick={() => remove(index)}
              >
                ×
              </button>
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

EditableBulletList.craft = {
  displayName: 'EditableBulletList',
  rules: LOCKED_RULES,
};
