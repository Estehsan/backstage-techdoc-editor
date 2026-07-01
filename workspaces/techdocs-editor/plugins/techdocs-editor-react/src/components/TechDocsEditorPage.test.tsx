import '@testing-library/jest-dom';
import { renderInTestApp } from '@backstage/test-utils';
import { fireEvent, screen, waitFor } from '@testing-library/react';

jest.mock('react', () =>
  jest.requireActual('../../../../../../../../node_modules/react'),
);
jest.mock('react/jsx-runtime', () =>
  jest.requireActual('../../../../../../../../node_modules/react/jsx-runtime'),
);

jest.mock('@backstage/core-components', () => ({
  Progress: () => <div>Loading…</div>,
  ResponseErrorPanel: ({ error }: { error: Error }) => (
    <div>{error.message}</div>
  ),
  Header: ({ title, subtitle }: { title: string; subtitle?: string }) => (
    <div>
      <h1>{title}</h1>
      {subtitle && <div>{subtitle}</div>}
    </div>
  ),
  Page: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Content: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

jest.mock('../api', () => ({
  useTechDocsEditorApi: jest.fn(),
}));

jest.mock('./TechDocsMarkdownEditor', () => ({
  TechDocsMarkdownEditor: ({
    initialContent,
    onChange,
  }: {
    initialContent: string;
    onChange: (markdown: string) => void;
  }) => (
    <div>
      <div data-testid="mock-editor-content">{initialContent}</div>
      <button onClick={() => onChange(`${initialContent}\nEdited`)}>
        Make Edit
      </button>
    </div>
  ),
}));

import { TechDocsEditorPage } from './TechDocsEditorPage';
import { useTechDocsEditorApi } from '../api';

type MockApi = {
  getFileTree: jest.Mock;
  getMkDocsConfig: jest.Mock;
  getFile: jest.Mock;
  submitEdits: jest.Mock;
};

const mockUseTechDocsEditorApi = useTechDocsEditorApi as jest.MockedFunction<
  typeof useTechDocsEditorApi
>;

function createApi(overrides?: Partial<MockApi>): MockApi {
  return {
    getFileTree: jest.fn().mockResolvedValue({
      nodes: [{ title: 'index.md', path: 'index.md' }],
      sourceEtag: 'tree-etag',
      branch: 'main',
      docsDir: 'docs',
      canSaveLocally: true,
      canCreatePullRequest: true,
    }),
    getMkDocsConfig: jest.fn().mockResolvedValue({
      site_name: 'Test Docs',
      docs_dir: 'docs',
    }),
    getFile: jest.fn().mockResolvedValue({
      content: '# Hello',
      etag: 'etag-1',
      branch: 'main',
    }),
    submitEdits: jest
      .fn()
      .mockResolvedValue({ pullRequestUrl: 'https://example.com/pr/1' }),
    ...overrides,
  };
}

async function renderPage(api: MockApi) {
  mockUseTechDocsEditorApi.mockReturnValue(api as any);

  await renderInTestApp(
    <TechDocsEditorPage
      entityRef={{ kind: 'Component', namespace: 'default', name: 'sample' }}
    />,
  );

  await screen.findByText('Edit Docs: Test Docs');
  await waitFor(() =>
    expect(api.getFile).toHaveBeenCalledWith(
      { kind: 'Component', namespace: 'default', name: 'sample' },
      'index.md',
      'main',
    ),
  );
}

describe('TechDocsEditorPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.open = jest.fn();
  });

  it('renders without crashing', async () => {
    const api = createApi();

    await renderPage(api);

    expect(screen.getByText('Branch:')).toBeInTheDocument();
    expect(screen.getByText('main')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /submit changes/i }),
    ).toBeDisabled();
  });

  it('shows only Save Locally when local save is the only capability', async () => {
    const api = createApi({
      getFileTree: jest.fn().mockResolvedValue({
        nodes: [{ title: 'index.md', path: 'index.md' }],
        sourceEtag: 'tree-etag',
        branch: 'main',
        docsDir: 'docs',
        canSaveLocally: true,
        canCreatePullRequest: false,
      }),
    });

    await renderPage(api);

    fireEvent.click(screen.getByRole('button', { name: 'Make Edit' }));
    fireEvent.click(screen.getByRole('button', { name: /submit changes/i }));

    expect(
      screen.getByRole('button', { name: 'Save Locally' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Open Pull Request' }),
    ).not.toBeInTheDocument();
  });

  it('shows only Open Pull Request when PRs are the only capability', async () => {
    const api = createApi({
      getFileTree: jest.fn().mockResolvedValue({
        nodes: [{ title: 'index.md', path: 'index.md' }],
        sourceEtag: 'tree-etag',
        branch: 'main',
        docsDir: 'docs',
        canSaveLocally: false,
        canCreatePullRequest: true,
      }),
    });

    await renderPage(api);

    fireEvent.click(screen.getByRole('button', { name: 'Make Edit' }));
    fireEvent.click(screen.getByRole('button', { name: /submit changes/i }));

    expect(
      screen.queryByRole('button', { name: 'Save Locally' }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Open Pull Request' }),
    ).toBeInTheDocument();
  });

  it('forwards save-locally action and omits prTitle for local saves', async () => {
    const api = createApi({
      getFileTree: jest.fn().mockResolvedValue({
        nodes: [{ title: 'index.md', path: 'index.md' }],
        sourceEtag: 'tree-etag',
        branch: 'main',
        docsDir: 'docs',
        canSaveLocally: true,
        canCreatePullRequest: false,
      }),
      submitEdits: jest.fn().mockResolvedValue({
        savedLocally: true,
        savedCount: 1,
      }),
    });

    await renderPage(api);

    fireEvent.click(screen.getByRole('button', { name: 'Make Edit' }));
    fireEvent.click(screen.getByRole('button', { name: /submit changes/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Save Locally' }));

    await waitFor(() => {
      expect(api.submitEdits).toHaveBeenCalledWith(
        { kind: 'Component', namespace: 'default', name: 'sample' },
        {
          files: [
            {
              path: 'index.md',
              content: '# Hello\nEdited',
              etag: 'etag-1',
            },
          ],
          action: 'save-locally',
          prTitle: undefined,
          prDescription: '',
          commitMessage: 'docs: update via Backstage TechDocs editor',
          draft: false,
        },
      );
    });
  });
});
