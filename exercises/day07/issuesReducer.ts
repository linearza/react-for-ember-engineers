import type { Issue, Status } from '@domain/types';

// DAY 7 — useReducer.
// A reducer is a pure function (state, action) → newState. Redux-style, and testable without React.
//
// TODO: handle every action IMMUTABLY (the tests freeze the state):
//   'added'         → append action.issue
//   'updated'       → merge action.patch into the issue with action.id
//   'removed'       → drop the issue with action.id
//   'statusChanged' → set action.status on the issue with action.id
//   anything else   → throw new Error(`Unknown action: ${type}`)
//
// Ember: there's no direct equivalent. Think of it as all of a service's @action methods
// collapsed into one function, with the state passed in instead of living on `this`.

export type IssuesAction =
  | { type: 'added'; issue: Issue }
  | { type: 'updated'; id: string; patch: Partial<Omit<Issue, 'id'>> }
  | { type: 'removed'; id: string }
  | { type: 'statusChanged'; id: string; status: Status };

export function issuesReducer(state: Issue[], action: IssuesAction): Issue[] {
  switch (action.type) {
    case 'added':
      state.push(action.issue); // @tracked habits die hard…
      return state;
    default:
      return state;
  }
}
