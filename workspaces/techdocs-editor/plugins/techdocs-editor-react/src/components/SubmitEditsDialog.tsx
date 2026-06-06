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
  TextField,
  Typography,
  makeStyles,
} from '@material-ui/core';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import SaveIcon from '@material-ui/icons/Save';
import { EditedFile } from '@estehsaan/backstage-plugin-techdocs-editor-common';

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
}));

/**
 * Props for {@link SubmitEditsDialog}.
 * @public
 */
export type SubmitEditsDialogProps = {
  /** Whether the dialog is open. */
  open: boolean;
  /** Files the user has modified in the current editing session. */
  changedFiles: EditedFile[];
  /** Called when the user dismisses the dialog without submitting. */
  onClose: () => void;
  /** Called when the user confirms their PR details. */
  onSubmit: (opts: {
    prTitle: string;
    prDescription: string;
    commitMessage: string;
    draft: boolean;
  }) => Promise<void>;
  defaultPrTitle?: string;
  /**
   * If true, hide PR fields and show simplified local save UI.
   * Local sources write files directly to disk without creating PRs.
   */
  isLocalSource?: boolean;
};

/**
 * Modal dialog for composing and submitting a pull/merge request with doc edits.
 * @public
 */
export function SubmitEditsDialog({
  open,
  changedFiles,
  onClose,
  onSubmit,
  defaultPrTitle = 'docs: update documentation',
  isLocalSource = false,
}: SubmitEditsDialogProps) {
  const classes = useStyles();
  const [prTitle, setPrTitle] = useState(defaultPrTitle);
  const [prDescription, setPrDescription] = useState('');
  const [commitMessage, setCommitMessage] = useState(
    'docs: update via Backstage TechDocs editor',
  );
  const [draft, setDraft] = useState(false);
  const [loading, setLoading] = useState(false);
  const [prUrl, setPrUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    // For local sources, neither prTitle nor commitMessage are required
    if (!isLocalSource && !prTitle.trim()) return;
    if (!isLocalSource && !commitMessage.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await onSubmit({ prTitle, prDescription, commitMessage, draft });
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
    }
  };

  const handleClose = () => {
    setPrUrl(null);
    setError(null);
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
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {isLocalSource ? 'Save Documentation Edits' : 'Submit Documentation Edits'}
      </DialogTitle>
      <DialogContent>
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

        {isLocalSource && (
          <Typography
            variant="body2"
            color="textSecondary"
            style={{ marginBottom: 16 }}
          >
            These changes will be saved directly to the local filesystem. No
            pull request will be created.
          </Typography>
        )}

        {!isLocalSource && (
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
          label={isLocalSource ? 'Note (optional)' : 'Commit Message'}
          fullWidth
          variant="outlined"
          size="small"
          value={commitMessage}
          onChange={e => setCommitMessage(e.target.value)}
          required={!isLocalSource}
        />

        {!isLocalSource && (
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
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          color="primary"
          variant="contained"
          disabled={
            loading ||
            (!isLocalSource && !prTitle.trim()) ||
            (!isLocalSource && !commitMessage.trim())
          }
          startIcon={isLocalSource ? <SaveIcon /> : undefined}
        >
          {loading
            ? isLocalSource
              ? 'Saving…'
              : 'Submitting…'
            : isLocalSource
              ? 'Save to Disk'
              : 'Open Pull Request'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
