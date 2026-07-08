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

import { useState } from 'react';
import {
  Button,
  ButtonLink,
  Checkbox,
  Dialog,
  DialogBody,
  DialogFooter,
  DialogHeader,
  FieldLabel,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  Text,
  TextField,
} from '@backstage/ui';
import { RiExternalLinkLine, RiSaveLine } from '@remixicon/react';
import { EditedFile } from '@estehsaan/backstage-plugin-techdocs-editor-common';
import styles from './SubmitEditsDialog.module.css';

// ─── Inline line-diff (no extra dependency) ────────────────────────────────

type DiffLine =
  | { type: 'context'; text: string }
  | { type: 'added'; text: string }
  | { type: 'removed'; text: string };

/** Compute a simple line-level diff between `before` and `after`. */
function computeLineDiff(before: string, after: string): DiffLine[] {
  const a = before.split('\n');
  const b = after.split('\n');

  // LCS-based Myers-style diff via DP length table.
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array(n + 1).fill(0),
  );
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      if (a[i] === b[j]) {
        dp[i][j] = dp[i + 1][j + 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  const result: DiffLine[] = [];
  let i = 0;
  let j = 0;
  while (i < m || j < n) {
    if (i < m && j < n && a[i] === b[j]) {
      result.push({ type: 'context', text: a[i] });
      i++;
      j++;
    } else if (j < n && (i >= m || dp[i][j + 1] >= dp[i + 1][j])) {
      result.push({ type: 'added', text: b[j] });
      j++;
    } else {
      result.push({ type: 'removed', text: a[i] });
      i++;
    }
  }
  return result;
}

/** Return only the diff hunks (changed lines ± 3 context lines). */
function getHunks(lines: DiffLine[]): DiffLine[][] {
  const CONTEXT = 3;
  const changed = new Set<number>();
  lines.forEach((l, idx) => {
    if (l.type !== 'context') {
      for (let k = Math.max(0, idx - CONTEXT); k <= Math.min(lines.length - 1, idx + CONTEXT); k++) {
        changed.add(k);
      }
    }
  });
  if (changed.size === 0) return [];

  const sorted = Array.from(changed).sort((a, b) => a - b);
  const hunks: DiffLine[][] = [];
  let hunk: DiffLine[] = [];
  let prev = -2;
  for (const idx of sorted) {
    if (idx !== prev + 1 && hunk.length > 0) {
      hunks.push(hunk);
      hunk = [];
    }
    hunk.push(lines[idx]);
    prev = idx;
  }
  if (hunk.length > 0) hunks.push(hunk);
  return hunks;
}

// ─── Component ─────────────────────────────────────────────────────────────

/**
 * Props for {@link SubmitEditsDialog}.
 * @public
 */
export type SubmitEditsDialogProps = {
  /** Whether the dialog is open. */
  open: boolean;
  /** Files the user has modified in the current editing session. */
  changedFiles: EditedFile[];
  /** Original (pre-edit) content per file path. Used for the diff preview. */
  originalContents?: Map<string, string>;
  /** Called when the user dismisses the dialog without submitting. */
  onClose: () => void;
  /** Called when the user confirms a save or pull request submission. */
  onSubmit: (opts: {
    action: 'save-locally' | 'create-pull-request';
    prTitle: string;
    prDescription: string;
    commitMessage: string;
    draft: boolean;
  }) => Promise<void>;
  defaultPrTitle?: string;
  /** Whether this entity's source supports saving directly to the local filesystem. */
  canSaveLocally: boolean;
  /** Whether this entity's source supports creating a pull request in a VCS provider. */
  canCreatePullRequest: boolean;
};

/**
 * Modal dialog for composing and submitting a pull/merge request with doc edits.
 * Includes a "Review Changes" tab with a GitHub-style unified diff preview.
 * @public
 */
export function SubmitEditsDialog({
  open,
  changedFiles,
  originalContents,
  onClose,
  onSubmit,
  defaultPrTitle = 'docs: update documentation',
  canSaveLocally,
  canCreatePullRequest,
}: SubmitEditsDialogProps) {
  const [tab, setTab] = useState<'details' | 'diff'>('details');
  const [prTitle, setPrTitle] = useState(defaultPrTitle);
  const [prDescription, setPrDescription] = useState('');
  const [commitMessage, setCommitMessage] = useState(
    'docs: update via Backstage TechDocs editor',
  );
  const [draft, setDraft] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeAction, setActiveAction] = useState<
    'save-locally' | 'create-pull-request' | null
  >(null);
  const [prUrl, setPrUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (
    action: 'save-locally' | 'create-pull-request',
  ) => {
    if (action === 'create-pull-request' && !prTitle.trim()) return;
    if (action === 'create-pull-request' && !commitMessage.trim()) return;
    setLoading(true);
    setActiveAction(action);
    setError(null);
    try {
      await onSubmit({
        action,
        prTitle,
        prDescription,
        commitMessage,
        draft,
      });
    } catch (err: any) {
      if (err.status === 409 && err.conflicts) {
        setError(
          `Conflict detected on file(s): ${err.conflicts
            .map((c: any) => c.path)
            .join(', ')}. ` + `Please refresh and re-apply your changes.`,
        );
      } else {
        setError(err.message ?? 'An unexpected error occurred');
      }
    } finally {
      setLoading(false);
      setActiveAction(null);
    }
  };

  const handleClose = () => {
    setPrUrl(null);
    setError(null);
    setTab('details');
    onClose();
  };

  if (prUrl) {
    return (
      <Dialog
        isOpen={open}
        onOpenChange={o => {
          if (!o) handleClose();
        }}
        width={600}
      >
        <DialogHeader>Pull Request Opened</DialogHeader>
        <DialogBody>
          <Text as="div">
            Your changes have been submitted successfully.
          </Text>
          <ButtonLink
            className={styles.prLink}
            variant="primary"
            iconEnd={<RiExternalLinkLine size={16} />}
            href={prUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            View Pull Request
          </ButtonLink>
        </DialogBody>
        <DialogFooter>
          <Button variant="secondary" onPress={handleClose}>
            Close
          </Button>
        </DialogFooter>
      </Dialog>
    );
  }

  return (
    <Dialog
      isOpen={open}
      onOpenChange={o => {
        if (!o) handleClose();
      }}
      width={900}
    >
      <DialogHeader>
        {canSaveLocally && !canCreatePullRequest
          ? 'Save Documentation Edits'
          : 'Submit Documentation Edits'}
      </DialogHeader>

      <Tabs
        selectedKey={tab}
        onSelectionChange={k => setTab(k as 'details' | 'diff')}
      >
        <TabList>
          <Tab id="details">
            {`Details (${changedFiles.length} file${
              changedFiles.length !== 1 ? 's' : ''
            })`}
          </Tab>
          <Tab id="diff">Review Changes</Tab>
        </TabList>

        <DialogBody>
          <TabPanel id="details">
            <div className={styles.changedFiles}>
              <Text variant="body-x-small" color="secondary" as="div">
                Changed files ({changedFiles.length}):
              </Text>
              {changedFiles.map(f => (
                <Text key={f.path} className={styles.fileChip} as="div">
                  • {f.path}
                </Text>
              ))}
            </div>

            {canSaveLocally && !canCreatePullRequest && (
              <Text
                variant="body-small"
                color="secondary"
                as="div"
                style={{ marginBottom: 16 }}
              >
                These changes will be saved directly to the local filesystem. No
                pull request will be created.
              </Text>
            )}

            {canCreatePullRequest && (
              <>
                <TextField
                  className={styles.field}
                  label="Pull Request Title"
                  value={prTitle}
                  onChange={setPrTitle}
                  isRequired
                />

                <div className={styles.field}>
                  <FieldLabel
                    label="Description (optional)"
                    htmlFor="pr-desc"
                  />
                  <textarea
                    id="pr-desc"
                    className={styles.textarea}
                    rows={3}
                    value={prDescription}
                    onChange={e => setPrDescription(e.target.value)}
                    placeholder="What did you change and why?"
                  />
                </div>
              </>
            )}

            <TextField
              className={styles.field}
              label={canCreatePullRequest ? 'Commit Message' : 'Note (optional)'}
              value={commitMessage}
              onChange={setCommitMessage}
              isRequired={canCreatePullRequest}
            />

            {canCreatePullRequest && (
              <Checkbox isSelected={draft} onChange={setDraft}>
                Open as draft pull request
              </Checkbox>
            )}

            {error && (
              <Text
                color="danger"
                variant="body-small"
                as="div"
                style={{ marginTop: 8 }}
              >
                {error}
              </Text>
            )}
          </TabPanel>

          <TabPanel id="diff">
            <div style={{ paddingTop: 8 }}>
              {changedFiles.length === 0 ? (
                <Text className={styles.noChanges} as="div">
                  No changes to show.
                </Text>
              ) : (
                changedFiles.map(file => {
                  const before = originalContents?.get(file.path) ?? '';
                  const after = file.content ?? '';
                  const isNew = before === '' && file.etag === '';
                  const lines = isNew
                    ? after
                        .split('\n')
                        .map(t => ({ type: 'added' as const, text: t }))
                    : computeLineDiff(before, after);
                  const hunks = isNew ? [lines] : getHunks(lines);

                  return (
                    <div key={file.path}>
                      <div className={styles.diffFileHeader}>
                        {isNew ? '(new file) ' : ''}
                        {file.path}
                      </div>
                      <div className={styles.diffContainer}>
                        {hunks.length === 0 ? (
                          <span className={styles.noChanges}>
                            No visible differences (whitespace only?)
                          </span>
                        ) : (
                          hunks.map((hunk, hi) => (
                            <div key={hi}>
                              {hi > 0 && (
                                <span className={styles.hunkSeparator}>
                                  @@ ... @@
                                </span>
                              )}
                              {hunk.map((line, li) => (
                                <span
                                  key={li}
                                  className={
                                    line.type === 'added'
                                      ? styles.lineAdded
                                      : line.type === 'removed'
                                      ? styles.lineRemoved
                                      : styles.lineContext
                                  }
                                >
                                  {line.text}
                                </span>
                              ))}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </TabPanel>
        </DialogBody>
      </Tabs>

      <DialogFooter>
        <Button variant="secondary" onPress={handleClose} isDisabled={loading}>
          Cancel
        </Button>
        {canSaveLocally && (
          <Button
            onPress={() => handleSubmit('save-locally')}
            variant={canCreatePullRequest ? 'secondary' : 'primary'}
            isDisabled={loading}
            iconStart={<RiSaveLine size={16} />}
          >
            {loading && activeAction === 'save-locally'
              ? 'Saving…'
              : 'Save Locally'}
          </Button>
        )}
        {canCreatePullRequest && (
          <Button
            onPress={() => handleSubmit('create-pull-request')}
            variant="primary"
            isDisabled={loading || !prTitle.trim() || !commitMessage.trim()}
          >
            {loading && activeAction === 'create-pull-request'
              ? 'Submitting…'
              : 'Open Pull Request'}
          </Button>
        )}
      </DialogFooter>
    </Dialog>
  );
}
