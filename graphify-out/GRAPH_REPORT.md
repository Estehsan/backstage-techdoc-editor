# Graph Report - plugins/backstage-plugin-techdocs-editor  (2026-06-03)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 543 nodes · 610 edges · 49 communities (39 shown, 10 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c8244d18`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 20 edges
2. `scripts` - 13 edges
3. `GitHubVcsProvider` - 10 edges
4. `GitLabVcsProvider` - 10 edges
5. `TechDocsEditorClient` - 10 edges
6. `scripts` - 8 edges
7. `scripts` - 8 edges
8. `scripts` - 8 edges
9. `scripts` - 8 edges
10. `resolutions` - 7 edges

## Surprising Connections (you probably didn't know these)
- `TechDocsEditorPage()` --calls--> `useTechDocsEditorApi()`  [EXTRACTED]
  workspaces/techdocs-editor/plugins/techdocs-editor-react/src/components/TechDocsEditorPage.tsx → workspaces/techdocs-editor/plugins/techdocs-editor-react/src/api.ts

## Import Cycles
- None detected.

## Communities (49 total, 10 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.05
Nodes (44): alpha, default, types, backstage, pluginId, pluginPackages, role, configSchema (+36 more)

### Community 1 - "Community 1"
Cohesion: 0.06
Nodes (37): backstage, pluginId, pluginPackages, role, default, description, ., ./package.json (+29 more)

### Community 2 - "Community 2"
Cohesion: 0.06
Nodes (36): backstage, pluginId, pluginPackages, role, default, dependencies, @backstage/plugin-permission-common, description (+28 more)

### Community 3 - "Community 3"
Cohesion: 0.06
Nodes (36): backstage, pluginId, pluginPackages, role, default, dependencies, @backstage/backend-plugin-api, @estehsaan/backstage-plugin-techdocs-editor-common (+28 more)

### Community 4 - "Community 4"
Cohesion: 0.11
Nodes (22): SubmitEditsDialog(), SubmitEditsDialogProps, useStyles, TechDocsEditorPage(), TechDocsEditorPageProps, useStyles, collectPaths(), NewPageDialog() (+14 more)

### Community 5 - "Community 5"
Cohesion: 0.06
Nodes (34): devDependencies, @backstage/cli, @backstage/cli-defaults, @backstage/repo-tools, @commitlint/cli, @commitlint/config-conventional, husky, jest (+26 more)

### Community 6 - "Community 6"
Cohesion: 0.14
Nodes (5): GitHubVcsProvider, OctokitWithPR, GitLabVcsProvider, techdocsEditorModuleDefaultProviders, techdocsEditorPlugin

### Community 7 - "Community 7"
Cohesion: 0.09
Nodes (22): compilerOptions, allowSyntheticDefaultImports, declaration, declarationMap, emitDecoratorMetadata, esModuleInterop, experimentalDecorators, forceConsistentCasingInFileNames (+14 more)

### Community 8 - "Community 8"
Cohesion: 0.10
Nodes (19): typescript, engines, node, private, build:all, prettier:check, prettier:write, tsc (+11 more)

### Community 9 - "Community 9"
Cohesion: 0.11
Nodes (18): dependencies, @backstage/backend-plugin-api, @backstage/catalog-client, @backstage/catalog-model, @backstage/config, @backstage/errors, @backstage/integration, @backstage/plugin-permission-common (+10 more)

### Community 10 - "Community 10"
Cohesion: 0.20
Nodes (6): TechDocsEditPageAddon, techdocsEditorAddonExtension, techdocsEditorAlphaPlugin, techdocsEditorApiExtension, techdocsEditorExtensionPage, editorRouteRef

### Community 11 - "Community 11"
Cohesion: 0.22
Nodes (6): createRouter(), RouterOptions, assertSafeDocsDir(), resolveFromSlug(), resolveSourceUrl(), VcsProviderRegistry

### Community 12 - "Community 12"
Cohesion: 0.25
Nodes (11): techdocsEditorReadPermission, techdocsEditorWritePermission, DocFile, DocTree, DocTreeNode, EditedFile, FileConflict, MkDocsConfig (+3 more)

