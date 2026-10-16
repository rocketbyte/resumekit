import { describe, expect, it } from 'vitest';
import {
  describeLibraryEntry,
  experienceOffer,
  libraryBullets,
  libraryCandidates,
} from './library.js';
import type { ResumeObject } from './resume.js';

const role = (company: string, title: string, start: string) => ({
  company,
  title,
  start,
  end: 'Present',
  bullets: [],
  tech: [],
});

const profile = {
  experience: [
    role('Doral Health', 'Senior Software Engineer', '2024-02'),
    role('Calvert Impact', 'Senior Software Engineer', '2023-03'),
    role('Digital Enhancements, LLC', 'Technical Lead', '2022-01'),
  ],
  courses: [{ title: 'Distributed Systems' }, { title: 'Accounting 101' }],
  certifications: ['AWS Solutions Architect', 'CPA'],
} as unknown as ResumeObject;

describe('what the profile can add to a resume', () => {
  it('offers the roles the resume does not carry, even when it reworded one', () => {
    const present = [role('Doral Health', 'Frontend Engineer', '2024-02')];
    const offered = libraryCandidates('experience', present, profile);
    expect(offered.map((r) => (r as { company: string }).company)).toEqual([
      'Calvert Impact',
      'Digital Enhancements, LLC',
    ]);
  });

  it('recognises entries by their name, however punctuated', () => {
    expect(
      libraryCandidates('certifications', ['aws solutions-architect'], profile),
    ).toEqual(['CPA']);
    expect(
      libraryCandidates('courses', [{ title: 'Distributed systems' }], profile),
    ).toEqual([{ title: 'Accounting 101' }]);
  });

  it('offers nothing without a profile', () => {
    expect(libraryCandidates('experience', [], null)).toEqual([]);
    expect(libraryCandidates('languages', [], profile)).toEqual([]);
  });

  it('names an entry for a list', () => {
    expect(describeLibraryEntry('experience', profile.experience[2])).toEqual({
      title: 'Technical Lead',
      detail: 'Digital Enhancements, LLC · 2022-01 – Present',
    });
    expect(describeLibraryEntry('certifications', 'CPA')).toEqual({
      title: 'CPA',
    });
  });
});

describe('bullets the profile holds for a role on the resume', () => {
  const withBullets = {
    experience: [
      {
        ...role('Doral Health', 'Senior Software Engineer', '2024-02'),
        bullets: [
          'Built NestJS microservices.',
          'Led the HL7 integration layer.',
          'Mentored three engineers.',
        ],
      },
    ],
  } as unknown as ResumeObject;

  it('offers the ones the resume’s version of the role lacks', () => {
    expect(
      libraryBullets(
        { company: 'Doral Health', start: '2024-02' },
        ['built nestjs microservices'],
        withBullets,
      ),
    ).toEqual(['Led the HL7 integration layer.', 'Mentored three engineers.']);
  });

  it('offers nothing for a role the profile does not hold', () => {
    expect(
      libraryBullets({ company: 'Globex', start: '2019-01' }, [], withBullets),
    ).toEqual([]);
  });
});

describe('what a role on the resume can take from the profile', () => {
  it('offers the role’s missing bullets and the roles not on the resume', () => {
    const library = {
      experience: [
        {
          ...role('Doral Health', 'Senior Software Engineer', '2024-02'),
          bullets: ['One.', 'Two.', 'Three.'],
        },
        role('Globex', 'Tech Lead', '2019-01'),
      ],
    } as unknown as ResumeObject;
    const onResume = {
      ...role('Doral Health', 'Frontend Engineer', '2024-02'),
      bullets: ['One.'],
    };

    const offer = experienceOffer(onResume, [onResume], library);
    expect(offer.bullets).toEqual(['Two.', 'Three.']);
    expect(offer.roles.map((r) => r.company)).toEqual(['Globex']);
  });
});
