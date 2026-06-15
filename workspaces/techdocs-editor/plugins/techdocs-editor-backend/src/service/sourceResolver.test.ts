/*
 * Copyright 2025 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Entity } from '@backstage/catalog-model';
import { ConfigReader } from '@backstage/config';
import { ScmIntegrations } from '@backstage/integration';
import { UrlReaderService } from '@backstage/backend-plugin-api';
import { resolveSource } from './sourceResolver';

describe('resolveSource', () => {
  const reader = {} as UrlReaderService;
  const config = new ConfigReader({});
  const scmIntegrations = ScmIntegrations.fromConfig(
    new ConfigReader({
      integrations: {
        github: [{ host: 'github.com', token: 'fake' }],
      },
    }),
  );

  // A source-location root that is deliberately unrelated to the backend's
  // process.cwd(), reproducing the original "outside working directory" bug.
  const sourceRoot = '/tmp/example-workspace/documented-component';

  function dirEntity(target: string): Entity {
    return {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Component',
      metadata: {
        name: 'documented-component',
        annotations: {
          'backstage.io/techdocs-ref': `dir:${target}`,
          'backstage.io/source-location': `url:file://${sourceRoot}`,
        },
      },
      spec: { type: 'service', lifecycle: 'experimental', owner: 'guest' },
    };
  }

  it('resolves a dir:. source located outside the backend working directory', async () => {
    const result = await resolveSource(
      dirEntity('.'),
      scmIntegrations,
      reader,
      config,
    );

    expect(result).toEqual({
      type: 'local',
      basePath: sourceRoot,
      docsDir: 'docs',
    });
  });

  it('resolves a dir: subdirectory within the source root', async () => {
    const result = await resolveSource(
      dirEntity('./custom-docs'),
      scmIntegrations,
      reader,
      config,
    );

    expect(result).toMatchObject({
      type: 'local',
      basePath: `${sourceRoot}/custom-docs`,
    });
  });

  it('rejects a dir: target that escapes the source root', async () => {
    await expect(
      resolveSource(dirEntity('../../etc'), scmIntegrations, reader, config),
    ).rejects.toThrow(/resolves outside the allowed source directory/);
  });

  it('resolves a url: GitHub annotation to a vcs source', async () => {
    const entity: Entity = {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Component',
      metadata: {
        name: 'remote-component',
        annotations: {
          'backstage.io/techdocs-ref':
            'url:https://github.com/backstage/backstage/tree/master/docs',
        },
      },
      spec: { type: 'service', lifecycle: 'experimental', owner: 'guest' },
    };

    const result = await resolveSource(entity, scmIntegrations, reader, config);

    expect(result).toMatchObject({
      type: 'vcs',
      repoUrl: 'https://github.com/backstage/backstage',
    });
  });
});