### Community 13 - "Community 13"
Cohesion: 0.15
Nodes (13): scripts, build:all, build:api-reports, build:api-reports:only, clean, fix, lint, new (+5 more)

### Community 14 - "Community 14"
Cohesion: 0.17
Nodes (12): dependencies, @backstage/catalog-model, @backstage/core-plugin-api, @backstage/frontend-plugin-api, @backstage/plugin-catalog-react, @backstage/plugin-techdocs-common, @backstage/plugin-techdocs-react, @estehsaan/backstage-plugin-techdocs-editor-common (+4 more)

### Community 15 - "Community 15"
Cohesion: 0.18
Nodes (11): dependencies, @backstage/catalog-model, @backstage/core-components, @backstage/core-plugin-api, @backstage/plugin-catalog-react, @backstage/plugin-techdocs-common, @estehsaan/backstage-plugin-techdocs-editor-common, @material-ui/core (+3 more)

### Community 16 - "Community 16"
Cohesion: 0.20
Nodes (9): access, baseBranch, changelog, commit, fixed, ignore, linked, $schema (+1 more)

### Community 17 - "Community 17"
Cohesion: 0.24
Nodes (10): default, types, default, ., ./alpha, ./package.json, publishConfig, access (+2 more)

### Community 18 - "Community 18"
Cohesion: 0.20
Nodes (9): description, files, homepage, keywords, license, main, sideEffects, name (+1 more)

### Community 19 - "Community 19"
Cohesion: 0.20
Nodes (10): @backstage/cli, @backstage/core-app-api, @backstage/test-utils, react-router-dom, @testing-library/jest-dom, @testing-library/react, @testing-library/user-event, devDependencies (+2 more)

### Community 20 - "Community 20"
Cohesion: 0.20
Nodes (10): devDependencies, @backstage/cli, @backstage/core-app-api, @backstage/test-utils, react, react-dom, react-router-dom, @testing-library/jest-dom (+2 more)

### Community 21 - "Community 21"
Cohesion: 0.22
Nodes (8): Backend, Features, Frontend (Classic), Frontend (New Frontend System), Installation, License, Packages, TechDocs Editor — Backstage Plugin Suite

### Community 22 - "Community 22"
Cohesion: 0.39
Nodes (6): techdocsEditorVcsProviderExtensionPoint, OpenPrOptions, OpenPrResult, VcsFileResult, VcsProvider, VcsProviderExtensionPoint

### Community 23 - "Community 23"
Cohesion: 0.25
Nodes (7): arrowParens, bracketSpacing, overrides, printWidth, semi, singleQuote, trailingComma

### Community 24 - "Community 24"
Cohesion: 0.25
Nodes (8): build, postpack, prepack, start, scripts, clean, lint, test

### Community 25 - "Community 25"
Cohesion: 0.29
Nodes (6): compilerOptions, outDir, rootDir, exclude, extends, include

### Community 26 - "Community 26"
Cohesion: 0.33
Nodes (5): Architecture, Development, Packages, Release, TechDocs Editor Plugin — Developer Notes

### Community 27 - "Community 27"
Cohesion: 0.50
Nodes (3): 1.0.0 (2026-06-01), Bug Fixes, Features

### Community 28 - "Community 28"
Cohesion: 0.50
Nodes (3): branches, plugins, tagFormat

### Community 29 - "Community 29"
Cohesion: 0.50
Nodes (4): backstage, pluginId, pluginPackages, role

### Community 30 - "Community 30"
Cohesion: 0.50
Nodes (4): peerDependencies, react, react-dom, react-router-dom

### Community 31 - "Community 31"
Cohesion: 0.50
Nodes (4): repository, directory, type, url

## Knowledge Gaps
- **325 isolated node(s):** `printWidth`, `semi`, `singleQuote`, `trailingComma`, `bracketSpacing` (+320 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `Community 9` to `Community 0`?**
  _High betweenness centrality (0.006) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Community 14` to `Community 18`?**
  _High betweenness centrality (0.004) - this node is a cross-community bridge._
- **What connects `printWidth`, `semi`, `singleQuote` to the rest of the system?**
  _325 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.04734299516908213 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.0553306342780027 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.05689900426742532 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.05689900426742532 - nodes in this community are weakly interconnected._