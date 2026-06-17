# TechDocs Editor Plugin — Developer Notes

This is a git submodule in the main Backstage monorepo, pointing to `github.com/Estehsan/backstage-techdoc-editor`.

## Packages

- `@estehsaan/backstage-plugin-techdocs-editor` — Frontend (NFS `/alpha` + classic)
- `@estehsaan/backstage-plugin-techdocs-editor-backend` — Backend (Express + VCS providers)
- `@estehsaan/backstage-plugin-techdocs-editor-react` — Shared React components + API client
- `@estehsaan/backstage-plugin-techdocs-editor-node` — Extension point for custom VCS providers
- `@estehsaan/backstage-plugin-techdocs-editor-common` — Shared types and permissions

## Development

```bash
# Install dependencies
yarn install

# Type check
yarn tsc

# Run tests
CI=1 yarn test <path>

# Lint
yarn lint

# Format
yarn prettier:write .
```

## Pre-Push Checklist (MANDATORY)

**Run every step below from the submodule root and confirm it passes before any `git push` or commit to an open PR. Do not skip steps. Fix failures before re-running from step 1.**

```bash
# 1. Immutable install — no YN0028 errors
yarn install --immutable

# 2. Type check — zero errors required
yarn tsc

# 3. Prettier check — zero violations required
yarn prettier:check

# 4. Build all packages
yarn build:all

# 5. Build API reports
yarn build:api-reports:only

# 6. Lint — zero errors required
yarn lint

# 7. Tests — must pass
yarn test
```

> **Iron law:** `git push` is forbidden until all seven steps produce zero errors.

## Architecture

The backend plugin (`techdocsEditorPlugin`) exposes REST endpoints for:

- Reading mkdocs.yml config
- Listing documentation files
- Reading file content (with ETag for conflict detection)
- Submitting edits as pull/merge requests

VCS providers (GitHub, GitLab) are registered via an extension point and implemented in the `techdocsEditorModuleDefaultProviders` backend module.

The frontend plugin provides:

- `TechDocsEditPageAddon` — classic TechDocs Subheader addon
- `techdocsEditorExtensionPage` — NFS standalone editor page
- `techdocsEditorAddonExtension` — NFS entity content tab

## Release

Releases are automated via semantic-release on push to `main`. The NPM token must be stored as `NPM_TOKEN` in the repository secrets.
