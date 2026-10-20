import type { Issue } from '@domain/types';

// DAY 2 — BUG HUNT.
// Each issue has a free-text note input. Type a note, then re-sort the list (the parent passes the
// issues in a new order) and the note "jumps" to a different issue. Find and fix the bug.
//
// Interview question hiding in here: "Why shouldn't you use the array index as a key?"

interface IssueNotesProps {
  issues: Issue[];
}

export function IssueNotes({ issues }: IssueNotesProps) {
  return (
    <ul>
      {issues.map((issue, index) => (
        <li key={index}>
          <label>
            Note for {issue.title}
            <input />
          </label>
        </li>
      ))}
    </ul>
  );
}
