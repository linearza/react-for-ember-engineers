import { PRIORITY_LABELS, type Issue } from '@domain/types';
import { StatusBadge } from './StatusBadge';
import { formatDate } from './formatDate';

// DAY 1 — compose components.
// TODO: render an <article className="issue-card" aria-labelledby={titleId}> containing,
// in this order, as direct children:
//   1. <h3 id={titleId}> with the issue title
//   2. <StatusBadge status={issue.status} />
//   3. <span className="priority"> with the priority's display label from PRIORITY_LABELS
//      (e.g. 'High'). Urgent issues get '🔥 ' in front, inside the same span: '🔥 Urgent'.
//   4. <p className="assignee"> with the `assigneeName` prop, or 'Unassigned' when it's missing
//   5. <p className="labels"> with 'Labels: ' + the labels joined by ', ' (e.g. 'Labels: bug, auth').
//      Leave this <p> out entirely when the issue has no labels, and make sure no stray '0'
//      shows up instead (the `0 &&` trap!)
//   6. <time dateTime={issue.createdAt}> with formatDate(issue.createdAt)
//
// The finished result looks like this:
//
//   <IssueCard issue={urgentLoginBug} assigneeName="Ada Lovelace" />
//     <article class="issue-card" aria-labelledby="issue-1-title">
//       <h3 id="issue-1-title">Login button does nothing on Safari</h3>
//       <span class="badge badge--todo">To do</span>
//       <span class="priority">🔥 Urgent</span>
//       <p class="assignee">Ada Lovelace</p>
//       <p class="labels">Labels: bug, auth</p>
//       <time datetime="2026-10-01T09:00:00.000Z">Oct 1, 2026</time>
//     </article>
//
//   <IssueCard issue={unlabelledHighIssue} />   (no assigneeName, labels: [])
//     <article …>
//       <h3 …>…</h3>
//       <span class="badge …">…</span>
//       <span class="priority">High</span>
//       <p class="assignee">Unassigned</p>
//       <time …>…</time>
//     </article>
//
// Ember → React: there is no {{if}} helper. Use `cond && <X/>`, `cond ? <A/> : <B/>`,
// or an early return. Args are just the props object — destructure it.

interface IssueCardProps {
  issue: Issue;
  assigneeName?: string;
}

export function IssueCard({ issue, assigneeName }: IssueCardProps) {
  const titleId = `issue-${issue.id}-title`;
  void [PRIORITY_LABELS, StatusBadge, formatDate, assigneeName, titleId];

  return (
    <article className="issue-card">
      <h3>{issue.title}</h3>
    </article>
  );
}
