import type { Issue } from '@domain/types';

interface IssueNotesProps {
  issues: Issue[];
}

export function IssueNotes({ issues }: IssueNotesProps) {
  return (
    <ul>
      {issues.map((issue) => (
        // A stable identity from the data. Never the array index for lists that reorder.
        <li key={issue.id}>
          <label>
            Note for {issue.title}
            <input />
          </label>
        </li>
      ))}
    </ul>
  );
}
