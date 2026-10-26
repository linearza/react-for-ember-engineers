import { IssueCard } from '@ex/day01/IssueCard';
import { StatusBadge } from '@ex/day01/StatusBadge';
import { formatDate } from '@ex/day01/formatDate';
import { ISSUES } from '@domain/seed';
import { STATUSES } from '@domain/types';
import type { Scenario } from './types';

const [login, darkMode, migrate] = ISSUES;

export const scenarios: Scenario[] = [
  {
    title: 'StatusBadge, every status',
    render: () => (
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        {STATUSES.map((status) => (
          <StatusBadge key={status} status={status} />
        ))}
      </div>
    ),
  },
  {
    title: 'formatDate',
    render: () => <code>formatDate('2026-10-01T09:00:00.000Z') → {JSON.stringify(formatDate('2026-10-01T09:00:00.000Z'))}</code>,
  },
  {
    title: 'IssueCard: urgent, with labels, unassigned',
    render: () => <IssueCard issue={login} />,
  },
  {
    title: 'IssueCard: assigned, in progress',
    render: () => <IssueCard issue={darkMode} assigneeName="Grace Hopper" />,
  },
  {
    title: 'IssueCard: no labels',
    hint: 'Watch for a stray "0" here: the && trap.',
    render: () => <IssueCard issue={migrate} />,
  },
];
