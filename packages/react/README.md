# @resumekit/react

Editable, paginated resume templates for React. Every template is drawn on real page
geometry (Letter or A4), split across sheets by a paginator, and editable in place.

```sh
pnpm add @resumekit/react @resumekit/schema react react-dom zod
```

Requires React 19 and zod 4. The package is ESM-only and is meant to be consumed through a
bundler (Vite, Next.js, webpack) that handles CSS imports.

## Drawing a resume

```tsx
import { TemplateDocument, TemplateLocaleProvider } from '@resumekit/react';
import '@resumekit/react/fonts.css';
import '@resumekit/react/document.css';

export function Preview({ resume }) {
  return (
    <TemplateLocaleProvider locale="en">
      <TemplateDocument
        resume={resume}
        presentation={{ template_id: 'harvard', edits: [], updated_at: '' }}
        shrinkToFit
      />
    </TemplateLocaleProvider>
  );
}
```

`resume` is a `ResumeObject` from `@resumekit/schema`. `presentation` chooses the template and
carries the person's edits, typography and spacing; omit it for the default template.

## Entry points

| Import                               | What                                                                              |
| ------------------------------------ | --------------------------------------------------------------------------------- |
| `@resumekit/react`                   | Components, editing kit, paginator, locale catalogs                               |
| `@resumekit/react/document.css`      | The document and editor styles                                                    |
| `@resumekit/react/fonts.css`         | `@font-face` rules for the bundled typefaces                                      |
| `@resumekit/react/static`            | `renderStatic(templateId, resume, options)` → HTML string, for Node at build time |
| `@resumekit/react/static.css`        | Shared CSS for static pages, pruned and minified                                  |
| `@resumekit/react/static/<id>.css`   | One template's CSS for static pages                                               |
| `@resumekit/react/export/bundle.js`  | A self-contained IIFE (React and fonts inlined) for headless PDF rendering        |
| `@resumekit/react/export/bundle.css` | Its stylesheet                                                                    |

### Static rendering

```ts
import { renderStatic } from '@resumekit/react/static';

const html = renderStatic('harvard', resume, { language: 'en', picture: true });
```

`picture: true` draws the page as an image of itself: inert links, headings out of the host
page's outline, no editor attributes.

### PDF export

The export bundle runs in a headless browser with no network. Build one HTML page that holds:

1. `export/bundle.css` inlined in a `<style>`,
2. `<div id="cvgs-export-root"></div>`,
3. a script that sets `window[EXPORT_PAYLOAD_GLOBAL] = { resume, presentation }`,
4. `export/bundle.js` inlined in a `<script>` after it.

Wait for `window[EXPORT_STATE_GLOBAL]` to become `'ready'` (or `'failed'`), then print.
`window[EXPORT_PAGES_GLOBAL]` holds the page count. The constants and payload types are exported
from `@resumekit/schema`.

## License

MIT. Bundled fonts are under the SIL Open Font License 1.1 (`dist/fonts/licenses/`).
