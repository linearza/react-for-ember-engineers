import { useCallback, useState } from 'react';
import type { Issue } from '@domain/types';
import { IssueRow } from './IssueRow';

interface IssueTableProps {
  issues: Issue[];
}

export function IssueTable({ issues }: IssueTableProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

  // Same function identity on every render, so memo(IssueRow) can bail out.
  // (`setSelectedId` itself is already stable; the useCallback shows the general pattern.)
  const handleSelect = useCallback((id: string) => setSelectedId(id), []);

  return (
    <div>
      {/* Alternative fix for the typing case: move this input + its state into its own
          <DraftNote/> component. Then typing never re-renders IssueTable at all ("move state down"). */}
      <label>
        Draft note
        <input value={draft} onChange={(e) => setDraft(e.target.value)} />
      </label>
      <table>
        <thead>
          <tr>
            <th>Title</th>
            <th>Status</th>
            <th>Priority</th>
            <th>
              <span className="visually-hidden">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {issues.map((issue) => (
            <IssueRow key={issue.id} issue={issue} isSelected={issue.id === selectedId} onSelect={handleSelect} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
