# TechDocs Editor — Backstage Plugin Suite

[![CI](https://github.com/Estehsan/backstage-techdoc-editor/actions/workflows/ci.yaml/badge.svg)](https://github.com/Estehsan/backstage-techdoc-editor/actions/workflows/ci.yaml)
[![npm](https://img.shields.io/npm/v/%40estehsaan%2Fbackstage-plugin-techdocs-editor?label=npm)](https://www.npmjs.com/package/@estehsaan/backstage-plugin-techdocs-editor)

> **In-app TechDocs editor for Backstage** — edit documentation directly from the developer portal and open pull/merge requests without leaving the browser.

---

## Screenshots

**Editor page** — file tree on the left, WYSIWYG editor on the right, Visual/Markdown toggle, and Submit Changes button:

![TechDocs Editor page](https://raw.githubusercontent.com/Estehsan/community-plugins/add-techdocs-editor-workspace/workspaces/techdocs-editor/plugins/techdocs-editor/docs/editor-page.png)

**Submit Documentation Edits dialog** — shows changed files, PR title, description, commit message, and draft option:

![Submit Documentation Edits dialog](https://raw.githubusercontent.com/Estehsan/community-plugins/add-techdocs-editor-workspace/workspaces/techdocs-editor/plugins/techdocs-editor/docs/submit-dialog.png)

---

## Packages

| Package                                                                                                               | Version                                                                                                                                                                           | Description                               |
| --------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| [`@estehsaan/backstage-plugin-techdocs-editor`](./workspaces/techdocs-editor/plugins/techdocs-editor)                 | [![npm](https://img.shields.io/npm/v/%40estehsaan%2Fbackstage-plugin-techdocs-editor)](https://www.npmjs.com/package/@estehsaan/backstage-plugin-techdocs-editor)                 | Frontend plugin (NFS & classic)           |
| [`@estehsaan/backstage-plugin-techdocs-editor-backend`](./workspaces/techdocs-editor/plugins/techdocs-editor-backend) | [![npm](https://img.shields.io/npm/v/%40estehsaan%2Fbackstage-plugin-techdocs-editor-backend)](https://www.npmjs.com/package/@estehsaan/backstage-plugin-techdocs-editor-backend) | Backend plugin (REST API + VCS providers) |
| [`@estehsaan/backstage-plugin-techdocs-editor-react`](./workspaces/techdocs-editor/plugins/techdocs-editor-react)     | [![npm](https://img.shields.io/npm/v/%40estehsaan%2Fbackstage-plugin-techdocs-editor-react)](https://www.npmjs.com/package/@estehsaan/backstage-plugin-techdocs-editor-react)     | Shared React components & API client      |
| [`@estehsaan/backstage-plugin-techdocs-editor-node`](./workspaces/techdocs-editor/plugins/techdocs-editor-node)       | [![npm](https://img.shields.io/npm/v/%40estehsaan%2Fbackstage-plugin-techdocs-editor-node)](https://www.npmjs.com/package/@estehsaan/backstage-plugin-techdocs-editor-node)       | Extension point for custom VCS providers  |
| [`@estehsaan/backstage-plugin-techdocs-editor-common`](./workspaces/techdocs-editor/plugins/techdocs-editor-common)   | [![npm](https://img.shields.io/npm/v/%40estehsaan%2Fbackstage-plugin-techdocs-editor-common)](https://www.npmjs.com/package/@estehsaan/backstage-plugin-techdocs-editor-common)   | Shared types and permissions              |

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
