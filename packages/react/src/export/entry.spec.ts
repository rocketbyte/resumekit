import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, beforeAll } from 'vitest';
import {
  EXPORT_PAGES_GLOBAL,
  EXPORT_PAYLOAD_GLOBAL,
  EXPORT_STATE_GLOBAL,
  type ResumeObject,
} from '@cvgs/core';

/**
 * The export bundle actually draws the document.
 *
 * This test exists because of a specific, and specifically silent, failure. The
 * obvious way to build this export was `renderToStaticMarkup` of the same
 * components — and it produces a document of exactly the right shape with every
 * field `undefined`, because Craft.js populates node props in an effect and the
 * server renderer runs none. It does not throw. It renders an empty résumé, and
 * a candidate downloads it.
 *
 * So the property under test is content, not layout: the bundle boots, the
 * payload reaches the templates, and the candidate's own words are in the DOM.
 *
 * jsdom cannot do layout — every measurement is zero — so pagination is NOT
 * checked here and cannot be. That is what the fidelity check against a real
 * Chromium is for (see `docs/pdf-export.md`). What this catches is the failure
 * that would otherwise reach production looking like a working export.
 */

const bundlePath = join(__dirname, '../../dist-export/bundle.js');
const built = existsSync(bundlePath);

const resume = {
  name: 'Ada Lovelace',
  contact: { email: 'ada@example.com', phone: '555-0100', location: 'London' },
  links: [],
  summary: 'Analytical engine specialist.',
  skills: [{ category: 'Mathematics', items: ['Numerical analysis'] }],
  experience: [
    {
      company: 'Analytical Engine Co',
      title: 'Consulting Engineer',
      start: '1842-01',
      end: 'Present',
      location: 'London',
      bullets: ['Wrote the first published algorithm for a machine.'],
      tech: ['Bernoulli numbers'],
    },
  ],
  education: [],
  certifications: [],
} as unknown as ResumeObject;

describe.skipIf(!built)('export bundle', () => {
  beforeAll(async () => {
    // jsdom has no font loading; the bundle waits on it before measuring.
    Object.defineProperty(document, 'fonts', {
      value: { ready: Promise.resolve() },
      configurable: true,
    });
    document.body.innerHTML = '<div id="cvgs-export-root"></div>';
    (window as unknown as Record<string, unknown>)[EXPORT_PAYLOAD_GLOBAL] = {
      resume,
    };

    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    new Function(readFileSync(bundlePath, 'utf8')).call(window);

    /*
     * Poll rather than sleep. The bundle waits on fonts and then on several
     * animation frames agreeing, and a fixed delay makes this test's pass or
     * failure depend on how busy the machine running it happens to be.
     */
    const deadline = Date.now() + 5000;
    while (
      Date.now() < deadline &&
      (window as unknown as Record<string, unknown>)[EXPORT_STATE_GLOBAL] ===
        'pending'
    ) {
      await new Promise((r) => setTimeout(r, 25));
    }
  });

  it('reports that it is ready', () => {
    expect(
      (window as unknown as Record<string, unknown>)[EXPORT_STATE_GLOBAL],
    ).toBe('ready');
  });

  it('draws the candidate’s own text — the failure SSR produced silently', () => {
    const html = document.body.innerHTML;
    expect(html).toContain('Ada Lovelace');
    expect(html).toContain('Analytical Engine Co');
    expect(html).toContain('Wrote the first published algorithm');
    expect(html).toContain('Numerical analysis');
  });

  it('renders no editing affordance', () => {
    // A read-only document carries the document and none of the workshop.
    expect(document.querySelector('input')).toBeNull();
    expect(document.querySelector('[contenteditable="true"]')).toBeNull();
  });

  it('reports a page count', () => {
    expect(
      (window as unknown as Record<string, unknown>)[EXPORT_PAGES_GLOBAL],
    ).toBeGreaterThanOrEqual(1);
  });
});
