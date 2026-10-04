import type { ResumeObject, TemplateId } from '@cvgs/core';

export interface StaticOptions {
  /** The document's language, e.g. `es`; the template's default otherwise. */
  language?: string;
  /**
   * Draw the page as a picture of itself, for embedding in another page: links
   * are text, headings stay out of the host's outline, no editor attributes.
   */
  picture?: boolean;
}

export type RenderStatic = (
  template: TemplateId,
  resume: ResumeObject,
  options?: StaticOptions,
) => string;

export declare const renderStatic: RenderStatic;
