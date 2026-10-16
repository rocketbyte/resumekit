# Contributing

## Setup

```sh
nvm use          # Node 22
corepack enable  # pnpm, at the version in package.json
pnpm install
pnpm gallery     # every template, live
```

Before a pull request: `pnpm format:check && pnpm lint && pnpm check-templates && pnpm typecheck && pnpm build && pnpm test && pnpm check:package`. CI runs the same.

## Templates

A template is described, not hand-written: `packages/react/src/templates/<id>/<id>.template.yaml`
plus `<id>.css`. `pnpm -F @resumekit/react generate-templates` writes `<Id>Document.tsx` and
`entries.tsx` from them. Never edit a generated file — `check-templates` fails on drift. A
missing option belongs in the format (`src/compiler/`), not in one template. The full contract is
[docs/template-contract.md](docs/template-contract.md).

Every registered template runs through `templates/conformance.spec.tsx`; the static renderer is
held to the browser render by `static/parity.spec.tsx`.

## Changesets and versions

Every pull request that changes a package adds a changeset: `pnpm changeset`. Both packages are
released together at one version (Changesets `fixed` mode).

Until 1.0, a breaking change bumps the **minor**; anything else is a patch. Breaking means:

- a schema rejects data the previous version accepted,
- an export, a template id, or a CSS class a host could style is removed or renamed,
- a peer dependency range is raised.

A visual change to a template is not breaking, but its changeset names the templates it changes.

## Working from an application

An application can run against your checkout — edits show up in its dev server with hot reload,
with no build and no reinstall.

Each package's `exports` has a `@resumekit/source` condition pointing at `src/`. It is removed
from the published manifest (`publishConfig.exports`), so installs from npm always resolve
`dist/`. An application that wants the live source:

1. resolves the condition — Vite: `resolve.conditions: ['@resumekit/source', ...defaultClientConditions]`;
   TypeScript: `"customConditions": ["@resumekit/source"]`;
2. dedupes `react`, `react-dom` and `zod` (`resolve.dedupe`), so the linked package uses the
   application's copies;
3. allows Vite to serve the checkout (`server.fs.allow`);
4. links it: `pnpm link ../resumekit/packages/schema ../resumekit/packages/react`.

`/static` and `/export` are prebuilt artifacts, not source: while linked, rebuild them with
`pnpm build` when you change what they render.

## Releasing

Merging to `main` lets the Changesets action open (or refresh) a "release packages" pull
request. Merging that publishes both packages from GitHub Actions through npm trusted
publishing — no npm token exists, and every version carries a provenance attestation.
