# Plan 001 — TechDocs editor architecture

## Packages

| Package           | Role                                                                                                                                              |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `-common`         | Shared types (`ResolvedSource`, `DocTree`, `SubmitEditsRequest/Response`, `FileConflict`) and permissions (`techdocsEditorRead/WritePermission`). |
| `-node`           | Extension points & the `VcsProvider` interface (`listFiles`, `readFile`, `openPullRequest`, `getDefaultBranch`, `canHandle`).                     |
| `-backend`        | Express router, `resolveSource`, `VcsProviderRegistry`, `GitHubVcsProvider`, `GitLabVcsProvider`, `LocalFsVcsProvider`.                           |
| `-react`          | `TechDocsEditorPage`, `TechDocsFileTree`, `TechDocsMarkdownEditor`, submit dialog, API client.                                                    |
| `techdocs-editor` | Classic + new-frontend-system wiring.                                                                                                             |

## Data flow (open editor → list files)

```
Frontend  TechDocsEditorPage → api.getFileTree(entityRef)
   │            │ GET /sources/:ns/:kind/:name/tree
   ▼            ▼
Backend  loadEntity → follow backstage.io/techdocs-entity → resolveSource(docEntity)
   │            ├─ vcs:   providerRegistry.getForUrl(repoUrl).listFiles({ docsDir, branch })
   │            └─ local: LocalFsVcsProvider.listFiles({ basePath, docsDir })
   ▼
Response  { files, docsDir, branch, isLocalSource }
   ▼
Frontend  buildTree(files) → TechDocsFileTree (empty-state if files === [])
```

## Source resolution rules

- `url:` GitHub/GitLab → parse owner/repo, branch (from `tree/<branch>`), and
  `docsDir` (URL hash). Missing branch → `provider.getDefaultBranch`.
- `dir:` → base path from `backstage.io/source-location` (or `managed-by-location`,
  else `backend.workingDirectory`); `docsDir` derived via mkdocs `docs_dir` →
  `docs/` fallback → `.` (see Spec 002).
- `dir:` is confined to the source-location root; `LocalFsVcsProvider` sandboxes FS.

## Endpoints (`/api/techdocs-editor`)

- `GET …/mkdocs` — mkdocs metadata.
- `GET …/tree` — `{ files, docsDir, branch, isLocalSource }`.
- `GET …/file?path=&branch=` — `{ content, etag, branch }`.
- `POST /submissions/…` — open PR or save to disk; returns PR url or `savedLocally`.

## Testing approach

- Backend: unit-test `resolveSource` against real temp dirs; provider `listFiles`
  behavior; router endpoints for tree/file/submit.
- Frontend: component tests for empty-state and tree rendering.
