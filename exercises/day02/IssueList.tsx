import type { ReactNode } from 'react';
import type { Issue } from '@domain/types';

/*
DAY 2 — lists, keys and render props.
Ember:  {{#each @issues key="id" as |issue index|}} {{yield issue index}} {{else}} … {{/each}}

TODO:
  - When `issues` is empty, render `emptyState` if given, otherwise <p>No issues</p>.
  - Otherwise render <ul className="issue-list"> with one <li> per issue (use a proper key!).
  - Each <li> contains renderItem(issue, index) if given, otherwise just issue.title.
*/

interface IssueListProps {
  issues: Issue[];
  renderItem?: (issue: Issue, index: number) => ReactNode;
  emptyState?: ReactNode;
}

export function IssueList({ issues }: IssueListProps) {
  void issues;
  return <ul className="issue-list" />;
}
