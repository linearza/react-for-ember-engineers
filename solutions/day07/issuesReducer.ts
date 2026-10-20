import type { Issue, Status } from '@domain/types';

export type IssuesAction =
  | { type: 'added'; issue: Issue }
  | { type: 'updated'; id: string; patch: Partial<Omit<Issue, 'id'>> }
  | { type: 'removed'; id: string }
  | { type: 'statusChanged'; id: string; status: Status };

// A pure function: (state, action) → new state. No React in here, so it's trivially unit-testable.
export function issuesReducer(state: Issue[], action: IssuesAction): Issue[] {
  switch (action.type) {
    case 'added':
      return [...state, action.issue];
    case 'updated':
      return state.map((issue) => (issue.id === action.id ? { ...issue, ...action.patch } : issue));
    case 'removed':
      return state.filter((issue) => issue.id !== action.id);
    case 'statusChanged':
      return state.map((issue) => (issue.id === action.id ? { ...issue, status: action.status } : issue));
    default: {
      // Exhaustiveness: adding a new action type without handling it is a compile error.
      const unknown: never = action;
      throw new Error(`Unknown action: ${(unknown as { type: string }).type}`);
    }
  }
}
