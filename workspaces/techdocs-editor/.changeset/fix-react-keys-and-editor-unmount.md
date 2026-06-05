---
'@estehsaan/backstage-plugin-techdocs-editor-react': patch
---

Fix stable React keys in `TechDocsFileTree` — use `node.path ?? node.title` instead of array indices to prevent stale component state when files are added, removed, or reordered. Fix `TechDocsMarkdownEditor` to cancel the Toast UI lazy-load on unmount, preventing setState calls on unmounted components.
