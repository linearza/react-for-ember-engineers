import type { Issue } from '@domain/types';

// DAY 8 — composing hooks.
// TODO: return { query, setQuery, results }
//   - `query` persists via useLocalStorage('issue-search:query', '')
//   - `results` filter `issues` by title (case-insensitive, trimmed), using the query debounced by
//     SEARCH_DEBOUNCE_MS via useDebouncedValue. An empty query returns every issue.
// No new state for `results`: derive it.

export const SEARCH_DEBOUNCE_MS = 200;

export function useIssueSearch(issues: Issue[]) {
  return { query: '', setQuery: (query: string) => void query, results: issues };
}
