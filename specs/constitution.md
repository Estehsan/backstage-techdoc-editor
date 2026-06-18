# TechDocs Editor — Project Constitution

> Governing principles for the `@estehsaan/backstage-plugin-techdocs-editor-*`
> package suite. Spec-driven artifacts (specs, plans, tasks) and all code changes
> must comply with these principles.

## 1. Code quality

- TypeScript only. Use `undefined`, never `null`. No `I` prefix for interfaces.
- Type parameters prefixed with `T`. Errors come from `@backstage/errors`
  (`InputError`, `NotFoundError`, …); check by `error.name`.
- Exported React components use the `function` keyword (required for API Extractor).
- Prefer options objects over many positional args. Return response objects, not
  bare arrays, so the API can evolve (pagination, diagnostics).
- `index.ts` re-exports only. Shared types live in the `-common` package.
- Per-package style consistency wins over cross-repo consistency.

## 2. Source resolution & VCS providers

- All documentation sources are resolved through `resolveSource`, which returns a
  discriminated `ResolvedSource` union (`vcs` | `local`).
- A `VcsProvider` abstracts listing/reading/writing files and opening PRs. New
  providers implement the `VcsProvider` interface from the `-node` package.
- **Providers MUST NOT silently swallow missing-path errors.** An empty result
  must be observable: log a warning with the resolved path/branch/docsDir, and
  surface enough context for the frontend to render an informative empty state.
- `docsDir` is never assumed. For local `dir:` sources it is derived in order:
  (1) `docs_dir` in `mkdocs.yml`, (2) a conventional `docs/` subdirectory,
  (3) the base path itself (`.`). Never hardcode `docs`.

## 3. Security (non-negotiable)

- Every client-supplied path passes `assertSafeDocPath` / `assertSafeDocsDir`.
- `dir:` targets are confined to the entity's `source-location` root via
  `assertSafeLocalPath`; `LocalFsVcsProvider` additionally sandboxes all FS ops.
- No path traversal, no null bytes, no absolute paths from clients.
- Read permission gates read endpoints; write permission gates submissions.

## 4. Testing standards

- Local `dir:` source resolution MUST have unit tests covering: mkdocs `docs_dir`,
  `docs/` fallback, base-path (`.`) fallback, the `dir:./docs` no-double-nesting
  regression, and path-traversal rejection.
- Prefer fewer thorough tests with multiple assertions. Tests use real temp
  directories when filesystem behavior is under test (no over-mocking of `fs`).
- React Testing Library: use `screen` and `findBy*`; no test IDs in implementation.

## 5. User experience

- A blank panel is a bug. When no docs are found, show the user _why_ (resolved
  docs directory, branch, and the annotation to check), not an empty list.
- Local (`dir:`) and remote (`url:`) flows must both work end to end (list, edit,
  save/PR). Local saves write to disk; remote saves open a pull request.

## 6. Delivery

- Published-package changes ship with a Changeset (patch while `<1.0.0`). Write
  for adopters, not implementers.
- Run the submodule pre-push checklist (install --immutable, tsc, prettier:check,
  build:all, build:api-reports:only, lint, test) before any push or PR.
- Commits are signed off (`git commit -s`).
