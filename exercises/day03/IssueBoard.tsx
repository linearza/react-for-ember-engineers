import { useState } from 'react';
import { STATUS_LABELS, STATUSES, type Issue, type Status } from '@domain/types';

/*
DAY 3 — state, immutability, derived state.
This component was "ported from Ember" by someone thinking in @tracked. It has three problems:

  1. FILTERING ISN'T IMPLEMENTED. Show only issues matching the status filter AND whose title
     contains the search text (case-insensitive). Do NOT add state or an effect for the filtered
     list — derive it during render (Ember: a getter over tracked state).
     Also render "Showing X of Y".

  2. toggleDone MUTATES the issue object. The tests freeze the data, so this throws.
     Rewrite it as an immutable update.

  3. The "+2 points" button only adds 1. Why? (Hint: what is `issues` inside addPoint
     the second time it's called?) Fix it without changing the onClick.
*/

type Filter = Status | 'all';

interface IssueBoardProps {
  initialIssues: Issue[];
}

export function IssueBoard({ initialIssues }: IssueBoardProps) {
  const [issues, setIssues] = useState(initialIssues);
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');

  const visible = issues; // TODO (1)

  function toggleDone(id: string) {
    // TODO (2)
    const issue = issues.find((i) => i.id === id)!;
    issue.status = issue.status === 'done' ? 'todo' : 'done';
    setIssues([...issues]);
  }

  function addPoint(id: string) {
    // TODO (3)
    setIssues(issues.map((issue) => (issue.id === id ? { ...issue, estimate: issue.estimate + 1 } : issue)));
  }

  const filters: Filter[] = ['all', ...STATUSES];

  return (
    <div>
      <div role="group" aria-label="Status filter">
        {filters.map((f) => (
          <button key={f} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)}>
            {f === 'all' ? 'All' : STATUS_LABELS[f]}
          </button>
        ))}
      </div>

      <label>
        Search
        <input value={query} onChange={(e) => setQuery(e.target.value)} />
      </label>

      {/* TODO (1): <p>Showing {visible.length} of {issues.length}</p> */}

      <ul>
        {visible.map((issue) => (
          <li key={issue.id}>
            <label>
              <input
                type="checkbox"
                checked={issue.status === 'done'}
                onChange={() => toggleDone(issue.id)}
                aria-label={`Mark "${issue.title}" done`}
              />
              {issue.title}
            </label>{' '}
            <span>{issue.estimate} pts</span>{' '}
            <button
              type="button"
              onClick={() => {
                addPoint(issue.id);
                addPoint(issue.id);
              }}
            >
              +2 points to "{issue.title}"
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
