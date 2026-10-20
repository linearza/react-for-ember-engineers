// DAY 12 — the client boundary.
// TODO: this component has an event handler (onChange), so it can't be a Server Component.
// Mark the file with the 'use client' directive (first statement, above the imports).
// 'use client' doesn't mean "only runs in the browser": it still SSRs. It marks the point where
// the server tree hands over to code that is ALSO shipped to the client.
import { STATUS_LABELS, STATUSES, type Status } from '@domain/types';

interface IssueFilterBarProps {
  status: Status | 'all';
}

export function IssueFilterBar({ status }: IssueFilterBarProps) {
  return (
    <form method="get" className="filter-bar">
      <label>
        Status filter
        <select name="status" defaultValue={status} onChange={(e) => e.currentTarget.form?.requestSubmit()}>
          <option value="all">All</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </label>
      <noscript>
        <button type="submit">Apply</button>
      </noscript>
    </form>
  );
}
