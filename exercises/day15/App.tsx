// DAY 15 — capstone. Assemble the app from what you built.
//
// TODO: export AppRoot({ initialEntries? }) that renders the whole issue tracker:
//   - a QueryClient held in useState(() => new QueryClient(…)) and a <QueryClientProvider>
//   - a router held in useState too: createMemoryRouter(routes, { initialEntries }) when
//     initialEntries is given (tests), otherwise
//     createBrowserRouter(routes, { basename: import.meta.env.BASE_URL }) (pnpm start serves
//     your app under /app/, pnpm dev at /)
//   - Day 10's route structure: '/' Layout (+ RootError) → index redirect to /issues →
//     'issues' (list + <Outlet/>) → ':issueId' (detail), and '*' NotFound
//   - data through Day 9's hooks (useIssuesQuery, useIssueQuery, useUpdateIssueStatus), not loaders
//   - the list: a "Status filter" <select> bound to ?status=, each issue a Day 1 <IssueCard> inside a <Link>
//   - the detail: an <h2> title, a Day 1 <StatusBadge>, and a "Status" <select> that calls the mutation
//   - a "New issue" button in the layout that opens Day 14's <Modal title="New issue"> with Day 4's
//     <NewIssueForm>. On create: createIssue, invalidate issueKeys.all, close the modal.
// Import earlier days through '@ex/dayNN/…' (never relative paths), so the SOLUTIONS switch works.
//
// Ember: this is your app/router.js + application template + a few routes, all in one file.
// Split it up if you like; only AppRoot's export and props are fixed.

interface AppRootProps {
  initialEntries?: string[];
}

export function AppRoot({ initialEntries }: AppRootProps) {
  void initialEntries;
  return <p>TODO: build the capstone (exercises/day15/App.tsx)</p>;
}
