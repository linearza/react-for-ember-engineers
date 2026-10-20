import {
  Link,
  NavLink,
  Outlet,
  data,
  isRouteErrorResponse,
  redirect,
  useLoaderData,
  useNavigation,
  useRouteError,
  useSearchParams,
  type LoaderFunctionArgs,
  type RouteObject,
} from 'react-router';
import { ApiError, fetchIssue, fetchIssues } from '@domain/api';
import { STATUS_LABELS, STATUSES, type Status } from '@domain/types';

// Ember: application.hbs with {{outlet}}.
export function Layout() {
  const navigation = useNavigation();
  return (
    <div className="layout">
      <header className="layout__header">
        <nav aria-label="Main">
          <NavLink to="/issues">Issues</NavLink>
        </nav>
        {/* Ember: the loading substate. Here, the old page stays up while the next one loads. */}
        {navigation.state === 'loading' && <span className="spinner">Loading…</span>}
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}

export function RootError() {
  const error = useRouteError();
  return (
    <div role="alert">
      <h1>Something went wrong</h1>
      <p>{isRouteErrorResponse(error) ? `${error.status} ${error.statusText}` : String(error)}</p>
    </div>
  );
}

function parseStatus(value: string | null): Status | 'all' {
  return value && (STATUSES as string[]).includes(value) ? (value as Status) : 'all';
}

// Ember: the route's model() hook. Runs before the route renders, in parallel with sibling loaders.
export async function issuesLoader({ request }: LoaderFunctionArgs) {
  const status = parseStatus(new URL(request.url).searchParams.get('status'));
  return { issues: await fetchIssues({ status }), status };
}

export function IssuesPage() {
  const { issues, status } = useLoaderData<typeof issuesLoader>();
  // Ember: query params on the controller. Here the URL *is* the state: shareable, back-button friendly.
  const [, setSearchParams] = useSearchParams();

  return (
    <div className="issues-page">
      <section className="issues-page__list">
        <h1>Issues</h1>
        <label>
          Status filter
          <select
            value={status}
            onChange={(e) => setSearchParams(e.target.value === 'all' ? {} : { status: e.target.value })}
          >
            <option value="all">All</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </label>
        <ul className="issue-list">
          {issues.map((issue) => (
            <li key={issue.id}>
              <Link to={`/issues/${issue.id}${status === 'all' ? '' : `?status=${status}`}`}>{issue.title}</Link>
            </li>
          ))}
        </ul>
      </section>
      <section className="issues-page__detail">
        <Outlet />
      </section>
    </div>
  );
}

export async function issueLoader({ params }: LoaderFunctionArgs) {
  try {
    return await fetchIssue(params.issueId!);
  } catch (error) {
    // Turn a domain 404 into a route 404: errorElement can tell it apart with isRouteErrorResponse.
    if (error instanceof ApiError && error.status === 404) {
      throw data('Issue not found', { status: 404 });
    }
    throw error;
  }
}

export function IssueDetailPage() {
  const issue = useLoaderData<typeof issueLoader>();
  return (
    <article>
      <h2>{issue.title}</h2>
      <p>{STATUS_LABELS[issue.status]}</p>
      <p>{issue.description}</p>
    </article>
  );
}

export function IssueError() {
  const error = useRouteError();
  if (isRouteErrorResponse(error) && error.status === 404) {
    return <p role="alert">Issue not found</p>;
  }
  return <p role="alert">Could not load this issue</p>;
}

export function NotFound() {
  return <h1>Page not found</h1>;
}

// Ember: Router.map(function () { this.route('issues', function () { this.route('issue', { path: ':issue_id' }) }) })
export const routes: RouteObject[] = [
  {
    path: '/',
    element: <Layout />,
    errorElement: <RootError />,
    hydrateFallbackElement: <p>Loading…</p>,
    children: [
      { index: true, loader: () => redirect('/issues') },
      {
        path: 'issues',
        element: <IssuesPage />,
        loader: issuesLoader,
        children: [
          // The child's errorElement replaces only the child's <Outlet/>; the list stays visible.
          { path: ':issueId', element: <IssueDetailPage />, loader: issueLoader, errorElement: <IssueError /> },
        ],
      },
      { path: '*', element: <NotFound /> },
    ],
  },
];
