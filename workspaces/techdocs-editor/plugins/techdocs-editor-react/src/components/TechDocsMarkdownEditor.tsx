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
  /**
   * Called when the user picks an image via Toast UI's built-in image
   * toolbar button. Should stage/upload the file and resolve with the URL
   * (typically a relative markdown path) and alt text to insert. If omitted,
   * Toast UI falls back to embedding the raw file as a data URI.
   */
  onUploadImage?: (file: File) => Promise<{ url: string; altText: string }>;
  /**
   * Resolves an image's markdown `destination` (as written in the doc, e.g.
   * a relative path like `./diagram.png`) to a `src` usable for preview —
   * typically a `data:` URI built from the image's actual (possibly staged)
   * content. Relative paths on their own don't resolve to anything in the
   * editor's page, so without this every inserted/existing image would show
   * as a broken-image icon. Falls back to the original destination
   * unchanged if omitted or if it returns the input unresolved (e.g. for
   * external URLs).
   */
  resolveImageSrc?: (destination: string) => string;
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
  onUploadImage,
  resolveImageSrc,
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

  // Adding toastui-editor-dark to our wrapper div makes it an ancestor of
  // all Toast UI internal elements — the dark CSS uses descendant selectors
  // like `.toastui-editor-dark .ProseMirror { color: #e8e8e8 }`, so placing
  // the class here is equivalent to the official `theme="dark"` prop but
  // also responds to live theme changes without remounting the editor.
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
          ['table', 'link', 'image'],
          ['code', 'codeblock'],
        ]}
        customHTMLRenderer={{
          // Images are written to markdown as relative paths (e.g.
          // `./diagram.png`), which is correct for the saved document, but
          // doesn't resolve to anything on the editor's own page — without
          // this override every image (existing or newly inserted) would
          // render as a broken-image icon. `resolveImageSrc` swaps in a
          // `data:` URI built from the image's actual content when one is
          // available, leaving the destination untouched otherwise (e.g.
          // external URLs).
          image: (node: any, context: any) => {
            const { destination, title } = node;
            context.skipChildren();
            const src = resolveImageSrc
              ? resolveImageSrc(destination)
              : destination;
            return {
              type: 'openTag',
              tagName: 'img',
              selfClose: true,
              attributes: {
                src,
                alt: context.getChildrenText(node),
                ...(title ? { title } : {}),
              },
            };
          },
        }}
        hooks={{
          // Route Toast UI's own "insert image" toolbar button through the
          // app's upload pipeline via `onUploadImage`, instead of letting it
          // fall back to embedding the raw file as an inline base64 data
          // URI (which isn't persisted by the backend and gets
          // lost/corrupted the next time this file is opened).
          //
          // IMPORTANT: Toast UI still performs its own default data-URI
          // embed *in addition to* calling this hook unless the hook
          // explicitly returns `false`. Without that, both insertions race:
          // the real (relative-path) image link from `onUploadImage`, and a
          // giant raw base64 payload from Toast UI's default handling —
          // which is what was corrupting documents on revisit.
          addImageBlobHook: (
            blob: Blob,
            callback: (url: string, altText: string) => void,
          ) => {
            if (!onUploadImage) return false;
            onUploadImage(blob as File)
              .then(({ url, altText }) => callback(url, altText))
              .catch(() => {
                // Swallow the error here; TechDocsEditorPage surfaces upload
                // failures via its own error state.
              });
            return false;
          },
        }}
      />
    </div>
  );
}
