import { STATUS_LABELS, STATUSES, type Issue } from '@domain/types';

interface IssueStatsProps {
  issues: Issue[];
}

export function IssueStats({ issues }: IssueStatsProps) {
  // You don't need an effect: this is derived data. Compute it during render, so it's never
  // stale and there's no second commit. (Ember: a getter.)
  const counts = STATUSES.map((status) => ({
    status,
    count: issues.filter((issue) => issue.status === status).length,
  }));

  return (
    <dl className="issue-stats">
      {counts.map(({ status, count }) => (
        <div key={status}>
          <dt>{STATUS_LABELS[status]}</dt>
          <dd>{count}</dd>
        </div>
      ))}
    </dl>
  );
}
