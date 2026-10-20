import { STATUS_LABELS, STATUSES, type Status } from '@domain/types';
import { useIssuesQuery, useUpdateIssueStatus } from './queries';

interface IssueListScreenProps {
  status?: Status | 'all';
}

export function IssueListScreen({ status = 'all' }: IssueListScreenProps) {
  const { data, isPending, isError, refetch } = useIssuesQuery({ status });
  const updateStatus = useUpdateIssueStatus();

  if (isPending) return <p>Loading issues…</p>;
  if (isError) {
    return (
      <div role="alert">
        <p>Could not load issues.</p>
        <button type="button" onClick={() => refetch()}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <ul className="issue-list">
      {data.map((issue) => (
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
