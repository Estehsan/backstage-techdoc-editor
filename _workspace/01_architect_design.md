# Plugin Architecture Design: `dir:` Annotation Support for TechDocs Editor

## Overview

Add full support for `dir:` type TechDocs annotations by implementing a local filesystem provider that reads/writes files directly on disk (no PR workflow). This enables the TechDocs editor to work end-to-end for local documentation sources.

## Packages Affected

- `@estehsaan/backstage-plugin-techdocs-editor-common`: Add new response type fields for local saves
- `@estehsaan/backstage-plugin-techdocs-editor-backend`: Modify `sourceResolver.ts` to handle `dir:` annotations, create `LocalFsVcsProvider`, update router for local workflow
- `@estehsaan/backstage-plugin-techdocs-editor-node`: **No changes** — `VcsProvider` interface remains unchanged
- `@estehsaan/backstage-plugin-techdocs-editor-react`: Update `SubmitEditsDialog` to handle local saves, update `TechDocsEditorPage` for local flow
- `@estehsaan/backstage-plugin-techdocs-editor`: **No changes** — frontend plugin wiring stays the same

---

## Common Types

### Changes to `types.ts`

```typescript
// Add to existing SubmitEditsResponse type — make PR fields optional
// and add new fields for local saves

/**
 * Successful response from POST /submissions
 * @public
 */
export type SubmitEditsResponse = {
  /** PR URL. Present only for VCS-based submissions, undefined for local saves. */
  pullRequestUrl?: string;
  /** PR number. Present only for VCS-based submissions, undefined for local saves. */
  pullRequestNumber?: number;
  /** Head branch name. Present only for VCS-based submissions, undefined for local saves. */
  headBranch?: string;
  /** Whether the files were saved directly to the local filesystem. */
  savedLocally?: boolean;
  /** Number of files saved locally. Present only when savedLocally is true. */
  savedCount?: number;
  /** Base path where files were saved. Present only when savedLocally is true. */
  savedPath?: string;
};

/**
 * Request body for POST /submissions/:namespace/:kind/:name
 * @public
 */
export type SubmitEditsRequest = {
  files: EditedFile[];
  commitMessage: string;
  /** PR title. Required for VCS submissions, ignored for local saves. */
  prTitle?: string;
  /** PR description. Used only for VCS submissions. */
  prDescription?: string;
  /** Open as draft PR. Used only for VCS submissions. */
  draft?: boolean;
  /** Override the base branch. Used only for VCS submissions. */
  baseBranch?: string;
};
```

### New type: `ResolvedSource`

Add to `types.ts` (or a new `source.ts`):

```typescript
/**
 * Resolved source location for a TechDocs entity.
 * Either a VCS URL or a local filesystem path.
 * @public
 */
export type ResolvedSource =
  | {
      type: 'vcs';
      /** Full repository URL, e.g. https://github.com/org/repo */
      repoUrl: string;
      /** Docs directory relative to repo root, e.g. "docs" */
      docsDir: string | undefined;
      /** Default branch name, e.g. "main" */
      defaultBranch: string | undefined;
    }
  | {
      type: 'local';
      /** Absolute path to the docs root directory on the local filesystem */
      basePath: string;
      /** Docs directory relative to basePath, e.g. "docs" */
      docsDir: string;
    };
```

---

## Extension Points (if applicable)

**No changes to extension point interface required.**

The existing `VcsProvider` interface already supports all operations needed:

- `canHandle(repoUrl)`: For local, we use a pseudo-URL like `file:///path/to/docs`
- `readFile()`: Read from local fs instead of remote API
- `listFiles()`: List local directory
- `getDefaultBranch()`: Return a sentinel value like `"local"`
- `openPullRequest()`: For local, write files directly and return a synthetic result

The `LocalFsVcsProvider` will implement `VcsProvider` and handle the `file://` URL scheme.

---

## Backend API Routes

### Modified Endpoints

| Method | Path                              | Changes                           | Notes                                                             |
| ------ | --------------------------------- | --------------------------------- | ----------------------------------------------------------------- |
| GET    | `/sources/:ns/:kind/:name/mkdocs` | Now handles `dir:` annotations    | Returns same shape; uses local fs when applicable                 |
| GET    | `/sources/:ns/:kind/:name/tree`   | Now handles `dir:` annotations    | Same response shape                                               |
| GET    | `/sources/:ns/:kind/:name/file`   | Now handles `dir:` annotations    | Same response shape                                               |
| POST   | `/submissions/:ns/:kind/:name`    | Returns different shape for local | `prTitle` becomes optional; response includes `savedLocally` flag |

