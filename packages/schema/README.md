# @resumekit/schema

Zod schemas for a structured resume and for how it is presented: the resume object, the
template catalog, the presentation overlay a person's edits are recorded in, collections,
date checks and the export contract. Depends on nothing but `zod` (a peer dependency).

```sh
pnpm add @resumekit/schema zod
```

```ts
import {
  ResumeObjectSchema,
  TEMPLATES,
  TemplateIdSchema,
  applyPresentation,
  type ResumeObject,
} from '@resumekit/schema';

const resume: ResumeObject = ResumeObjectSchema.parse(input);
TemplateIdSchema.parse('harvard'); // throws for an id the catalog does not contain
Object.keys(TEMPLATES); // every template, as data
```

The same schemas type `@resumekit/react`, so a resume validated here is one every template can
draw.

MIT licensed.
