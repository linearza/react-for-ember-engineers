import { STATUS_LABELS, type Status } from '@domain/types';

interface StatusBadgeProps {
  status: Status;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return <span className={`badge badge--${status}`}>{STATUS_LABELS[status]}</span>;
}
