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

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Button,
  Text,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  TooltipTrigger,
} from '@backstage/ui';
import { RiCodeLine, RiEyeLine, RiGitPullRequestLine, RiSaveLine } from '@remixicon/react';
import {
  Progress,
  ResponseErrorPanel,
  Header,
  Page,
  Content,
} from '@backstage/core-components';
import { MissingAnnotationEmptyState } from '@backstage/plugin-catalog-react';
import { CompoundEntityRef } from '@backstage/catalog-model';
import { TECHDOCS_ANNOTATION } from '@backstage/plugin-techdocs-common';
import {
  EditedFile,
  DocTreeNode,
  MkDocsConfig,
} from '@estehsaan/backstage-plugin-techdocs-editor-common';
import { useTechDocsEditorApi } from '../api';
import { TechDocsFileTree } from './TechDocsFileTree';
import { TechDocsMarkdownEditor } from './TechDocsMarkdownEditor';
import { SubmitEditsDialog } from './SubmitEditsDialog';
import { ChangesDrawer } from './ChangesDrawer';
import styles from './TechDocsEditorPage.module.css';


/**
 * Props for {@link TechDocsEditorPage}.
 * @public
 */
export type TechDocsEditorPageProps = {
  entityRef: CompoundEntityRef;
  /** Pre-selected file path (e.g. when linked from the TechDocs addon) */
  initialPath?: string;
  /** Whether the entity has the techdocs annotation — if false, shows empty state */
  hasTechDocsAnnotation?: boolean;
};

/**
 * Full-page TechDocs editor: file tree on the left, WYSIWYG editor on the right.
 * @public
 */
