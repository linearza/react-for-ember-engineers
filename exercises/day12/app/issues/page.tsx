'use client';

/*
DAY 12 — fix the boundaries.
Someone ported the Ember route as a client component: 'use client', fetch in an effect, a
loading flag. In the App Router this page can be a Server Component that awaits its data.

TODO:
  - remove 'use client'
  - make it `export default async function IssuesPage({ searchParams })`
  - `const { status } = await searchParams` (a Promise in Next 15+); invalid/missing → 'all'
  - `await fetchIssues({ status })` directly; no useState, no useEffect
  - render <h1>Issues</h1>, <IssueFilterBar status={status} />, <IssueList issues={issues} />
*/
import { useEffect, useState } from 'react';
import { fetchIssues } from '@domain/api';
import { STATUSES, type Issue, type Status } from '@domain/types';
import { IssueFilterBar } from './IssueFilterBar';
import { IssueList } from './IssueList';

interface IssuesPageProps {
  searchParams: Promise<{ status?: string }>;
}

export default function IssuesPage({ searchParams }: IssuesPageProps) {
  const [issues, setIssues] = useState<Issue[] | null>(null);
  const [status, setStatus] = useState<Status | 'all'>('all');

  useEffect(() => {
    searchParams.then(({ status: raw }) => {
      const next = raw && (STATUSES as string[]).includes(raw) ? (raw as Status) : 'all';
      setStatus(next);
      fetchIssues({ status: next }).then(setIssues);
    });
  }, [searchParams]);

  return (
    <main>
      <h1>Issues</h1>
      <IssueFilterBar status={status} />
      {issues ? <IssueList issues={issues} /> : <p>Loading…</p>}
    </main>
  );
}
