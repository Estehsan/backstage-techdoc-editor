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
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Tab,
  Tabs,
  TextField,
  Typography,
  makeStyles,
} from '@material-ui/core';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import SaveIcon from '@material-ui/icons/Save';
import { EditedFile } from '@estehsaan/backstage-plugin-techdocs-editor-common';

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

// ─── Styles ────────────────────────────────────────────────────────────────

const useStyles = makeStyles(theme => ({
  field: {
    marginBottom: theme.spacing(2),
  },
  changedFiles: {
    marginBottom: theme.spacing(2),
  },
  fileChip: {
    fontFamily: 'monospace',
    fontSize: '0.8rem',
    color: theme.palette.text.secondary,
  },
  prLink: {
    marginTop: theme.spacing(2),
  },
  diffContainer: {
    fontFamily: 'monospace',
    fontSize: '0.78rem',
    overflowX: 'auto',
    backgroundColor:
      theme.palette.type === 'dark' ? '#1e1e1e' : '#f6f8fa',
    borderRadius: 4,
    padding: theme.spacing(1),
    marginBottom: theme.spacing(2),
  },
  diffFileHeader: {
    fontWeight: 'bold',
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(0.5),
    color: theme.palette.text.primary,
    fontSize: '0.8rem',
    padding: theme.spacing(0.5, 1),
    backgroundColor:
      theme.palette.type === 'dark' ? '#2d2d2d' : '#e8ecf0',
    borderRadius: 2,
  },
  hunkSeparator: {
    color: theme.palette.info.main,
    padding: '0 8px',
    lineHeight: '1.6',
    userSelect: 'none',
  },
  lineAdded: {
    backgroundColor:
      theme.palette.type === 'dark' ? '#1a3a1a' : '#e6ffec',
    color: theme.palette.type === 'dark' ? '#7ec878' : '#24292f',
    display: 'block',
    padding: '0 8px',
    whiteSpace: 'pre-wrap',
    lineHeight: '1.6',
    '&::before': { content: '"+"', marginRight: 8, color: '#28a745' },
  },
  lineRemoved: {
    backgroundColor:
      theme.palette.type === 'dark' ? '#3a1a1a' : '#ffebe9',
    color: theme.palette.type === 'dark' ? '#e07070' : '#24292f',
    display: 'block',
    padding: '0 8px',
    whiteSpace: 'pre-wrap',
    lineHeight: '1.6',
    '&::before': { content: '"-"', marginRight: 8, color: '#d1242f' },
  },
  lineContext: {
    display: 'block',
    padding: '0 8px',
    whiteSpace: 'pre-wrap',
    lineHeight: '1.6',
    color: theme.palette.text.secondary,
    '&::before': { content: '" "', marginRight: 8 },
  },
  noChanges: {
    color: theme.palette.text.secondary,
    fontStyle: 'italic',
    padding: theme.spacing(1),
  },
}));

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
  const classes = useStyles();
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
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Pull Request Opened</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Your changes have been submitted successfully.
          </Typography>
          <Button
            className={classes.prLink}
            variant="contained"
            color="primary"
            endIcon={<OpenInNewIcon />}
            href={prUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            View Pull Request
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {canSaveLocally && !canCreatePullRequest
          ? 'Save Documentation Edits'
          : 'Submit Documentation Edits'}
      </DialogTitle>

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        indicatorColor="primary"
        textColor="primary"
        style={{ borderBottom: '1px solid rgba(0,0,0,0.12)', paddingLeft: 16 }}
      >
        <Tab label={`Details (${changedFiles.length} file${changedFiles.length !== 1 ? 's' : ''})`} value="details" />
        <Tab label="Review Changes" value="diff" />
      </Tabs>

      <DialogContent>
        {tab === 'details' && (
          <>
            <div className={classes.changedFiles}>
              <Typography variant="caption" color="textSecondary">
                Changed files ({changedFiles.length}):
              </Typography>
              {changedFiles.map(f => (
                <Typography
                  key={f.path}
                  className={classes.fileChip}
                  display="block"
                >
                  • {f.path}
                </Typography>
              ))}
            </div>

            {canSaveLocally && !canCreatePullRequest && (
              <Typography
                variant="body2"
                color="textSecondary"
                style={{ marginBottom: 16 }}
              >
                These changes will be saved directly to the local filesystem. No
                pull request will be created.
              </Typography>
            )}

            {canCreatePullRequest && (
              <>
                <TextField
                  className={classes.field}
                  label="Pull Request Title"
                  fullWidth
                  variant="outlined"
                  size="small"
                  value={prTitle}
                  onChange={e => setPrTitle(e.target.value)}
                  required
                />

                <TextField
                  className={classes.field}
                  label="Description (optional)"
                  fullWidth
                  variant="outlined"
                  size="small"
                  multiline
                  minRows={3}
                  value={prDescription}
                  onChange={e => setPrDescription(e.target.value)}
                  placeholder="What did you change and why?"
                />
              </>
            )}

            <TextField
              className={classes.field}
              label={canCreatePullRequest ? 'Commit Message' : 'Note (optional)'}
              fullWidth
              variant="outlined"
              size="small"
              value={commitMessage}
              onChange={e => setCommitMessage(e.target.value)}
              required={canCreatePullRequest}
            />

            {canCreatePullRequest && (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={draft}
                    onChange={e => setDraft(e.target.checked)}
                    color="primary"
                  />
                }
                label="Open as draft pull request"
              />
            )}

            {error && (
              <Typography color="error" variant="body2" style={{ marginTop: 8 }}>
                {error}
              </Typography>
            )}
          </>
        )}

        {tab === 'diff' && (
          <div style={{ paddingTop: 8 }}>
            {changedFiles.length === 0 ? (
              <Typography className={classes.noChanges}>
                No changes to show.
              </Typography>
            ) : (
              changedFiles.map(file => {
                const before = originalContents?.get(file.path) ?? '';
                const after = file.content ?? '';
                const isNew = before === '' && file.etag === '';
                const lines = isNew
                  ? (after.split('\n').map(t => ({ type: 'added' as const, text: t })))
                  : computeLineDiff(before, after);
                const hunks = isNew ? [lines] : getHunks(lines);

                return (
                  <div key={file.path}>
                    <div className={classes.diffFileHeader}>
                      {isNew ? '(new file) ' : ''}{file.path}
                    </div>
                    <div className={classes.diffContainer}>
                      {hunks.length === 0 ? (
                        <span className={classes.noChanges}>
                          No visible differences (whitespace only?)
                        </span>
                      ) : (
                        hunks.map((hunk, hi) => (
                          <div key={hi}>
                            {hi > 0 && (
                              <span className={classes.hunkSeparator}>
                                @@ ... @@
                              </span>
                            )}
                            {hunk.map((line, li) => (
                              <span
                                key={li}
                                className={
                                  line.type === 'added'
                                    ? classes.lineAdded
                                    : line.type === 'removed'
                                    ? classes.lineRemoved
                                    : classes.lineContext
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
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        {canSaveLocally && (
          <Button
            onClick={() => handleSubmit('save-locally')}
            variant={canCreatePullRequest ? 'outlined' : 'contained'}
            color="primary"
            disabled={loading}
            startIcon={<SaveIcon />}
          >
            {loading && activeAction === 'save-locally'
              ? 'Saving…'
              : 'Save Locally'}
          </Button>
        )}
        {canCreatePullRequest && (
          <Button
            onClick={() => handleSubmit('create-pull-request')}
            variant="contained"
            color="primary"
            disabled={loading || !prTitle.trim() || !commitMessage.trim()}
          >
            {loading && activeAction === 'create-pull-request'
              ? 'Submitting…'
              : 'Open Pull Request'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
