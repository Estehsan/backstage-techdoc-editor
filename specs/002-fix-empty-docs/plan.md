# Plan 002 — Fix empty docs

## Changes

| File                                                          | Change                                                                                                                                              |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `techdocs-editor-backend/src/service/sourceResolver.ts`       | Add `resolveLocalDocsDir(basePath)` (mkdocs `docs_dir` → `docs/` → `.`); use it instead of hardcoded `docsDir: 'docs'`. Add `fs`/`js-yaml` imports. |
| `techdocs-editor-backend/src/service/router.ts`               | `/tree`: `logger.warn(...)` with resolved `source/branch/docsDir/repoUrl` when `files.length === 0`. (`docsDir` already returned.)                  |
| `techdocs-editor-react/src/api.ts`                            | `getFileTree` returns `docsDir` from the response.                                                                                                  |
| `techdocs-editor-react/src/components/TechDocsFileTree.tsx`   | New `branch`/`docsDir` props + empty-state block when `nodes.length === 0`.                                                                         |
| `techdocs-editor-react/src/components/TechDocsEditorPage.tsx` | Store `docsDir`; pass `branch`/`docsDir` to the tree.                                                                                               |
| `techdocs-editor-backend/src/service/sourceResolver.test.ts`  | Rewrite to use real temp dirs; cover all resolution outcomes + the no-double-nesting regression.                                                    |

## Risks & mitigations

- `resolveLocalDocsDir` adds `fs` reads in resolution. Bounded to one `readFile`
  - one `stat` per request; errors are caught and fall through safely.
- `docsDir: '.'` for sources without `docs/` changes prior behavior, but the
  previous behavior produced empty lists, so this is strictly an improvement.
  Covered by tests.

## Verification

- `yarn backstage-cli repo test sourceResolver` (6 passing).
- Submodule checklist: tsc, prettier:check, lint, build:all, build:api-reports:only.
- Manual: editor for a `dir:.` and a `dir:./docs` entity; confirm files list and
  the empty-state for a genuinely empty docs dir.
