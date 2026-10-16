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

## Commits and versions

Versions are automatic. Pull requests are squash-merged, and the pull request title becomes the
commit on `main`, so the title must be a [Conventional Commit](https://www.conventionalcommits.org)
(CI checks it):

| Title                                                    | Release                                   |
| -------------------------------------------------------- | ----------------------------------------- |
| `fix(react): keep the rail inside A4`                    | patch                                     |
| `feat(schema): a languages collection`                   | minor                                     |
| `feat!: rename TemplateDocument`                         | breaking: minor below 1.0, major from 1.0 |
| `docs:`, `chore:`, `ci:`, `test:`, `refactor:`, `build:` | no release                                |

Both packages always share one version. Until 1.0, a breaking change bumps the **minor**.
Breaking means:

- a schema rejects data the previous version accepted,
- an export, a template id, or a CSS class a host could style is removed or renamed,
- a peer dependency range is raised.

Mark it with `!` after the type, or a `BREAKING CHANGE:` footer in the description. A visual
change to a template is a `feat` or `fix`, and its title names the template.

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

Nothing to do by hand. After every merge to `main`, release-please updates one "chore: release"
pull request with the next version and both changelogs. Merging it tags the release
(`schema-vX.Y.Z`, `react-vX.Y.Z`), creates the GitHub releases, and publishes both packages from
GitHub Actions through npm trusted publishing: no npm token exists, and every version carries a
provenance attestation.

### The first release

npm configures trusted publishing only on a package that already exists, so `0.1.0` is published
once with a short-lived token:

1. On npmjs.com, generate a **granular access token**: read and write on the `@resumekit` scope,
   "Bypass two-factor authentication" ticked, expiring in a few days.
2. Save it as the `NPM_TOKEN` secret of this repository's `npm` environment.
3. Run the **Release** workflow by hand (Actions, Release, Run workflow).
4. For each package on npmjs.com, add trusted publishing (Settings, Trusted publishing, GitHub
   Actions: `rocketbyte` / `resumekit` / `release.yml` / environment `npm`).
5. Delete the `NPM_TOKEN` secret and revoke the token. From then on, releases need no token.