### Request/Response Changes

**POST /submissions** — Request:

- `prTitle` becomes optional (ignored for local saves)
- `prDescription`, `draft`, `baseBranch` ignored for local saves

**POST /submissions** — Response for local save:

```json
{
  "savedLocally": true,
  "savedCount": 3,
  "savedPath": "/path/to/entity/docs"
}
```

**POST /submissions** — Response for VCS (unchanged):

```json
{
  "pullRequestUrl": "https://github.com/org/repo/pull/42",
  "pullRequestNumber": 42,
  "headBranch": "techdocs-editor/user/12345-abc"
}
```

---

## Backend Implementation Design

### 1. `sourceResolver.ts` — Extend to handle `dir:`

The current `resolveSourceUrl` function throws for `dir:` annotations. We need to:

1. Detect `dir:` annotation type
2. Resolve the relative path to an absolute filesystem path
3. Return a `ResolvedSource` discriminated union

**Resolution logic for `dir:` paths:**

```typescript
// dir: annotation resolution priority:
// 1. If entity has 'backstage.io/source-location' annotation → use that as base
// 2. If entity has 'backstage.io/managed-by-location' annotation → parse and use
// 3. Fall back to cwd (Backstage working directory)

// Example: dir:. with source-location: file:///repo/services/my-service
// → basePath = /repo/services/my-service
// → docsDir = docs (from mkdocs.yml or default)
// → Full path = /repo/services/my-service/docs

// Example: dir:./custom-docs
// → Full path = /repo/services/my-service/custom-docs
```

**New function signature:**

```typescript
export async function resolveSource(
  entity: Entity,
  scmIntegrations: ScmIntegrationRegistry,
  reader: UrlReaderService,
  config: Config,
): Promise<ResolvedSource> {
  // ... implementation
}
```

**Security: Path traversal prevention:**

```typescript
function assertSafeLocalPath(basePath: string, workingDir: string): void {
  const normalizedBase = path.normalize(path.resolve(workingDir, basePath));
  const normalizedWork = path.normalize(workingDir);

  if (
    !normalizedBase.startsWith(normalizedWork + path.sep) &&
    normalizedBase !== normalizedWork
  ) {
    throw new InputError(
      `Path '${basePath}' resolves outside the Backstage working directory. ` +
        `This may be a path traversal attempt.`,
    );
  }
}
```

### 2. `LocalFsVcsProvider.ts` — New provider

