import { PRIORITY_LABELS, type Issue } from '@domain/types';
import { StatusBadge } from './StatusBadge';
import { formatDate } from './formatDate';

interface IssueCardProps {
  issue: Issue;
  assigneeName?: string;
}

export function IssueCard({ issue, assigneeName }: IssueCardProps) {
  const titleId = `issue-${issue.id}-title`;

  return (
    <article className="issue-card" aria-labelledby={titleId}>
      <h3 id={titleId}>{issue.title}</h3>
      <StatusBadge status={issue.status} />
      <span className="priority">
        {issue.priority === 'urgent' && '🔥 '}
        {PRIORITY_LABELS[issue.priority]}
      </span>
      <p className="assignee">{assigneeName ?? 'Unassigned'}</p>
      {/* `labels.length && …` would render a literal 0 when empty. Always use a boolean. */}
      {issue.labels.length > 0 && <p className="labels">Labels: {issue.labels.join(', ')}</p>}
      <time dateTime={issue.createdAt}>{formatDate(issue.createdAt)}</time>
    </article>
  );
}
