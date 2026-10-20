import { useEffect, useState } from 'react';
import { fetchIssue } from '@domain/api';
import type { Issue } from '@domain/types';

interface IssueDetailProps {
  issueId: string;
}

type State = { status: 'loading' } | { status: 'error' } | { status: 'ok'; issue: Issue };

export function IssueDetail({ issueId }: IssueDetailProps) {
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    // Each run of the effect owns its own `ignore` flag. When issueId changes, React runs the
    // previous cleanup first, so a slow, stale response can never overwrite a newer one.
    // (Ember: ember-concurrency's `restartable` gave you this for free.)
    let ignore = false;
    setState({ status: 'loading' });
    fetchIssue(issueId).then(
      (issue) => {
        if (!ignore) setState({ status: 'ok', issue });
      },
      () => {
        if (!ignore) setState({ status: 'error' });
      },
    );
    return () => {
      ignore = true;
    };
  }, [issueId]);

  if (state.status === 'loading') return <p>Loading…</p>;
  if (state.status === 'error') return <p role="alert">Could not load issue</p>;
  return (
    <article>
      <h2>{state.issue.title}</h2>
      <p>{state.issue.description}</p>
    </article>
  );
}
