# Tasks 001 — TechDocs editor: done vs remaining

Derived from the code and `_workspace/04_qa_report.md`. `[x]` done, `[ ]` remaining.

## Done

- [x] `-common` shared types & permissions (`ResolvedSource`, `DocTree`,
      `SubmitEditsRequest/Response`, `FileConflict`).
- [x] `-node` `VcsProvider` interface & extension points.
- [x] `resolveSource` for `url:` (GitHub/GitLab) and `dir:` (local) with
      `project-slug` fallback and `backstage.io/techdocs-entity` indirection.
- [x] `GitHubVcsProvider`, `GitLabVcsProvider`, `LocalFsVcsProvider`.
- [x] Router endpoints: `/mkdocs`, `/tree`, `/file`, `/submissions`.
- [x] Path-traversal guards (`assertSafeDocPath`, `assertSafeDocsDir`,
      `assertSafeLocalPath`) + read/write permission checks.
- [x] Frontend editor page, file tree, Markdown editor, submit dialog;
      `isLocalSource` branch (save-to-disk vs PR).
- [x] Classic + new-frontend-system wiring.
- [x] Local `dir:` `docsDir` resolution (mkdocs → `docs/` → `.`) — Spec 002.
- [x] Observable empty tree (backend warn log + UI empty state) — Spec 002.
- [x] `resolveSource` regression tests (real temp dirs) — Spec 002.

## Remaining

- [ ] Router integration tests for `/tree`, `/file`, `/submissions`
      (local + remote), incl. the empty-list warning path.
- [ ] Frontend component test asserting the empty-state message renders when the
      tree is empty.
- [ ] Conflict-resolution UX test (etag mismatch on save).
- [ ] Docs: troubleshooting section for "Documentation Files is empty" pointing at
      the resolved `docsDir`/`branch` log line.
- [ ] Optional: thread a logger into `LocalFsVcsProvider` for a provider-level
      ENOENT warning (currently logged at the router with full context).