```typescript
import { promises as fs } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {
  VcsProvider,
  OpenPrOptions,
  OpenPrResult,
  VcsFileResult,
} from '@estehsaan/backstage-plugin-techdocs-editor-node';
import { NotFoundError } from '@backstage/errors';

/**
 * VcsProvider implementation for local filesystem documentation.
 * Handles file:// URLs and writes changes directly to disk.
 * @internal
 */
export class LocalFsVcsProvider implements VcsProvider {
  readonly id = 'local-fs';

  canHandle(repoUrl: string): boolean {
    return repoUrl.startsWith('file://');
  }

  async getDefaultBranch(_repoUrl: string): Promise<string> {
    // Local files have no branch concept; return sentinel
    return 'local';
  }

  async readFile(opts: {
    repoUrl: string;
    ref: string;
    filePath: string;
  }): Promise<VcsFileResult> {
    const basePath = this.urlToPath(opts.repoUrl);
    const fullPath = path.join(basePath, opts.filePath);

    // Security check
    this.assertWithinBase(fullPath, basePath);

    try {
      const content = await fs.readFile(fullPath, 'utf-8');
      const stat = await fs.stat(fullPath);
      // Use mtime + size as etag for conflict detection
      const etag = crypto
        .createHash('sha256')
        .update(`${stat.mtimeMs}-${stat.size}`)
        .digest('hex')
        .slice(0, 16);
      return { content, etag };
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        throw new NotFoundError(`File not found: ${opts.filePath}`);
      }
      throw err;
    }
  }

  async listFiles(opts: {
    repoUrl: string;
    ref: string;
    dirPath: string;
  }): Promise<string[]> {
    const basePath = this.urlToPath(opts.repoUrl);
    const fullDir = path.join(basePath, opts.dirPath);

    this.assertWithinBase(fullDir, basePath);

    const files: string[] = [];
    await this.walkDir(fullDir, opts.dirPath, files);
    return files.sort();
  }

  async openPullRequest(opts: OpenPrOptions): Promise<OpenPrResult> {
    const basePath = this.urlToPath(opts.repoUrl);

    // Write each file directly to disk
    let savedCount = 0;
    for (const [filePath, content] of opts.files) {
      const fullPath = path.join(basePath, filePath);
      this.assertWithinBase(fullPath, basePath);

      if (content === null) {
        // Delete file
        await fs.unlink(fullPath).catch(() => {});
      } else {
        // Ensure parent directory exists
        await fs.mkdir(path.dirname(fullPath), { recursive: true });
        await fs.writeFile(fullPath, content, 'utf-8');
      }
      savedCount++;
    }

    // Return synthetic result — no actual PR
    return {
      url: '', // Frontend will check savedLocally flag instead
      number: savedCount, // Repurpose for count
    };
  }

  private urlToPath(fileUrl: string): string {
    // file:///path/to/docs → /path/to/docs
    return decodeURIComponent(fileUrl.replace(/^file:\/\//, ''));
  }

  private assertWithinBase(targetPath: string, basePath: string): void {
    const resolved = path.resolve(targetPath);
    const resolvedBase = path.resolve(basePath);
    if (
      !resolved.startsWith(resolvedBase + path.sep) &&
      resolved !== resolvedBase
    ) {
      throw new InputError(
        `Path '${targetPath}' is outside the allowed base path.`,
      );
    }
  }

  private async walkDir(
    dirPath: string,
    relativePath: string,
    files: string[],
  ): Promise<void> {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const relPath = path.join(relativePath, entry.name);
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        await this.walkDir(fullPath, relPath, files);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        // Return path relative to docsDir
        files.push(relPath.split(path.sep).slice(1).join('/'));
      }
    }
  }
}
```

### 3. `router.ts` — Update submission endpoint

```typescript
// In POST /submissions handler:

const source = await resolveSource(entity, scmIntegrations, reader, config);

if (source.type === 'local') {
  // Local filesystem flow — no PR, just write files
  const basePath = source.basePath;
  const docsDir = source.docsDir;

  // Validate paths and write files
  for (const file of body.files) {
    assertSafeDocPath(file.path);
    const fullPath = path.join(basePath, docsDir, file.path);
    // Security check
    assertWithinBase(fullPath, basePath);

    if (file.content === null) {
      await fs.unlink(fullPath).catch(() => {});
    } else {
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      await fs.writeFile(fullPath, file.content, 'utf-8');
    }
  }

  logger.info(
    `TechDocs editor: saved ${body.files.length} files locally for ${stringifyEntityRef(entity)} at ${path.join(basePath, docsDir)}`,
  );

  res.json({
    savedLocally: true,
    savedCount: body.files.length,
    savedPath: path.join(basePath, docsDir),
  });
  return;
}

// Existing VCS flow continues below...
```

### 4. Register `LocalFsVcsProvider` in `module.ts`

```typescript
export const techdocsEditorModuleDefaultProviders = createBackendModule({
  pluginId: 'techdocs-editor',
  moduleId: 'default-providers',
  register(env) {
    env.registerInit({
      deps: {
        config: coreServices.rootConfig,
        vcs: techdocsEditorVcsProviderExtensionPoint,
      },
      async init({ config, vcs }) {
        vcs.addProvider(new GitHubVcsProvider(config));
        vcs.addProvider(new GitLabVcsProvider(config));
        vcs.addProvider(new LocalFsVcsProvider()); // NEW
      },
    });
  },
});
```

---

## Frontend API Client

### Changes to `api.ts`

No interface changes needed — `SubmitEditsResponse` already covers the new fields.

The `TechDocsEditorClient.submitEdits()` method returns whatever the backend sends, so the discriminated union response works automatically.

---

## Frontend Component Changes

