// A fake async backend (think: Mirage). In-memory, with configurable latency and
// failure injection so you can practise loading, error and race-condition handling.

import type { Issue, NewIssue, Status, User } from './types';
import { freshIssues, USERS } from './seed';

let db: Issue[] = freshIssues();
let nextId = 100;
let latency = 300;
let failNext: string | null = null;
const latencyOverrides = new Map<string, number>();

export class ApiError extends Error {
  constructor(message: string, public status = 500) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Reset to seed data. Called before every test. */
export function resetDb() {
  db = freshIssues();
  nextId = 100;
  failNext = null;
  latencyOverrides.clear();
}

/** Default latency (ms) for every call. Tests set this to 0. */
export function setLatency(ms: number) {
  latency = ms;
}

/** Make one specific issue slower to load — handy for race-condition demos. */
export function setIssueLatency(id: string, ms: number) {
  latencyOverrides.set(id, ms);
}

/** The next API call fails with this message. */
export function failNextRequest(message = 'Server error') {
  failNext = message;
}

function wait(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

async function request<T>(fn: () => T, ms = latency): Promise<T> {
  if (ms > 0) await wait(ms);
  else await Promise.resolve();
  if (failNext) {
    const message = failNext;
    failNext = null;
    throw new ApiError(message);
  }
  return structuredClone(fn());
}

export interface IssueQuery {
  status?: Status | 'all';
  q?: string;
}

export function fetchIssues(query: IssueQuery = {}): Promise<Issue[]> {
  return request(() =>
    db.filter((issue) => {
      if (query.status && query.status !== 'all' && issue.status !== query.status) return false;
      if (query.q && !issue.title.toLowerCase().includes(query.q.toLowerCase())) return false;
      return true;
    }),
  );
}

export function fetchIssue(id: string): Promise<Issue> {
  return request(() => {
    const issue = db.find((i) => i.id === id);
    if (!issue) throw new ApiError(`Issue ${id} not found`, 404);
    return issue;
  }, latencyOverrides.get(id) ?? latency);
}

export function updateIssue(id: string, patch: Partial<Omit<Issue, 'id'>>): Promise<Issue> {
  return request(() => {
    const index = db.findIndex((i) => i.id === id);
    if (index === -1) throw new ApiError(`Issue ${id} not found`, 404);
    if (patch.title !== undefined && patch.title.trim().length < 3) {
      throw new ApiError('Title must be at least 3 characters', 422);
    }
    db[index] = { ...db[index], ...patch };
    return db[index];
  });
}

export function createIssue(input: NewIssue): Promise<Issue> {
  return request(() => {
    if (input.title.trim().length < 3) throw new ApiError('Title must be at least 3 characters', 422);
    const issue: Issue = {
      id: String(nextId++),
      description: '',
      status: 'todo',
      estimate: 1,
      createdAt: new Date().toISOString(),
      ...input,
      title: input.title.trim(),
    };
    db = [...db, issue];
    return issue;
  });
}

export function fetchUsers(): Promise<User[]> {
  return request(() => USERS);
}

/** Synchronous peek for tests. */
export function getDbSnapshot(): Issue[] {
  return structuredClone(db);
}
