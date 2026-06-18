# Tasks 002 — Fix empty docs

- [x] Add `resolveLocalDocsDir` (mkdocs `docs_dir` → `docs/` → `.`).
- [x] Replace hardcoded `docsDir: 'docs'` for `dir:` sources.
- [x] Warn-log at `/tree` when the resolved file list is empty.
- [x] Return `docsDir` from `/tree` and thread it to the frontend.
- [x] Render an informative empty state in `TechDocsFileTree`.
- [x] Rewrite `sourceResolver.test.ts` with real temp dirs + no-double-nesting case.
- [x] `sourceResolver` tests pass (6/6).
- [ ] Add a `/tree` router integration test asserting the empty-list warning.
- [ ] Add a `TechDocsFileTree` component test for the empty state.
- [ ] Changeset (patch) for `-backend` and `-react`.
- [ ] Run full submodule pre-push checklist.