### 1. `SubmitEditsDialog.tsx`

Add a new prop and conditional rendering:

```typescript
export type SubmitEditsDialogProps = {
  open: boolean;
  changedFiles: EditedFile[];
  onClose: () => void;
  onSubmit: (opts: {
    prTitle: string;
    prDescription: string;
    commitMessage: string;
    draft: boolean;
  }) => Promise<void>;
  defaultPrTitle?: string;
  /** If true, hide PR fields and show local save UI */
  isLocalSource?: boolean; // NEW
};
```

**Conditional rendering:**

```tsx
// If isLocalSource, show simplified UI without PR fields
{!isLocalSource && (
  <>
    <TextField label="Pull Request Title" ... />
    <TextField label="Description (optional)" ... />
    <FormControlLabel ... label="Open as draft pull request" />
  </>
)}

{isLocalSource && (
  <Typography variant="body2" color="textSecondary">
    These changes will be saved directly to the local filesystem.
    No pull request will be created.
  </Typography>
)}

// Button text changes
<Button ...>
  {loading
    ? 'Saving…'
    : isLocalSource
      ? 'Save to Disk'
      : 'Open Pull Request'}
</Button>
```

**Success state:**

```tsx
// After successful submission
if (savedLocally) {
  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>Files Saved</DialogTitle>
      <DialogContent>
        <Typography gutterBottom>
          {savedCount} file{savedCount !== 1 ? 's' : ''} saved to disk.
        </Typography>
        <Typography variant="caption" color="textSecondary">
          {savedPath}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
```

### 2. `TechDocsEditorPage.tsx`

Need to detect local source and pass to dialog:

```typescript
// Add state
const [isLocalSource, setIsLocalSource] = useState(false);

// In useEffect that loads mkdocs config, also check annotation
useEffect(() => {
  // After loading config, check if it's a local source
  // Option 1: Add an endpoint that returns source type
  // Option 2: Check entity annotation directly
  // For simplicity, we'll add a field to the /tree response
}, [...]);

// Pass to dialog
<SubmitEditsDialog
  open={submitOpen}
  changedFiles={...}
  onClose={...}
  onSubmit={handleSubmit}
  defaultPrTitle={...}
  isLocalSource={isLocalSource}  // NEW
/>
```

**Handle submit response:**

```typescript
const handleSubmit = async opts => {
  const files: EditedFile[] = Array.from(editedFiles.values());
  const result = await api.submitEdits(entityRef, {
    files,
    prTitle: opts.prTitle, // Will be ignored for local
    prDescription: opts.prDescription,
    commitMessage: opts.commitMessage,
    draft: opts.draft,
  });

  setEditedFiles(new Map());
  setSubmitOpen(false);

  // Different behavior based on response
  if (result.savedLocally) {
    // Show success notification (no new window)
    // The dialog handles showing "Files Saved" state
  } else if (result.pullRequestUrl) {
    window.open(result.pullRequestUrl, '_blank', 'noopener,noreferrer');
  }
};
```

### 3. Backend Response — Add `isLocalSource` to `/tree`

To let the frontend know whether it's dealing with local docs:

```typescript
// In router.ts GET /tree handler:
res.json({
  files,
  docsDir: resolvedDocsDir,
  branch,
  isLocalSource: source.type === 'local', // NEW
});
```

---

## Implementation Order

1. **`techdocs-editor-common`**: Update `SubmitEditsResponse` and `SubmitEditsRequest` types
2. **`techdocs-editor-backend`**:
   a. Create `LocalFsVcsProvider.ts`
   b. Update `sourceResolver.ts` to return `ResolvedSource` discriminated union
   c. Update `router.ts` to handle local saves in POST `/submissions`
   d. Update `router.ts` GET `/tree` to include `isLocalSource` flag
   e. Register `LocalFsVcsProvider` in `module.ts`
3. **`techdocs-editor-react`**:
   a. Update `SubmitEditsDialog.tsx` with `isLocalSource` prop and conditional UI
   b. Update `TechDocsEditorPage.tsx` to detect local source and handle response
4. **`techdocs-editor`**: No changes needed

---

## Changeset Plan

