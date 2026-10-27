import { createContext, useContext, useReducer, type Dispatch, type ReactNode } from 'react';
import type { Issue } from '@domain/types';
import { issuesReducer, type IssuesAction } from './issuesReducer';

/*
DAY 7 — Context as "a service".
Ember: @service issues → a singleton from the DI container, the same instance everywhere.
React: there is no container. A provider puts a value into the TREE, and only its
descendants can read it. Two providers = two independent "services".

TODO:
  1. useIssues() must throw new Error('useIssues must be used inside <IssuesProvider>') when
     there's no provider above it. Right now it silently returns null.
  2. Memoize the context value (useMemo) so consumers don't re-render whenever the provider does.
*/

interface IssuesContextValue {
  issues: Issue[];
  dispatch: Dispatch<IssuesAction>;
}

const IssuesContext = createContext<IssuesContextValue | null>(null);

interface IssuesProviderProps {
  initialIssues: Issue[];
  children: ReactNode;
}

export function IssuesProvider({ initialIssues, children }: IssuesProviderProps) {
  const [issues, dispatch] = useReducer(issuesReducer, initialIssues);
  return <IssuesContext value={{ issues, dispatch }}>{children}</IssuesContext>;
}

export function useIssues(): IssuesContextValue {
  return useContext(IssuesContext)!;
}
