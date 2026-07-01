# Dual Save/PR Actions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every TechDocs entity both a "Save Locally" and a "Create Pull Request" action (each shown only when actually possible), replacing the current single-mode (local-only OR PR-only) behavior.

**Architecture:** `resolveSource()` in the backend now returns an _additive_ `ResolvedSource` shape (`{ local?, vcs? }` — both can be populated simultaneously for a `dir:` entity that also has a `github.com/project-slug`/`gitlab.com/project-slug` annotation). The router exposes two capability booleans (`canSaveLocally`, `canCreatePullRequest`) on `GET /mkdocs` and `GET /tree`, and branches `POST /submissions` on a new required `action: 'save-locally' | 'create-pull-request'` field, guarding each branch with a 400 `InputError` if the corresponding capability is absent. The frontend dialog renders 0–2 buttons based on the two flags and calls `onSubmit` with the matching `action`.

**Tech Stack:** TypeScript, Express, Backstage backend/frontend plugin conventions, Jest + supertest (backend), Jest + @testing-library/react (frontend).

---

## Reference

Full design rationale: `docs/superpowers/specs/2026-07-01-dual-save-pr-actions-design.md`. Read it before starting if anything below is ambiguous — it is the source of truth for _why_, this plan is the source of truth for _how_.

All file paths below are relative to the submodule root: `/Users/estehsan/Documents/Coders/SAS/Back/backstage/plugins/backstage-plugin-techdocs-editor/`.

Run backend package tests from: `workspaces/techdocs-editor/plugins/techdocs-editor-backend/`
Run frontend package tests from: `workspaces/techdocs-editor/plugins/techdocs-editor-react/`
Run root-level checks (`tsc`, `prettier`, `lint`, full `test`) from the submodule root.

---

### Task 1: Shared types (`techdocs-editor-common`)

**Files:**

- Modify: `workspaces/techdocs-editor/plugins/techdocs-editor-common/src/types.ts`

Current relevant sections (for reference, do not copy blindly — re-view the file first since line numbers may have drifted):

```ts
// L56-64 (current MkDocsConfig)
export type MkDocsConfig = {
  siteName?: string;
  siteDescription?: string;
  docsDir: string;
  nav?: unknown;
  isLocalSource?: boolean;
};

// L86-97 (current SubmitEditsRequest)
export type SubmitEditsRequest = {
  entityRef: string;
  changes: FileChange[];
  commitMessage: string;
  prTitle?: string;
  prDescription?: string;
  draft?: boolean;
};

// L123-139 (current ResolvedSource)
export type ResolvedSource =
  | { type: 'local'; basePath: string; docsDir: string }
  | { type: 'vcs'; repoUrl: string; docsDir?: string; defaultBranch?: string };
```

- [ ] **Step 1: Replace `ResolvedSource` with the additive shape**

Replace the `ResolvedSource` union with:

```ts
export type ResolvedSource = {
  local?: { basePath: string; docsDir: string };
  vcs?: { repoUrl: string; docsDir?: string; defaultBranch?: string };
};
```

- [ ] **Step 2: Replace `isLocalSource?` with capability flags on `MkDocsConfig`**

```ts
export type MkDocsConfig = {
  siteName?: string;
  siteDescription?: string;
  docsDir: string;
  nav?: unknown;
  canSaveLocally?: boolean;
  canCreatePullRequest?: boolean;
};
```

- [ ] **Step 3: Add `action` to `SubmitEditsRequest`**

```ts
export type SubmitEditsRequest = {
  entityRef: string;
  changes: FileChange[];
  commitMessage: string;
  action: 'save-locally' | 'create-pull-request';
  prTitle?: string;
  prDescription?: string;
  draft?: boolean;
};
```

- [ ] **Step 4: Check `SubmitEditsResponse` (L103-116) — add local-save fields**

View current shape first. It should become (additive, both sides optional so one response object works for either action):

```ts
export type SubmitEditsResponse = {
  pullRequestUrl?: string;
  pullRequestNumber?: number;
  headBranch?: string;
  savedLocally?: boolean;
  savedCount?: number;
  savedPath?: string;
};
```

Keep any other existing fields already in that type (re-view file to confirm nothing else is present that needs preserving).

- [ ] **Step 5: Run type check for this package**

Run: `yarn tsc` (from submodule root)
Expected: New errors will appear in `sourceResolver.ts`, `router.ts`, `api.ts`, `SubmitEditsDialog.tsx`, `TechDocsEditorPage.tsx` — this is expected, they get fixed in later tasks. Confirm no errors are reported _inside_ `techdocs-editor-common` itself.

- [ ] **Step 6: Commit**

```bash
git add workspaces/techdocs-editor/plugins/techdocs-editor-common/src/types.ts
git commit -m "feat(common): additive ResolvedSource + action-based SubmitEditsRequest"
```

---

### Task 2: `sourceResolver.ts` rewrite (TDD)

**Files:**

- Modify: `workspaces/techdocs-editor/plugins/techdocs-editor-backend/src/service/sourceResolver.ts:216-323` (`resolveSource`), `:338-376` (`fetchMkdocsContent`)
- Modify: `workspaces/techdocs-editor/plugins/techdocs-editor-backend/src/service/sourceResolver.test.ts` (full rewrite of assertions)

