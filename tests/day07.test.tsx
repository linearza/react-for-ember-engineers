import { memo, useState } from 'react';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { issuesReducer, type IssuesAction } from '@ex/day07/issuesReducer';
import { IssuesProvider, useIssues } from '@ex/day07/IssuesContext';
import { createStore, useStore } from '@ex/day07/store';
import { freshIssues } from '@domain/seed';
import { deepFreeze } from '@domain/testing';
import type { Issue } from '@domain/types';

const frozen = () => deepFreeze(freshIssues());
const newIssue: Issue = {
  id: '5',
  title: 'Write the Day 7 exercise',
  description: '',
  status: 'todo',
  priority: 'low',
  assigneeId: null,
  labels: [],
  estimate: 1,
  createdAt: '2026-10-20T08:00:00.000Z',
};

describe('Day 7 — state architecture', () => {
  describe('issuesReducer (pure, immutable)', () => {
    test('added appends without mutating', () => {
      const state = frozen();
      const next = issuesReducer(state, { type: 'added', issue: newIssue });
      expect(next).toHaveLength(5);
      expect(next).not.toBe(state);
      expect(next[4]).toEqual(newIssue);
    });

    test('updated and statusChanged replace only the target issue', () => {
      const state = frozen();
      const updated = issuesReducer(state, { type: 'updated', id: '2', patch: { title: 'Dark mode v2', estimate: 8 } });
      expect(updated[1]).toMatchObject({ id: '2', title: 'Dark mode v2', estimate: 8, status: 'in_progress' });
      expect(updated[0]).toBe(state[0]); // untouched items keep their identity

      const moved = issuesReducer(state, { type: 'statusChanged', id: '1', status: 'done' });
      expect(moved[0].status).toBe('done');
      expect(state[0].status).toBe('todo');
    });

    test('removed drops the issue', () => {
      const next = issuesReducer(frozen(), { type: 'removed', id: '3' });
      expect(next.map((i) => i.id)).toEqual(['1', '2', '4']);
    });

    test('unknown actions throw', () => {
      expect(() => issuesReducer(frozen(), { type: 'archived' } as unknown as IssuesAction)).toThrow(
        'Unknown action: archived',
      );
    });
  });

  describe('IssuesProvider + useIssues (context as a service)', () => {
    function Count() {
      const { issues } = useIssues();
      return <p>{issues.length} issues</p>;
    }
    function CloseFirst() {
      const { issues, dispatch } = useIssues();
      return (
        <button type="button" onClick={() => dispatch({ type: 'removed', id: issues[0].id })}>
          Remove first
        </button>
      );
    }

    test('consumers share state through the provider', async () => {
      const user = userEvent.setup();
      render(
        <IssuesProvider initialIssues={frozen()}>
          <Count />
          <CloseFirst />
        </IssuesProvider>,
      );
      expect(screen.getByText('4 issues')).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: 'Remove first' }));
      expect(screen.getByText('3 issues')).toBeInTheDocument();
    });

    test('the context value is memoized: an unrelated provider re-render does not re-render consumers', async () => {
      const user = userEvent.setup();
      let consumerRenders = 0;
      const Consumer = memo(function Consumer() {
        consumerRenders++;
        const { issues } = useIssues();
        return <p>{issues.length} issues</p>;
      });
      const initialIssues = frozen();
      function Shell() {
        const [clicks, setClicks] = useState(0);
        return (
          <IssuesProvider initialIssues={initialIssues}>
            <button type="button" onClick={() => setClicks((c) => c + 1)}>
              Clicked {clicks}
            </button>
            <Consumer />
          </IssuesProvider>
        );
      }
      render(<Shell />);
      await user.click(screen.getByRole('button', { name: 'Clicked 0' }));
      expect(screen.getByRole('button', { name: 'Clicked 1' })).toBeInTheDocument();
      expect(consumerRenders).toBe(1);
    });

    test('useIssues throws a helpful error outside a provider', () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(() => render(<Count />)).toThrow('useIssues must be used inside <IssuesProvider>');
    });
  });

  describe('createStore + useStore (external store with selectors)', () => {
    test('setState notifies subscribers, supports updaters, and unsubscribes', () => {
      const store = createStore({ count: 0 });
      const listener = vi.fn();
      const unsubscribe = store.subscribe(listener);
      store.setState((s) => ({ count: s.count + 1 }));
      expect(store.getState()).toEqual({ count: 1 });
      expect(listener).toHaveBeenCalledTimes(1);
      unsubscribe();
      store.setState({ count: 2 });
      expect(listener).toHaveBeenCalledTimes(1);
    });

    test('a consumer only re-renders when its selected slice changes', () => {
      const store = createStore({ filter: 'all', selectedId: null as string | null });
      const renders = { filter: 0, selection: 0 };

      function FilterLabel() {
        renders.filter++;
        const filter = useStore(store, (s) => s.filter);
        return <p>Filter: {filter}</p>;
      }
      function SelectionLabel() {
        renders.selection++;
        const selectedId = useStore(store, (s) => s.selectedId);
        return <p>Selected: {selectedId ?? 'none'}</p>;
      }

      render(
        <>
          <FilterLabel />
          <SelectionLabel />
        </>,
      );
      expect(renders).toEqual({ filter: 1, selection: 1 });

      act(() => store.setState((s) => ({ ...s, filter: 'todo' })));
      expect(screen.getByText('Filter: todo')).toBeInTheDocument();
      expect(renders).toEqual({ filter: 2, selection: 1 });

      act(() => store.setState((s) => ({ ...s, selectedId: '4' })));
      expect(screen.getByText('Selected: 4')).toBeInTheDocument();
      expect(renders).toEqual({ filter: 2, selection: 2 });
    });
  });
});
