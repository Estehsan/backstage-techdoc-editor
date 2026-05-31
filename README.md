# TechDocs Editor — Backstage Plugin Suite

[![CI](https://github.com/Estehsan/backstage-techdoc-editor/actions/workflows/ci.yaml/badge.svg)](https://github.com/Estehsan/backstage-techdoc-editor/actions/workflows/ci.yaml)
[![npm @estehsaan/backstage-plugin-techdocs-editor](https://img.shields.io/npm/v/@estehsaan/backstage-plugin-techdocs-editor)](https://www.npmjs.com/package/@estehsaan/backstage-plugin-techdocs-editor)

> **In-app TechDocs editor for Backstage** — edit documentation directly from the developer portal and open pull/merge requests without leaving the browser.

---

## Packages

| Package                                                                                                               | Description                               |
| --------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| [`@estehsaan/backstage-plugin-techdocs-editor`](./workspaces/techdocs-editor/plugins/techdocs-editor)                 | Frontend plugin (NFS & classic)           |
| [`@estehsaan/backstage-plugin-techdocs-editor-backend`](./workspaces/techdocs-editor/plugins/techdocs-editor-backend) | Backend plugin (REST API + VCS providers) |
| [`@estehsaan/backstage-plugin-techdocs-editor-react`](./workspaces/techdocs-editor/plugins/techdocs-editor-react)     | Shared React components & API client      |
| [`@estehsaan/backstage-plugin-techdocs-editor-node`](./workspaces/techdocs-editor/plugins/techdocs-editor-node)       | Extension point for custom VCS providers  |
| [`@estehsaan/backstage-plugin-techdocs-editor-common`](./workspaces/techdocs-editor/plugins/techdocs-editor-common)   | Shared types and permissions              |

## Installation

### Backend

```ts
// packages/backend/src/index.ts
backend.add(import('@estehsaan/backstage-plugin-techdocs-editor-backend'));
```

### Frontend (New Frontend System)

```ts
// packages/app/src/App.tsx
import techdocsEditorPlugin from '@estehsaan/backstage-plugin-techdocs-editor/alpha';

app.add(techdocsEditorPlugin);
```

### Frontend (Classic)

```tsx
// packages/app/src/App.tsx — add the TechDocs addon
import { TechDocsEditPageAddon } from '@estehsaan/backstage-plugin-techdocs-editor';

// Inside TechDocsReaderPage:
<TechDocsEditPageAddon />;
```

## Features

- WYSIWYG (Toast UI) and Markdown source mode
- Sidebar file tree with dirty indicators
- New page creation
- GitHub & GitLab pull/merge request creation
- ETag-based conflict detection
- Permission system integration (`techdocs.editor.read` / `techdocs.editor.write`)
- Entity content tab (`/edit-docs`) + standalone editor page

## License

Apache-2.0
