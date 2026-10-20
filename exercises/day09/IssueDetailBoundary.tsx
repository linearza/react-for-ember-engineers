import { useIssueQuery } from './queries';
import { ErrorBoundary } from './ErrorBoundary';

// DAY 9 — Suspense for data.
// This version handles loading/error inside the component, the useEffect way. Move them up:
//
// TODO:
//   - IssueDetailContent uses useIssueSuspenseQuery(id): it suspends while loading and throws on
//     error, so `data` is always defined.
//   - IssueDetailBoundary renders:
//       <QueryErrorResetBoundary>{({ reset }) =>
//         <ErrorBoundary onReset={reset} fallback={…role="alert" "Something went wrong" + "Try again" button…}>
//           <Suspense fallback={<p>Loading issue…</p>}> <IssueDetailContent id={id} /> </Suspense>
//         </ErrorBoundary>}
//       </QueryErrorResetBoundary>
//   - Why QueryErrorResetBoundary? Without it, "Try again" re-renders the child, which re-throws
//     the cached error instead of refetching.

function IssueDetailContent({ id }: { id: string }) {
  const { data: issue, isPending } = useIssueQuery(id);
  if (isPending) return <p>Loading issue…</p>;
  if (!issue) return null;
  return (
    <article>
      <h2>{issue.title}</h2>
      <p>{issue.description}</p>
    </article>
  );
}

interface IssueDetailBoundaryProps {
  id: string;
}

export function IssueDetailBoundary({ id }: IssueDetailBoundaryProps) {
  void ErrorBoundary;
  return <IssueDetailContent id={id} />;
}
