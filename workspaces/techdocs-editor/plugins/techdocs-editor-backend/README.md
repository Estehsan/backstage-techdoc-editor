# @estehsaan/backstage-plugin-techdocs-editor-backend

[![npm](https://img.shields.io/npm/v/%40estehsaan%2Fbackstage-plugin-techdocs-editor-backend)](https://www.npmjs.com/package/@estehsaan/backstage-plugin-techdocs-editor-backend)
[![CI](https://github.com/Estehsan/backstage-techdoc-editor/actions/workflows/ci.yaml/badge.svg)](https://github.com/Estehsan/backstage-techdoc-editor/actions/workflows/ci.yaml)

Backend plugin for the TechDocs in-app editor. Provides the REST API used by the frontend to read documentation source files and submit edits — either as a GitHub/GitLab pull request (`url:` annotations) or saved directly to the local filesystem (`dir:` annotations).

## Installation

```bash
# From your Backstage root directory
yarn --cwd packages/backend add @estehsaan/backstage-plugin-techdocs-editor-backend
```

Add the plugin to `packages/backend/src/index.ts`:

```ts
backend.add(import('@estehsaan/backstage-plugin-techdocs-editor-backend'));
```

The default installation bundles built-in GitHub, GitLab, and local filesystem providers. No extra modules are required for those sources.

### Adding a custom VCS provider

If you host docs on an unsupported VCS, register a custom provider via the extension point:

```ts
import { createBackendModule } from '@backstage/backend-plugin-api';
import { techdocsEditorVcsProviderExtensionPoint } from '@estehsaan/backstage-plugin-techdocs-editor-node';

export const techdocsEditorModuleMyVcs = createBackendModule({
  pluginId: 'techdocs-editor',
  moduleId: 'my-vcs',
  register(reg) {
    reg.registerInit({
      deps: {
        extensionPoint: techdocsEditorVcsProviderExtensionPoint,
      },
      async init({ extensionPoint }) {
        extensionPoint.addProvider(new MyVcsProvider());
      },
    });
  },
});
```

See [@estehsaan/backstage-plugin-techdocs-editor-node](https://www.npmjs.com/package/@estehsaan/backstage-plugin-techdocs-editor-node) for the `VcsProvider` interface.

## API Endpoints

All routes are served under `/api/techdocs-editor`.

| Method | Path                                               | Permission required     | Description                                                |
| ------ | -------------------------------------------------- | ----------------------- | ---------------------------------------------------------- |
| GET    | `/health`                                          | None                    | Health check — returns `{ status: 'ok' }`                  |
| GET    | `/sources/:namespace/:kind/:name/mkdocs`           | `techdocs.editor.read`  | Returns the parsed `mkdocs.yml` for the entity's docs repo |
| GET    | `/sources/:namespace/:kind/:name/tree`             | `techdocs.editor.read`  | Returns the list of docs files in the docs directory       |
| GET    | `/sources/:namespace/:kind/:name/file?path=<path>` | `techdocs.editor.read`  | Returns file content and ETag for a specific docs file     |
| POST   | `/submissions/:namespace/:kind/:name`              | `techdocs.editor.write` | Submits edits — opens a PR on the VCS or saves to disk     |

### POST `/submissions/:namespace/:kind/:name` body

```ts
{
  files: Array<{
    path: string;    // relative path within the docs dir (e.g. "guide/setup.md")
    content: string; // new file content
    etag?: string;   // ETag from the GET /file response — used for conflict detection
  }>;
  commitMessage: string;  // commit message
  prTitle?: string;       // PR/MR title — required for url: sources, ignored for dir:
  prDescription?: string; // optional PR/MR description (url: only)
  newBranch?: string;     // optional branch name (auto-generated if omitted, url: only)
  baseBranch?: string;    // optional base branch (falls back to repo default, url: only)
  draft?: boolean;        // open as draft PR (default: false, url: only)
}
```

### Response

**For `url:` sources** (VCS pull/merge request):

```json
{
  "pullRequestUrl": "https://github.com/org/repo/pull/42",
  "pullRequestNumber": 42,
  "headBranch": "techdocs-editor/..."
}
```

**For `dir:` sources** (local filesystem save):

```json
{ "savedLocally": true, "savedCount": 3, "savedPath": "/abs/path/to/entity" }
```

## Configuration

No `app-config.yaml` entries are required for the default GitHub/GitLab providers — they use the standard `integrations` config already present in your Backstage instance:

```yaml
# Standard Backstage integrations config (already required for TechDocs)
integrations:
  github:
    - host: github.com
      token: ${GITHUB_TOKEN}
  gitlab:
    - host: gitlab.com
      token: ${GITLAB_TOKEN}
```

The backend resolves which VCS provider to use by inspecting the entity's `metadata.annotations`:

```yaml
# catalog-info.yaml — standard TechDocs annotations
metadata:
  annotations:
    backstage.io/techdocs-ref: dir:. # or url:https://github.com/org/repo
```

## Permissions

Uses the Backstage [Permission Framework](https://backstage.io/docs/permissions/overview). Define a policy in your backend to control who can read and write docs:

| Permission constant             | Permission name         | Action  |
| ------------------------------- | ----------------------- | ------- |
| `techdocsEditorReadPermission`  | `techdocs.editor.read`  | `read`  |
| `techdocsEditorWritePermission` | `techdocs.editor.write` | `write` |

Both are exported from `@estehsaan/backstage-plugin-techdocs-editor-common`.

## Related packages

| Package                                                                                                                                  | Description                              |
| ---------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| [`@estehsaan/backstage-plugin-techdocs-editor`](https://www.npmjs.com/package/@estehsaan/backstage-plugin-techdocs-editor)               | Frontend plugin (NFS & classic)          |
| [`@estehsaan/backstage-plugin-techdocs-editor-node`](https://www.npmjs.com/package/@estehsaan/backstage-plugin-techdocs-editor-node)     | Extension point for custom VCS providers |
| [`@estehsaan/backstage-plugin-techdocs-editor-common`](https://www.npmjs.com/package/@estehsaan/backstage-plugin-techdocs-editor-common) | Shared types and permissions             |

## License

Apache-2.0

Apache-2.0
