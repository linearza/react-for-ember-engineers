import { act, renderHook } from '@testing-library/react';
import { useToggle } from '@ex/day08/useToggle';
import { useDebouncedValue } from '@ex/day08/useDebouncedValue';
import { useLocalStorage } from '@ex/day08/useLocalStorage';
import { useIssueSearch } from '@ex/day08/useIssueSearch';
import { freshIssues } from '@domain/seed';

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('Day 8 — custom hooks', () => {
  test('useToggle: toggles, sets, and keeps toggle stable', () => {
    const { result, rerender } = renderHook(() => useToggle());
    const firstToggle = result.current[1];
    expect(result.current[0]).toBe(false);

    act(() => result.current[1]());
    expect(result.current[0]).toBe(true);
    act(() => result.current[1]());
    expect(result.current[0]).toBe(false);
    act(() => result.current[2](true));
    expect(result.current[0]).toBe(true);

    rerender();
    expect(result.current[1]).toBe(firstToggle);
  });

  test('useDebouncedValue: only updates after the value settles', () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 300), {
      initialProps: { value: 'a' },
    });
    rerender({ value: 'ab' });
    act(() => vi.advanceTimersByTime(200));
    rerender({ value: 'abc' });
    act(() => vi.advanceTimersByTime(200));
    expect(result.current).toBe('a'); // the clock restarted at 'abc'
    act(() => vi.advanceTimersByTime(100));
    expect(result.current).toBe('abc');
  });

  describe('useLocalStorage', () => {
    test('reads an existing JSON value lazily, once', () => {
      localStorage.setItem('prefs', JSON.stringify({ dense: true }));
      const getItem = vi.spyOn(Storage.prototype, 'getItem');
      const { result, rerender } = renderHook(() => useLocalStorage('prefs', { dense: false }));
      rerender();
      rerender();
      expect(result.current[0]).toEqual({ dense: true });
      expect(getItem).toHaveBeenCalledTimes(1);
    });

    test('falls back to the initial value on bad JSON', () => {
      localStorage.setItem('prefs', '{not json');
      const { result } = renderHook(() => useLocalStorage('prefs', 'fallback'));
      expect(result.current[0]).toBe('fallback');
    });

    test('writes JSON on set, including updater functions', () => {
      const { result } = renderHook(() => useLocalStorage('count', 1));
      act(() => result.current[1]((n) => n + 1));
      expect(result.current[0]).toBe(2);
      expect(localStorage.getItem('count')).toBe('2');
    });
  });

  test('useIssueSearch: composes the hooks, results debounced by 200 ms', () => {
    vi.useFakeTimers();
    const issues = freshIssues();
    const { result } = renderHook(() => useIssueSearch(issues));
    expect(result.current.results).toHaveLength(4);

    act(() => result.current.setQuery('DARK'));
    expect(result.current.query).toBe('DARK');
    expect(result.current.results).toHaveLength(4); // not yet
    act(() => vi.advanceTimersByTime(200));
    expect(result.current.results.map((i) => i.title)).toEqual(['Add dark mode']);
    expect(localStorage.getItem('issue-search:query')).toBe('"DARK"');
  });

  test('useIssueSearch: restores the persisted query on mount', () => {
    localStorage.setItem('issue-search:query', JSON.stringify('safari'));
    const { result } = renderHook(() => useIssueSearch(freshIssues()));
    expect(result.current.query).toBe('safari');
    expect(result.current.results.map((i) => i.id)).toEqual(['1']);
  });
});
