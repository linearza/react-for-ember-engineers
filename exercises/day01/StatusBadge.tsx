import { STATUS_LABELS, type Status } from '@domain/types';

// DAY 1 — your first component.
// TODO: render <span className="badge badge--{status}">{label}</span>
//   e.g. status 'in_progress' → <span class="badge badge--in_progress">In progress</span>
// Notes: `className`, not `class`. Any JS expression goes inside { }.

interface StatusBadgeProps {
  status: Status;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  void STATUS_LABELS;
  void status;
  return null;
}
