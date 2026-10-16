# resumekit

Print-accurate, editable resume templates for React, and the schemas they are drawn from.

| Package                                | What it is                                                                               |
| -------------------------------------- | ---------------------------------------------------------------------------------------- |
| [`@resumekit/react`](packages/react)   | Templates, the in-place editing kit and the paginator; each template loads on first use  |
| [`@resumekit/schema`](packages/schema) | Zod schemas for a structured resume, the template catalog and the presentation overlay   |
| [`@resumekit/static`](packages/static) | The templates rendered to static HTML in Node, with pruned stylesheets (build time)      |
| [`@resumekit/export`](packages/export) | One self-contained browser bundle for rendering PDFs in a headless browser (server side) |

All four are released together at one version. An application needs `react` and `schema`;
`static` and `export` are for build steps and servers.

```sh
pnpm add @resumekit/react @resumekit/schema react react-dom zod
```

```tsx
import { TemplateDocument } from '@resumekit/react';
import '@resumekit/react/fonts.css';
import '@resumekit/react/document.css';

<TemplateDocument
  resume={resume}
  presentation={{ template_id: 'harvard', edits: [], updated_at: '' }}
/>;
```

See [`packages/react`](packages/react#readme) for the full guide.

## Developing

```sh
pnpm install
pnpm gallery            # every template, live, at http://localhost:4400
pnpm test
pnpm build
```

Working on resumekit from an application that depends on it, without rebuilding or
reinstalling: see [CONTRIBUTING.md](CONTRIBUTING.md#working-from-an-application).

## License

Code: [MIT](LICENSE). The bundled typefaces are under the SIL Open Font License 1.1; each
font's license ships next to it in `fonts/licenses/`.
