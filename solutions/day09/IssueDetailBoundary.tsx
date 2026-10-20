import { Suspense } from 'react';
import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { ErrorBoundary } from './ErrorBoundary';
import { useIssueSuspenseQuery } from './queries';

function IssueDetailContent({ id }: { id: string }) {
  // Suspends while loading, throws on error. `data` is always defined here.
  const { data: issue } = useIssueSuspenseQuery(id);
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

// Loading and error handling move OUT of the component and up into the tree.
// (Ember: loading/error substates, but placed wherever you want, not just per route.)
export function IssueDetailBoundary({ id }: IssueDetailBoundaryProps) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          onReset={reset}
          fallback={({ reset: retry }) => (
            <div role="alert">
              <p>Something went wrong</p>
              <button type="button" onClick={retry}>
                Try again
              </button>
            </div>
          )}
        >
          <Suspense fallback={<p>Loading issue…</p>}>
            <IssueDetailContent id={id} />
          </Suspense>
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}
