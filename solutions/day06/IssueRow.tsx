import { memo } from 'react';
import { PRIORITY_LABELS, STATUS_LABELS, type Issue } from '@domain/types';

/** Every IssueRow render pushes its issue id here. Tests read it; you can too (console.table(renderLog)). */
export const renderLog: string[] = [];

export function resetRenderLog() {
  renderLog.length = 0;
}

interface IssueRowProps {
  issue: Issue;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

// memo: skip re-rendering when every prop is Object.is-equal to last time.
// That only works because the parent passes primitives (`isSelected`) and a stable callback.
export const IssueRow = memo(function IssueRow({ issue, isSelected, onSelect }: IssueRowProps) {
  renderLog.push(issue.id);
  return (
    <tr className={isSelected ? 'is-selected' : undefined}>
      <td>{issue.title}</td>
      <td>{STATUS_LABELS[issue.status]}</td>
      <td>{PRIORITY_LABELS[issue.priority]}</td>
      <td>
        <button type="button" aria-pressed={isSelected} aria-label={`Select ${issue.title}`} onClick={() => onSelect(issue.id)}>
          {isSelected ? 'Selected' : 'Select'}
        </button>
      </td>
    </tr>
  );
});
