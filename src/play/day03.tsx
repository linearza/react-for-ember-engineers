import { IssueBoard } from '@ex/day03/IssueBoard';
import { freshIssues } from '@domain/seed';
import { deepFreeze } from '@domain/testing';
import type { Scenario } from './types';

export const scenarios: Scenario[] = [
  {
    title: 'IssueBoard',
    hint: 'The issues are frozen, like in the tests, so mutating one throws. Try ticking a checkbox, filtering, and "+2 points".',
    render: () => <IssueBoard initialIssues={deepFreeze(freshIssues())} />,
  },
];
