import type { ReactNode } from 'react';
import type { Issue } from '@domain/types';

// Ember: {{yield issue}} with block params → a "render prop": a function prop that returns JSX.
interface IssueListProps {
  issues: Issue[];
  renderItem?: (issue: Issue, index: number) => ReactNode;
  emptyState?: ReactNode;
}

export function IssueList({ issues, renderItem, emptyState }: IssueListProps) {
  if (issues.length === 0) {
    return <>{emptyState ?? <p>No issues</p>}</>;
  }

  return (
    <ul className="issue-list">
      {issues.map((issue, index) => (
        <li key={issue.id}>{renderItem ? renderItem(issue, index) : issue.title}</li>
      ))}
    </ul>
  );
}
