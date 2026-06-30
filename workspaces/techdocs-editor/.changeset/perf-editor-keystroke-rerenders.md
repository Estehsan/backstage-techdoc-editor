---
'@estehsaan/backstage-plugin-techdocs-editor-react': patch
---

Improve editor typing performance and guard unsaved work. The `TechDocsEditorPage` no longer re-runs the file-loading effect on every keystroke, and the `TechDocsFileTree` sidebar is now memoized so it does not re-render while editing file content. Unsaved-file tracking is kept in dedicated state whose identity only changes when the set of edited files changes. The page now also warns before a browser reload or tab close while there are unsaved edits.
