# resumekit

Print-accurate, editable resume templates for React, and the schemas they are drawn from.

| Package                                | What it is                                                                                        |
| -------------------------------------- | ------------------------------------------------------------------------------------------------- |
| [`@resumekit/react`](packages/react)   | About thirty templates, the in-place editing kit, a paginator, a static renderer and a PDF bundle |
| [`@resumekit/schema`](packages/schema) | Zod schemas for a structured resume, the template catalog and the presentation overlay            |

Both packages are released together at one version.

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
