import { useState } from 'react';
import { STATUS_LABELS, STATUSES, type Issue, type Status } from '@domain/types';

type Filter = Status | 'all';

interface IssueBoardProps {
  initialIssues: Issue[];
}

export function IssueBoard({ initialIssues }: IssueBoardProps) {
  // `initialIssues` is only read on the first render — the "initial" prefix signals that.
  const [issues, setIssues] = useState(initialIssues);
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');

  // Derived state: computed during render. No useState, no useEffect. (Ember: a getter.)
  const visible = issues.filter(
    (issue) =>
      (filter === 'all' || issue.status === filter) &&
      issue.title.toLowerCase().includes(query.trim().toLowerCase()),
  );

  function toggleDone(id: string) {
    // Immutable update: new array, new object for the changed item.
    setIssues((prev) =>
      prev.map((issue) =>
        issue.id === id ? { ...issue, status: issue.status === 'done' ? 'todo' : 'done' } : issue,
      ),
    );
  }

  function addPoint(id: string) {
    // Updater function: reads the latest queued state, so calling it twice adds 2.
    setIssues((prev) =>
      prev.map((issue) => (issue.id === id ? { ...issue, estimate: issue.estimate + 1 } : issue)),
    );
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

      <p>
        Showing {visible.length} of {issues.length}
      </p>

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
