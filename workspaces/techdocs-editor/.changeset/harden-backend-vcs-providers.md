---
'@estehsaan/backstage-plugin-techdocs-editor-backend': patch
---

Harden backend reliability and security: validate GitHub credentials exist before creating Octokit (instead of silently making unauthenticated requests); validate GitHub file SHA before using it as an ETag; improve GitLab 404 detection to check `err.status` in addition to error message strings; only swallow `NotFoundError` when `mkdocs.yml` is missing (previously all errors were silently ignored, hiding network/auth failures).
