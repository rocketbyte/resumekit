import { describe, expect, it } from 'vitest';
import {
  dateIssuesByField,
  dateIssuesInDrawnOrder,
  dateOrder,
  resumeDateIssues,
} from './resume-dates.js';
import type { ResumeObject } from './resume.js';

const role = (start: string, end: string) => ({
  company: 'Acme',
  title: 'SRE',
  start,
  end,
  bullets: ['Did it.'],
  tech: [],
});

const resume = (over: Partial<ResumeObject> = {}): ResumeObject =>
  ({
    name: 'Ada Lovelace',
    contact: { email: 'ada@example.com' },
    links: [],
    summary: '',
    skills: [],
    experience: [],
    education: [],
    certifications: [],
    ...over,
  }) as ResumeObject;

describe('reading a date', () => {
  it('orders YYYY-MM', () => {
    expect(dateOrder('2024-02')).toBeLessThan(dateOrder('2024-03') as number);
    expect(dateOrder('2019-12')).toBeLessThan(dateOrder('2020-01') as number);
  });

  it('orders a bare year, because a degree is routinely dated by one', () => {
    expect(dateOrder('2018')).toBeLessThan(dateOrder('2019') as number);
    // January of the next year outranks a bare previous year.
    expect(dateOrder('2018')).toBeLessThan(dateOrder('2019-01') as number);
  });

  it('treats a current role as the most recent point in time', () => {
    /*
     * Not today's date: "Present" means "has not ended", which outranks any
     * month a candidate could type — and a clock here would make the same
     * résumé report differently tomorrow.
     */
    expect(dateOrder('Present')).toBe(Number.POSITIVE_INFINITY);
    expect(dateOrder('present')).toBe(Number.POSITIVE_INFINITY);
  });

  it('refuses to read what it cannot compare', () => {
    /*
     * The important return. A candidate mid-keystroke has `20`, and the
     * reference résumé is written `Feb 2024` — neither is wrong, and judging
     * either would be the editor refusing a perfectly good document.
     */
    expect(dateOrder('Feb 2024')).toBeNull();
    expect(dateOrder('20')).toBeNull();
    expect(dateOrder('')).toBeNull();
    expect(dateOrder(undefined)).toBeNull();
    expect(dateOrder('2024-13')).toBeNull();
  });
});

describe('a range that ends before it starts', () => {
  it('is reported', () => {
    const issues = resumeDateIssues(
      resume({ experience: [role('2024-06', '2024-01')] }),
    );
    expect(issues).toHaveLength(1);
    expect(issues[0].kind).toBe('ends-before-start');
    expect(issues[0].fields).toEqual([
      'experience.0.start',
      'experience.0.end',
    ]);
  });

  it('is not reported for a current role', () => {
    expect(
      resumeDateIssues(resume({ experience: [role('2024-06', 'Present')] })),
    ).toEqual([]);
  });

  it('is not reported when a date cannot be read', () => {
    expect(
      resumeDateIssues(resume({ experience: [role('Feb 2024', '2024-01')] })),
    ).toEqual([]);
  });
});

describe('reverse-chronological order', () => {
  it('accepts most recent first', () => {
    expect(
      resumeDateIssues(
        resume({
          experience: [
            role('2024-02', 'Present'),
            role('2023-03', '2024-01'),
            role('2022-01', '2023-02'),
          ],
        }),
      ),
    ).toEqual([]);
  });

  it('reports an entry that starts later than the one above it', () => {
    const issues = resumeDateIssues(
      resume({
        experience: [role('2019-01', '2020-01'), role('2024-02', 'Present')],
      }),
    );
    expect(issues).toHaveLength(1);
    expect(issues[0].kind).toBe('out-of-order');
    // The LATER entry is the one marked — it is the one in the wrong place.
    expect(issues[0].entryPath).toBe('experience.1');
  });

  it('orders by START, not by end', () => {
    /*
     * Two roles that both ended in 2024 are ordered by which began more
     * recently, and a current role has no end to order by at all.
     */
    expect(
      resumeDateIssues(
        resume({
          experience: [role('2023-06', '2024-05'), role('2021-01', '2024-05')],
        }),
      ),
    ).toEqual([]);
  });

  it('does not let one unreadable row cascade down the section', () => {
    /*
     * A half-typed row in the middle must not make every row beneath it look
     * out of order — the comparison is against the last row that could be read.
     */
    const issues = resumeDateIssues(
      resume({
        experience: [
          role('2024-02', 'Present'),
          role('', ''),
          role('2022-01', '2023-01'),
        ],
      }),
    );
    expect(issues).toEqual([]);
  });

  it('checks education by the same rule', () => {
    const issues = resumeDateIssues(
      resume({
        education: [
          { school: 'UTESA', start: '2013', end: '2017' },
          { school: 'EOI', start: '2018', end: '2019' },
        ],
      }),
    );
    expect(issues).toHaveLength(1);
    expect(issues[0].entryPath).toBe('education.1');
  });

  it('checks the two sections independently', () => {
    // Experience running most-recent-first says nothing about education.
    const issues = resumeDateIssues(
      resume({
        experience: [role('2024-01', 'Present')],
        education: [
          { school: 'A', start: '2013', end: '2017' },
          { school: 'B', start: '2018', end: '2019' },
        ],
      }),
    );
    expect(issues.map((i) => i.entryPath)).toEqual(['education.1']);
  });

  it('says nothing about a correctly ordered résumé', () => {
    expect(
      resumeDateIssues(
        resume({
          experience: [role('2024-02', 'Present'), role('2022-01', '2024-01')],
          education: [{ school: 'EOI', start: '2018', end: '2019' }],
        }),
      ),
    ).toEqual([]);
  });
});

