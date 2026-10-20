import { startTransition, useOptimistic, useState } from 'react';
import { updateIssue } from '@domain/api';
import { STATUS_LABELS, type Issue, type Status } from '@domain/types';

interface StatusToggleProps {
  issue: Issue;
}

export function StatusToggle({ issue }: StatusToggleProps) {
  const [status, setStatus] = useState<Status>(issue.status);
  // While a transition is pending, show the optimistic value. When it settles, React drops the
  // optimistic layer and shows `status` again. On failure we never call setStatus, so it "rolls back".
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(status);
  const [error, setError] = useState<string | null>(null);

  function toggle() {
    const next: Status = optimisticStatus === 'done' ? 'todo' : 'done';
    setError(null);
    startTransition(async () => {
      setOptimisticStatus(next);
      try {
        const updated = await updateIssue(issue.id, { status: next });
        startTransition(() => setStatus(updated.status));
      } catch {
        setError('Could not update status');
      }
    });
  }

  return (
    <div>
      <p>Status: {STATUS_LABELS[optimisticStatus]}</p>
      <button type="button" onClick={toggle}>
        {optimisticStatus === 'done' ? 'Reopen' : 'Mark done'}
      </button>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
