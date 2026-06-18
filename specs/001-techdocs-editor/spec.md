# Spec 001 — TechDocs in-app editor

**Status:** Implemented (1.x), with active hardening (see Spec 002)
**Packages:** `-backend`, `-react`, `-common`, `-node`, classic `techdocs-editor`

## Why

Adopters want to edit TechDocs Markdown from within Backstage instead of
context-switching to a Git client. The editor reads the docs for a catalog
entity, lets users edit pages in a WYSIWYG/Markdown editor, and persists changes
either by opening a pull request (remote `url:` sources) or by writing to disk
(local `dir:` sources).

## Users & stories

- **As a developer**, I open the editor for a component and see its documentation
  files listed, so I can pick a page to edit.
- **As a developer**, I edit a Markdown page and save it. For a GitHub/GitLab
  source a pull request is opened; for a local source the file is written to disk.
- **As a developer**, I create a new page and it appears in the file tree.
- **As an operator**, when docs fail to load I get an actionable message and a
  backend log, so I can fix the entity annotation quickly.

## Functional requirements

1. Resolve the documentation source from `backstage.io/techdocs-ref`
   (`url:` → VCS, `dir:` → local FS), with `github.com/project-slug` /
   `gitlab.com/project-slug` fallback and `backstage.io/techdocs-entity`
   indirection.
2. List documentation files under the resolved docs directory.
3. Read and write individual files; detect conflicts via etag.
4. Submit edits: open PR (remote) or save to disk (local).
5. Expose mkdocs metadata (site_name, docs_dir, nav, repo_url, edit_uri).
6. Enforce read/write permissions and path-traversal protections on every path.

## Non-goals

- Rendering the full TechDocs site (handled by core TechDocs).
- Editing non-Markdown assets or binary files.

## Acceptance

- Both a `url:` GitHub entity and a `dir:.` local entity can list, edit, and save.
- Empty/misconfigured sources produce a logged warning and a UI empty state, never
  a silent blank panel.
