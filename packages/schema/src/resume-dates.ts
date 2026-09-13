import type { ResumeObject } from './resume.js';

/**
 * Whether a résumé's dates read the way a recruiter expects them to.
 *
 * The rules are NOT invented here. Both are already in the knowledge base, and
 * both already bind the writer through `GUIDE`:
 *
 * - `reverse-chronological` — "List experience and education in reverse
 *   chronological order", because "recruiters expect the most recent, most
 *   relevant role first within a six-second scan".
 * - `date-format` — "YYYY-MM, and 'Present' for the current role".
 *
 * What was missing is that neither bound the CANDIDATE. The editor lets them add
 * a role, drag it anywhere and type any date into it, so a résumé could be
 * exported with 2019 above 2024, or with a role that ends before it starts, and
 * the first reader to notice was the recruiter doing the six-second scan.
 *
 * Pure and framework-free: no I/O, no model call, no clock. Comparing two dates
 * is arithmetic, and a check the product can make itself must not become a
 * billable request.
 *
 * @pii Reads employment dates and returns PATHS and an enum — never a date, and
 * never anything that identifies the candidate.
 */

/** What was noticed about a date. */
export type DateIssueKind =
  /** The range ends before it starts. */
  | 'ends-before-start'
  /** This entry is more recent than the one above it. */
  | 'out-of-order';

export interface DateIssue {
  kind: DateIssueKind;
  /** The entry this is about, e.g. `experience.1`. */
  entryPath: string;
  /** The fields to mark, e.g. `['experience.1.start', 'experience.1.end']`. */
  fields: string[];
}

/**
 * A date reduced to a number that sorts, or `null` when it cannot be read.
 *
 * `null` is the important return. A candidate mid-keystroke has `20`, and a
 * résumé written like the reference one has `Feb 2024` — neither is wrong, and
 * reporting either as an error would be the editor refusing a document that is
 * perfectly good. Only what can be READ is judged; everything else is left
 * alone. That is why this returns `null` rather than `0` or `NaN`.
 *
 * `Present` is the LARGEST value rather than today's date, deliberately: it
 * means "has not ended", which outranks any month a candidate could type, and
 * using a clock here would make the same résumé report differently tomorrow.
 */
export function dateOrder(value: string | undefined): number | null {
  const text = (value ?? '').trim();
  if (!text) return null;
  if (/^present$/i.test(text)) return Number.POSITIVE_INFINITY;

  /* `YYYY-MM`, and `YYYY` alone — a degree is routinely dated by year, and a
     year is perfectly comparable against a month in another entry. */
  const iso = /^(\d{4})(?:-(\d{1,2}))?$/.exec(text);
  if (iso) {
    const year = Number(iso[1]);
    const month = iso[2] ? Number(iso[2]) : 1;
    if (month < 1 || month > 12) return null;
    return year * 12 + (month - 1);
  }
  return null;
}

/** One dated entry, whichever section it came from. */
interface Dated {
  start?: string;
  end?: string;
}

/**
 * The issues in one section's entries.
 *
 * Ordering is judged on the START date, which is what "reverse chronological"
 * orders by: two roles that both ended in 2024 are ordered by which began more
 * recently, and a current role has no end to order by at all.
 *
 * An entry whose start cannot be read is SKIPPED rather than treated as zero —
 * and skipped without breaking the chain, so a half-typed row in the middle does
 * not make every row beneath it look out of order. The comparison is against the
 * last entry that could be read.
 */
function sectionIssues(entries: readonly Dated[], path: string): DateIssue[] {
  const issues: DateIssue[] = [];
  let previousStart: number | null = null;

  entries.forEach((entry, i) => {
    const entryPath = `${path}.${i}`;
    const start = dateOrder(entry.start);
    const end = dateOrder(entry.end);

    if (start !== null && end !== null && end < start) {
      issues.push({
        kind: 'ends-before-start',
        entryPath,
        fields: [`${entryPath}.start`, `${entryPath}.end`],
      });
    }

    if (start === null) return;
    if (previousStart !== null && start > previousStart) {
      issues.push({
        kind: 'out-of-order',
        entryPath,
        fields: [`${entryPath}.start`],
      });
    }
    previousStart = start;
  });

  return issues;
}

/**
 * Every date in a résumé that disagrees with the chronological rules.
 *
 * Sections are checked INDEPENDENTLY: experience running most-recent-first says
 * nothing about education, and a section nobody has dated yet must not suppress
 * the check on one that is complete.
 */
export function resumeDateIssues(resume: ResumeObject): DateIssue[] {
  return [
    ...sectionIssues(resume.experience ?? [], 'experience'),
    ...sectionIssues(resume.education ?? [], 'education'),
  ];
}

/**
 * The same check, over the editor's LIVE field values.
 *
 * The editor does not hold a `ResumeObject` while it is being typed into: it
 * holds the résumé it mounted with, plus a map of every field's current value
 * keyed by path. Reading that map is what makes the marking clear the moment a
 * date is corrected — computing from the mounted copy would leave a warning
 * standing on a date the candidate has already fixed, which is worse than not
 * warning at all.
 *
 * Entries are discovered FROM THE KEYS rather than from a count passed in, so
 * adding and removing entries needs nothing else to be told.
 */
export function dateIssuesByFieldFromValues(
  values: ReadonlyMap<string, unknown>,
): Map<string, DateIssueKind> {
  const sections: Record<string, Map<number, Dated>> = {
    experience: new Map(),
    education: new Map(),
  };

  for (const [path, value] of values) {
    const m = /^(experience|education)\.(\d+)\.(start|end)$/.exec(path);
    if (!m || typeof value !== 'string') continue;
    const bucket = sections[m[1]];
    const i = Number(m[2]);
    bucket.set(i, { ...(bucket.get(i) ?? {}), [m[3]]: value });
  }

  const byField = new Map<string, DateIssueKind>();
  for (const [name, bucket] of Object.entries(sections)) {
    if (bucket.size === 0) continue;
    /* Dense, and in index order: a gap would shift every entry below it and
       report an ordering that is not on screen. */
    const highest = Math.max(...bucket.keys());
    const entries: Dated[] = [];
    for (let i = 0; i <= highest; i++) entries.push(bucket.get(i) ?? {});
    for (const issue of sectionIssues(entries, name)) {
      for (const field of issue.fields) {
        if (!byField.has(field)) byField.set(field, issue.kind);
      }
    }
  }
  return byField;
}

/** What the editor says about each kind, in the candidate's terms. */
export const DATE_ISSUE_MESSAGE: Record<DateIssueKind, string> = {
  'ends-before-start': 'This ends before it starts — check the dates.',
  'out-of-order':
    'Recruiters expect the most recent first — this one starts later than the entry above it.',
};

/**
 * The issues keyed by the FIELD path each one marks.
 *
 * Keyed by path because that is the address a field already knows itself by, so
 * a field can ask "is there anything about me?" without knowing the résumé's
 * shape — and every template gets this without being edited.
 */
export function dateIssuesByField(
  resume: ResumeObject,
): Map<string, DateIssueKind> {
  const byField = new Map<string, DateIssueKind>();
  for (const issue of resumeDateIssues(resume)) {
    for (const field of issue.fields) {
      /* First wins. A range that is inverted AND out of order is more usefully
         described by the thing wrong inside it than by its position. */
      if (!byField.has(field)) byField.set(field, issue.kind);
    }
  }
  return byField;
}
