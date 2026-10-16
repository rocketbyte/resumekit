import { useMemo, useState } from 'react';
import {
  APPENDABLE_SECTIONS,
  COLLECTIONS,
  describeLibraryEntry,
  experienceOffer,
  libraryCandidates,
  type Experience,
  type LibrarySection,
} from '@resumekit/schema';
import { useAuthoring } from '../authoring-context.js';
import type { CollectionHandle } from '../useCollection.js';
import {
  useFieldRegistry,
  useFieldValue,
} from '../../fields/field-registry.js';
import { useAutosave } from '../../autosave-context.js';
import { useEditorText } from '../../i18n/index.js';
import {
  LibraryPicker,
  type PickerGroup,
  type PickerSelection,
} from './LibraryPicker.js';

const LibraryIcon = () => (
  <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
    <path d="M8 2.5v6.5M5.5 6.5 8 9l2.5-2.5M3 9.5v3h10v-3" />
  </svg>
);

const MORE = 'more-of-this-role';
const OTHERS = 'other-entries';

/**
 * "Add from career profile" on an entry.
 *
 * On a role it offers two things at once — the bullets the profile holds for
 * THIS role that the resume left out, and the roles the resume does not carry
 * (each with its bullets, any of which can be left behind). Elsewhere it
 * offers the section's missing entries. Chosen bullets join this role; chosen
 * entries are inserted below it as candidate additions.
 *
 * Shown whenever there is a profile, even with nothing new: a control that
 * comes and goes with the data reads as a missing feature, so the picker says
 * so instead. Absent without a profile (the profile's own editor passes none)
 * and in sections nobody can add to.
 */
export function LibraryAction<T>({
  collection,
  index,
  path,
  noun,
  className,
}: {
  collection: CollectionHandle<T>;
  index: number;
  /** The entry's field path, e.g. `experience.2`. */
  path?: string;
  noun: string;
  className: string;
}) {
  const library = useAuthoring()?.library;
  const registry = useFieldRegistry();
  const { saveNow } = useAutosave();
  const [open, setOpen] = useState(false);
  const text = useEditorText();
  const { t, format } = text;

  const section = (APPENDABLE_SECTIONS as readonly string[]).includes(
    collection.id,
  )
    ? (collection.id as LibrarySection)
    : null;
  const sectionNoun = COLLECTIONS[collection.id].noun ?? noun;
  const nounForms = text.noun(sectionNoun);
  const isRole = section === 'experience';

  /* The role's bullets as they stand now, typed edits included. */
  const bulletsPath = path ? `${path}.bullets` : '';
  const liveBullets = useFieldValue(bulletsPath) as string[] | undefined;
  const item = collection.items[index] as unknown as Experience | undefined;

  const offer = useMemo(() => {
    if (!section || !library) return null;
    if (!isRole) {
      return {
        bullets: [] as string[],
        entries: libraryCandidates(section, collection.items, library),
      };
    }
    const { bullets, roles } = experienceOffer(
      { ...item, bullets: liveBullets ?? item?.bullets ?? [] },
      collection.items,
      library,
    );
    return { bullets, entries: roles as unknown[] };
  }, [section, library, isRole, item, liveBullets, collection.items]);

  if (!section || !collection.canAdd || !library || !offer) return null;

  const groups: PickerGroup[] = [
    ...(isRole
      ? [
          {
            id: MORE,
            heading: t.library.moreHeading,
            hint: t.library.moreHint,
            options: offer.bullets.map((title) => ({ title })),
          },
        ]
      : []),
    {
      id: OTHERS,
      heading: isRole ? t.library.othersHeading : undefined,
      hint: isRole ? t.library.othersHint : undefined,
      options: offer.entries.map((entry) => ({
        ...describeLibraryEntry(section, entry),
        ...(isRole ? { parts: (entry as Experience).bullets } : {}),
      })),
    },
  ];

  const addLabel = (selection: PickerSelection) => {
    const bullets = selection[MORE]?.length ?? 0;
    const entries = selection[OTHERS]?.length ?? 0;
    const counted = [
      bullets > 0 && text.plural(text.noun('bullet').count, bullets),
      entries > 0 && text.plural(nounForms.count, entries),
    ].filter((part): part is string => Boolean(part));
    return format(t.library.addSelection, { items: text.list(counted) });
  };

  const add = (selection: PickerSelection) => {
    const bullets = (selection[MORE] ?? []).map(
      ({ index: i }) => offer.bullets[i] as string,
    );
    if (bullets.length > 0 && registry && bulletsPath) {
      registry.write(bulletsPath, [
        ...(liveBullets ?? item?.bullets ?? []),
        ...bullets,
      ]);
      saveNow();
    }

    const entries = (selection[OTHERS] ?? []).map(({ index: i, parts }) => {
      const entry = offer.entries[i];
      if (!isRole) return entry as T;
      const role = entry as Experience;
      return {
        ...role,
        bullets: parts.map((p) => role.bullets[p] as string),
      } as unknown as T;
    });
    if (entries.length > 0) collection.addMany(index, entries);
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        className={className}
        title={t.library.action}
        aria-label={format(t.library.actionLabel, text.noun(noun))}
        aria-haspopup="dialog"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
      >
        <LibraryIcon />
      </button>
      {open && (
        <LibraryPicker
          title={
            isRole
              ? t.library.roleTitle
              : format(t.library.sectionTitle, nounForms)
          }
          subtitle={
            isRole && item
              ? format(t.library.roleSubtitle, {
                  role: [item.title, item.company].filter(Boolean).join(' · '),
                })
              : t.library.subtitle
          }
          groups={groups}
          empty={
            isRole
              ? t.library.roleEmpty
              : format(t.library.sectionEmpty, nounForms)
          }
          addLabel={addLabel}
          onAdd={add}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
