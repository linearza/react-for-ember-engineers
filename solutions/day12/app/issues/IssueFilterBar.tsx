'use client';

// The client boundary. This file and everything it imports ship to the browser.
// Its props come from a server component, so they must be serializable (strings, not functions).
import { STATUS_LABELS, STATUSES, type Status } from '@domain/types';

interface IssueFilterBarProps {
  status: Status | 'all';
}

export function IssueFilterBar({ status }: IssueFilterBarProps) {
  // A plain GET form: works without JS (submit button), and with JS it auto-submits on change.
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
