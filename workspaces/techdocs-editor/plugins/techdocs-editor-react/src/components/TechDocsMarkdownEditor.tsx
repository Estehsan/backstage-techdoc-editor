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

import { useEffect, useRef, useState } from 'react';
import { Text } from '@backstage/ui';
import '@toast-ui/editor/dist/toastui-editor.css';
import styles from './TechDocsMarkdownEditor.module.css';

// Lazy-load Toast UI to avoid SSR issues
const EditorPromise = import('@toast-ui/react-editor').then(m => m.Editor);

/**
 * Props for {@link TechDocsMarkdownEditor}.
 * @public
 */
export type TechDocsMarkdownEditorProps = {
  /** Initial markdown content */
  initialContent: string;
  /** Called when the markdown content changes */
  onChange: (markdown: string) => void;
  /** If true, show source markdown mode; false = WYSIWYG */
  sourceMode?: boolean;
};

/**
 * A WYSIWYG markdown editor wrapping Toast UI Editor.
 * Supports a source-mode toggle via the `sourceMode` prop.
 * @public
 */
export function TechDocsMarkdownEditor({
  initialContent,
  onChange,
  sourceMode = false,
}: TechDocsMarkdownEditorProps) {
  const editorRef = useRef<any>(null);
  const [EditorComponent, setEditorComponent] = useState<any>(null);
  const [editorLoadError, setEditorLoadError] = useState<string | undefined>();

  useEffect(() => {
    let mounted = true;
    EditorPromise.then(Editor => {
      if (mounted) setEditorComponent(() => Editor);
    }).catch(err => {
      if (mounted) {
        setEditorLoadError(
          `Failed to load editor: ${err?.message ?? String(err)}`,
        );
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Sync editor mode when sourceMode prop changes
  useEffect(() => {
    const instance = editorRef.current?.getInstance?.();
    if (!instance) return;
    if (sourceMode) {
      instance.changeMode('markdown');
    } else {
      instance.changeMode('wysiwyg');
    }
  }, [sourceMode]);

  if (editorLoadError) {
    return (
      <div className={styles.editorWrapper}>
        <Text color="danger" variant="body-small">
          {editorLoadError}
        </Text>
      </div>
    );
  }

  if (!EditorComponent) {
    return <div className={styles.editorWrapper}>Loading editor…</div>;
  }

  return (
    <div className={styles.editorWrapper}>
      <EditorComponent
        ref={editorRef}
        initialValue={initialContent || ' '}
        previewStyle="vertical"
        height="100%"
        initialEditType={sourceMode ? 'markdown' : 'wysiwyg'}
        useCommandShortcut
        onChange={() => {
          const instance = editorRef.current?.getInstance?.();
          if (instance) {
            onChange(instance.getMarkdown());
          }
        }}
        toolbarItems={[
          ['heading', 'bold', 'italic', 'strike'],
          ['hr', 'quote'],
          ['ul', 'ol', 'task', 'indent', 'outdent'],
          ['table', 'link'],
          ['code', 'codeblock'],
        ]}
      />
    </div>
  );
}
