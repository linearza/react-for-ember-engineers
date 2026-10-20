// app/issues/page.tsx: a Server Component. It is async, so it awaits data directly.
// No client-side fetching, no loading flags, no client JS for this file.
import { fetchIssues } from '@domain/api';
import { STATUSES, type Status } from '@domain/types';
import { IssueFilterBar } from './IssueFilterBar';
import { IssueList } from './IssueList';

interface IssuesPageProps {
  // Next.js 15+: searchParams is a Promise.
  searchParams: Promise<{ status?: string }>;
}

export default async function IssuesPage({ searchParams }: IssuesPageProps) {
  const { status: raw } = await searchParams;
  const status: Status | 'all' = raw && (STATUSES as string[]).includes(raw) ? (raw as Status) : 'all';
  const issues = await fetchIssues({ status });

  return (
    <main>
      <h1>Issues</h1>
      {/* Server → client: pass data, not functions. */}
      <IssueFilterBar status={status} />
      <IssueList issues={issues} />
    </main>
  );
}
