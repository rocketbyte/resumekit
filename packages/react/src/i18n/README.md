# Languages

The library carries its own words and needs no i18n dependency. English and Spanish ship; any other
language is one JSON file.

## Two languages

| What                                                              | Follows            | Set by                                 |
| ----------------------------------------------------------------- | ------------------ | -------------------------------------- |
| **Editor** — controls, accessible names, field guidance, warnings | the person editing | `<TemplateLocaleProvider locale="es">` |
| **Document** — default section headings, language levels          | the résumé         | `presentation.language`                |

They are separate on purpose: a candidate can edit in Spanish and write an English résumé for an
English job, and the PDF prints what the screen shows. Without a provider, and without a
presentation language, everything is English.

```tsx
import { TemplateDocument, TemplateLocaleProvider } from '@resumekit/react';

<TemplateLocaleProvider locale="es">
  <TemplateDocument
    resume={resume}
    presentation={{ ...presentation, language: 'en' }}
  />
</TemplateLocaleProvider>;
```

## Adding a language

1. Copy `locales/en.json` to `fr.json` and translate the values. Keep the keys and the `{params}`.
2. Pass it: `<TemplateLocaleProvider locale="fr" catalogs={{ fr }}>`.

A catalog may be partial — every message it lacks is English — so it can ship before it is done.
`resolveCatalog(fr)` returns it complete, typed as `TemplateCatalog`, if you want to check it.

## The format

- **`{name}`** places a parameter.
- **Plurals** are objects of CLDR categories — `{ "one": "{count} role", "other": "{count} roles" }` —
  chosen by `Intl.PluralRules`. Add `few`, `many` and so on where the language has them.
- **Nouns** (`editor.nouns`) carry the forms a sentence places: `one`, `other`, `title`, `a`
  ("a role", "una habilidad") and `this` ("this role", "esta habilidad"). A sentence such as
  `"moveUp": "Subir {this}"` then reads correctly for every noun, articles and gender included,
  without one sentence per noun. A sentence may use any form, or none.
- **Lists** ("3 bullets and 1 role") are joined by `Intl.ListFormat` in the active language.

## Kept in step with the schema

`editor.placeholders`, `editor.sections`, `editor.nouns` and `editor.dateIssues` mirror English text
that `@resumekit/schema` owns, by the schema's own keys. `catalog.spec.ts` fails when the English catalog and the schema
disagree, and when a shipped catalog is missing a key, has an empty message or uses a parameter the
English message is not given.
