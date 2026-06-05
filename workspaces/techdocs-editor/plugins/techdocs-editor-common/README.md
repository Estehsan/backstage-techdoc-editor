# @estehsaan/backstage-plugin-techdocs-editor-common

[![npm](https://img.shields.io/npm/v/%40estehsaan%2Fbackstage-plugin-techdocs-editor-common)](https://www.npmjs.com/package/@estehsaan/backstage-plugin-techdocs-editor-common)
[![CI](https://github.com/Estehsan/backstage-techdoc-editor/actions/workflows/ci.yaml/badge.svg)](https://github.com/Estehsan/backstage-techdoc-editor/actions/workflows/ci.yaml)

Shared types, data contracts, and Backstage permission definitions for the TechDocs editor plugin suite. This package is a dependency of both the frontend and backend packages.

> **When to install this directly**: Install this package only if you are building an extension of the TechDocs editor (e.g. a custom policy handler or a backend module) and need access to the shared types or permission constants. Standard Backstage installations should install `@estehsaan/backstage-plugin-techdocs-editor` and `@estehsaan/backstage-plugin-techdocs-editor-backend` instead.

## Installation

```bash
# For backend packages
yarn --cwd packages/backend add @estehsaan/backstage-plugin-techdocs-editor-common

# For frontend packages
yarn --cwd packages/app add @estehsaan/backstage-plugin-techdocs-editor-common
```

## Exported Permissions

Use these constants in a custom Backstage [permission policy](https://backstage.io/docs/permissions/writing-a-policy) to control who can read and write TechDocs through the editor.

| Constant                        | Permission name         | Action  | Description                                            |
| ------------------------------- | ----------------------- | ------- | ------------------------------------------------------ |
| `techdocsEditorReadPermission`  | `techdocs.editor.read`  | `read`  | Required to load the file tree and read file content   |
| `techdocsEditorWritePermission` | `techdocs.editor.write` | `write` | Required to submit edits and open a pull/merge request |

Example policy usage:

```ts
import {
  techdocsEditorReadPermission,
  techdocsEditorWritePermission,
} from '@estehsaan/backstage-plugin-techdocs-editor-common';

// In your permission policy:
if (isPermission(request.permission, techdocsEditorWritePermission)) {
  // Allow only members of the 'docs-editors' group to submit edits
  if (await isGroupMember(user, 'docs-editors')) {
    return { result: AuthorizeResult.ALLOW };
  }
  return { result: AuthorizeResult.DENY };
}
```

## Exported Types

### File and tree types

| Type           | Description                                                                                                      |
| -------------- | ---------------------------------------------------------------------------------------------------------------- |
| `DocFile`      | A single documentation file — `{ path: string; content: string }`                                                |
| `DocTreeNode`  | A node in the docs file tree — `{ path: string; name: string; type: 'file' \| 'dir'; children?: DocTreeNode[] }` |
| `DocTree`      | The full directory tree structure — `DocTreeNode[]`                                                              |
| `EditedFile`   | A file with pending edits — `{ path: string; content: string; etag?: string }`                                   |
| `FileConflict` | Conflict reported by the backend — `{ path: string; serverEtag: string }`                                        |

### MkDocs types

| Type             | Description                                                                                |
| ---------------- | ------------------------------------------------------------------------------------------ |
| `MkDocsConfig`   | Parsed `mkdocs.yml` structure — `site_name`, `docs_dir`, `repo_url`, `edit_uri`, `nav`     |
| `MkDocsNavEntry` | A navigation entry in `mkdocs.yml` — a string path or a `Record<string, MkDocsNavEntry[]>` |

### API request / response types

| Type                  | Description                                                            |
| --------------------- | ---------------------------------------------------------------------- |
| `SubmitEditsRequest`  | Body of `POST /api/techdocs-editor/submissions/:namespace/:kind/:name` |
| `SubmitEditsResponse` | Response from the submission endpoint — `{ prUrl: string }`            |

#### `SubmitEditsRequest` shape

```ts
type SubmitEditsRequest = {
  files: EditedFile[]; // Files to commit — each must have path and content
  prTitle: string; // Pull/merge request title
  commitMessage: string; // Commit message
  prBody?: string; // Optional PR/MR description
  newBranch?: string; // Optional branch name (auto-generated if omitted)
};
```

## Related packages

| Package                                                                                                                                    | Description                                   |
| ------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------- |
| [`@estehsaan/backstage-plugin-techdocs-editor`](https://www.npmjs.com/package/@estehsaan/backstage-plugin-techdocs-editor)                 | Frontend plugin (NFS & classic)               |
| [`@estehsaan/backstage-plugin-techdocs-editor-backend`](https://www.npmjs.com/package/@estehsaan/backstage-plugin-techdocs-editor-backend) | Backend REST API + VCS providers              |
| [`@estehsaan/backstage-plugin-techdocs-editor-react`](https://www.npmjs.com/package/@estehsaan/backstage-plugin-techdocs-editor-react)     | Shared React components and API client        |
| [`@estehsaan/backstage-plugin-techdocs-editor-node`](https://www.npmjs.com/package/@estehsaan/backstage-plugin-techdocs-editor-node)       | Node extension point for custom VCS providers |

## License

Apache-2.0
