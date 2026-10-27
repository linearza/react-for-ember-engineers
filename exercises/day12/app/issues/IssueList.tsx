/*
DAY 12 — this one is already a correct Server Component. Read it: no directive, no hooks,
no handlers, and a <form action={serverFunction}> that works without client JS.
*/
import type { Issue } from '@domain/types';
import { STATUS_LABELS } from '@domain/types';
import { updateStatusAction } from './actions';

interface IssueListProps {
  issues: Issue[];
}

export function IssueList({ issues }: IssueListProps) {
  if (issues.length === 0) return <p>No issues</p>;
  return (
    <ul className="issue-list">
      {issues.map((issue) => (
        <li key={issue.id}>
          <span>{issue.title}</span> <span className="muted">{STATUS_LABELS[issue.status]}</span>
          {issue.status !== 'done' && (
            <form action={updateStatusAction}>
              <input type="hidden" name="id" value={issue.id} />
              <input type="hidden" name="status" value="done" />
              <button type="submit">Mark “{issue.title}” done</button>
            </form>
          )}
        </li>
      ))}
    </ul>
  );
}
