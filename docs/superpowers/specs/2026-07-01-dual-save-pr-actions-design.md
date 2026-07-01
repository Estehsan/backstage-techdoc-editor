# TechDocs Editor: Independent "Save Locally" and "Create Pull Request" Actions

**Status:** Approved, ready for implementation plan
**Date:** 2026-07-01

## Problem

The editor currently picks a single submission mode per entity based on
`ResolvedSource.type` (`'local' | 'vcs'`), a mutually-exclusive union. For
entities with a `dir:` techdocs-ref annotation — the common case where docs
live alongside code in a real GitHub/GitLab-hosted repo — this forces an
all-or-nothing choice: either the editor writes straight to local disk with
no PR, or it opens a PR, never both.

In practice, users editing a `dir:` entity often want **both** options
available at once: a quick local save while iterating, and a "Create Pull
Request" action when ready to submit changes upstream. Neither option should
be hidden just because the other is also possible.

## Goals

- Show "Save Locally" and "Create Pull Request" as independent actions,
  each visible only when actually possible for the entity.
- Preserve the plugin's original, documented behavior for resolving a PR
  target: `url:` annotations, or `github.com/project-slug` /
  `gitlab.com/project-slug` annotations with a matching SCM integration.
  No git-CLI/remote detection — annotation-based only, for simplicity and to
  avoid any dependency on a git binary or working copy state.
- Reading (file tree, file content, mkdocs.yml) continues to prefer local
  disk when available, for speed and to reflect live, uncommitted edits.
  Only "Create Pull Request" talks to the remote VCS API, and only at
  submit time.

## Non-goals

- No change to how `url:`-only entities (no local filesystem access) behave
  — they still only ever show "Create Pull Request".
- No change to conflict detection semantics, just which source (local disk
  vs. remote API) it's detected against, per action.
- No new provider types or SCM integrations.

## Design

### 1. `ResolvedSource` becomes additive

`packages/techdocs-editor-common/src/types.ts`:

```ts
export type ResolvedSource = {
  /** Present whenever the entity has a `dir:` annotation (filesystem access exists). */
  local?: {
    /** Absolute path to the entity root directory on the local filesystem */
    basePath: string;
    /** Docs directory relative to basePath, e.g. "docs" */
    docsDir: string;
  };
  /** Present whenever a VCS repo can be resolved. */
  vcs?: {
    /** Full repository URL, e.g. https://github.com/org/repo */
    repoUrl: string;
    /** Docs directory relative to repo root, e.g. "docs" */
    docsDir?: string;
    /** Default branch name, e.g. "main" */
    defaultBranch?: string;
  };
};
```

`resolveSource()` in `techdocs-editor-backend/src/service/sourceResolver.ts`:

