---
'@estehsaan/backstage-plugin-techdocs-editor': minor
'@estehsaan/backstage-plugin-techdocs-editor-common': patch
---

Add full classic (old frontend system) support alongside the existing New Frontend System `/alpha` plugin. The package now exports a classic `techdocsEditorPlugin` that auto-registers the editor API, a routable `TechdocsEditorPage` for `FlatRoutes`, and an `EntityTechdocsEditorContent` entity content component. This makes the in-app editor — including the standalone editor route linked from the "Edit this page" addon — fully usable in classic Backstage apps without manually wiring `createApiFactory`.

The `MkDocsConfig` type in `@estehsaan/backstage-plugin-techdocs-editor-common` gains an optional `isLocalSource` field that reflects the value already returned by the backend `/mkdocs` endpoint for `dir:` entities.