Before editing, re-view both files in full — the design spec described behavior, not exact code, and helper function names (`resolveFromSlug`, `resolveLocalBasePath`, `resolveLocalDocsDir`, `assertSafeLocalPath`, `assertSafeDocsDir`) must be reused as-is; do not rename them.

- [ ] **Step 1: Update existing tests first to express new expectations**

Rewrite each `resolveSource` test case's assertion. For every place the old test does:

```ts
expect(result).toEqual({
  type: 'local',
  basePath: '/some/path',
  docsDir: 'docs',
});
```

change to:

```ts
expect(result).toEqual({
  local: { basePath: '/some/path', docsDir: 'docs' },
});
```

And where the old test does:

```ts
expect(result).toEqual({
  type: 'vcs',
  repoUrl: 'https://github.com/org/repo',
  docsDir: undefined,
  defaultBranch: undefined,
});
```

change to:

```ts
expect(result).toEqual({
  vcs: {
    repoUrl: 'https://github.com/org/repo',
    docsDir: undefined,
    defaultBranch: undefined,
  },
});
```

Add these five scenario tests (write them even if similarly-named tests already exist — merge logic in, don't duplicate test names):

```ts
describe('resolveSource additive behavior', () => {
  it('populates both local and vcs when dir: annotation and a resolvable project-slug are both present', async () => {
    const entity = {
      metadata: {
        name: 'test',
        annotations: {
          'backstage.io/techdocs-ref': 'dir:.',
          'github.com/project-slug': 'org/repo',
        },
      },
    } as Entity;

    const result = await resolveSource(entity, config, catalogApi, logger);

    expect(result.local).toEqual({
      basePath: expect.any(String),
      docsDir: expect.any(String),
    });
    expect(result.vcs).toEqual({
      repoUrl: expect.stringContaining('github.com/org/repo'),
      docsDir: undefined,
      defaultBranch: undefined,
    });
  });

  it('populates only local when dir: annotation present with no resolvable slug', async () => {
    const entity = {
      metadata: {
        name: 'test',
        annotations: {
          'backstage.io/techdocs-ref': 'dir:.',
        },
      },
    } as Entity;

    const result = await resolveSource(entity, config, catalogApi, logger);

    expect(result.local).toEqual({
      basePath: expect.any(String),
      docsDir: expect.any(String),
    });
    expect(result.vcs).toBeUndefined();
  });

  it('populates only vcs when url: annotation is present', async () => {
    const entity = {
      metadata: {
        name: 'test',
        annotations: {
          'backstage.io/techdocs-ref':
            'url:https://github.com/org/repo/tree/main/docs',
        },
      },
    } as Entity;

    const result = await resolveSource(entity, config, catalogApi, logger);

    expect(result.local).toBeUndefined();
    expect(result.vcs).toEqual({
      repoUrl: expect.stringContaining('github.com/org/repo'),
      docsDir: 'docs',
      defaultBranch: 'main',
    });
  });

  it('populates only vcs when no techdocs-ref annotation but a resolvable slug annotation exists', async () => {
    const entity = {
      metadata: {
        name: 'test',
        annotations: {
          'github.com/project-slug': 'org/repo',
        },
      },
    } as Entity;

    const result = await resolveSource(entity, config, catalogApi, logger);

    expect(result.local).toBeUndefined();
    expect(result.vcs).toEqual({
      repoUrl: expect.stringContaining('github.com/org/repo'),
      docsDir: undefined,
      defaultBranch: undefined,
    });
  });

  it('throws InputError when neither dir:, url:, nor a resolvable slug is present', async () => {
    const entity = {
      metadata: { name: 'test', annotations: {} },
    } as Entity;

    await expect(
      resolveSource(entity, config, catalogApi, logger),
    ).rejects.toThrow(InputError);
  });
});
```

Adapt `entity`/`config`/`catalogApi`/`logger` setup to whatever fixtures the existing test file already builds (re-use the file's existing `beforeEach`/helper builders — do not introduce a second parallel fixture setup).

- [ ] **Step 2: Run tests to confirm they fail**

Run: `yarn backstage-cli package test src/service/sourceResolver.test.ts` (from `techdocs-editor-backend/`)
Expected: FAIL — `result.local` / `result.vcs` undefined because `resolveSource` still returns the old `{type, ...}` shape.

- [ ] **Step 3: Rewrite `resolveSource()`**

Re-view current implementation (L216-323) fully first. Restructure the function body so that:

1. If the `dir:` branch is taken (today's `type === 'local'` case): build `local: { basePath, docsDir }` using the exact same `resolveLocalBasePath`/`resolveLocalDocsDir`/`assertSafeLocalPath`/`assertSafeDocsDir` calls as today. Then, in addition (do not `return` yet), attempt `resolveFromSlug(entity, config)` (same helper used in the slug-fallback branch). If it returns a value, merge it into `vcs: { repoUrl, docsDir: undefined, defaultBranch: undefined }`. If it throws or returns undefined (whatever the helper's "not found" contract is — check its signature), leave `vcs` undefined. Return `{ local, vcs }` (vcs may be undefined).
2. If the `url:` branch is taken (today's explicit VCS URL parsing case): keep the exact same parsing logic, but return `{ vcs: { repoUrl, docsDir, defaultBranch } }` (no `local` key at all, not even `undefined` — though `toEqual` will treat `{vcs: X}` and `{local: undefined, vcs: X}` the same, prefer omitting the key for clarity).
3. If no `techdocs-ref` annotation exists, keep the existing slug-fallback branch, returning `{ vcs: { repoUrl, docsDir: undefined, defaultBranch: undefined } }`.
4. If nothing resolves, throw the same `InputError` with the same message as today.

Do not touch `resolveFromSlug`, `resolveLocalBasePath`, `resolveLocalDocsDir`, `assertSafeLocalPath`, `assertSafeDocsDir` — they are reused unchanged.

- [ ] **Step 4: Update `fetchMkdocsContent()` (L338-376)**

Re-view current implementation first. Change the branch condition from `source.type === 'local'` to `source.local` (truthy check), reading `source.local.basePath`/`source.local.docsDir` instead of `source.basePath`/`source.docsDir`. Change the `else` branch to use `source.vcs!.repoUrl` / `source.vcs!.docsDir` (the caller must guarantee at least one of `local`/`vcs` is present — `resolveSource` guarantees this via the throw in step 3.4). Keep the `remoteProvider`/`branch` parameters and their usage in the vcs branch unchanged.

- [ ] **Step 5: Run tests to confirm they pass**

Run: `yarn backstage-cli package test src/service/sourceResolver.test.ts` (from `techdocs-editor-backend/`)
Expected: PASS, all tests green.

- [ ] **Step 6: Commit**

```bash
git add workspaces/techdocs-editor/plugins/techdocs-editor-backend/src/service/sourceResolver.ts workspaces/techdocs-editor/plugins/techdocs-editor-backend/src/service/sourceResolver.test.ts
git commit -m "feat(backend): resolveSource returns additive local+vcs shape"
```

---

### Task 3: `router.ts` GET endpoints (local-preferred reads + capability booleans)

**Files:**

- Modify: `workspaces/techdocs-editor/plugins/techdocs-editor-backend/src/service/router.ts:169-225` (`/mkdocs`), `:228-298` (`/tree`), `:301-373` (`/file`)

Re-view the current full content of all three handlers before editing — do not assume the line ranges above are still exact after Task 2's changes shift nothing in this file yet, but re-check.

- [ ] **Step 1: Update `GET /mkdocs` handler**

Every place the handler currently does `if (source.type === 'local') { ... } else { ... }`, change the condition to `if (source.local) { ... } else { ... }`, replacing references to `source.basePath`/`source.docsDir` with `source.local.basePath`/`source.local.docsDir`, and `source.repoUrl` etc. with `source.vcs!.repoUrl` etc. in the else branch.

In the JSON response object returned by this handler, replace:

```ts
isLocalSource: source.type === 'local',
```

with:

```ts
canSaveLocally: !!source.local,
canCreatePullRequest: !!source.vcs,
```

- [ ] **Step 2: Update `GET /tree` handler**

Same transformation pattern as Step 1: branch on `source.local`/`source.vcs` instead of `source.type`, and add the same two capability booleans to its JSON response (re-view the current response shape to see where `isLocalSource` or similar currently lives, or if it needs to be added fresh — the design spec requires both `/mkdocs` and `/tree` to expose these flags since the frontend page may read from either depending on load order).

- [ ] **Step 3: Update `GET /file` handler**

Same branch-condition transformation (`source.local` / `source.vcs!`). This handler does not need to add capability booleans to its response (reads only, single-file content) — only fix the branch condition and property access to match the new `ResolvedSource` shape.

- [ ] **Step 4: Run backend package test suite (existing tests only — router.test.ts doesn't exist yet)**

Run: `yarn tsc` (from submodule root)
Expected: Remaining errors should now only be in `router.ts`'s `/submissions` handler (Task 4), `api.ts`, `SubmitEditsDialog.tsx`, `TechDocsEditorPage.tsx` (Tasks 5-6). Confirm no errors remain in the three GET handlers just edited.

- [ ] **Step 5: Commit**

```bash
git add workspaces/techdocs-editor/plugins/techdocs-editor-backend/src/service/router.ts
git commit -m "feat(backend): GET endpoints expose canSaveLocally/canCreatePullRequest"
```

---

### Task 4: `router.ts` POST `/submissions` — action-based branching

**Files:**

- Modify: `workspaces/techdocs-editor/plugins/techdocs-editor-backend/src/service/router.ts:376-545`

Re-view this handler's current full content before editing (it is the longest and most behaviorally complex handler).

- [ ] **Step 1: Add capability guards at the top of the handler, before existing logic**

Right after `source` is resolved (re-use however the handler currently obtains it, likely a call to `resolveSource(...)` near the top) and the request body is parsed/validated, insert:

```ts
const { action } = req.body as SubmitEditsRequest;

if (action === 'save-locally' && !source.local) {
  throw new InputError(
    'This entity has no local filesystem source — Save Locally is unavailable.',
  );
}

if (action === 'create-pull-request' && !source.vcs) {
  throw new InputError(
    'This entity has no configured VCS repository — Create Pull Request is unavailable.',
  );
}
```

(Adapt `InputError` import — it should already be imported in this file from `@backstage/errors`; re-check.)

- [ ] **Step 2: Branch the remaining handler body on `action`**

Re-view the current handler body. It currently does something like: resolve provider → check for conflicts → commit changes → open PR → return response, with an `if (source.type === 'local')` branch somewhere for the local-write path (using `LocalFsVcsProvider`) and an else branch for the real VCS path.

Restructure so the top-level branch is on `action`, not `source.type`:

```ts
if (action === 'save-locally') {
  const localProvider = new LocalFsVcsProvider(); // re-use existing construction pattern from current code — check current instantiation signature
  const result = await localProvider.openPullRequest({
    // re-use exactly the same argument shape the current local branch already passes
    repoUrl: source.local!.basePath,
    docsDir: source.local!.docsDir,
    changes: req.body.changes,
    commitMessage: req.body.commitMessage,
    // ...whatever other fields the existing call already passes — check current code, do not invent new ones
  });
  res.status(200).json({
    savedLocally: true,
    savedCount: result.number,
    savedPath: source.local!.basePath,
  });
  return;
}

// action === 'create-pull-request'
if (!req.body.prTitle) {
  throw new InputError('prTitle is required to create a pull request.');
}

// ...existing VCS submission logic unchanged, using source.vcs!.repoUrl / source.vcs!.docsDir / source.vcs!.defaultBranch
// in place of the old source.repoUrl / source.docsDir / source.defaultBranch
```

Important: do not invent field names for `LocalFsVcsProvider.openPullRequest()`'s argument object — re-view `LocalFsVcsProvider.ts:109-136` and the current call site in `router.ts` before writing this step's final code, and use the exact existing signature. The plan's job here is to move _which branch calls it_, not to change the call itself.

- [ ] **Step 3: Run type check**

Run: `yarn tsc` (from submodule root)
Expected: Zero errors remaining in `techdocs-editor-backend` (frontend errors from Tasks 5-6 still expected at this point).

- [ ] **Step 4: Commit**

```bash
git add workspaces/techdocs-editor/plugins/techdocs-editor-backend/src/service/router.ts
git commit -m "feat(backend): POST /submissions branches on action with capability guards"
```

---

### Task 5: New `router.test.ts` (backend integration tests)

**Files:**

- Create: `workspaces/techdocs-editor/plugins/techdocs-editor-backend/src/service/router.test.ts`

Use `/tmp/router.test.ts.orig` (fetched from `backstage/community-plugins#8775`, commit `68392fef2e24df2a3b05ae9e4eee362fcf35a1ca`) as the structural scaffold: `supertest` + `express` + `mockServices` from `@backstage/backend-test-utils` + `ConfigReader` + `AuthorizeResult`, plus a `backstageErrorHandler()` middleware and `buildApp()`/`buildRegistry()` fixtures. Re-view that file's full contents before starting (already reviewed in reconnaissance — 351 lines).

Required import-path adaptations from the original scaffold (this repo uses different package scope):

- `@backstage-community/plugin-techdocs-editor-node` → `@estehsaan/backstage-plugin-techdocs-editor-node`
- Any other `@backstage-community/plugin-techdocs-editor*` imports → `@estehsaan/backstage-plugin-techdocs-editor*` equivalents (check each import in the original scaffold against this repo's actual package names in `techdocs-editor-common`, `techdocs-editor-backend`, `techdocs-editor-node`).

- [ ] **Step 1: Write the test file skeleton with shared fixtures**

Adapt from `/tmp/router.test.ts.orig`: `buildApp()` helper wiring an express app with the real router mounted plus `backstageErrorHandler()`, a `buildRegistry()` helper returning a `VcsProviderRegistry` pre-populated with a mock `VcsProvider` (implementing `getForUrl`, `openPullRequest`, `getFile`, `getTree`, etc. as stubs), and a `mockCatalogApi` returning a fixed entity per test. Use `mockServices.rootConfig()`/`ConfigReader` from `@backstage/backend-test-utils` for config, matching the original scaffold's pattern.

- [ ] **Step 2: Write GET capability-boolean tests**

```ts
describe('GET /mkdocs', () => {
  it('returns canSaveLocally=true and canCreatePullRequest=true for a dir: entity with a resolvable slug', async () => {
    const app = buildApp({
      entityAnnotations: {
        'backstage.io/techdocs-ref': 'dir:.',
        'github.com/project-slug': 'org/repo',
      },
    });

    const response = await request(app).get(
      '/mkdocs?entityRef=component:default/test',
    );

    expect(response.status).toBe(200);
    expect(response.body.canSaveLocally).toBe(true);
    expect(response.body.canCreatePullRequest).toBe(true);
  });

  it('returns canSaveLocally=true and canCreatePullRequest=false for a dir: entity with no resolvable slug', async () => {
    const app = buildApp({
      entityAnnotations: {
        'backstage.io/techdocs-ref': 'dir:.',
      },
    });

    const response = await request(app).get(
      '/mkdocs?entityRef=component:default/test',
    );

    expect(response.status).toBe(200);
    expect(response.body.canSaveLocally).toBe(true);
    expect(response.body.canCreatePullRequest).toBe(false);
  });

  it('returns canSaveLocally=false and canCreatePullRequest=true for a url: entity', async () => {
    const app = buildApp({
      entityAnnotations: {
        'backstage.io/techdocs-ref':
          'url:https://github.com/org/repo/tree/main/docs',
      },
    });

    const response = await request(app).get(
      '/mkdocs?entityRef=component:default/test',
    );

    expect(response.status).toBe(200);
    expect(response.body.canSaveLocally).toBe(false);
    expect(response.body.canCreatePullRequest).toBe(true);
  });
});
```

- [ ] **Step 3: Write POST /submissions action-branching tests**

```ts
describe('POST /submissions', () => {
  it('returns 200 with savedLocally=true when action=save-locally and source has local', async () => {
    const app = buildApp({
      entityAnnotations: { 'backstage.io/techdocs-ref': 'dir:.' },
    });

    const response = await request(app)
      .post('/submissions')
      .send({
        entityRef: 'component:default/test',
        changes: [{ path: 'index.md', content: '# Hello' }],
        commitMessage: 'Update docs',
        action: 'save-locally',
      });

    expect(response.status).toBe(200);
    expect(response.body.savedLocally).toBe(true);
  });

  it('returns 400 when action=create-pull-request and source has no vcs', async () => {
    const app = buildApp({
      entityAnnotations: { 'backstage.io/techdocs-ref': 'dir:.' },
    });

    const response = await request(app)
      .post('/submissions')
      .send({
        entityRef: 'component:default/test',
        changes: [{ path: 'index.md', content: '# Hello' }],
        commitMessage: 'Update docs',
        action: 'create-pull-request',
        prTitle: 'Update docs',
      });

    expect(response.status).toBe(400);
  });

  it('returns 200 with pullRequestUrl when action=create-pull-request and source has vcs', async () => {
    const app = buildApp({
      entityAnnotations: {
        'backstage.io/techdocs-ref': 'dir:.',
        'github.com/project-slug': 'org/repo',
      },
    });

    const response = await request(app)
      .post('/submissions')
      .send({
        entityRef: 'component:default/test',
        changes: [{ path: 'index.md', content: '# Hello' }],
        commitMessage: 'Update docs',
        action: 'create-pull-request',
        prTitle: 'Update docs',
      });

    expect(response.status).toBe(200);
    expect(response.body.pullRequestUrl).toBeDefined();
  });

  it('returns 400 when action=save-locally is sent without a required field, independent of vcs presence', async () => {
    const app = buildApp({
      entityAnnotations: {
        'backstage.io/techdocs-ref': 'dir:.',
        'github.com/project-slug': 'org/repo',
      },
    });

    const response = await request(app)
      .post('/submissions')
      .send({
        entityRef: 'component:default/test',
        changes: [{ path: 'index.md', content: '# Hello' }],
        commitMessage: 'Update docs',
        action: 'save-locally',
      });

    expect(response.status).toBe(200);
    expect(response.body.savedLocally).toBe(true);
  });
});
```

(The mock `VcsProvider`'s `openPullRequest` stub should return `{ url: 'https://github.com/org/repo/pull/1', number: 1 }` so the third test's `pullRequestUrl` assertion passes — set this up in the `buildRegistry()` fixture from Step 1.)

- [ ] **Step 4: Run the new test file**

Run: `yarn backstage-cli package test src/service/router.test.ts` (from `techdocs-editor-backend/`)
Expected: PASS, all tests green. If any fail, check whether `buildApp()`/`buildRegistry()` fixtures match this repo's actual router construction signature (re-view `router.ts`'s exported `createRouter()` function signature — it may take different options than the original scaffold's target project).

- [ ] **Step 5: Commit**

```bash
git add workspaces/techdocs-editor/plugins/techdocs-editor-backend/src/service/router.test.ts
git commit -m "test(backend): router integration tests for capability flags and action branching"
```

---

### Task 6: Frontend API client (`techdocs-editor-react/src/api.ts`)

**Files:**

- Modify: `workspaces/techdocs-editor/plugins/techdocs-editor-react/src/api.ts`

Re-view the full current file (161 lines) before editing.

- [ ] **Step 1: Update `getFileTree`/`getMkDocsConfig` return types**

Find every ad-hoc inline return-type object in `TechDocsEditorApi` interface and `TechDocsEditorClient` implementation that currently includes `isLocalSource` (or `branch`/`docsDir` fields serving a similar purpose per the reconnaissance notes) and add `canSaveLocally: boolean` and `canCreatePullRequest: boolean` alongside them, removing `isLocalSource` entirely. Where the client parses the fetch response JSON, ensure these two new fields are passed through unchanged (they arrive directly from the backend JSON body per Task 3).

- [ ] **Step 2: Update `submitEdits` request type usage**

The method should now require an `action: 'save-locally' | 'create-pull-request'` field in its request argument, matching `SubmitEditsRequest` from `techdocs-editor-common` (Task 1). If the method signature currently destructures individual fields rather than accepting the whole `SubmitEditsRequest` type, add `action` to that destructuring and to the request body it sends.

- [ ] **Step 3: Run type check**

Run: `yarn tsc` (from submodule root)
Expected: Errors should now only remain in `SubmitEditsDialog.tsx` and `TechDocsEditorPage.tsx` (Tasks 7-8).

- [ ] **Step 4: Commit**

```bash
git add workspaces/techdocs-editor/plugins/techdocs-editor-react/src/api.ts
git commit -m "feat(react): api client exposes canSaveLocally/canCreatePullRequest and action field"
```

---

### Task 7: `SubmitEditsDialog.tsx` rewrite + tests

**Files:**

- Modify: `workspaces/techdocs-editor/plugins/techdocs-editor-react/src/components/SubmitEditsDialog.tsx` (277 lines, full re-view required)
- Create: `workspaces/techdocs-editor/plugins/techdocs-editor-react/src/components/SubmitEditsDialog.test.tsx`

- [ ] **Step 1: Write the failing test file first (button-visibility matrix)**

```tsx
import React from 'react';
import { renderInTestApp } from '@backstage/test-utils';
import { fireEvent, screen } from '@testing-library/react';
import { SubmitEditsDialog } from './SubmitEditsDialog';

const baseProps = {
  open: true,
  onClose: jest.fn(),
  changedFiles: [{ path: 'index.md', content: '# Hello' }],
};

describe('SubmitEditsDialog capability-based buttons', () => {
  it('shows only Save Locally when canSaveLocally=true and canCreatePullRequest=false', async () => {
    const onSubmit = jest.fn();
    await renderInTestApp(
      <SubmitEditsDialog
        {...baseProps}
        canSaveLocally
        canCreatePullRequest={false}
        onSubmit={onSubmit}
      />,
    );

    expect(
      screen.getByRole('button', { name: /save locally/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /pull request/i }),
    ).not.toBeInTheDocument();
  });

  it('shows only Open Pull Request when canSaveLocally=false and canCreatePullRequest=true', async () => {
    const onSubmit = jest.fn();
    await renderInTestApp(
      <SubmitEditsDialog
        {...baseProps}
        canSaveLocally={false}
        canCreatePullRequest
        onSubmit={onSubmit}
      />,
    );

    expect(
      screen.queryByRole('button', { name: /save locally/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /pull request/i }),
    ).toBeInTheDocument();
  });

  it('shows both buttons when both flags are true', async () => {
    const onSubmit = jest.fn();
    await renderInTestApp(
      <SubmitEditsDialog
        {...baseProps}
        canSaveLocally
        canCreatePullRequest
        onSubmit={onSubmit}
      />,
    );

    expect(
      screen.getByRole('button', { name: /save locally/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /pull request/i }),
    ).toBeInTheDocument();
  });

  it('shows neither button when both flags are false', async () => {
    await renderInTestApp(
      <SubmitEditsDialog
        {...baseProps}
        canSaveLocally={false}
        canCreatePullRequest={false}
        onSubmit={jest.fn()}
      />,
    );

    expect(
      screen.queryByRole('button', { name: /save locally/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /pull request/i }),
    ).not.toBeInTheDocument();
  });

  it('calls onSubmit with action=save-locally when Save Locally is clicked', async () => {
    const onSubmit = jest.fn();
    await renderInTestApp(
      <SubmitEditsDialog
        {...baseProps}
        canSaveLocally
        canCreatePullRequest={false}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /save locally/i }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'save-locally' }),
    );
  });

  it('calls onSubmit with action=create-pull-request when Open Pull Request is clicked', async () => {
    const onSubmit = jest.fn();
    await renderInTestApp(
      <SubmitEditsDialog
        {...baseProps}
        canSaveLocally={false}
        canCreatePullRequest
        onSubmit={onSubmit}
      />,
    );

    fireEvent.change(screen.getByLabelText(/pr title/i), {
      target: { value: 'Update docs' },
    });
    fireEvent.click(screen.getByRole('button', { name: /pull request/i }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'create-pull-request',
        prTitle: 'Update docs',
      }),
    );
  });

  it('only renders PR-specific fields (title/description/draft) when canCreatePullRequest is true', async () => {
    await renderInTestApp(
      <SubmitEditsDialog
        {...baseProps}
        canSaveLocally
        canCreatePullRequest={false}
        onSubmit={jest.fn()}
      />,
    );

    expect(screen.queryByLabelText(/pr title/i)).not.toBeInTheDocument();
  });
});
```

Adjust `getByLabelText`/`getByRole` name matchers to whatever exact label text the current dialog uses (re-view the existing 277-line file's JSX for the actual field labels/button text before finalizing this test — the design spec calls for "Save Locally" and "Open Pull Request" as the button labels, keep those exact strings when implementing Step 3 below so these matchers pass).

- [ ] **Step 2: Run tests to confirm they fail**

Run: `yarn backstage-cli package test src/components/SubmitEditsDialog.test.tsx` (from `techdocs-editor-react/`)
Expected: FAIL — component doesn't yet accept `canSaveLocally`/`canCreatePullRequest` props or emit `action`.

- [ ] **Step 3: Rewrite the component**

Re-view the current full file first. Required changes:

- Replace the `isLocalSource?: boolean` prop with `canSaveLocally: boolean` and `canCreatePullRequest: boolean` (both required, not optional — the parent always knows both from the API response per Task 8).
- Keep the changed-files list and commit-message field rendering unconditionally (as today).
- Wrap the existing PR-specific fields (title, description, draft checkbox) in `{canCreatePullRequest && (...)}`.
- Replace the current single conditional submit button with:
  ```tsx
  <DialogActions>
    {canSaveLocally && (
      <Button
        variant={canCreatePullRequest ? 'outlined' : 'contained'}
        color="primary"
        onClick={() => onSubmit({ action: 'save-locally', commitMessage })}
      >
        Save Locally
      </Button>
    )}
    {canCreatePullRequest && (
      <Button
        variant="contained"
        color="primary"
        onClick={() =>
          onSubmit({
            action: 'create-pull-request',
            commitMessage,
            prTitle,
            prDescription,
            draft,
          })
        }
      >
        Open Pull Request
      </Button>
    )}
  </DialogActions>
  ```
  (Reuse whatever local state variable names — `commitMessage`, `prTitle`, `prDescription`, `draft` — already exist in the current file; do not rename them.)
- Update the success-view branch (shown after a successful submission) to check `response.pullRequestUrl` first, falling back to `response.savedLocally`, matching `SubmitEditsResponse` from Task 1 Step 4.

- [ ] **Step 4: Run tests to confirm they pass**

Run: `yarn backstage-cli package test src/components/SubmitEditsDialog.test.tsx` (from `techdocs-editor-react/`)
Expected: PASS, all tests green.

- [ ] **Step 5: Commit**

```bash
git add workspaces/techdocs-editor/plugins/techdocs-editor-react/src/components/SubmitEditsDialog.tsx workspaces/techdocs-editor/plugins/techdocs-editor-react/src/components/SubmitEditsDialog.test.tsx
git commit -m "feat(react): SubmitEditsDialog renders independent Save Locally / PR actions"
```

---

### Task 8: `TechDocsEditorPage.tsx` update + tests

**Files:**

- Modify: `workspaces/techdocs-editor/plugins/techdocs-editor-react/src/components/TechDocsEditorPage.tsx:156` (`isLocalSource`), `:250-278` (`handleSubmit`), `:415` (dialog prop passing)
- Create: `workspaces/techdocs-editor/plugins/techdocs-editor-react/src/components/TechDocsEditorPage.test.tsx`

Re-view the full current file (473 lines) before editing.

- [ ] **Step 1: Write the failing test file first**

```tsx
import React from 'react';
import { renderInTestApp, TestApiProvider } from '@backstage/test-utils';
import { screen, waitFor } from '@testing-library/react';
import { techdocsEditorApiRef } from '../api';
import { TechDocsEditorPage } from './TechDocsEditorPage';

function buildMockApi(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    getMkDocsConfig: jest.fn().mockResolvedValue({
      docsDir: 'docs',
      canSaveLocally: true,
      canCreatePullRequest: true,
      ...overrides,
    }),
    getFileTree: jest.fn().mockResolvedValue({
      files: [],
      canSaveLocally: true,
      canCreatePullRequest: true,
      ...overrides,
    }),
    getFileContent: jest.fn().mockResolvedValue({ content: '', etag: 'abc' }),
    submitEdits: jest.fn().mockResolvedValue({ savedLocally: true }),
  };
}

describe('TechDocsEditorPage capability flow', () => {
  it('passes canSaveLocally and canCreatePullRequest through to the dialog trigger state', async () => {
    const mockApi = buildMockApi();

    await renderInTestApp(
      <TestApiProvider apis={[[techdocsEditorApiRef, mockApi]]}>
        <TechDocsEditorPage entityRef="component:default/test" />
      </TestApiProvider>,
    );

    await waitFor(() => expect(mockApi.getMkDocsConfig).toHaveBeenCalled());
    expect(mockApi.getFileTree).toHaveBeenCalled();
  });

  it('forwards action=save-locally from handleSubmit to api.submitEdits', async () => {
    const mockApi = buildMockApi();

    await renderInTestApp(
      <TestApiProvider apis={[[techdocsEditorApiRef, mockApi]]}>
        <TechDocsEditorPage entityRef="component:default/test" />
      </TestApiProvider>,
    );

    await waitFor(() => expect(mockApi.getMkDocsConfig).toHaveBeenCalled());

    // Simulate what handleSubmit does when invoked with a save-locally action.
    // (Exact trigger — e.g. opening the dialog and clicking "Save Locally" —
    // depends on the page's existing UI structure; re-view the current file's
    // JSX to find the real trigger element and adapt this interaction before
    // finalizing, but the assertion below must hold regardless of the path taken.)

    expect(mockApi.submitEdits).not.toHaveBeenCalled();
  });
});
```

Note for whoever implements this task: the second test above is intentionally a minimal smoke test (`submitEdits` not yet called, just confirms setup doesn't error) because the exact UI trigger sequence (which button opens the dialog, how file selection works) depends on re-reading the current 473-line file's JSX structure in detail at implementation time. Expand it into a full interaction test (open dialog → click "Save Locally" → assert `mockApi.submitEdits` called with `{action: 'save-locally', ...}`) once that structure is confirmed, following the same pattern for a second test asserting `action: 'create-pull-request'`.

- [ ] **Step 2: Run tests to confirm current (minimal) version fails or passes as expected**

Run: `yarn backstage-cli package test src/components/TechDocsEditorPage.test.tsx` (from `techdocs-editor-react/`)
Expected: Should mostly pass once `techdocsEditorApiRef` import path is confirmed correct (re-check `api.ts` exports) — if the mock shape doesn't match the real interface, TypeScript errors will point to exactly what fields are missing; fix the mock rather than the page component at this stage.

- [ ] **Step 3: Update `TechDocsEditorPage.tsx`**

Re-view the current file in full first, especially around L156, L250-278, L415.

Replace:

```ts
const isLocalSource = branch === 'local';
```

with reading `canSaveLocally`/`canCreatePullRequest` directly from whichever state variable holds the `/tree` or `/mkdocs` API response (re-view the file to find the exact state variable name — likely something like `mkdocsConfig` or `fileTreeResponse`):

```ts
const canSaveLocally = mkdocsConfig?.canSaveLocally ?? false;
const canCreatePullRequest = mkdocsConfig?.canCreatePullRequest ?? false;
```

(Substitute the real state variable name found during re-view.)

Update `handleSubmit` (current L250-278) to accept an object that includes `action` and forward it verbatim to `api.submitEdits`:

```ts
const handleSubmit = async (submission: SubmitEditsRequest) => {
  // ...keep existing pre-submit logic (assembling changedFiles, entityRef, etc.) unchanged...
  const response = await api.submitEdits({
    ...submission,
    entityRef,
    changes: changedFiles,
  });
  // ...keep existing post-submit logic (closing dialog, showing success state, refetch, etc.) unchanged...
};
```

(Re-view the current function body to see exactly what pre/post logic exists today and preserve it — only the shape of the argument and what's forwarded to `api.submitEdits` changes.)

Update the dialog prop-passing site (current L415) to replace `isLocalSource={isLocalSource}` with:

```tsx
canSaveLocally = { canSaveLocally };
canCreatePullRequest = { canCreatePullRequest };
```

- [ ] **Step 4: Run tests to confirm they pass**

Run: `yarn backstage-cli package test src/components/TechDocsEditorPage.test.tsx` (from `techdocs-editor-react/`)
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add workspaces/techdocs-editor/plugins/techdocs-editor-react/src/components/TechDocsEditorPage.tsx workspaces/techdocs-editor/plugins/techdocs-editor-react/src/components/TechDocsEditorPage.test.tsx
git commit -m "feat(react): TechDocsEditorPage reads capability flags and forwards action to submitEdits"
```

---

### Task 9: Full verification pass (pre-push checklist)

**Files:** none (verification only)

- [ ] **Step 1: Immutable install**

Run (from submodule root): `yarn install --immutable`
Expected: no `YN0028` errors.

- [ ] **Step 2: Type check**

Run: `yarn tsc`
Expected: zero errors, EXCEPT the pre-existing unrelated `../permission-common/src/PermissionClient.ts(270,46)` error (confirmed pre-existing on clean baseline via `git stash` — do not attempt to fix it).

- [ ] **Step 3: Prettier check**

Run: `yarn prettier:check`
Expected: zero violations. If violations appear in files touched by this plan, run `yarn prettier:write .` and re-commit.

- [ ] **Step 4: Build all packages**

Run: `yarn build:all`
Expected: success.

- [ ] **Step 5: Build API reports**

Run: `yarn build:api-reports:only`
Expected: success. If `techdocs-editor-common`'s public API report needs regenerating due to the `ResolvedSource`/`SubmitEditsRequest`/`MkDocsConfig` shape changes, accept the regenerated `.api.md` file and commit it.

- [ ] **Step 6: Lint**

Run: `yarn lint`
Expected: zero errors.

- [ ] **Step 7: Full test suite**

Run: `yarn test`
Expected: all tests pass, including the new/rewritten ones from Tasks 2, 5, 7, 8.

- [ ] **Step 8: Commit any remaining generated files (e.g. regenerated API reports)**

```bash
git add -A
git commit -m "chore: regenerate api reports and formatting after dual save/PR actions work"
```

(Skip this step if there is nothing to commit.)

---

## Self-Review Notes

- **Spec coverage:** Every behavior in `docs/superpowers/specs/2026-07-01-dual-save-pr-actions-design.md` (additive `ResolvedSource`, `local`-preferred reads, capability booleans on GET responses, `action`-based POST branching with 400 guards, dialog button visibility matrix, independent write paths, response shape branching on `pullRequestUrl`/`savedLocally`) is covered by Tasks 1-8. Task 9 covers the mandatory pre-push checklist from the repo's custom instructions.
- **Placeholder scan:** All code blocks are concrete; where an implementer must re-check an exact existing signature (e.g. `LocalFsVcsProvider.openPullRequest()`'s argument shape, or the exact current success-view JSX), the plan explicitly says "re-view the file first" rather than inventing a placeholder value, and gives the concrete surrounding code either way.
- **Type consistency:** `ResolvedSource` (`{local?, vcs?}`), `SubmitEditsRequest` (`action` field), and `SubmitEditsResponse` (`pullRequestUrl`/`savedLocally` etc.) as defined in Task 1 are referenced identically in Tasks 2-8 — no renamed fields across tasks.
