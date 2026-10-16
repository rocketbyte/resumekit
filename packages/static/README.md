# @resumekit/static

Resumekit's templates as static HTML, rendered in Node at build time: a landing page gallery, a
template preview, an email. No React or script reaches the page.

```sh
pnpm add -D @resumekit/static
```

```ts
import { renderStatic } from '@resumekit/static';

const html = renderStatic('harvard', resume, { language: 'en', picture: true });
```

- `resume` is a `ResumeObject` from `@resumekit/schema`.
- `picture: true` draws the page as an image of itself: inert links, headings kept out of the
  host page's outline (`div[data-h]`), no editor attributes.

The renderer is one self-contained module (React and every template inside), so it has no
runtime dependencies.

## Stylesheets

Every library stylesheet, pruned to the rules a read-only page can match, and minified:

| Import                                 | What                                               |
| -------------------------------------- | -------------------------------------------------- |
| `@resumekit/static/templates.css`      | Shared kit, nodes and page canvas                  |
| `@resumekit/static/templates/<id>.css` | One template's styles: link only the ones you show |

Fonts are left out; a static page uses each template's fallback stack.

## License

MIT.
