# @resumekit/react

Editable, paginated resume templates for React. Every template is drawn on real US Letter page
geometry, split across sheets by a paginator, and editable in place.

```sh
pnpm add @resumekit/react @resumekit/schema react react-dom zod
```

Requires React 19 and zod 4. The package is ESM-only and is meant to be consumed through a
bundler (Vite, Next.js, webpack) that handles CSS imports and code splitting.

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

## Templates load on demand

Each template, with its stylesheet, is a separate chunk that loads the first time it is drawn,
so an application ships only the templates it uses. `TemplateDocument` shows nothing until the
template has arrived (it holds its own `Suspense` boundary).

- **No wait:** call `preloadTemplate(id)` as soon as the template is known, e.g. a saved resume's
  template, or the one under the pointer in a chooser.
- **Rendering `TEMPLATE_RENDERERS[id].Document` yourself:** wrap it in `<Suspense>`, or preload
  it first.
- **Everything at once:** server-side rendering, print pipelines and test suites can
  `import '@resumekit/react/all-templates'`, which makes every template render synchronously.
  `preloadTemplates()` does the same asynchronously.

## Testing with Vitest or Jest

The modules import their own stylesheets, which a bundler handles but Node cannot load. Let your
test runner transform the package, and load every template up front so documents render
synchronously:

```ts
// vitest.config.ts
export default defineConfig({
  test: {
    server: { deps: { inline: ['@resumekit/react'] } },
    setupFiles: ['./test-setup.ts'], // containing: import '@resumekit/react/all-templates';
  },
});
```

With Jest, exempt the package from `transformIgnorePatterns` and map `\.css$` to a stub in
`moduleNameMapper`.

## Entry points

| Import                           | What                                                                        |
| -------------------------------- | --------------------------------------------------------------------------- |
| `@resumekit/react`               | Components, editing kit, paginator, locale catalogs, `preloadTemplate(s)`   |
| `@resumekit/react/all-templates` | Side-effect import: every template loaded now (SSR, print, tests)           |
| `@resumekit/react/document.css`  | The document and editor styles (each template brings its own when it loads) |
| `@resumekit/react/fonts.css`     | `@font-face` rules for the bundled typefaces; a face downloads when used    |

Rendering outside a React application lives in its own packages:

- [`@resumekit/static`](../static#readme): read-only pages as static HTML, for Node at build time.
- [`@resumekit/export`](../export#readme): a self-contained browser bundle for headless PDF
  rendering.

## License

MIT. Bundled fonts are under the SIL Open Font License 1.1 (`dist/fonts/licenses/`).
