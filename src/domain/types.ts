// The shared domain for the whole course: a small issue tracker.
// Every day adds a feature to it; Day 15 assembles the full app.

export type Status = 'todo' | 'in_progress' | 'done';
export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export interface User {
  id: string;
  name: string;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  assigneeId: string | null;
  labels: string[];
  estimate: number; // story points
  createdAt: string; // ISO date
}

export type NewIssue = Pick<Issue, 'title' | 'priority' | 'assigneeId' | 'labels'> &
  Partial<Pick<Issue, 'description' | 'status' | 'estimate'>>;

export const STATUS_LABELS: Record<Status, string> = {
  todo: 'To do',
  in_progress: 'In progress',
  done: 'Done',
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

export const STATUSES: Status[] = ['todo', 'in_progress', 'done'];
export const PRIORITIES: Priority[] = ['low', 'medium', 'high', 'urgent'];
