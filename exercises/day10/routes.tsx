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

// DAY 10 — React Router 8, data mode. Note: everything comes from 'react-router' (no -dom package in v8).
//
// Ember → React Router:
//   Router.map(...)          → the `routes` array at the bottom
//   model() hook             → `loader`, read with useLoaderData()
//   {{outlet}}               → <Outlet />
//   error / loading substates → `errorElement` / useNavigation().state
//   query params             → useSearchParams()
//
// TODO (the Layout, RootError, NotFound and page components are mostly done — the wiring isn't):
//   1. issuesLoader: read `?status=` from request.url and pass it to fetchIssues. Return { issues, status }.
//   2. IssuesPage: the "Status filter" <select> must update the URL via setSearchParams
//      ('all' → remove the param). It must also render an <Outlet/> for the child route.
//   3. issueLoader: fetchIssue(params.issueId). When it rejects with a 404 ApiError,
//      throw data('Issue not found', { status: 404 }).
//   4. IssueError: when isRouteErrorResponse(error) && status 404 → <p role="alert">Issue not found</p>
//   5. routes:
//        '/' → Layout (errorElement: RootError)
//          index      → loader that returns redirect('/issues')
//          'issues'   → IssuesPage + issuesLoader
//            ':issueId' → IssueDetailPage + issueLoader, errorElement: IssueError (nested, so the list stays)
//          '*'        → NotFound

export function Layout() {
  const navigation = useNavigation();
  return (
    <div className="layout">
      <header className="layout__header">
        <nav aria-label="Main">
          <NavLink to="/issues">Issues</NavLink>
        </nav>
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

export async function issuesLoader({ request }: LoaderFunctionArgs) {
  void request;
  return { issues: await fetchIssues(), status: 'all' as Status | 'all' };
}

export function IssuesPage() {
  const { issues, status } = useLoaderData<typeof issuesLoader>();
  void useSearchParams;
  void STATUSES;

  return (
    <div className="issues-page">
      <section className="issues-page__list">
        <h1>Issues</h1>
        <label>
          Status filter
          <select value={status} onChange={() => {}}>
            <option value="all">All</option>
          </select>
        </label>
        <ul className="issue-list">
          {issues.map((issue) => (
            <li key={issue.id}>
              <Link to={`/issues/${issue.id}`}>{issue.title}</Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export async function issueLoader({ params }: LoaderFunctionArgs) {
  void [ApiError, data];
  return fetchIssue(params.issueId!);
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
  return <p role="alert">Could not load this issue</p>;
}

export function NotFound() {
  return <h1>Page not found</h1>;
}

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <Layout />,
    errorElement: <RootError />,
    hydrateFallbackElement: <p>Loading…</p>,
    children: [{ path: 'issues', element: <IssuesPage />, loader: issuesLoader }],
  },
];

void redirect;
