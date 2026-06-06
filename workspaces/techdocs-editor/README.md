# TechDocs Editor — Backstage Plugin

[![CI](https://github.com/Estehsan/backstage-techdoc-editor/actions/workflows/ci.yaml/badge.svg)](https://github.com/Estehsan/backstage-techdoc-editor/actions/workflows/ci.yaml)

> Edit TechDocs documentation directly from the Backstage developer portal and open pull/merge requests without leaving the browser.

**Editor page** — file tree on the left, WYSIWYG editor on the right, Visual/Markdown toggle, and Submit Changes button:

![TechDocs Editor page](https://raw.githubusercontent.com/Estehsan/community-plugins/add-techdocs-editor-workspace/workspaces/techdocs-editor/plugins/techdocs-editor/docs/editor-page.png)

**Submit Documentation Edits dialog** — shows changed files, PR title, description, commit message, and draft option:

![Submit Documentation Edits dialog](https://raw.githubusercontent.com/Estehsan/community-plugins/add-techdocs-editor-workspace/workspaces/techdocs-editor/plugins/techdocs-editor/docs/submit-dialog.png)

## Packages

| Package                                                                                    | Description                                               | Version                                                                                                                                                                           |
| ------------------------------------------------------------------------------------------ | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`@estehsaan/backstage-plugin-techdocs-editor`](./plugins/techdocs-editor)                 | Frontend plugin — NFS & classic frontend system           | [![npm](https://img.shields.io/npm/v/%40estehsaan%2Fbackstage-plugin-techdocs-editor)](https://www.npmjs.com/package/@estehsaan/backstage-plugin-techdocs-editor)                 |
| [`@estehsaan/backstage-plugin-techdocs-editor-backend`](./plugins/techdocs-editor-backend) | Backend REST API + built-in GitHub & GitLab VCS providers | [![npm](https://img.shields.io/npm/v/%40estehsaan%2Fbackstage-plugin-techdocs-editor-backend)](https://www.npmjs.com/package/@estehsaan/backstage-plugin-techdocs-editor-backend) |
| [`@estehsaan/backstage-plugin-techdocs-editor-react`](./plugins/techdocs-editor-react)     | Shared React components, hooks, and API client            | [![npm](https://img.shields.io/npm/v/%40estehsaan%2Fbackstage-plugin-techdocs-editor-react)](https://www.npmjs.com/package/@estehsaan/backstage-plugin-techdocs-editor-react)     |
| [`@estehsaan/backstage-plugin-techdocs-editor-node`](./plugins/techdocs-editor-node)       | Node extension point for custom VCS providers             | [![npm](https://img.shields.io/npm/v/%40estehsaan%2Fbackstage-plugin-techdocs-editor-node)](https://www.npmjs.com/package/@estehsaan/backstage-plugin-techdocs-editor-node)       |
| [`@estehsaan/backstage-plugin-techdocs-editor-common`](./plugins/techdocs-editor-common)   | Shared types and permission definitions                   | [![npm](https://img.shields.io/npm/v/%40estehsaan%2Fbackstage-plugin-techdocs-editor-common)](https://www.npmjs.com/package/@estehsaan/backstage-plugin-techdocs-editor-common)   |

## Quick Install

### 1. Install the backend

```bash
yarn --cwd packages/backend add @estehsaan/backstage-plugin-techdocs-editor-backend
```

```ts
// packages/backend/src/index.ts
backend.add(import('@estehsaan/backstage-plugin-techdocs-editor-backend'));
```

### 2. Install the frontend (New Frontend System — Backstage ≥ 1.30)

```bash
yarn --cwd packages/app add @estehsaan/backstage-plugin-techdocs-editor
```

```tsx
// packages/app/src/App.tsx
import techdocsEditorPlugin from '@estehsaan/backstage-plugin-techdocs-editor/alpha';

export const app = createApp({
  features: [
    // ...other plugins
    techdocsEditorPlugin,
  ],
});
```

The plugin automatically registers an **Edit Docs** tab on every entity that has a `backstage.io/techdocs-ref` annotation, and a standalone editor page at `/docs/:namespace/:kind/:name/edit`.

Both `url:` and `dir:` annotation types are supported:

| Annotation type                   | Workflow                                            |
| --------------------------------- | --------------------------------------------------- |
| `url:https://github.com/org/repo` | Edits are submitted as a GitHub/GitLab pull request |
| `dir:.` (local filesystem)        | Files are saved directly to disk — no PR required   |

### Classic Frontend System (Backstage < 1.30)

See [plugins/techdocs-editor/README.md](./plugins/techdocs-editor/README.md#classic-frontend-system-backstage--130) for addon-based wiring.

## Workspace Structure

```
workspaces/techdocs-editor/
├── plugins/
│   ├── techdocs-editor/          # @estehsaan/backstage-plugin-techdocs-editor
│   ├── techdocs-editor-backend/  # @estehsaan/backstage-plugin-techdocs-editor-backend
│   ├── techdocs-editor-react/    # @estehsaan/backstage-plugin-techdocs-editor-react
│   ├── techdocs-editor-node/     # @estehsaan/backstage-plugin-techdocs-editor-node
│   └── techdocs-editor-common/   # @estehsaan/backstage-plugin-techdocs-editor-common
├── .changeset/
├── backstage.json
├── package.json
└── tsconfig.json
```

## Development

```bash
# Install dependencies
yarn install

# Type-check all packages
yarn tsc

# Run tests
CI=1 yarn test

# Lint
yarn lint

# Build API reports (required before PRs)
yarn build:api-reports:only
```

## Supported Annotation Types

### `url:` — Remote VCS (GitHub / GitLab)

```yaml
# catalog-info.yaml
metadata:
  annotations:
    backstage.io/techdocs-ref: url:https://github.com/org/repo/tree/main/docs
```

The editor reads files from the remote repo and submits changes as a pull/merge request.

### `dir:` — Local Filesystem

```yaml
# catalog-info.yaml
metadata:
  annotations:
    backstage.io/techdocs-ref: dir:.
```

The editor reads files directly from the local filesystem (resolved relative to the entity's `backstage.io/source-location`) and saves edits in-place. No PR is created — the Save to Disk button writes changes immediately. Useful for local development and monorepo setups where docs live alongside code.

> **Note:** `dir:` support requires no additional configuration. The backend resolves the path from the entity's `backstage.io/source-location` annotation automatically.

## Configuration

The backend reads the standard Backstage `integrations` config — no extra setup required if you already have TechDocs working:

```yaml
# app-config.yaml
integrations:
  github:
    - host: github.com
      token: ${GITHUB_TOKEN}
  gitlab:
    - host: gitlab.com
      token: ${GITLAB_TOKEN}

# Optional: override commit author identity
techdocsEditor:
  defaultAuthorName: 'TechDocs Bot'
  defaultAuthorEmail: 'techdocs-bot@example.com'
```

## Custom VCS Providers

GitHub and GitLab are supported out of the box. To add support for Bitbucket, Azure DevOps, or any other host, implement the `VcsProvider` interface from `@estehsaan/backstage-plugin-techdocs-editor-node`. See [plugins/techdocs-editor-node/README.md](./plugins/techdocs-editor-node/README.md) for a full example.

## License

Apache-2.0
