/**
 * The export bundle: the document, drawn in the renderer's browser.
 *
 * ## Why a browser bundle rather than server-rendered HTML
 *
 * Not because the components cannot be server-rendered — they can.
 * `renderToStaticMarkup` of `TemplateDocument` produces the whole document, text
 * and all. The reason is narrower, and it is **pagination**.
 *
 * `PagedSheet` decides where a page ends by MEASURING the laid-out document:
 * `getBoundingClientRect` on every block, a settle loop, and a correction pass
 * for margins that collapsed. `pagination.ts` states the constraint plainly —
 * reading the layout is a browser question, and every measurement outside a
 * browser is zero. Server-rendered markup therefore arrives unpaginated: no
 * pushed margins, one sheet reported however long the résumé is, and the page
 * breaks left to whatever Chromium's own `break-*` rules decide. That is exactly
 * the screen/paper divergence this change exists to eliminate.
 *
 * Paginating server-rendered markup would mean reimplementing the measuring half
 * of `PagedSheet` as a standalone script — a second implementation of the one
 * piece of code the guarantee rests on. So the export ships the real thing and
 * lets the renderer's Chromium run it. The paginator is **executed, not
 * reimplemented**, and the only difference from the editor's rendering is
 * `sheetGap`, which is zero because paper has no gap between its pages.
 *
 * The cost is an inlined bundle of a few hundred KB. Against a render that is
 * already starting a browser, that is not the expensive part.
 */
import { createRoot } from 'react-dom/client';
import { TemplateDocument } from '../TemplateDocument.js';
import { LetterDocument } from '../letter/LetterDocument.js';
import {
  EXPORT_PAGES_GLOBAL,
  EXPORT_PAYLOAD_GLOBAL,
  EXPORT_STATE_GLOBAL,
  PRINT_SHEET_GAP,
  isLetterPayload,
  type ExportPayload,
  type ExportState,
} from '@resumekit/schema';

/** How many consecutive identical frames count as "the layout has stopped". */
const STABLE_FRAMES = 3;
/** Frames to wait before giving up on the layout ever settling. */
const MAX_FRAMES = 240;

declare global {
  interface Window {
    [EXPORT_PAYLOAD_GLOBAL]?: ExportPayload;
    [EXPORT_STATE_GLOBAL]?: ExportState;
    [EXPORT_PAGES_GLOBAL]?: number;
  }
}

function setState(state: ExportState): void {
  window[EXPORT_STATE_GLOBAL] = state;
}

const frame = () =>
  new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

/**
 * A fingerprint of everything that decides where the pages fall.
 *
 * The page count alone is not enough: a document can reach its final count while
 * a block is still being nudged by the correction pass, and printing then would
 * capture the intermediate position. The pushed margins are therefore part of
 * the fingerprint, so "settled" means every block has stopped moving.
 */
function layoutFingerprint(): string {
  const pages = document.querySelector<HTMLElement>('.tpl-pages');
  if (!pages) return '';
  const blocks = Array.from(
    pages.querySelectorAll<HTMLElement>('.tpl-pages__flow *'),
  )
    .map((el) => el.style.marginTop)
    .filter(Boolean)
    .join('|');
  return `${pages.style.getPropertyValue('--pages')}#${Math.round(
    pages.getBoundingClientRect().height,
  )}#${blocks}`;
}

/**
 * Wait until the document has stopped moving.
 *
 * Fonts first, because a face that loads late re-flows every line and would
 * otherwise settle the layout twice — the second time after the renderer had
 * already been told the page was ready. `document.fonts.ready` is the browser's
 * own answer to "are the metrics final", so nothing here has to guess at a delay.
 */
async function settle(): Promise<void> {
  await document.fonts.ready;

  let previous = '';
  let stable = 0;
  for (let i = 0; i < MAX_FRAMES; i++) {
    await frame();
    const current = layoutFingerprint();
    if (current !== '' && current === previous) {
      if (++stable >= STABLE_FRAMES) return;
    } else {
      stable = 0;
    }
    previous = current;
  }
  throw new Error('layout did not settle');
}

async function main(): Promise<void> {
  const payload = window[EXPORT_PAYLOAD_GLOBAL];
  if (!payload) throw new Error('no export payload');

  const host = document.getElementById('cvgs-export-root');
  if (!host) throw new Error('no export root');

  /*
   * Deliberately NOT under StrictMode.
   *
   * StrictMode exists to surface effect bugs during development by running
   * effects twice. This is a print job: there is no developer to warn, and the
   * doubling costs a second full pagination pass of a document whose whole job
   * is to be measured. The app mounts the same tree under StrictMode, so
   * anything it would catch is already caught where it can be acted on.
   *
   * A letter is one flowing column the browser breaks by itself — it has no
   * paginator to wait for, only its fonts.
   */
  if (isLetterPayload(payload)) {
    createRoot(host).render(
      <LetterDocument letter={payload.letter} date={payload.date} />,
    );
    await document.fonts.ready;
    await frame();
    window[EXPORT_PAGES_GLOBAL] = 1;
    setState('ready');
    return;
  }

  createRoot(host).render(
    <TemplateDocument
      resume={payload.resume}
      presentation={payload.presentation}
      sheetGap={PRINT_SHEET_GAP}
    />,
  );

  await settle();

  const pages = document.querySelector<HTMLElement>('.tpl-pages');
  window[EXPORT_PAGES_GLOBAL] = Number(
    pages?.style.getPropertyValue('--pages') ?? 1,
  );
  setState('ready');
}

setState('pending');

/*
 * Any failure ends the wait immediately and says so.
 *
 * Without this a broken document would hold the renderer for its whole timeout
 * and then report only that it expired — the least useful of the available
 * facts. The renderer additionally fails on console exceptions, so an error
 * thrown outside this promise is caught too.
 */
window.addEventListener('error', () => setState('failed'));
window.addEventListener('unhandledrejection', () => setState('failed'));

main().catch((error: unknown) => {
  setState('failed');
  // The template id and the failure — never the document. See the PII rule.
  console.error(
    '[export] render failed:',
    error instanceof Error ? error.message : 'unknown error',
  );
});
