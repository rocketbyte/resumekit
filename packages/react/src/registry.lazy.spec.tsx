import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ResumeObjectSchema } from '@resumekit/schema';

/*
 * Runs in the `react-lazy` project, whose setup registers no template: what a
 * browser application starts with.
 */
describe('a template that has not loaded yet', () => {
  it('is drawn once its module arrives', async () => {
    const { TemplateDocument } = await import('./TemplateDocument.js');
    const resume = ResumeObjectSchema.parse({
      name: 'Ada Lovelace',
      contact: {},
      links: [],
      summary: 'Engineer.',
      skills: [],
      experience: [],
      education: [],
      certifications: [],
    });

    render(
      <TemplateDocument
        resume={resume}
        presentation={{ template_id: 'curve', edits: [], updated_at: '' }}
      />,
    );

    expect(await screen.findByText('Ada Lovelace')).toBeTruthy();
  });
});
