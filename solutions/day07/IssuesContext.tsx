import { createContext, useContext, useMemo, useReducer, type Dispatch, type ReactNode } from 'react';
import type { Issue } from '@domain/types';
import { issuesReducer, type IssuesAction } from './issuesReducer';

interface IssuesContextValue {
  issues: Issue[];
  dispatch: Dispatch<IssuesAction>;
}

// `null` default: there is no sensible value outside a provider, so make that case loud.
const IssuesContext = createContext<IssuesContextValue | null>(null);

interface IssuesProviderProps {
  initialIssues: Issue[];
  children: ReactNode;
}

export function IssuesProvider({ initialIssues, children }: IssuesProviderProps) {
  const [issues, dispatch] = useReducer(issuesReducer, initialIssues);
  // Without useMemo the value is a new object on every provider render, and every consumer re-renders.
  const value = useMemo(() => ({ issues, dispatch }), [issues]);
  // React 19: <Context> is the provider (no `.Provider` needed).
  return <IssuesContext value={value}>{children}</IssuesContext>;
}

export function useIssues(): IssuesContextValue {
  const value = useContext(IssuesContext);
  if (!value) throw new Error('useIssues must be used inside <IssuesProvider>');
  return value;
}
