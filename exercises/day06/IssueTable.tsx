import { useState } from 'react';
import type { Issue } from '@domain/types';
import { IssueRow } from './IssueRow';

/*
DAY 6 — referential stability.
Two complaints from users:
  - typing in "Draft note" re-renders EVERY row (watch renderLog)
  - selecting a row re-renders every row, when only the old and new selected rows changed

TODO:
  1. memo(IssueRow) (see IssueRow.tsx)
  2. The inline arrow below is a NEW function on every render, which defeats memo.
     Make it stable with useCallback.
  Goal: typing → 0 row renders. Selecting row 2 → only ['2']. Then row 4 → ['2', '4'].

Then think: could you fix the typing case WITHOUT memo, by moving state down?
*/

interface IssueTableProps {
  issues: Issue[];
}

export function IssueTable({ issues }: IssueTableProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

  return (
    <div>
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
            <IssueRow
              key={issue.id}
              issue={issue}
              isSelected={issue.id === selectedId}
              onSelect={(id) => setSelectedId(id)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
