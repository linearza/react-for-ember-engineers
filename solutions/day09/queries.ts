import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { fetchIssue, fetchIssues, updateIssue, type IssueQuery } from '@domain/api';
import type { Status } from '@domain/types';

// Query-key factory: one place that knows the shape of every key, hierarchical so you can
// invalidate broadly (issueKeys.all) or narrowly (issueKeys.detail('2')).
export const issueKeys = {
  all: ['issues'] as const,
  lists: () => [...issueKeys.all, 'list'] as const,
  list: (filters: IssueQuery) => [...issueKeys.lists(), filters] as const,
  details: () => [...issueKeys.all, 'detail'] as const,
  detail: (id: string) => [...issueKeys.details(), id] as const,
};

export function useIssuesQuery(filters: IssueQuery = {}) {
  // Everything the queryFn depends on is in the key. Different filters = different cache entry.
  return useQuery({ queryKey: issueKeys.list(filters), queryFn: () => fetchIssues(filters) });
}

export function useIssueQuery(id: string) {
  return useQuery({ queryKey: issueKeys.detail(id), queryFn: () => fetchIssue(id) });
}

export function useIssueSuspenseQuery(id: string) {
  return useSuspenseQuery({ queryKey: issueKeys.detail(id), queryFn: () => fetchIssue(id) });
}

export function useUpdateIssueStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: Status }) => updateIssue(id, { status }),
    // Returning the promise keeps the mutation pending until the refetch is done.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: issueKeys.all }),
  });
}