export function TechDocsEditorPage({
  entityRef,
  initialPath,
  hasTechDocsAnnotation = true,
}: TechDocsEditorPageProps) {
  const api = useTechDocsEditorApi();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [mkdocsConfig, setMkdocsConfig] = useState<MkDocsConfig | null>(null);
  const [treeNodes, setTreeNodes] = useState<DocTreeNode[]>([]);
  const [branch, setBranch] = useState<string>('');
  const [docsDir, setDocsDir] = useState<string | undefined>(undefined);

  const [selectedPath, setSelectedPath] = useState<string | undefined>(
    initialPath,
  );
  const [fileContent, setFileContent] = useState<string>('');
  const [fileLoading, setFileLoading] = useState(false);
  const [fileError, setFileError] = useState<Error | null>(null);

  const [editedFiles, setEditedFiles] = useState<Map<string, EditedFile>>(
    new Map(),
  );
  // Mirror of `editedFiles` for use inside effects that must not re-run on
  // every keystroke (reading the ref avoids listing `editedFiles` as a dep).
  const editedFilesRef = useRef(editedFiles);
  editedFilesRef.current = editedFiles;
  // Set of paths with unsaved edits. Tracked as its own state so its identity
  // only changes when membership changes (not on every keystroke), which keeps
  // the memoized file tree from re-rendering while typing.
  const [dirtyPaths, setDirtyPaths] = useState<Set<string>>(new Set());
  const originalEtags = useRef<Map<string, string>>(new Map());
  // Pristine content as loaded from the source, keyed by path. Toast UI
  // Editor fires `onChange` once on mount as it re-serializes the markdown
  // internally, even without any user interaction. Comparing against this
  // baseline lets us tell a real edit apart from that mount-time noise, so
  // simply opening a file never silently marks it dirty and pulls it into
  // the next submission.
  const originalContents = useRef<Map<string, string>>(new Map());

  const [sourceMode, setSourceMode] = useState(true);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [canSaveLocally, setCanSaveLocally] = useState(false);
  const [canCreatePullRequest, setCanCreatePullRequest] = useState(false);

  const requestEntityRef = useMemo(
    () => ({
      kind: entityRef.kind,
      name: entityRef.name,
      namespace: entityRef.namespace,
    }),
    [entityRef.kind, entityRef.name, entityRef.namespace],
  );

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getFileTree(requestEntityRef),
      api.getMkDocsConfig(requestEntityRef),
    ])
      .then(([tree, config]) => {
        setBranch(tree.branch);
        setDocsDir(tree.docsDir);
        setCanSaveLocally(tree.canSaveLocally);
        setCanCreatePullRequest(tree.canCreatePullRequest);
        setMkdocsConfig(config);
        const nodes: DocTreeNode[] = buildTree(
          tree.nodes.map(n => n.path!).filter(Boolean),
        );
        setTreeNodes(nodes);
        const first = initialPath ?? tree.nodes[0]?.path;
        if (first) setSelectedPath(first);
      })
      .catch(e => setError(e))
      .finally(() => setLoading(false));
  }, [api, requestEntityRef, initialPath]);

  useEffect(() => {
    if (!selectedPath || !branch) return;

    const edited = editedFilesRef.current.get(selectedPath);
    if (edited) {
      setFileContent(edited.content ?? '');
      return;
    }

    setFileLoading(true);
    setFileError(null);
    api
      .getFile(requestEntityRef, selectedPath, branch)
      .then(({ content, etag }) => {
        setFileContent(content);
        originalEtags.current.set(selectedPath, etag);
        originalContents.current.set(selectedPath, content);
      })
      .catch(e => setFileError(e))
      .finally(() => setFileLoading(false));
  }, [api, requestEntityRef, selectedPath, branch]);

  const handleContentChange = useCallback(
    (markdown: string) => {
      if (!selectedPath) return;
      const original = originalContents.current.get(selectedPath);
      setEditedFiles(prev => {
        const next = new Map(prev);
        if (markdown === original) {
          // Content matches what was loaded (or the editor's mount-time
          // re-serialization produced an identical result) — this isn't a
          // real edit, so don't include it in the next submission.
          next.delete(selectedPath);
          return next;
        }
        const etag = originalEtags.current.get(selectedPath) ?? '';
        next.set(selectedPath, { path: selectedPath, content: markdown, etag });
        return next;
      });
      setDirtyPaths(prev => {
        if (markdown === original) {
          if (!prev.has(selectedPath)) return prev;
          const next = new Set(prev);
          next.delete(selectedPath);
          return next;
        }
        return prev.has(selectedPath) ? prev : new Set(prev).add(selectedPath);
      });
    },
    [selectedPath],
  );

  const handleCreateFile = useCallback((relativePath: string) => {
    const initialContent = `# ${
      relativePath.replace(/\.md$/, '').split('/').pop()?.replace(/-/g, ' ') ??
      'New Page'
    }`;
    setEditedFiles(prev => {
      const next = new Map(prev);
      next.set(relativePath, {
        path: relativePath,
        content: initialContent,
        etag: '',
      });
      return next;
    });
    setDirtyPaths(prev =>
      prev.has(relativePath) ? prev : new Set(prev).add(relativePath),
    );
    setTreeNodes(prev => {
      const allPaths = collectPaths(prev).concat(relativePath);
      return buildTree(allPaths);
    });
    setSelectedPath(relativePath);
    setFileContent(initialContent);
  }, []);

  const handleSubmit = async (opts: {
    action: 'save-locally' | 'create-pull-request';
    prTitle: string;
    prDescription: string;
    commitMessage: string;
    draft: boolean;
  }) => {
    const files: EditedFile[] = Array.from(editedFiles.values());
    const result = await api.submitEdits(entityRef, {
      files,
      action: opts.action,
      prTitle: opts.action === 'create-pull-request' ? opts.prTitle : undefined,
      prDescription: opts.prDescription,
      commitMessage: opts.commitMessage,
      draft: opts.draft,
    });
    setEditedFiles(new Map());
    setDirtyPaths(new Set());
    setSubmitOpen(false);

    // Handle different response types
    if (result.savedLocally) {
      // Show success message for local saves
      const count = result.savedCount ?? files.length;
      setSuccessMessage(`Saved ${count} file${count !== 1 ? 's' : ''} to disk`);
    } else if (result.pullRequestUrl) {
      // Open PR URL for VCS saves
      window.open(result.pullRequestUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const dirtyCount = dirtyPaths.size;

  // Auto-hide the success toast after 6 seconds (replaces MUI Snackbar's
  // autoHideDuration, which BUI's Alert has no equivalent for).
  useEffect(() => {
    if (!successMessage) return undefined;
    const timer = setTimeout(() => setSuccessMessage(null), 6000);
    return () => clearTimeout(timer);
  }, [successMessage]);

  // Warn the user before leaving (reload/close) if there are unsaved edits.
  useEffect(() => {
    if (dirtyCount === 0) return undefined;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [dirtyCount]);

  // Memoize the sidebar so it does not re-render on every keystroke. Its props
  // are stable while typing (`dirtyPaths` identity only changes when the set of
  // edited files changes, not on content edits).
  const fileTree = useMemo(
    () => (
      <TechDocsFileTree
        nodes={treeNodes}
        selectedPath={selectedPath}
        dirtyPaths={dirtyPaths}
        onSelect={setSelectedPath}
        onCreateFile={handleCreateFile}
        branch={branch}
        docsDir={docsDir}
      />
    ),
    [treeNodes, selectedPath, dirtyPaths, handleCreateFile, branch, docsDir],
  );

  if (!hasTechDocsAnnotation) {
    return <MissingAnnotationEmptyState annotation={TECHDOCS_ANNOTATION} />;
  }

  if (loading) return <Progress />;
  if (error) return <ResponseErrorPanel error={error} />;

  return (
    <Page themeId="documentation">
      <Header
        title={`Edit Docs: ${mkdocsConfig?.site_name ?? entityRef.name}`}
        subtitle={`${entityRef.kind}:${entityRef.namespace ?? 'default'}/${
          entityRef.name
        }`}
      />
      <Content noPadding>
        <div className={styles.shell}>
          {/* Toolbar */}
          <div className={styles.toolbar}>
            <ToggleButtonGroup
              selectionMode="single"
              disallowEmptySelection
              selectedKeys={new Set([sourceMode ? 'markdown' : 'visual'])}
              onSelectionChange={keys =>
                setSourceMode([...keys][0] === 'markdown')
              }
            >
              <TooltipTrigger>
                <ToggleButton id="visual" iconStart={<RiEyeLine size={16} />}>
                  Visual
                </ToggleButton>
                <Tooltip>WYSIWYG mode</Tooltip>
              </TooltipTrigger>
              <TooltipTrigger>
                <ToggleButton id="markdown" iconStart={<RiCodeLine size={16} />}>
                  Markdown
                </ToggleButton>
                <Tooltip>Markdown source mode</Tooltip>
              </TooltipTrigger>
            </ToggleButtonGroup>

            <Text variant="body-x-small" color="secondary">
              Branch: <strong>{branch}</strong>
            </Text>

            {dirtyCount > 0 && (
              <TooltipTrigger>
                <Button
                  variant="secondary"
                  iconStart={<RiGitPullRequestLine size={16} />}
                  onPress={() => setDrawerOpen(true)}
                >
                  {dirtyCount} change{dirtyCount !== 1 ? 's' : ''}
                </Button>
                <Tooltip>Review all your changes before submitting</Tooltip>
              </TooltipTrigger>
            )}

            <div style={{ marginLeft: 'auto' }}>
              <Button
                variant="primary"
                isDisabled={dirtyCount === 0}
                iconStart={<RiSaveLine size={16} />}
                onPress={() => setSubmitOpen(true)}
              >
                Submit Changes
                {dirtyCount > 0 && (
                  <span className={styles.changedCount}>{dirtyCount}</span>
                )}
              </Button>
            </div>
          </div>

          <hr className={styles.divider} />

          {/* Body: sidebar + editor */}
          <div className={styles.body}>
            {fileTree}

            <div className={styles.editorArea}>
              {fileLoading && (
                <div className={styles.noFileSelected}>
                  <Text color="secondary">Loading…</Text>
                </div>
              )}
              {fileError && <ResponseErrorPanel error={fileError} />}
              {!selectedPath && !fileLoading && (
                <div className={styles.noFileSelected}>
                  <Text color="secondary">Select a file to edit</Text>
                </div>
              )}
              {selectedPath && !fileLoading && !fileError && (
                <TechDocsMarkdownEditor
                  key={selectedPath}
                  initialContent={fileContent}
                  onChange={handleContentChange}
                  sourceMode={sourceMode}
                />
              )}
            </div>
          </div>
        </div>

        <SubmitEditsDialog
          open={submitOpen}
          changedFiles={Array.from(editedFiles.values())}
          originalContents={originalContents.current}
          onClose={() => setSubmitOpen(false)}
          onSubmit={handleSubmit}
          defaultPrTitle={`docs: update ${
            mkdocsConfig?.site_name ?? entityRef.name
          } documentation`}
          canSaveLocally={canSaveLocally}
          canCreatePullRequest={canCreatePullRequest}
        />

        <ChangesDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          changedFiles={Array.from(editedFiles.values())}
          originalContents={originalContents.current}
        />

        {/* Success notification for local saves */}
        {successMessage && (
          <Alert
            status="success"
            title={successMessage}
            className={styles.toast}
          />
        )}
      </Content>
    </Page>
  );
}

// ─── Utilities ────────────────────────────────────────────────────────────────

/** Build a nested tree from a flat list of file paths like "getting-started.md", "api/overview.md" */
function buildTree(paths: string[]): DocTreeNode[] {
  const root: DocTreeNode[] = [];

  for (const p of paths.sort()) {
    const parts = p.split('/');
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;

      if (isLast) {
        current.push({
          title: part.replace(/\.md$/, '').replace(/-/g, ' '),
          path: p,
        });
      } else {
        let dir = current.find(n => n.title === part && !n.path);
        if (!dir) {
          dir = { title: part, children: [] };
          current.push(dir);
        }
        current = dir.children!;
      }
    }
  }

  return root;
}

/** Collect every leaf file path from a nested tree. */
function collectPaths(nodes: DocTreeNode[]): string[] {
  const paths: string[] = [];
  for (const node of nodes) {
    if (node.path) paths.push(node.path);
    if (node.children) paths.push(...collectPaths(node.children));
  }
  return paths;
}
