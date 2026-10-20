import type { Issue, User } from './types';

export const USERS: User[] = [
  { id: 'u1', name: 'Ada Lovelace' },
  { id: 'u2', name: 'Grace Hopper' },
  { id: 'u3', name: 'Yehuda Katz' },
];

export const ISSUES: Issue[] = [
  {
    id: '1',
    title: 'Login button does nothing on Safari',
    description: 'Clicking "Log in" on Safari 18 has no effect. No console errors.',
    status: 'todo',
    priority: 'urgent',
    assigneeId: 'u1',
    labels: ['bug', 'auth'],
    estimate: 3,
    createdAt: '2026-10-01T09:00:00.000Z',
  },
  {
    id: '2',
    title: 'Add dark mode',
    description: 'Respect prefers-color-scheme and add a manual toggle.',
    status: 'in_progress',
    priority: 'medium',
    assigneeId: 'u2',
    labels: ['feature', 'ui'],
    estimate: 5,
    createdAt: '2026-10-03T14:30:00.000Z',
  },
  {
    id: '3',
    title: 'Migrate settings page off ember-data',
    description: 'Move to the new fetch layer.',
    status: 'done',
    priority: 'low',
    assigneeId: 'u3',
    labels: [],
    estimate: 8,
    createdAt: '2026-09-20T08:15:00.000Z',
  },
  {
    id: '4',
    title: 'Slow issue list with 5k items',
    description: 'Scrolling stutters once the list grows past a few thousand rows.',
    status: 'todo',
    priority: 'high',
    assigneeId: null,
    labels: ['performance'],
    estimate: 5,
    createdAt: '2026-10-10T11:45:00.000Z',
  },
];

/** Deep copy so tests and the fake API never share object identity with the seed. */
export function freshIssues(): Issue[] {
  return structuredClone(ISSUES);
}
