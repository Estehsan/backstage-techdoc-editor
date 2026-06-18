---
'@estehsaan/backstage-plugin-techdocs-editor': minor
'@estehsaan/backstage-plugin-techdocs-editor-backend': patch
---

Fix the "Documentation Files" list showing empty for local (`dir:`) TechDocs
sources.

The backend now derives the documentation directory for `dir:` annotations
instead of always assuming `docs`: it uses `docs_dir` from `mkdocs.yml` when
present, falls back to a conventional `docs/` directory, and otherwise treats the
annotated path itself as the docs directory. This removes the `…/docs/docs`
double-nesting that made annotations such as `dir:./docs` resolve to an empty
list. When the resolved list is empty the backend now logs a warning with the
resolved source, branch, and docs directory so misconfigurations are diagnosable.

The editor's file tree now renders an informative empty state — including the
resolved docs directory and branch and a pointer to the
`backstage.io/techdocs-ref` annotation — instead of a blank panel. `TechDocsFileTree`
gains optional `branch` and `docsDir` props to support this.
