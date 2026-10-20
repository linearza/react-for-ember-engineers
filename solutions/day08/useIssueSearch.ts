import type { Issue } from '@domain/types';
import { useDebouncedValue } from './useDebouncedValue';
import { useLocalStorage } from './useLocalStorage';

export const SEARCH_DEBOUNCE_MS = 200;

// Hooks compose: this one is just two other hooks plus a derived value.
export function useIssueSearch(issues: Issue[]) {
  const [query, setQuery] = useLocalStorage('issue-search:query', '');
  const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);
  const needle = debouncedQuery.trim().toLowerCase();
  const results = needle ? issues.filter((issue) => issue.title.toLowerCase().includes(needle)) : issues;
  return { query, setQuery, results };
}
