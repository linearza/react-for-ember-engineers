import { useState, type FormEvent } from 'react';
import { PRIORITIES, PRIORITY_LABELS, type NewIssue, type Priority, type User } from '@domain/types';

const MAX_TITLE = 80;

interface NewIssueFormProps {
  users: User[];
  onCreate: (issue: NewIssue) => void;
}

export function NewIssueForm({ users, onCreate }: NewIssueFormProps) {
  // Controlled inputs: React state is the single source of truth for each field.
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [assigneeId, setAssigneeId] = useState('');
  const [labels, setLabels] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); // no full-page form post
    const trimmed = title.trim();
    if (trimmed.length < 3) {
      setError('Title must be at least 3 characters');
      return;
    }
    onCreate({
      title: trimmed,
      priority,
      assigneeId: assigneeId || null,
      labels: labels
        .split(',')
        .map((l) => l.trim())
        .filter(Boolean),
    });
    setTitle('');
    setPriority('medium');
    setAssigneeId('');
    setLabels('');
    setError(null);
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <label>
        Title
        <input value={title} maxLength={MAX_TITLE} onChange={(e) => setTitle(e.target.value)} />
      </label>
      <span aria-live="polite">
        {title.length}/{MAX_TITLE}
      </span>

      <label>
        Priority
        <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {PRIORITY_LABELS[p]}
            </option>
          ))}
        </select>
      </label>

      <label>
        Assignee
        <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}>
          <option value="">Unassigned</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
      </label>

      <label>
        Labels
        <input value={labels} onChange={(e) => setLabels(e.target.value)} placeholder="bug, ui" />
      </label>

      {error && <p role="alert">{error}</p>}

      <button type="submit">Create issue</button>
    </form>
  );
}