- `dir:` annotation:
  1. Always resolves `local` (basePath + docsDir), exactly as it does today
     for what is currently `type: 'local'`.
  2. Additionally attempts `resolveFromSlug(entity, scmIntegrations)`
     (existing helper, unchanged) using the entity's `project-slug`
     annotations. If it resolves, also populates `vcs` (`docsDir` and
     `defaultBranch` left `undefined` — resolved later from `mkdocs.yml` /
     the provider, same as today's slug-fallback path).
  3. If neither the slug annotation is present nor resolvable, `vcs` stays
     `undefined` — entity only supports local save.
- `url:` annotation: only populates `vcs` (unchanged parsing logic from
  today's `type: 'vcs'` branch). `local` stays `undefined`.
- Missing annotation with a resolvable project-slug: only populates `vcs`
  (unchanged from today's fallback branch).
- Neither resolvable at all: throws `InputError`, same as today.

This removes the git-remote-detection code (`detectGitRemoteSource`,
`normalizeGitRemoteUrl`, its cache) added in the prior iteration of this
work — superseded by this annotation-only design per explicit decision.

### 2. Backend routes

`techdocs-editor-backend/src/service/router.ts`:

- **`GET /sources/:namespace/:kind/:name/mkdocs`** and **`GET
.../tree`**: prefer `source.local` for actually reading files (unchanged
  local-read code path) when present; otherwise read via `source.vcs` +
  the resolved `VcsProvider` (unchanged VCS-read code path). Response JSON
  adds two booleans:
  - `canSaveLocally: boolean` — `!!source.local`
  - `canCreatePullRequest: boolean` — `!!source.vcs`

  (Replaces the current single `isLocalSource` boolean.)

- **`GET .../file`**: same local-preferred read logic, unchanged otherwise.

- **`POST /submissions/:namespace/:kind/:name`**: `SubmitEditsRequest` gains
  a required field:

  ```ts
  action: 'save-locally' | 'create-pull-request';
  ```

  Handler behavior:
  - `action === 'save-locally'`: require `source.local` (400 `InputError`
    otherwise: _"This entity has no local filesystem source — Save Locally
    is unavailable."_). Write files directly via `LocalFsVcsProvider` to
    `source.local.basePath`/`docsDir`. No branch, no commit-to-git, no PR
    call. Response: `{ savedLocally: true, savedCount, savedPath }`.
  - `action === 'create-pull-request'`: require `source.vcs` (400
    `InputError` otherwise: _"This entity has no configured VCS repository —
    Create Pull Request is unavailable."_). Requires `prTitle`. Resolves
    default branch, fetches `mkdocs.yml` via the VCS provider, does conflict
    detection against the **remote** repo state, creates a branch, commits,
    opens the PR — all unchanged from today's VCS submission path, just
    gated on `source.vcs` instead of `source.type === 'vcs'`. Response:
    `{ pullRequestUrl, pullRequestNumber, headBranch }`.
  - These two paths are fully independent: no shared branch/commit state,
    no ordering requirement between them. A user can Save Locally now and
    Create Pull Request later (or never), and vice versa.

### 3. Frontend

`techdocs-editor-react/src/components/TechDocsEditorPage.tsx`:

- Reads `canSaveLocally` / `canCreatePullRequest` from the `/tree` (or
  `/mkdocs`) response instead of deriving `isLocalSource` from `branch ===
'local'`.
- Passes both flags to `SubmitEditsDialog`.
- `handleSubmit(action, opts)` calls `api.submitEdits(..., { ...opts,
action })`, replacing the current single `handleSubmit(opts)`.

`techdocs-editor-react/src/components/SubmitEditsDialog.tsx`:

- Always renders: changed-files list, commit message field.
- Renders PR title / description / draft-checkbox fields **only if**
  `canCreatePullRequest`.
- Bottom actions:
  - "Save Locally" button, shown iff `canSaveLocally`. Secondary/outlined
    style when both buttons are present; primary when it's the only action.
  - "Open Pull Request" button (existing style/icon), shown iff
    `canCreatePullRequest`. Always primary when present.
  - Each button independently triggers `onSubmit({ action: 'save-locally' |
'create-pull-request', ...formFields })`; clicking one does not also
    trigger the other.
- Success view branches on which action just completed (existing "PR
  opened" view vs. existing "saved" messaging), keyed off the response
  shape (`pullRequestUrl` present vs. `savedLocally` present).

## Data flow summary

```
Entity annotations
  ├─ dir: ─────────────► local (always) ─┐
  │                                       ├─► both may be present
  └─ project-slug / url: ──► vcs (maybe) ─┘

Read (tree/file/mkdocs):  prefer local, else vcs
Write (submissions):      action picks local XOR vcs explicitly
```

## Testing

- `sourceResolver.test.ts`: replace the git-remote-detection tests from the
  prior iteration with tests asserting `local`/`vcs` are populated
  independently for: `dir:` with slug, `dir:` without slug, `url:` only,
  missing annotation with slug, neither resolvable (still throws).
- `router.test.ts` (new or existing): `save-locally` succeeds when
  `source.local` present and fails with 400 otherwise; `create-pull-request`
  succeeds when `source.vcs` present and fails with 400 otherwise; both
  actions available and independently triggerable for a `dir:` + slug
  entity.
- `SubmitEditsDialog.test.tsx`: button visibility matrix for all four
  `(canSaveLocally, canCreatePullRequest)` combinations; each button calls
  `onSubmit` with the correct `action`.
- `TechDocsEditorPage.test.tsx`: capability flags flow from API response to
  dialog props; `handleSubmit` forwards the right `action`.

## Open questions / risks

- None outstanding — all prior open questions were resolved during
  brainstorming (see conversation history: annotation-only VCS detection,
  single dialog with two buttons, fully independent write paths, local-first
  reads).
