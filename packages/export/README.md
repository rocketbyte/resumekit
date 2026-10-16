# @resumekit/export

Resumekit's document as one self-contained browser bundle, for rendering PDFs in a headless
browser (Chromium, Gotenberg) that has no network and no module resolution. React, every
template and every typeface are inside it.

```sh
pnpm add -D @resumekit/export
```

| File                           | What                             |
| ------------------------------ | -------------------------------- |
| `@resumekit/export/bundle.js`  | An IIFE that renders the payload |
| `@resumekit/export/bundle.css` | Its stylesheet, fonts inlined    |

Treat them as assets: copy them into your server's build, never import them into application
code.

## Rendering a PDF

Build one HTML page that holds, in order:

1. `bundle.css` inlined in a `<style>`;
2. `<div id="cvgs-export-root"></div>`;
3. a script that sets `window[EXPORT_PAYLOAD_GLOBAL] = { resume, presentation }`, or
   `{ letter, date }` for a letter;
4. `bundle.js` inlined in a `<script>`.

Wait for `window[EXPORT_STATE_GLOBAL]` to become `'ready'` (or `'failed'`), then print.
`window[EXPORT_PAGES_GLOBAL]` holds the page count. The constants and payload types come from
`@resumekit/schema`.

## License

MIT. Bundled fonts are under the SIL Open Font License 1.1.
