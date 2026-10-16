import type { ResumeObject } from '@cvgs/core';

/**
 * A résumé that populates every one of the nine sections, so the gallery shows
 * what each template does with all of them rather than with the five it used to
 * have. The content is the references' own, so a panel can be held up against
 * `docs/template-references/<id>.png` directly.
 */
export const RESUME: ResumeObject = {
  name: 'Isabella Watson',
  headline: 'Digital Marketing Executive | PPC | Data Analysis | SEO',
  contact: {
    email: 'help@enhancv.com',
    phone: '+44 20 7123 4567',
    location: 'Liverpool, UK',
  },
  links: [{ label: 'linkedin.com', url: 'https://linkedin.com/in/isabella' }],
  summary:
    'Dynamic Digital Marketing Executive with over 5 years of experience ' +
    'leading effective PPC campaigns, leveraging data analytics and driving ' +
    'cross-functional initiatives to boost digital authority. Skilled in ' +
    'optimising campaign performance and achieving key marketing objectives.',
  skills: [
    {
      category: 'Marketing',
      items: ['PPC Campaign Management', 'Google Ads', 'SEO', 'CRO'],
    },
    { category: 'Analysis', items: ['Microsoft Excel', 'Data Analysis'] },
  ],
  experience: [
    {
      company: 'TechSolutions Ltd',
      title: 'Digital Marketing Manager',
      location: 'Manchester, UK',
      start: '2018-01',
      end: 'Present',
      bullets: [
        'Led a team to manage omni-channel digital strategies, boosting lead generation by 30% and increasing conversion rates by 25% within a year.',
        'Developed and executed a comprehensive SEO strategy that improved organic search ranking to top 5 for over 50 targeted keywords.',
        'Overhauled PPC campaign structures, enhancing CTR to 7% from a previous average of 3% and reducing CPA by 20%.',
      ],
      tech: [],
    },
    {
      company: 'Online Innovations Inc.',
      title: 'PPC Specialist',
      location: 'Liverpool, UK',
      start: '2016-06',
      end: '2017-12',
      bullets: [
        'Executed PPC campaigns across Google and Bing networks, achieving a 15% increase in ROAS within 9 months.',
        'Implemented A/B testing strategies that improved ad copy performance, leading to a 30% uplift in click-through rates.',
        'Managed a diverse portfolio of accounts, resulting in a growth of managed spend to over £200,000 yearly.',
      ],
      tech: [],
    },
  ],
  education: [
    {
      school: 'University of Liverpool',
      degree: 'MSc',
      field: 'Digital Marketing',
      location: 'Liverpool, UK',
      start: '2010-01',
      end: '2011-01',
    },
    {
      school: 'Manchester Metropolitan University',
      degree: 'BA (Hons)',
      field: 'Business Studies',
      location: 'Manchester, UK',
      start: '2006-01',
      end: '2010-01',
    },
  ],
  certifications: ['Google Ads Certification', 'Advanced Excel'],
  achievements: [
    {
      title: 'Lead Conversion Rate Boost',
      description:
        'Revitalised PPC ad copy leading to a 10% improvement in conversion rates within the first 6 months.',
    },
    {
      title: 'Significant Organic Rankings Uplift',
      description:
        'Spearheaded SEO initiative that positioned company within top 5 organic search results for key terms.',
    },
    {
      title: 'Marketing Automation Implementation',
      description:
        'Championed the implementation of marketing automation, enhancing outreach efficiency and cutting down operational costs.',
    },
    {
      title: 'Substantial Budget Management',
      description:
        'Oversaw and optimised a £200,000 marketing budget, achieving notable savings while maintaining campaign effectiveness.',
    },
  ],
  courses: [
    {
      title: 'Google Ads Certification',
      description:
        'Certified in Google Ads, mastering the advanced concepts of pay-per-click advertising with Google.',
    },
    {
      title: 'Advanced Excel for Data Analysis',
      description:
        'Completed coursework specialising in data manipulation and visualisation techniques using Microsoft Excel.',
    },
  ],
  passions: [
    {
      title: 'Sustainable Energy Advocacy',
      description:
        'Actively engaged in promoting renewable energy through community initiatives and public speaking engagements.',
    },
    {
      title: 'Marathon Running',
      description:
        'Participate in national marathons, fostering discipline and determination.',
    },
  ],
  languages: [
    { name: 'English', level: 'native' },
    { name: 'Spanish', level: 'advanced' },
    { name: 'French', level: 'intermediate' },
  ],
  custom_sections: [],
  section_headings: {},
};
