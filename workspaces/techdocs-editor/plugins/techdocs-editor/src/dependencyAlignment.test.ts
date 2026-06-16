import fs from 'fs';
import path from 'path';

function readJson(filePath: string): Record<string, string> {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

describe('techdocs editor dependency alignment', () => {
  it('pins frontend plugin dependencies to the same generation as the app', () => {
    const editorPkgPath = path.resolve(__dirname, '../package.json');
    const reactLibPkgPath = path.resolve(
      __dirname,
      '../../techdocs-editor-react/package.json',
    );

    const editorPkg = readJson(editorPkgPath);
    const reactLibPkg = readJson(reactLibPkgPath);

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
