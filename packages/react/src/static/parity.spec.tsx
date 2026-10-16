import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { TemplateId } from '@resumekit/schema';
import { TEMPLATE_RENDERERS } from '../registry.js';
import { DocumentPresentationProvider } from '../presentation-context.js';
import { renderStatic } from './render.js';
import { AWKWARD, EMPTY, FULL } from './fixtures.js';

describe('the static render is the template’s own read-only page', () => {
  for (const id of Object.keys(TEMPLATE_RENDERERS) as TemplateId[]) {
    for (const [name, resume] of Object.entries({ FULL, EMPTY, AWKWARD })) {
      for (const language of ['en', 'es']) {
        it(`${id} — ${name}, ${language}`, () => {
          const { Document } = TEMPLATE_RENDERERS[id];
          const view = render(
            <div className="tpl-editor tpl-editor--static">
              <DocumentPresentationProvider language={language}>
                <Document resume={resume} />
              </DocumentPresentationProvider>
            </div>,
          );
          expect(renderStatic(id, resume, { language })).toBe(
            view.container.innerHTML,
          );
          view.unmount();
        });
      }
    }
  }
});

describe('a picture of the page', () => {
  for (const id of Object.keys(TEMPLATE_RENDERERS) as TemplateId[]) {
    it(`${id} has no links, headings or editor attributes`, () => {
      const html = renderStatic(id, FULL, { picture: true });
      /* As text: a two-weight name is two spans around the typed space. */
      expect(html.replace(/<[^>]+>/g, '')).toContain('Ada Lovelace');
      expect(html).not.toMatch(/<a\b|<h[1-6]\b|data-path=|data-placeholder=/);
    });
  }
});