describe('addressing an issue by the field it marks', () => {
  it('keys every marked field by its own path', () => {
    const byField = dateIssuesByField(
      resume({ experience: [role('2024-06', '2024-01')] }),
    );
    expect(byField.get('experience.0.start')).toBe('ends-before-start');
    expect(byField.get('experience.0.end')).toBe('ends-before-start');
    expect(byField.get('experience.0.title')).toBeUndefined();
  });

  it('describes an inverted range by what is wrong inside it', () => {
    /*
     * An entry can be both inverted and out of order. The thing wrong INSIDE it
     * is the more useful of the two to be told about.
     */
    const byField = dateIssuesByField(
      resume({
        experience: [role('2020-01', '2021-01'), role('2024-06', '2024-01')],
      }),
    );
    expect(byField.get('experience.1.start')).toBe('ends-before-start');
  });
});

describe('judging the order the document is DRAWN in', () => {
  /*
   * The case the index walk got wrong, and the one the feature exists for.
   *
   * A path follows the JOB, not the position: a résumé the candidate has
   * reordered renders `experience.2` in first place and its fields keep saying
   * `experience.2.*`. So the index says where an entry STARTED and the check is
   * a claim about where it is NOW — walking by index compared entries in an
   * order nobody was looking at, and said nothing about a document just dragged
   * into the wrong order.
   */
  const at =
    (map: Record<string, string>) =>
    (path: string): string | undefined =>
      map[path];

  it('reports the drawn order, not the numbered one', () => {
    // Drawn: experience.2 (2022) above experience.0 (2024) — oldest first.
    const issues = dateIssuesInDrawnOrder(
      [['experience.2', 'experience.0']],
      at({
        'experience.2.start': '2022-02',
        'experience.2.end': '2023-03',
        'experience.0.start': '2024-01',
        'experience.0.end': 'Present',
      }),
    );
    expect([...issues]).toEqual([['experience.0.start', 'out-of-order']]);
  });

  it('says nothing when the drawn order is right but the indices are not', () => {
    /*
     * The same résumé dragged the correct way round. Numbered 0 then 2, drawn
     * 2 first — an index walk would have reported this CORRECT document as
     * wrong, which is the same bug pointing the other way.
     */
    const issues = dateIssuesInDrawnOrder(
      [['experience.2', 'experience.0']],
      at({
        'experience.2.start': '2024-01',
        'experience.2.end': 'Present',
        'experience.0.start': '2022-02',
        'experience.0.end': '2023-03',
      }),
    );
    expect([...issues]).toEqual([]);
  });

  it('marks an added entry by the path it was addressed with', () => {
    // An addition is addressed past the end of the writer's array, never by
    // where it is drawn.
    const issues = dateIssuesInDrawnOrder(
      [['experience.0', 'experience.5']],
      at({
        'experience.0.start': '2020-01',
        'experience.0.end': '2021-01',
        'experience.5.start': '2024-01',
        'experience.5.end': 'Present',
      }),
    );
    expect([...issues]).toEqual([['experience.5.start', 'out-of-order']]);
  });

  it('still catches an inverted range', () => {
    const issues = dateIssuesInDrawnOrder(
      [['experience.1']],
      at({ 'experience.1.start': '2024-06', 'experience.1.end': '2024-01' }),
    );
    expect([...issues]).toEqual([
      ['experience.1.start', 'ends-before-start'],
      ['experience.1.end', 'ends-before-start'],
    ]);
  });

  it('keeps the sections apart', () => {
    const issues = dateIssuesInDrawnOrder(
      [['experience.0'], ['education.0', 'education.1']],
      at({
        'experience.0.start': '2024-01',
        'experience.0.end': 'Present',
        'education.0.start': '2013',
        'education.0.end': '2017',
        'education.1.start': '2018',
        'education.1.end': '2019',
      }),
    );
    expect([...issues]).toEqual([['education.1.start', 'out-of-order']]);
  });
});