- `@estehsaan/backstage-plugin-techdocs-editor-common`: **patch** — Add optional fields to `SubmitEditsResponse` for local filesystem saves; make `prTitle` optional in `SubmitEditsRequest`
- `@estehsaan/backstage-plugin-techdocs-editor-backend`: **minor** — Add support for `dir:` TechDocs annotations via local filesystem provider; saves go directly to disk without creating PRs
- `@estehsaan/backstage-plugin-techdocs-editor-react`: **patch** — Update submit dialog to show simplified UI for local docs; display "Files Saved" instead of "PR Opened" for local saves
- `@estehsaan/backstage-plugin-techdocs-editor`: No changeset needed (no changes)

---

## Security Considerations

### Path Traversal Prevention

1. **In `sourceResolver.ts`**: Validate that resolved `dir:` path stays within Backstage working directory
2. **In `LocalFsVcsProvider`**: Double-check all file operations stay within the resolved base path
3. **In `router.ts`**: Existing `assertSafeDocPath()` already validates file paths from client

### Implementation:

```typescript
// Security utility function
function assertPathWithinRoot(
  targetPath: string,
  rootPath: string,
  label: string,
): void {
  const normalizedTarget = path.normalize(path.resolve(targetPath));
  const normalizedRoot = path.normalize(path.resolve(rootPath));

  if (
    !normalizedTarget.startsWith(normalizedRoot + path.sep) &&
    normalizedTarget !== normalizedRoot
  ) {
    throw new InputError(
      `Invalid ${label}: path '${targetPath}' is outside the allowed root '${rootPath}'`,
    );
  }
}
```

### File Type Restrictions

The `listFiles` method already filters to `.md` files. Consider whether to allow other file types (images, etc.) for future enhancements.

---

## Configuration

No new app-config schema required. The existing `backend.workingDirectory` config is used as the fallback root for path resolution.

Optional future config:

```yaml
techdocsEditor:
  # Allow local file editing (default: true when dir: annotations exist)
  allowLocalEdits: true
  # Restrict local edits to specific paths
  localEditPaths:
    - /docs
    - /services/*/docs
```

---

## Testing Strategy

### Unit Tests

1. **`sourceResolver.test.ts`**:
   - Test `dir:.` resolution with various annotations
   - Test path traversal prevention (e.g., `dir:../../etc`)
   - Test fallback to working directory

2. **`LocalFsVcsProvider.test.ts`**:
   - Test `readFile` with existing file
   - Test `readFile` with missing file (NotFoundError)
   - Test `listFiles` recursive directory walk
   - Test `openPullRequest` writes files
   - Test path traversal prevention in all methods

3. **`router.test.ts`**:
   - Test POST `/submissions` with local source
   - Test conflict detection for local files (etag mismatch)

### Integration Tests

- Test full flow: entity with `dir:.` → load tree → edit file → submit → verify file on disk

---

## Open Questions

_None — design is complete and all requirements are addressed._

---

## Diagram: Data Flow for Local Saves

```
┌─────────────────┐     POST /submissions      ┌──────────────────────┐
│   Frontend      │ ─────────────────────────► │   Backend Router     │
│   Editor Page   │    { files, commitMsg }    │                      │
└─────────────────┘                            └──────────┬───────────┘
                                                          │
                                                          ▼
                                               ┌──────────────────────┐
                                               │   sourceResolver     │
                                               │   resolveSource()    │
                                               └──────────┬───────────┘
                                                          │
                                              ┌───────────┴───────────┐
                                              │                       │
                                              ▼                       ▼
                                    ┌─────────────────┐     ┌─────────────────┐
                                    │  type: 'vcs'    │     │  type: 'local'  │
                                    │  (GitHub/Lab)   │     │  (filesystem)   │
                                    └────────┬────────┘     └────────┬────────┘
                                             │                       │
                                             ▼                       ▼
                                    ┌─────────────────┐     ┌─────────────────┐
                                    │  VcsProvider    │     │  fs.writeFile   │
                                    │  .openPR()      │     │  (direct)       │
                                    └────────┬────────┘     └────────┬────────┘
                                             │                       │
                                             ▼                       ▼
                                    ┌─────────────────┐     ┌─────────────────┐
                                    │ pullRequestUrl  │     │ savedLocally:   │
                                    │ pullRequestNum  │     │ true, count: N  │
                                    └─────────────────┘     └─────────────────┘
```
