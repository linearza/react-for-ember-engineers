import { STATUS_LABELS, STATUSES, type Status } from '@domain/types';
import { useIssuesQuery, useUpdateIssueStatus } from './queries';

/*
DAY 9 — rendering query state.
Ember: ember-concurrency's `task.isRunning` / `task.last.error` → the query's status fields.

TODO:
  - while pending: <p>Loading issues…</p>
  - on error: a role="alert" container with a "Retry" button that calls refetch()
  - otherwise the list (already here). Each <select> is labelled `Status for {title}` and calls
    the mutation. Once queries.ts invalidates, an issue moved out of the filter disappears.
*/

interface IssueListScreenProps {
  status?: Status | 'all';
}

export function IssueListScreen({ status = 'all' }: IssueListScreenProps) {
  const { data } = useIssuesQuery({ status });
  const updateStatus = useUpdateIssueStatus();

  return (
    <ul className="issue-list">
      {data?.map((issue) => (
        <li key={issue.id}>
          <span>{issue.title}</span>{' '}
          <select
            aria-label={`Status for ${issue.title}`}
            value={issue.status}
            onChange={(e) => updateStatus.mutate({ id: issue.id, status: e.target.value as Status })}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </li>
      ))}
    </ul>
  );
}
