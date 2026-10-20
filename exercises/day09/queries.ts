import { useMutation, useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { fetchIssue, fetchIssues, updateIssue, type IssueQuery } from '@domain/api';
import type { Status } from '@domain/types';

// DAY 9 — TanStack Query: the server-state cache.
// Ember: the ember-data / WarpDrive store, but keyed by *query* instead of by type+id, with
// stale-while-revalidate, dedupe and invalidation built in.
//
// TODO:
//   1. issueKeys: a hierarchical key factory.
//        all → ['issues'], lists() → ['issues','list'], list(f) → ['issues','list',f],
//        details() → ['issues','detail'], detail(id) → ['issues','detail',id]
//   2. useIssuesQuery: the key ignores `filters`, so every filter shares ONE cache entry.
//      Use issueKeys.list(filters).
//   3. useIssueQuery / useIssueSuspenseQuery: use issueKeys.detail(id).
//   4. useUpdateIssueStatus: after a successful mutation nothing refetches, so the list goes stale.
//      Invalidate issueKeys.all in onSuccess (useQueryClient) and return that promise.

export const issueKeys = {
  all: ['issues'] as const,
  lists: (): readonly unknown[] => issueKeys.all, // TODO
  list: (filters: IssueQuery): readonly unknown[] => (void filters, issueKeys.all), // TODO
  details: (): readonly unknown[] => issueKeys.all, // TODO
  detail: (id: string): readonly unknown[] => (void id, issueKeys.all), // TODO
};

export function useIssuesQuery(filters: IssueQuery = {}) {
  return useQuery({ queryKey: ['issues'], queryFn: () => fetchIssues(filters) });
}

export function useIssueQuery(id: string) {
  return useQuery({ queryKey: ['issue', id], queryFn: () => fetchIssue(id) });
}

export function useIssueSuspenseQuery(id: string) {
  return useSuspenseQuery({ queryKey: ['issue', id], queryFn: () => fetchIssue(id) });
}

export function useUpdateIssueStatus() {
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: Status }) => updateIssue(id, { status }),
  });
}
