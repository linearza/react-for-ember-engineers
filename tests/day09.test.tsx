import type { ReactNode } from 'react';
import { cleanup, render, renderHook, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { issueKeys, useIssueQuery } from '@ex/day09/queries';
import { IssueListScreen } from '@ex/day09/IssueListScreen';
import { ErrorBoundary } from '@ex/day09/ErrorBoundary';
import { IssueDetailBoundary } from '@ex/day09/IssueDetailBoundary';
import { failNextRequest, getDbSnapshot } from '@domain/api';

function renderWithClient(ui: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const result = render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
  return { client, ...result };
}

const titles = () => screen.queryAllByRole('listitem').map((li) => li.querySelector('span')!.textContent);

describe('Day 9 — data fetching', () => {
  test('issueKeys is a hierarchical factory', () => {
    expect(issueKeys.all).toEqual(['issues']);
    expect(issueKeys.list({ status: 'todo' })).toEqual(['issues', 'list', { status: 'todo' }]);
    expect(issueKeys.detail('2')).toEqual(['issues', 'detail', '2']);
  });

  test('useIssueQuery caches under issueKeys.detail(id)', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { result } = renderHook(() => useIssueQuery('2'), {
      wrapper: ({ children }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>,
    });
    await waitFor(() => expect(result.current.data?.title).toBe('Add dark mode'));
    expect(client.getQueryData(issueKeys.detail('2'))).toMatchObject({ id: '2' });
  });

  describe('IssueListScreen', () => {
    test('shows a loading state, then the issues', async () => {
      renderWithClient(<IssueListScreen />);
      expect(screen.getByText('Loading issues…')).toBeInTheDocument();
      expect(await screen.findAllByRole('listitem')).toHaveLength(4);
    });

    test('filters get their own cache entries', async () => {
      const { client } = renderWithClient(
        <>
          <IssueListScreen status="todo" />
          <IssueListScreen status="done" />
        </>,
      );
      await waitFor(() => expect(screen.getAllByRole('listitem')).toHaveLength(3));
      expect(client.getQueryData(issueKeys.list({ status: 'todo' }))).toHaveLength(2);
      expect(client.getQueryData(issueKeys.list({ status: 'done' }))).toHaveLength(1);
    });

    test('shows an error with a Retry button that refetches', async () => {
      failNextRequest('Database on fire');
      const user = userEvent.setup();
      renderWithClient(<IssueListScreen />);
      const alert = await screen.findByRole('alert');
      await user.click(within(alert).getByRole('button', { name: 'Retry' }));
      expect(await screen.findAllByRole('listitem')).toHaveLength(4);
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    test('changing status mutates, invalidates, and drops the issue from a filtered list', async () => {
      const user = userEvent.setup();
      renderWithClient(<IssueListScreen status="todo" />);
      await screen.findAllByRole('listitem');
      expect(titles()).toEqual(['Login button does nothing on Safari', 'Slow issue list with 5k items']);

      await user.selectOptions(screen.getByLabelText('Status for Login button does nothing on Safari'), 'done');
      await waitFor(() => expect(titles()).toEqual(['Slow issue list with 5k items']));
      expect(getDbSnapshot().find((i) => i.id === '1')!.status).toBe('done');
    });
  });

  describe('ErrorBoundary + Suspense', () => {
    beforeEach(() => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    test('ErrorBoundary renders the fallback and can reset', async () => {
      let shouldThrow = true;
      function Bomb() {
        if (shouldThrow) throw new Error('kaboom');
        return <p>All good</p>;
      }
      const user = userEvent.setup();
      render(
        <ErrorBoundary
          fallback={({ error, reset }) => (
            <button type="button" onClick={reset}>
              {error.message}: reset
            </button>
          )}
        >
          <Bomb />
        </ErrorBoundary>,
      );
      shouldThrow = false;
      await user.click(screen.getByRole('button', { name: 'kaboom: reset' }));
      expect(screen.getByText('All good')).toBeInTheDocument();
    });

    test('IssueDetailBoundary suspends with a fallback, then shows the issue', async () => {
      renderWithClient(<IssueDetailBoundary id="2" />);
      expect(screen.getByText('Loading issue…')).toBeInTheDocument();
      expect(await screen.findByRole('heading', { name: 'Add dark mode' })).toBeInTheDocument();
      cleanup();
      // A missing issue throws past the Suspense boundary to the ErrorBoundary
      renderWithClient(<IssueDetailBoundary id="999" />);
      expect(screen.getByText('Loading issue…')).toBeInTheDocument();
      expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong');
    });

    test('"Try again" resets the boundary AND the query, and refetches', async () => {
      failNextRequest();
      const user = userEvent.setup();
      renderWithClient(<IssueDetailBoundary id="2" />);
      await user.click(await screen.findByRole('button', { name: 'Try again' }));
      expect(await screen.findByRole('heading', { name: 'Add dark mode' })).toBeInTheDocument();
    });
  });
});
