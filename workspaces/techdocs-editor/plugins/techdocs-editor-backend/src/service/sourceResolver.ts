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
import { Config } from '@backstage/config';
import { InputError } from '@backstage/errors';
import { ScmIntegrationRegistry } from '@backstage/integration';
import { UrlReaderService } from '@backstage/backend-plugin-api';
import { parseReferenceAnnotation } from '@backstage/plugin-techdocs-node';
import { TECHDOCS_ANNOTATION } from '@backstage/plugin-techdocs-common';
import { ResolvedSource } from '@estehsaan/backstage-plugin-techdocs-editor-common';
import path from 'node:path';

const GITHUB_SLUG_ANNOTATION = 'github.com/project-slug';
const GITLAB_SLUG_ANNOTATION = 'gitlab.com/project-slug';

/**
 * Validates that a `docs_dir` value parsed from mkdocs.yml or a URL hash is
 * safe to use as a path prefix when constructing file paths on the VCS provider.
 * Throws InputError if the value could allow path traversal.
 *
 * @internal
 */
function assertSafeDocsDir(docsDir: string): void {
  if (
    docsDir.startsWith('/') ||
    docsDir.startsWith('..') ||
    docsDir.includes('/../') ||
    docsDir.includes('/..') ||
    docsDir === '..' ||
    /\0/.test(docsDir)
  ) {
    throw new InputError(
      `Invalid docs_dir '${docsDir}': must be a relative path and must not escape the repository root.`,
    );
  }
  if (!/^[a-zA-Z0-9_\-./]+$/.test(docsDir)) {
    throw new InputError(
      `Invalid docs_dir '${docsDir}': only alphanumeric characters, hyphens, underscores, dots, and slashes are allowed.`,
    );
  }
}

/**
 * Validates that a candidate path does not escape the allowed root directory.
 * Throws InputError on any path traversal attempt.
 *
 * @internal
 */
function assertSafeLocalPath(candidatePath: string, allowedRoot: string): void {
  const normalizedCandidate = path.normalize(
    path.resolve(allowedRoot, candidatePath),
  );
  const normalizedRoot = path.normalize(allowedRoot);

  if (
    !normalizedCandidate.startsWith(normalizedRoot + path.sep) &&
    normalizedCandidate !== normalizedRoot
  ) {
    throw new InputError(
      `Path '${candidatePath}' resolves outside the allowed source directory. ` +
        `This may be a path traversal attempt.`,
    );
  }
}

/**
 * Attempt to derive a repo URL from the entity's SCM project-slug annotations
 * (github.com/project-slug or gitlab.com/project-slug) when techdocs-ref is
 * not a remote `url:` annotation. Returns undefined if no usable slug is found.
 */
function resolveFromSlug(
  entity: Entity,
  scmIntegrations: ScmIntegrationRegistry,
): string | undefined {
  const annotations = entity.metadata.annotations ?? {};

  const githubSlug = annotations[GITHUB_SLUG_ANNOTATION];
  if (githubSlug) {
    const githubIntegrations = scmIntegrations.github.list();
    if (githubIntegrations.length > 0) {
      const host = githubIntegrations[0].config.host;
      return `https://${host}/${githubSlug}`;
    }
  }

  const gitlabSlug = annotations[GITLAB_SLUG_ANNOTATION];
  if (gitlabSlug) {
    const gitlabIntegrations = scmIntegrations.gitlab.list();
    if (gitlabIntegrations.length > 0) {
      const host = gitlabIntegrations[0].config.host;
      return `https://${host}/${gitlabSlug}`;
    }
  }

  return undefined;
}

const SOURCE_LOCATION_ANNOTATION = 'backstage.io/source-location';
const MANAGED_BY_LOCATION_ANNOTATION = 'backstage.io/managed-by-location';

/**
 * Resolve the base path for a local `dir:` annotation.
 * Priority:
 * 1. backstage.io/source-location annotation (strip file:// prefix)
 * 2. backstage.io/managed-by-location annotation (if file:// type)
 * 3. Backstage backend working directory from config
 *
 * @internal
 */
function resolveLocalBasePath(entity: Entity, config: Config): string {
  const annotations = entity.metadata.annotations ?? {};

  // Try backstage.io/source-location first
  const sourceLocation = annotations[SOURCE_LOCATION_ANNOTATION];
  if (sourceLocation) {
    // Format: url:file:///path/to/entity or file:///path/to/entity
    let locationPath = sourceLocation;
    if (locationPath.startsWith('url:')) {
      locationPath = locationPath.slice(4);
    }
    if (locationPath.startsWith('file://')) {
      return decodeURIComponent(locationPath.slice(7));
    }
  }

  // Try backstage.io/managed-by-location
  const managedBy = annotations[MANAGED_BY_LOCATION_ANNOTATION];
  if (managedBy) {
    // Format: file:/path/to/entity/catalog-info.yaml or url:file:///path
    let locationPath = managedBy;
    if (locationPath.startsWith('url:')) {
      locationPath = locationPath.slice(4);
    }
    if (locationPath.startsWith('file://')) {
      const fullPath = decodeURIComponent(locationPath.slice(7));
      // Return directory containing the catalog file
      return path.dirname(fullPath);
    }
    if (locationPath.startsWith('file:')) {
      const fullPath = decodeURIComponent(locationPath.slice(5));
      return path.dirname(fullPath);
    }
  }

  // Fall back to Backstage working directory
  return config.getOptionalString('backend.workingDirectory') ?? process.cwd();
}

