import { useEffect, useState } from 'react';
import { fetchIssue } from '@domain/api';
import type { Issue } from '@domain/types';

// DAY 5 — effects: fetching + race conditions.
// This "works" in the happy path. It has two bugs:
//
//   1. RACE CONDITION. Render issue 1 (slow), then quickly switch to issue 2 (fast). Issue 2 arrives
//      first, then issue 1's late response overwrites it. The heading shows the WRONG issue.
//      Fix: an `ignore` flag set in the effect's cleanup (or an AbortController).
//      Ember: ember-concurrency's `restartable` task cancelled the stale one for you. Here, the
//      cleanup of the previous effect run is your cancellation point.
//
//   2. NO ERROR STATE. A missing id (e.g. '999') rejects with a 404. Render
//      <p role="alert">Could not load issue</p>.
//
// While loading, render <p>Loading…</p>. When loaded, an <h2> with the title and a <p> with the description.

interface IssueDetailProps {
  issueId: string;
}

export function IssueDetail({ issueId }: IssueDetailProps) {
  const [issue, setIssue] = useState<Issue | null>(null);

  useEffect(() => {
    setIssue(null);
    fetchIssue(issueId).then((result) => setIssue(result));
  }, [issueId]);

  if (!issue) return <p>Loading…</p>;
  return (
    <article>
      <h2>{issue.title}</h2>
      <p>{issue.description}</p>
    </article>
  );
}
