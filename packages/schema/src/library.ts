import type { ResumeObject } from './resume.js';
import type { APPENDABLE_SECTIONS } from './template.js';

/**
 * Taking entries from the career profile into the resume being edited.
 *
 * The profile is the candidate's whole history; a resume carries the part
 * chosen for it. These functions answer which of the profile's entries a
 * resume does not carry yet, and how to name one in a list — pure, so the
 * editor, its tests and any later surface agree on both. See
 * `add-from-career-profile`.
 */

export type LibrarySection = (typeof APPENDABLE_SECTIONS)[number];

const norm = (value: unknown) =>
  String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

type Item = Record<string, unknown>;

/**
 * What makes two entries the SAME entry, per section.
 *
 * A role is its employer and when it began — not its title or bullets, which a
 * tailored resume rewrites, so a reworded role is still recognised as the one
 * already on the page. Everything else is recognised by the name it is listed
 * under.
 */
export function entryIdentity(section: LibrarySection, item: unknown): string {
  if (typeof item === 'string') return norm(item);
  const it = (item ?? {}) as Item;
  switch (section) {
    case 'experience':
      return `${norm(it['company'])}|${String(it['start'] ?? '').slice(0, 7)}`;
    case 'education':
      return `${norm(it['school'])}|${norm(it['degree'])}`;
    case 'skills':
      return norm(it['category']);
    case 'links':
      return norm(String(it['url'] ?? '').replace(/^https?:\/\/(www\.)?/i, ''));
    case 'languages':
      return norm(it['name']);
    case 'achievements':
    case 'courses':
    case 'passions':
      return norm(it['title']);
    case 'certifications':
      return norm(item);
  }
}

/** The profile's entries of `section` that `present` does not already carry. */
export function libraryCandidates(
  section: LibrarySection,
  present: readonly unknown[],
  library: ResumeObject | null | undefined,
): unknown[] {
  const available = (library?.[section] ?? []) as readonly unknown[];
  if (available.length === 0) return [];
  const have = new Set(present.map((item) => entryIdentity(section, item)));
  return available.filter((item) => {
    const key = entryIdentity(section, item);
    return key.length > 0 && key !== '|' && !have.has(key);
  });
}

/** How an entry is named in a list: a title and, when there is one, a detail line. */
export function describeLibraryEntry(
  section: LibrarySection,
  item: unknown,
): { title: string; detail?: string } {
  if (typeof item === 'string') return { title: item };
  const it = (item ?? {}) as Item;
  const s = (key: string) =>
    typeof it[key] === 'string' ? (it[key] as string) : '';
  const joined = (...parts: string[]) =>
    parts.filter(Boolean).join(' · ') || undefined;
  switch (section) {
    case 'experience':
      return {
        title: s('title') || s('company'),
        detail: joined(
          s('company'),
          [s('start'), s('end')].filter(Boolean).join(' – '),
        ),
      };
    case 'education':
      return {
        title: s('school'),
        detail: joined(
          [s('degree'), s('field')].filter(Boolean).join(', '),
          s('end'),
        ),
      };
    case 'skills': {
      const items = Array.isArray(it['items']) ? (it['items'] as string[]) : [];
      return {
        title: s('category') || 'Skills',
        detail: items.slice(0, 6).join(', ') || undefined,
      };
    }
    case 'links':
      return {
        title: s('label') || s('url'),
        detail: s('label') ? s('url') : undefined,
      };
    case 'languages':
      return { title: s('name'), detail: s('level') || undefined };
    default:
      return { title: s('title'), detail: s('description') || undefined };
  }
}

const sameText = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

/** The profile's version of a role on the resume: same employer, same start. */
export function libraryRole(
  role: { company?: unknown; start?: unknown },
  library: ResumeObject | null | undefined,
): ResumeObject['experience'][number] | undefined {
  const key = entryIdentity('experience', role);
  if (key === '|') return undefined;
  return library?.experience.find(
    (entry) => entryIdentity('experience', entry) === key,
  );
}

/**
 * The bullets the profile holds for this role that the resume's version of it
 * does not — compared by their words, so a bullet that differs only in
 * punctuation or case is not offered twice.
 */
export function libraryBullets(
  role: { company?: unknown; start?: unknown },
  present: readonly string[],
  library: ResumeObject | null | undefined,
): string[] {
  const match = libraryRole(role, library);
  if (!match) return [];
  const have = new Set(present.map(sameText));
  return match.bullets.filter((bullet) => {
    const key = sameText(bullet);
    return key.length > 0 && !have.has(key);
  });
}

/** What the profile can add from a role on the resume. */
export interface ExperienceOffer {
  /** The profile's bullets for THIS role that the resume's version lacks. */
  bullets: string[];
  /** The profile's roles the resume does not carry at all. */
  roles: ResumeObject['experience'];
}

/**
 * Everything the profile can add, seen from one role: more of this role, and
 * other roles. One answer for both, so a role already on the page never hides
 * the bullets the resume left out of it.
 */
export function experienceOffer(
  role: { company?: unknown; start?: unknown; bullets?: readonly string[] },
  present: readonly unknown[],
  library: ResumeObject | null | undefined,
): ExperienceOffer {
  return {
    bullets: libraryBullets(role, role.bullets ?? [], library),
    roles: libraryCandidates(
      'experience',
      present,
      library,
    ) as ResumeObject['experience'],
  };
}
