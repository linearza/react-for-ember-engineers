import { useEffect, useState } from 'react';
import { STATUS_LABELS, STATUSES, type Issue, type Status } from '@domain/types';

// DAY 5 — "You Might Not Need an Effect".
// This shows the right numbers, but it renders twice on mount: once with zeros, then again after
// the effect sets the counts. For one frame the UI is wrong, and the extra commit is wasted work.
//
// TODO: delete the state and the effect. Compute the counts during render.
// Ember: this is a getter, not an observer.
// Renders a <dl> with one <dt>{label}</dt><dd>{count}</dd> pair per status.

interface IssueStatsProps {
  issues: Issue[];
}

const ZERO: Record<Status, number> = { todo: 0, in_progress: 0, done: 0 };

export function IssueStats({ issues }: IssueStatsProps) {
  const [counts, setCounts] = useState<Record<Status, number>>(ZERO);

  useEffect(() => {
    const next = { ...ZERO };
    for (const issue of issues) next[issue.status]++;
    setCounts(next);
  }, [issues]);

  return (
    <dl className="issue-stats">
      {STATUSES.map((status) => (
        <div key={status}>
          <dt>{STATUS_LABELS[status]}</dt>
          <dd>{counts[status]}</dd>
        </div>
      ))}
    </dl>
  );
}
