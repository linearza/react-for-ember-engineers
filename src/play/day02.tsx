import { useState } from 'react';
import { Card } from '@ex/day02/Card';
import { IssueList } from '@ex/day02/IssueList';
import { IssueNotes } from '@ex/day02/IssueNotes';
import { ISSUES } from '@domain/seed';
import type { Scenario } from './types';

function NotesHarness() {
  const [reversed, setReversed] = useState(false);
  const issues = reversed ? [...ISSUES].reverse() : ISSUES;
  return (
    <>
      <button type="button" onClick={() => setReversed((r) => !r)}>
        Reverse the order
      </button>
      <IssueNotes issues={issues} />
    </>
  );
}

export const scenarios: Scenario[] = [
  {
    title: 'Card with actions and footer',
    render: () => (
      <Card title="Bugs" actions={<button type="button">Add</button>} footer={<span>4 issues</span>}>
        The card body (children)
      </Card>
    ),
  },
  {
    title: 'Card with only children',
    render: () => <Card title="Bugs">No actions, no footer</Card>,
  },
  {
    title: 'IssueList with a renderItem',
    render: () => (
      <IssueList
        issues={ISSUES}
        renderItem={(issue, index) => (
          <>
            {index + 1}. <strong>{issue.title}</strong>
          </>
        )}
      />
    ),
  },
  {
    title: 'IssueList, empty',
    render: () => <IssueList issues={[]} emptyState={<p>Nothing to see here</p>} />,
  },
  {
    title: 'IssueNotes: the key bug',
    hint: 'Type a note on the first issue, then reverse the order. Does the note stay with its issue?',
    render: () => <NotesHarness />,
  },
];
