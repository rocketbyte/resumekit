import type { ResumeObject } from '@resumekit/schema';

/** Resumes that between them reach every branch a template draws. */
export const FULL = {
  name: 'Ada Lovelace',
  headline: 'Engineer',
  contact: {
    email: 'ada@example.com',
    phone: '+1 555 0100',
    location: 'London',
  },
  links: [{ label: 'GitHub', url: 'https://github.com/ada' }],
  custom_sections: [
    {
      id: 'vol',
      heading: 'Volunteering',
      author: 'candidate',
      entries: [{ title: 'Mentor', detail: 'Code Club', bullets: ['Taught.'] }],
    },
  ],
  section_headings: { experience: 'Work' },
  achievements: [{ title: 'Grant won', description: 'Secured £1.2M.' }],
  courses: [{ title: 'Advanced Excel', description: 'Run by the CFI.' }],
  passions: [{ title: 'Marathons', description: 'Five, so far.' }],
  languages: [{ name: 'English', level: 'native' }],
  summary: 'Builds engines.',
  skills: [
    { category: 'Backend', items: ['Node.js', 'Go'] },
    { category: 'Data', items: ['SQL'] },
  ],
  experience: [
    {
      company: 'Analytical Co',
      title: 'Engineer',
      location: 'London',
      start: '2020-01',
      end: 'Present',
      bullets: ['Built it.'],
      tech: [],
    },
  ],
  education: [
    {
      school: 'University of London',
      degree: 'BSc',
      field: 'Mathematics',
      start: '2014',
      end: '2017',
    },
  ],
  certifications: ['AWS Solutions Architect'],
} as unknown as ResumeObject;

export const EMPTY = {
  name: '',
  contact: {},
  links: [],
  custom_sections: [],
  section_headings: {},
  achievements: [],
  courses: [],
  passions: [],
  languages: [],
  skills: [],
  experience: [],
  education: [],
  certifications: [],
} as unknown as ResumeObject;

export const AWKWARD = {
  ...FULL,
  headline: undefined,
  contact: { email: 'a@b.c' },
  links: [],
  education: [{ school: 'Open University', end: '2019' }],
  skills: [{ category: '', items: [] }],
  certifications: [],
} as unknown as ResumeObject;

export const FIXTURES = { FULL, EMPTY, AWKWARD };