/**
 * Resolve the source location from an entity's techdocs annotation.
 * Returns a discriminated union for VCS vs local filesystem sources.
 *
 * @internal
 */
export async function resolveSource(
  entity: Entity,
  scmIntegrations: ScmIntegrationRegistry,
  _reader: UrlReaderService,
  config: Config,
): Promise<ResolvedSource> {
  let annotation: ReturnType<typeof parseReferenceAnnotation> | undefined;
  try {
    annotation = parseReferenceAnnotation(TECHDOCS_ANNOTATION, entity);
  } catch {
    // Missing annotation — try slug fallback below
  }

  // Handle dir: annotations for local filesystem
  if (annotation && annotation.type === 'dir') {
    const dirRelativePath = annotation.target; // e.g., ".", "./docs", "custom-docs"
    const basePath = resolveLocalBasePath(entity, config);

    // Resolve absolute path
    const absolutePath = path.resolve(basePath, dirRelativePath);

    // Security: the dir: target must stay within the entity's source-location
    // root (the folder its catalog-info.yaml was loaded from). Filesystem
    // operations are additionally sandboxed by LocalFsVcsProvider.
    assertSafeLocalPath(absolutePath, basePath);

    return {
      type: 'local',
      basePath: absolutePath,
      docsDir: 'docs', // Will be overridden by mkdocs.yml if found
    };
  }

  // Handle url: annotations or missing annotations (try slug fallback)
  if (!annotation || annotation.type !== 'url') {
    const slugUrl = resolveFromSlug(entity, scmIntegrations);
    if (slugUrl) {
      return {
        type: 'vcs',
        repoUrl: slugUrl,
        docsDir: undefined,
        defaultBranch: undefined,
      };
    }
    if (!annotation) {
      throw new InputError(
        `Entity ${entity.metadata.name} is missing the '${TECHDOCS_ANNOTATION}' annotation ` +
          `and has no 'github.com/project-slug' or 'gitlab.com/project-slug' annotation to fall back to.`,
      );
    }
    throw new InputError(
      `TechDocs editor only supports 'url:' or 'dir:' type annotations. Got '${annotation.type}:'. ` +
        `Add a 'github.com/project-slug' or 'gitlab.com/project-slug' annotation, ` +
        `or change the techdocs-ref to 'url:https://github.com/org/repo' or 'dir:.'.`,
    );
  }

  const target = annotation.target;
  const integration = scmIntegrations.byUrl(target);
  if (!integration) {
    throw new InputError(
      `No SCM integration configured for URL: ${target}. ` +
        `Add an entry in integrations.github or integrations.gitlab in app-config.yaml.`,
    );
  }

  const url = new URL(target);
  const pathParts = url.pathname.split('/').filter(Boolean);

  let repoUrl: string;
  let defaultBranch: string | undefined;
  let docsDir: string | undefined;

  if (integration.type === 'github') {
    const owner = pathParts[0];
    const repo = pathParts[1];
    if (!owner || !repo) {
      throw new InputError(
        `Cannot parse owner/repo from GitHub URL: ${target}`,
      );
    }
    repoUrl = `https://github.com/${owner}/${repo}`;
    defaultBranch = pathParts[3]; // after 'tree'
    docsDir = url.hash ? url.hash.slice(1) : undefined;
  } else if (integration.type === 'gitlab') {
    const treeIdx = pathParts.indexOf('tree');
    const repo =
      treeIdx > 1
        ? pathParts.slice(0, treeIdx - 1).join('/')
        : pathParts.slice(0, 2).join('/');
    repoUrl = `${url.protocol}//${url.host}/${repo}`;
    defaultBranch = treeIdx >= 0 ? pathParts[treeIdx + 1] : undefined;
    docsDir = url.hash ? url.hash.slice(1) : undefined;
  } else {
    repoUrl = `${url.protocol}//${url.host}${url.pathname
      .split('/')
      .slice(0, 3)
      .join('/')}`;
    docsDir = undefined;
    defaultBranch = undefined;
  }

  if (docsDir) {
    assertSafeDocsDir(docsDir);
  }

  return { type: 'vcs', repoUrl, docsDir, defaultBranch };
}
