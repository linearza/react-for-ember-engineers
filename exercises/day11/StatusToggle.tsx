import { useState } from 'react';
import { updateIssue } from '@domain/api';
import { STATUS_LABELS, type Issue, type Status } from '@domain/types';

// DAY 11 — useOptimistic.
// This version waits for the server before the UI changes (feels laggy at 300 ms), and a failure
// leaves the user with no feedback.
//
// TODO:
//   - const [optimisticStatus, setOptimisticStatus] = useOptimistic(status)
//   - on click: startTransition(async () => { setOptimisticStatus(next); await updateIssue(…); … })
//     The optimistic value shows IMMEDIATELY, and lasts only while the transition is pending.
//   - on success: commit the real status (setStatus inside startTransition)
//   - on failure: don't touch `status`. The optimistic value disappears by itself (that's the
//     rollback). Show <p role="alert">Could not update status</p>.
// Render "Status: {label}" from the optimistic value.

interface StatusToggleProps {
  issue: Issue;
}

export function StatusToggle({ issue }: StatusToggleProps) {
  const [status, setStatus] = useState<Status>(issue.status);

  async function toggle() {
    const next: Status = status === 'done' ? 'todo' : 'done';
    const updated = await updateIssue(issue.id, { status: next });
    setStatus(updated.status);
  }

  return (
    <div>
      <p>Status: {STATUS_LABELS[status]}</p>
      <button type="button" onClick={toggle}>
        {status === 'done' ? 'Reopen' : 'Mark done'}
      </button>
    </div>
  );
}
