// eslint-disable-next-line @backstage/no-undeclared-imports
const editorPkg = require('../package.json') as {
  dependencies: Record<string, string>;
};
// package.json is exported via the exports map of techdocs-editor-react
// eslint-disable-next-line @backstage/no-undeclared-imports
const reactLibPkg =
  require('@estehsaan/backstage-plugin-techdocs-editor-react/package.json') as {
    dependencies: Record<string, string>;
  };

describe('techdocs editor dependency alignment', () => {
  it('pins frontend plugin dependencies to the same generation as the app', () => {
    expect(editorPkg.dependencies['@backstage/frontend-plugin-api']).toMatch(
      /^\^0\.17\./,
    );
    expect(editorPkg.dependencies['@backstage/plugin-catalog-react']).toMatch(
      /^\^3\./,
    );
    expect(reactLibPkg.dependencies['@backstage/plugin-catalog-react']).toMatch(
      /^\^3\./,
    );
  });
});
