import { PRIORITY_LABELS, type Issue } from '@domain/types';
import { StatusBadge } from './StatusBadge';
import { formatDate } from './formatDate';

// DAY 1 — compose components.
// TODO: render an <article className="issue-card" aria-labelledby={titleId}> containing:
//   1. <h3 id={titleId}> with the issue title
//   2. <StatusBadge status=… />
//   3. the priority label; urgent issues are prefixed with '🔥 ' (e.g. '🔥 Urgent')
//   4. the assignee name, or 'Unassigned' when no name is passed
//   5. 'Labels: bug, auth' — but ONLY when there are labels (watch out for the `0 &&` trap!)
//   6. <time dateTime={issue.createdAt}> with formatDate(issue.createdAt)
//
// Ember → React: there is no {{if}} helper. Use `cond && <X/>`, `cond ? <A/> : <B/>`,
// or an early return. Args are just the props object — destructure it.

interface IssueCardProps {
  issue: Issue;
  assigneeName?: string;
}

export function IssueCard({ issue, assigneeName }: IssueCardProps) {
  const titleId = `issue-${issue.id}-title`;
  void [PRIORITY_LABELS, StatusBadge, formatDate, assigneeName, titleId];

  return (
    <article className="issue-card">
      <h3>{issue.title}</h3>
    </article>
  );
}
