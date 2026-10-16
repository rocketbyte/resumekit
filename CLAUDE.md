# resumekit

Two packages, released together: `packages/schema` (`@resumekit/schema`, zod only) and
`packages/react` (`@resumekit/react`). Read `CONTRIBUTING.md` first.

- **Building or changing a template goes through the `template-author` agent**
  (`.claude/agents/template-author.md`), against `docs/template-contract.md`.
- **Templates are described, not hand-written.** Never edit a generated `<Id>Document.tsx` or
  `entries.tsx`; `check-templates` fails on drift.
- **`@resumekit/schema` imports nothing but `zod`.** Lint enforces it.
- **Peers stay peers.** `react`, `react-dom` and `zod` are never bundled or made dependencies.
- **Versions come from commit titles.** Pull request titles are Conventional Commits
  (`feat:`, `fix:`, `feat!:`); release-please derives the version and changelog from them. Never
  edit a `version` or a `CHANGELOG.md` by hand. Breaking rules are in `CONTRIBUTING.md`.
- **No customer data.** This repository is public: tests, fixtures and the gallery never hold
  a resume, contact details or links taken from a real user.
- Check your work: `pnpm format:check && pnpm lint && pnpm check-templates && pnpm typecheck && pnpm build && pnpm test && pnpm check:package`.
