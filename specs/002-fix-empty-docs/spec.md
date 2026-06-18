# Spec 002 — Fix: "Documentation Files" is empty for local docs

**Status:** Fixed
**Reported on:** `default/Digital-Engineering-Handbook` (Branch: `local`)
**Severity:** High (editor unusable for affected entities)

## Symptom

After the 1.1.0 staged update, opening the editor for a local (`dir:`) component
showed an empty "Documentation Files" list with no error and no log — a blank
panel.

## Root cause

Two compounding issues:

1. **Hardcoded `docsDir`.** `resolveSource` returned `docsDir: 'docs'` for _every_
   `dir:` target. For an annotation that already points at the docs folder
   (e.g. `dir:./docs`), the tree endpoint then searched `<basePath>/docs/docs`,
   which does not exist.
2. **Silent empty result.** `LocalFsVcsProvider.listFiles` returns `[]` on
   `ENOENT`. With no log and no UI feedback, a wrong path was indistinguishable
   from a genuinely empty docs set.

Context: commit `53aa938` ("prepare techdocs-editor 1.1.0 staged updates") also
introduced `backstage.io/techdocs-entity` indirection and switched resolution to
the referenced `docEntity`; combined with the silent-empty behavior this made any
misresolution surface as a blank panel.

## Fix

- Derive `docsDir` for local `dir:` sources: mkdocs `docs_dir` → conventional
  `docs/` if present → otherwise `.` (the base path is itself the docs dir). This
  removes the `…/docs/docs` double-nesting.
- Log a warning at `/tree` when the file list is empty, including the resolved
  `source type`, `branch`, `docsDir`, and `repoUrl`.
- Return `docsDir` from `/tree`; the frontend renders an informative empty state
  ("No documentation files found in '<docsDir>' on '<branch>'. Check the entity's
  `backstage.io/techdocs-ref` annotation …").

## Prevention (constitution-backed)

- Providers must not silently swallow missing-path errors (Constitution §2).
- A blank panel is a bug; show _why_ (Constitution §5).
- Local `dir:` resolution must be unit-tested, including the no-double-nesting
  case (Constitution §4).

## Acceptance

- `dir:.` with `docs/` (or mkdocs `docs_dir`) lists files as before.
- `dir:./docs` lists files (no double-nesting).
- Truly empty/misconfigured source → backend warning log + UI empty state.
- Regression tests cover all four resolution outcomes + traversal rejection.
