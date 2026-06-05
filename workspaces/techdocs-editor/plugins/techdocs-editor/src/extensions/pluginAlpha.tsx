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

import {
  createFrontendPlugin,
  PageBlueprint,
  ApiBlueprint,
  ExtensionDefinition,
  FrontendPlugin,
} from '@backstage/frontend-plugin-api';
import { discoveryApiRef, fetchApiRef } from '@backstage/core-plugin-api';
import { EntityContentBlueprint } from '@backstage/plugin-catalog-react/alpha';
import { useSearchParams, useParams } from 'react-router-dom';
import {
  TechDocsEditorApiRef,
  TechDocsEditorClient,
  TechDocsEditorPage,
} from '@estehsaan/backstage-plugin-techdocs-editor-react';
import { useEntity } from '@backstage/plugin-catalog-react';
import { parseEntityRef } from '@backstage/catalog-model';
import { TECHDOCS_ANNOTATION } from '@backstage/plugin-techdocs-common';
import { editorRouteRef } from '../routes';

// ── API ──────────────────────────────────────────────────────────────────────

const techdocsEditorApiExtension = ApiBlueprint.make({
  name: 'techdocs-editor',
  params: defineParams =>
    defineParams({
      api: TechDocsEditorApiRef,
      deps: {
        discoveryApi: discoveryApiRef,
        fetchApi: fetchApiRef,
      },
      factory: ({ discoveryApi, fetchApi }) =>
        new TechDocsEditorClient(discoveryApi, fetchApi),
    }),
});

// ── Standalone editor page ───────────────────────────────────────────────────

const EditorPageContent = () => {
  const [searchParams] = useSearchParams();
  const initialPath = searchParams.get('file') ?? undefined;

  // Extract entity ref from route params (path: /docs/:namespace/:kind/:name/edit)
  const { namespace, kind, name } = useParams<{
    namespace: string;
    kind: string;
    name: string;
  }>();

  if (!namespace || !kind || !name) {
    return null;
  }

  const entityRef = parseEntityRef(`${kind}:${namespace}/${name}`);
  return <TechDocsEditorPage entityRef={entityRef} initialPath={initialPath} />;
};

/**
 * @alpha
 */
export const techdocsEditorExtensionPage = PageBlueprint.make({
  name: 'techdocs-editor',
  params: {
    path: '/docs/:namespace/:kind/:name/edit',
    routeRef: editorRouteRef,
    loader: async () => <EditorPageContent />,
  },
});

// ── Entity content tab ───────────────────────────────────────────────────────

const EditorTabContent = () => {
  const { entity } = useEntity();
  const hasTechDocs = Boolean(
    entity.metadata.annotations?.[TECHDOCS_ANNOTATION],
  );
  const entityRef = {
    namespace: entity.metadata.namespace ?? 'default',
    kind: entity.kind,
    name: entity.metadata.name,
  };
  return (
    <TechDocsEditorPage
      entityRef={entityRef}
      hasTechDocsAnnotation={hasTechDocs}
    />
  );
};

/**
 * @alpha
 */
export const techdocsEditorAddonExtension: ExtensionDefinition =
  EntityContentBlueprint.make({
    name: 'techdocs-editor',
    params: {
      path: '/edit-docs',
      title: 'Edit Docs',
      filter: 'has:annotation:backstage.io/techdocs-ref',
      loader: async () => <EditorTabContent />,
    },
  });

// ── Plugin ───────────────────────────────────────────────────────────────────

/**
 * @alpha
 */
const techdocsEditorAlphaPlugin: FrontendPlugin = createFrontendPlugin({
  pluginId: 'techdocs-editor',
  extensions: [
    techdocsEditorApiExtension,
    techdocsEditorExtensionPage,
    techdocsEditorAddonExtension,
  ],
  routes: {
    root: editorRouteRef,
  },
});

export default techdocsEditorAlphaPlugin;
