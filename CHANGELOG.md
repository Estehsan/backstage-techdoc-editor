## [2.0.1](https://github.com/Estehsan/backstage-techdoc-editor/compare/techdocs-editor-v2.0.0...techdocs-editor-v2.0.1) (2026-07-29)


### Bug Fixes

* **techdocs-editor:** raise submission body limit and polish PR-submit UI ([b0619e0](https://github.com/Estehsan/backstage-techdoc-editor/commit/b0619e04fe68271dfa6d0c0827e2fbd2fb0f127a))

# [2.0.0](https://github.com/Estehsan/backstage-techdoc-editor/compare/techdocs-editor-v1.4.0...techdocs-editor-v2.0.0) (2026-07-20)


### Features

* **techdocs-editor:** add media file support and fix image preview bugs ([#21](https://github.com/Estehsan/backstage-techdoc-editor/issues/21)) ([968cc86](https://github.com/Estehsan/backstage-techdoc-editor/commit/968cc860d9cb9ed5a370ccf8b1ae111b27d4ef3c))


### BREAKING CHANGES

* **techdocs-editor:** OpenPrOptions.files in techdocs-editor-node now maps to
VcsWriteFile | null instead of string | null, to carry encoding/mimeType
metadata needed for binary media files. Custom VcsProvider implementers
must update their file-writing logic accordingly.

Signed-off-by: Estehsan <estehsaan@gmail.com>

# [1.4.0](https://github.com/Estehsan/backstage-techdoc-editor/compare/techdocs-editor-v1.3.0...techdocs-editor-v1.4.0) (2026-07-08)


### Bug Fixes

* **ci:** fix prettier formatting in 3 files ([d46e6c6](https://github.com/Estehsan/backstage-techdoc-editor/commit/d46e6c6669b67c2fee361113d29dbc326b12fe81))
* **ci:** use npm semver for @backstage/ui, remove monorepo jest mapper ([fe994ce](https://github.com/Estehsan/backstage-techdoc-editor/commit/fe994ce1765919e70ab5a42aff3f67dcac5e95cf))
* improve VCS provider setup guidance and docs ([#17](https://github.com/Estehsan/backstage-techdoc-editor/issues/17)) ([2df297c](https://github.com/Estehsan/backstage-techdoc-editor/commit/2df297c1cb833d240f8e9ac80ad339d89929a39b))
* **techdocs-editor:** QA fixes and changeset for MUI→BUI migration ([da89930](https://github.com/Estehsan/backstage-techdoc-editor/commit/da899306d3535a0f5cfa63d816209024c38d4a15))


### Features

* **techdocs-editor-react:** migrate UI components to @backstage/ui and CSS modules ([59451a1](https://github.com/Estehsan/backstage-techdoc-editor/commit/59451a1a4f2cc633a98331b1aae187eaaadc1232))
* **techdocs-editor:** add Changes drawer with GitHub-style diff history ([a70270f](https://github.com/Estehsan/backstage-techdoc-editor/commit/a70270f2b3ad79c5c186a988e9003eda91d2db25))
* **techdocs-editor:** fix dir: annotation on remote entities + add diff preview ([#18](https://github.com/Estehsan/backstage-techdoc-editor/issues/18)) ([d83e973](https://github.com/Estehsan/backstage-techdoc-editor/commit/d83e973b4d3bcca7b3270dbc89ddd59b05e6162d))
* **techdocs-editor:** migrate TechDocsEditorPage and EditPageAddon to @backstage/ui ([ec0804a](https://github.com/Estehsan/backstage-techdoc-editor/commit/ec0804ab38dac0475eed8e1a133ebff48d48e52c))

# [1.3.0](https://github.com/Estehsan/backstage-techdoc-editor/compare/techdocs-editor-v1.2.4...techdocs-editor-v1.3.0) (2026-07-02)


### Bug Fixes

* **frontend:** prevent duplicate React module trees in host app ([8269a17](https://github.com/Estehsan/backstage-techdoc-editor/commit/8269a17b7f1bc909795e28c764c7583ea972a414))
* **tests:** use module-resolved react jsx-runtime mocks ([da779bc](https://github.com/Estehsan/backstage-techdoc-editor/commit/da779bc0b95bba824f2b3aaa62b740ab91bc029f))


### Features

* **backend:** GET endpoints expose canSaveLocally/canCreatePullRequest ([aa5f35c](https://github.com/Estehsan/backstage-techdoc-editor/commit/aa5f35c995d50e43bc13de179994346d686aa5c7))
* **backend:** POST /submissions branches on action with capability guards ([563e845](https://github.com/Estehsan/backstage-techdoc-editor/commit/563e845a1b7ff989ae892f13d5add7b2d399cc4b))
* **backend:** resolveSource returns additive local+vcs shape ([581a687](https://github.com/Estehsan/backstage-techdoc-editor/commit/581a687e2723563bf820e037b9650ce2347b56a5))
* **common:** additive ResolvedSource + action-based SubmitEditsRequest ([18bde67](https://github.com/Estehsan/backstage-techdoc-editor/commit/18bde678848677ae7f1ee976d365a6151956c211))
* **react:** api client exposes canSaveLocally/canCreatePullRequest and action field ([1b441c6](https://github.com/Estehsan/backstage-techdoc-editor/commit/1b441c68edf4091dc6275d6023685d9e2b1c5fd8))
* **react:** SubmitEditsDialog renders independent Save Locally / PR actions ([5114625](https://github.com/Estehsan/backstage-techdoc-editor/commit/5114625e08f2a6394d734a90365e0371f71b331a))
* **react:** TechDocsEditorPage wires real capability flags and action-aware submit ([8d2383c](https://github.com/Estehsan/backstage-techdoc-editor/commit/8d2383c8486e52f7f9c5cd47a7aba593d6765c6d))

## [1.2.4](https://github.com/Estehsan/backstage-techdoc-editor/compare/techdocs-editor-v1.2.3...techdocs-editor-v1.2.4) (2026-07-01)


### Bug Fixes

* **techdocs-editor-backend:** centralize docsDir resolution across local and VCS sources ([ab41d00](https://github.com/Estehsan/backstage-techdoc-editor/commit/ab41d000345da88e074a3b7584e84314fb3b7c46))
* **techdocs-editor-backend:** exclude node_modules from doc file listings ([3ef3d1d](https://github.com/Estehsan/backstage-techdoc-editor/commit/3ef3d1d26f863bdbcbac95189fd26b3f369c290c))

## [1.2.3](https://github.com/Estehsan/backstage-techdoc-editor/compare/techdocs-editor-v1.2.2...techdocs-editor-v1.2.3) (2026-06-30)


### Bug Fixes

* **techdocs-editor-backend:** allow @ in doc path validation ([c58d3e8](https://github.com/Estehsan/backstage-techdoc-editor/commit/c58d3e8f9ddee857f4506ac57db9e6b9bdcb8cfe))


### Performance Improvements

* **techdocs-editor-react:** avoid per-keystroke re-renders in editor ([dd21bff](https://github.com/Estehsan/backstage-techdoc-editor/commit/dd21bff5c712722aee7234318d8af8b566080b00))

## [1.2.2](https://github.com/Estehsan/backstage-techdoc-editor/compare/techdocs-editor-v1.2.1...techdocs-editor-v1.2.2) (2026-06-18)


### Bug Fixes

* **techdocs-editor:** resolve empty local docs tree ([6c54500](https://github.com/Estehsan/backstage-techdoc-editor/commit/6c5450094f5387144c59b78836524220e14ce368))

## [1.2.1](https://github.com/Estehsan/backstage-techdoc-editor/compare/techdocs-editor-v1.2.0...techdocs-editor-v1.2.1) (2026-06-17)


### Bug Fixes

* add react-router-dom to root devDependencies to fix CI test resolution ([aa5a2d0](https://github.com/Estehsan/backstage-techdoc-editor/commit/aa5a2d0133cb62249196b3978b0a10a578b08491))
* align frontend dependency generations ([6d294dd](https://github.com/Estehsan/backstage-techdoc-editor/commit/6d294dd8b754ac58808d499cc5fad4cde33ddb41))
* fall back to LocalFsVcsProvider for file:// URLs when not in registry ([989fd7b](https://github.com/Estehsan/backstage-techdoc-editor/commit/989fd7b30b142e63205a8ac252c84c1d048642cd))
* remove problematic jest moduleNameMapper for react modules ([d4f9ef6](https://github.com/Estehsan/backstage-techdoc-editor/commit/d4f9ef69aa130453690409c83d794b4855531b00))
* update dependencies for React and TypeScript compatibility 🎉🔧 ([67b3cc2](https://github.com/Estehsan/backstage-techdoc-editor/commit/67b3cc2058d4d75c5779e90fa519c57a79d67637))
* update lockfile and fix lint in dependency alignment test ([feb09b4](https://github.com/Estehsan/backstage-techdoc-editor/commit/feb09b41cd0516e6bea828ef60bf2c3ddec4b717))

# [1.2.0](https://github.com/Estehsan/backstage-techdoc-editor/compare/techdocs-editor-v1.1.0...techdocs-editor-v1.2.0) (2026-06-15)


### Bug Fixes

* resolve API report warnings for classic frontend plugin ([5e19b59](https://github.com/Estehsan/backstage-techdoc-editor/commit/5e19b59da2936383a246251ac6adb1c249ecd103))


### Features

* add isLocalSource type and fix test environment for classic plugin ([876f7ef](https://github.com/Estehsan/backstage-techdoc-editor/commit/876f7ef45b23b186cc2b9bd891dd607a2a7bf308))
* implement classic TechDocs editor with routing and entity support 🎉 ([db8bed8](https://github.com/Estehsan/backstage-techdoc-editor/commit/db8bed8824b8a72e1f6623c5cccfa62cca0320cc))

# [1.1.0](https://github.com/Estehsan/backstage-techdoc-editor/compare/techdocs-editor-v1.0.4...techdocs-editor-v1.1.0) (2026-06-06)


### Bug Fixes

* replace @material-ui/lab Alert with Snackbar message prop ([72fab33](https://github.com/Estehsan/backstage-techdoc-editor/commit/72fab335d2286b9eb70381d83e9676c9adb2ffcc))


### Features

* add local filesystem support for dir: techdocs annotations ([f28ad1c](https://github.com/Estehsan/backstage-techdoc-editor/commit/f28ad1c6c3ae7532a089a92b1cb3b6d50406ec5c))

## [1.0.4](https://github.com/Estehsan/backstage-techdoc-editor/compare/techdocs-editor-v1.0.3...techdocs-editor-v1.0.4) (2026-06-05)


### Bug Fixes

* publish updated READMEs and bug fixes missed by v1.0.3 ([44b8f4d](https://github.com/Estehsan/backstage-techdoc-editor/commit/44b8f4d7ed4e41d6be19e01b41be2eca5e36dc55))

## [1.0.3](https://github.com/Estehsan/backstage-techdoc-editor/compare/techdocs-editor-v1.0.2...techdocs-editor-v1.0.3) (2026-06-04)


### Bug Fixes

* **metadata:** enrich npm package details for all techdocs packages ([a626735](https://github.com/Estehsan/backstage-techdoc-editor/commit/a626735c5783a21ffe121643aac2bc6f0091a601))

## [1.0.2](https://github.com/Estehsan/backstage-techdoc-editor/compare/techdocs-editor-v1.0.1...techdocs-editor-v1.0.2) (2026-06-04)


### Bug Fixes

* **release:** use GH_PAT for semantic-release GitHub auth ([034a80b](https://github.com/Estehsan/backstage-techdoc-editor/commit/034a80b73ca80f1eb28eae32f648d6ae4494a221))

## [1.0.1](https://github.com/Estehsan/backstage-techdoc-editor/compare/techdocs-editor-v1.0.0...techdocs-editor-v1.0.1) (2026-06-04)


### Bug Fixes

* **release:** switch publish target from GitHub Packages to npmjs.com ([fca7259](https://github.com/Estehsan/backstage-techdoc-editor/commit/fca725990c8479546c0c46b5304a3301c2dcf189))
* switch badges to github/package-json/v and fix alpha default export ([3116e31](https://github.com/Estehsan/backstage-techdoc-editor/commit/3116e318e0977021603ce9036b23adc0ac8c7d36))

# 1.0.0 (2026-06-03)


### Bug Fixes

* add graphify to prettier ignore and export default from alpha ([31b6370](https://github.com/Estehsan/backstage-techdoc-editor/commit/31b63702899a0d3e7ae5688a235c8d22feb89ca5))
* add missing eslint, prettier, husky configs and fix dependency versions ([90d9364](https://github.com/Estehsan/backstage-techdoc-editor/commit/90d93640991f84881d8b07f59f456d5e417ade3e))
* add missing eslint, prettier, husky configs and fix linting/type errors ([5b8c38b](https://github.com/Estehsan/backstage-techdoc-editor/commit/5b8c38b7c798a8329542e180fb037d0e2cb9e03d))
* avoid release tag collisions and add package version badges ([9b7b8d5](https://github.com/Estehsan/backstage-techdoc-editor/commit/9b7b8d541e31a5f162054887e886f15e3a1a08c3))
* **ci:** add verification step for publishable package count in release workflow ([f6f5424](https://github.com/Estehsan/backstage-techdoc-editor/commit/f6f54249f8c2ada25aca06a9d2789f5ffea7c9ad))
* **ci:** enhance release workflow with npm auth configuration and package count verification ([4cc4d2d](https://github.com/Estehsan/backstage-techdoc-editor/commit/4cc4d2d33b12ff6a2212647425eb5fd18980c35b))
* **ci:** unblock CI and Release pipelines ([2b0f8aa](https://github.com/Estehsan/backstage-techdoc-editor/commit/2b0f8aa311aa410fead993c1d585e07774e36538))
* remove accidental self-referencing submodule ([f67e5be](https://github.com/Estehsan/backstage-techdoc-editor/commit/f67e5bec8452ca7b1f13bcec7f8e02a6d6a5fa83))
* **techdocs-editor-backend:** normalize alpha default export ([e1e3283](https://github.com/Estehsan/backstage-techdoc-editor/commit/e1e3283130af045ef0624a6ff60c64250e49845a))
* update package dependencies to use workspace protocol for local development ([6f60226](https://github.com/Estehsan/backstage-techdoc-editor/commit/6f6022645ddfd35a5ffaceb15d3176483a827600))
* update yarn.lock to reflect npm:^ dependencies ([e89a574](https://github.com/Estehsan/backstage-techdoc-editor/commit/e89a574420fd52326193febbcf2094b8be641ce3))


### Features

* initial TechDocs Editor plugin suite ([541fc2f](https://github.com/Estehsan/backstage-techdoc-editor/commit/541fc2f0df88ec52375ee8ae0bcdc5bbae4d7090))

# 1.0.0 (2026-06-03)


### Bug Fixes

* add missing eslint, prettier, husky configs and fix dependency versions ([90d9364](https://github.com/Estehsan/backstage-techdoc-editor/commit/90d93640991f84881d8b07f59f456d5e417ade3e))
* add missing eslint, prettier, husky configs and fix linting/type errors ([5b8c38b](https://github.com/Estehsan/backstage-techdoc-editor/commit/5b8c38b7c798a8329542e180fb037d0e2cb9e03d))
* **ci:** add verification step for publishable package count in release workflow ([f6f5424](https://github.com/Estehsan/backstage-techdoc-editor/commit/f6f54249f8c2ada25aca06a9d2789f5ffea7c9ad))
* **ci:** enhance release workflow with npm auth configuration and package count verification ([4cc4d2d](https://github.com/Estehsan/backstage-techdoc-editor/commit/4cc4d2d33b12ff6a2212647425eb5fd18980c35b))
* **ci:** unblock CI and Release pipelines ([2b0f8aa](https://github.com/Estehsan/backstage-techdoc-editor/commit/2b0f8aa311aa410fead993c1d585e07774e36538))
* remove accidental self-referencing submodule ([f67e5be](https://github.com/Estehsan/backstage-techdoc-editor/commit/f67e5bec8452ca7b1f13bcec7f8e02a6d6a5fa83))
* update package dependencies to use workspace protocol for local development ([6f60226](https://github.com/Estehsan/backstage-techdoc-editor/commit/6f6022645ddfd35a5ffaceb15d3176483a827600))
* update yarn.lock to reflect npm:^ dependencies ([e89a574](https://github.com/Estehsan/backstage-techdoc-editor/commit/e89a574420fd52326193febbcf2094b8be641ce3))


### Features

* initial TechDocs Editor plugin suite ([541fc2f](https://github.com/Estehsan/backstage-techdoc-editor/commit/541fc2f0df88ec52375ee8ae0bcdc5bbae4d7090))

# 1.0.0 (2026-06-03)


### Bug Fixes

* add missing eslint, prettier, husky configs and fix dependency versions ([90d9364](https://github.com/Estehsan/backstage-techdoc-editor/commit/90d93640991f84881d8b07f59f456d5e417ade3e))
* add missing eslint, prettier, husky configs and fix linting/type errors ([5b8c38b](https://github.com/Estehsan/backstage-techdoc-editor/commit/5b8c38b7c798a8329542e180fb037d0e2cb9e03d))
* **ci:** add verification step for publishable package count in release workflow ([f6f5424](https://github.com/Estehsan/backstage-techdoc-editor/commit/f6f54249f8c2ada25aca06a9d2789f5ffea7c9ad))
* **ci:** unblock CI and Release pipelines ([2b0f8aa](https://github.com/Estehsan/backstage-techdoc-editor/commit/2b0f8aa311aa410fead993c1d585e07774e36538))
* remove accidental self-referencing submodule ([f67e5be](https://github.com/Estehsan/backstage-techdoc-editor/commit/f67e5bec8452ca7b1f13bcec7f8e02a6d6a5fa83))
* update package dependencies to use workspace protocol for local development ([6f60226](https://github.com/Estehsan/backstage-techdoc-editor/commit/6f6022645ddfd35a5ffaceb15d3176483a827600))
* update yarn.lock to reflect npm:^ dependencies ([e89a574](https://github.com/Estehsan/backstage-techdoc-editor/commit/e89a574420fd52326193febbcf2094b8be641ce3))


### Features

* initial TechDocs Editor plugin suite ([541fc2f](https://github.com/Estehsan/backstage-techdoc-editor/commit/541fc2f0df88ec52375ee8ae0bcdc5bbae4d7090))

# 1.0.0 (2026-06-01)


### Bug Fixes

* add missing eslint, prettier, husky configs and fix dependency versions ([90d9364](https://github.com/Estehsan/backstage-techdoc-editor/commit/90d93640991f84881d8b07f59f456d5e417ade3e))
* add missing eslint, prettier, husky configs and fix linting/type errors ([5b8c38b](https://github.com/Estehsan/backstage-techdoc-editor/commit/5b8c38b7c798a8329542e180fb037d0e2cb9e03d))
* remove accidental self-referencing submodule ([f67e5be](https://github.com/Estehsan/backstage-techdoc-editor/commit/f67e5bec8452ca7b1f13bcec7f8e02a6d6a5fa83))
* update yarn.lock to reflect npm:^ dependencies ([e89a574](https://github.com/Estehsan/backstage-techdoc-editor/commit/e89a574420fd52326193febbcf2094b8be641ce3))


### Features

* initial TechDocs Editor plugin suite ([541fc2f](https://github.com/Estehsan/backstage-techdoc-editor/commit/541fc2f0df88ec52375ee8ae0bcdc5bbae4d7090))
