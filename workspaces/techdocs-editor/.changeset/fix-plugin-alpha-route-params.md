---
'@estehsaan/backstage-plugin-techdocs-editor': patch
---

Fix entity ref extraction to use `useParams` from react-router-dom instead of fragile `window.location.pathname` string parsing. This makes the editor page resilient to URL routing changes and server-side rendering.
