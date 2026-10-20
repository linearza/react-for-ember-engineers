import { PRIORITY_LABELS, STATUS_LABELS, type Issue } from '@domain/types';

// DAY 6 — rendering performance.
// Every IssueRow render pushes its id to `renderLog`, so you (and the tests) can SEE renders.
//
// TODO: wrap IssueRow in `memo` so it skips rendering when its props are unchanged.
// On its own, memo is not enough. Read IssueTable.tsx next.
//
// Ember instinct to unlearn: Glimmer only re-evaluates the parts of a template whose tracked
// inputs changed. React re-runs the WHOLE child function whenever its parent renders, unless you opt out.

export const renderLog: string[] = [];

export function resetRenderLog() {
  renderLog.length = 0;
}

interface IssueRowProps {
  issue: Issue;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export function IssueRow({ issue, isSelected, onSelect }: IssueRowProps) {
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
}
