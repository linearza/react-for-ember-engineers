import { useState } from 'react';
import { QueryClient, QueryClientProvider, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Link,
  NavLink,
  Outlet,
  RouterProvider,
  createBrowserRouter,
  createMemoryRouter,
  redirect,
  useParams,
  useSearchParams,
  type RouteObject,
} from 'react-router';
import { createIssue, fetchUsers } from '@domain/api';
import { STATUS_LABELS, STATUSES, type NewIssue, type Status } from '@domain/types';
// Earlier days, through the @ex switch, so this file runs against your work OR the solutions.
import { IssueCard } from '@ex/day01/IssueCard';
import { StatusBadge } from '@ex/day01/StatusBadge';
import { NewIssueForm } from '@ex/day04/NewIssueForm';
import { issueKeys, useIssueQuery, useIssuesQuery, useUpdateIssueStatus } from '@ex/day09/queries';
import { NotFound, RootError } from '@ex/day10/routes';
import { Modal } from '@ex/day14/Modal';

function useUsers() {
  return useQuery({ queryKey: ['users'], queryFn: fetchUsers, staleTime: Infinity });
}

function useCreateIssue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NewIssue) => createIssue(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: issueKeys.all }),
  });
}

function Layout() {
  const [creating, setCreating] = useState(false);
  const { data: users = [] } = useUsers();
  const create = useCreateIssue();

  return (
    <div className="layout">
      <header className="layout__header">
        <Link to="/issues" className="brand">
          Tracker
        </Link>
        <nav aria-label="Main">
          <NavLink to="/issues">Issues</NavLink>
        </nav>
        <button type="button" className="button button--primary" onClick={() => setCreating(true)}>
          New issue
        </button>
      </header>
      <main>
        <Outlet />
      </main>
      <Modal open={creating} onClose={() => setCreating(false)} title="New issue">
        <NewIssueForm users={users} onCreate={(input) => create.mutate(input, { onSuccess: () => setCreating(false) })} />
        {create.isError && <p role="alert">{create.error.message}</p>}
      </Modal>
    </div>
  );
}

function parseStatus(value: string | null): Status | 'all' {
  return value && (STATUSES as string[]).includes(value) ? (value as Status) : 'all';
}

function IssuesScreen() {
  const [searchParams, setSearchParams] = useSearchParams();
  const status = parseStatus(searchParams.get('status'));
  const { data: issues, isPending, isError, refetch } = useIssuesQuery({ status });
  const { data: users = [] } = useUsers();
  const nameOf = (id: string | null) => users.find((u) => u.id === id)?.name;

  return (
    <div className="issues-page">
      <section className="issues-page__list">
        <div className="toolbar">
          <h1>Issues</h1>
          <label>
            Status filter
            <select
              value={status}
              onChange={(e) =>
                setSearchParams((prev) => {
                  const next = new URLSearchParams(prev);
                  if (e.target.value === 'all') next.delete('status');
                  else next.set('status', e.target.value);
                  return next;
                })
              }
            >
              <option value="all">All</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </label>
        </div>
        {isPending && <p>Loading issues…</p>}
        {isError && (
          <div role="alert">
            <p>Could not load issues.</p>
            <button type="button" onClick={() => refetch()}>
              Retry
            </button>
          </div>
        )}
        {issues && (
          <ul className="issue-grid">
            {issues.map((issue) => (
              <li key={issue.id}>
                <Link to={{ pathname: `/issues/${issue.id}`, search: searchParams.toString() }} className="card-link">
                  <IssueCard issue={issue} assigneeName={nameOf(issue.assigneeId)} />
                </Link>
              </li>
            ))}
          </ul>
        )}
        {issues?.length === 0 && <p className="muted">No issues</p>}
      </section>
      <aside className="issues-page__detail">
        <Outlet />
      </aside>
    </div>
  );
}

function IssueDetailScreen() {
  const { issueId } = useParams();
  const { data: issue, isPending, isError } = useIssueQuery(issueId!);
  const updateStatus = useUpdateIssueStatus();

  if (isPending) return <p>Loading issue…</p>;
  if (isError) return <p role="alert">Issue not found</p>;

  return (
    <article className="detail" aria-labelledby="detail-title">
      <h2 id="detail-title">{issue.title}</h2>
      <StatusBadge status={issue.status} />
      <p>{issue.description || <span className="muted">No description.</span>}</p>
      <label>
        Status
        <select
          value={issue.status}
          disabled={updateStatus.isPending}
          onChange={(e) => updateStatus.mutate({ id: issue.id, status: e.target.value as Status })}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </label>
    </article>
  );
}

const routes: RouteObject[] = [
  {
    path: '/',
    element: <Layout />,
    errorElement: <RootError />,
    children: [
      { index: true, loader: () => redirect('/issues') },
      { path: 'issues', element: <IssuesScreen />, children: [{ path: ':issueId', element: <IssueDetailScreen /> }] },
      { path: '*', element: <NotFound /> },
    ],
  },
];

interface AppRootProps {
  /** Given → memory router (tests). Omitted → browser router (the dev app). */
  initialEntries?: string[];
}

export function AppRoot({ initialEntries }: AppRootProps) {
  // useState, not module scope and not a plain `new` in render: one client and one router per
  // mounted app, created once. Module scope would leak cache between tests.
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: false } } }));
  const [router] = useState(() =>
    initialEntries
      ? createMemoryRouter(routes, { initialEntries })
      : createBrowserRouter(routes, { basename: import.meta.env.BASE_URL }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
