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
