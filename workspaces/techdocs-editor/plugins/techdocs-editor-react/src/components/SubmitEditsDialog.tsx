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
  ButtonIcon,
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
  TooltipTrigger,
  Tooltip,
} from '@backstage/ui';
import {
  RiCheckLine,
  RiExternalLinkLine,
  RiFileCopyLine,
  RiSaveLine,
} from '@remixicon/react';
import {
  EditedFile,
  SubmitEditsResponse,
} from '@estehsaan/backstage-plugin-techdocs-editor-common';
import { DiffViewer } from './DiffViewer';
import styles from './SubmitEditsDialog.module.css';

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
  /**
   * Called when the user confirms a save or pull request submission.
   * The resolved response is used to show the "Pull Request Opened"
   * confirmation in-place — the caller should not navigate away on success.
   */
  onSubmit: (opts: {
    action: 'save-locally' | 'create-pull-request';
    prTitle: string;
    prDescription: string;
    commitMessage: string;
    draft: boolean;
  }) => Promise<SubmitEditsResponse | void>;
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
  const [copied, setCopied] = useState(false);
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
      const result = await onSubmit({
        action,
        prTitle,
        prDescription,
        commitMessage,
        draft,
      });
      if (result?.pullRequestUrl) {
        // Keep the dialog open and show the confirmation panel with the
        // link instead of navigating away — the caller must not open the
        // PR in a new tab itself.
        setPrUrl(result.pullRequestUrl);
      }
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
    setCopied(false);
    setError(null);
    setTab('details');
    onClose();
  };

  const handleCopyLink = async () => {
    if (!prUrl) return;
    try {
      await navigator.clipboard.writeText(prUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be denied by the browser; the link is still
      // visible and selectable, so this is a non-fatal no-op.
    }
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
          <Text as="div">Your changes have been submitted successfully.</Text>
          <div className={styles.prLinkRow}>
            <TextField
              className={styles.prLinkField}
              aria-label="Pull request link"
              value={prUrl}
              isReadOnly
            />
            <TooltipTrigger>
              <ButtonIcon
                aria-label="Copy pull request link"
                icon={
                  copied ? (
                    <RiCheckLine size={16} />
                  ) : (
                    <RiFileCopyLine size={16} />
                  )
                }
                onPress={handleCopyLink}
              />
              <Tooltip>{copied ? 'Copied!' : 'Copy link'}</Tooltip>
            </TooltipTrigger>
          </div>
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
              label={
                canCreatePullRequest ? 'Commit Message' : 'Note (optional)'
              }
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
              <DiffViewer
                changedFiles={changedFiles}
                originalContents={originalContents}
              />
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
