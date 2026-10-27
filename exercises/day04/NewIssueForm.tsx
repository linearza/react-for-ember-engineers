import { useState, type FormEvent } from 'react';
import { PRIORITIES, PRIORITY_LABELS, type NewIssue, type Priority, type User } from '@domain/types';

/*
DAY 4 — controlled forms & events.
Ember: <input value={{this.title}} {{on "input" this.updateTitle}} /> + <form {{on "submit" this.save}}>
React: value={state} + onChange={…}. Same idea ("data down, actions up"), but state lives in the component.

TODO: build the form with CONTROLLED inputs (each field backed by useState):
  - "Title" text input (maxLength 80) with a live counter right after its <label>, in its own
    element: <span>12/80</span>. Keep the counter OUTSIDE the <label>, or the label's text
    becomes "Title12/80" and nothing can find the input by "Title" any more.
  - "Priority" <select> of PRIORITIES (default 'medium'), option text from PRIORITY_LABELS
  - "Assignee" <select>: first option "Unassigned" (value ""), then one per user
    (value = user.id, text = user.name)
  - "Labels" text input, comma separated
  - A "Create issue" submit button
On submit:
  - prevent the default browser submit
  - if the trimmed title is shorter than 3 chars, show <p role="alert">Title must be at least 3 characters</p>
    and DON'T call onCreate
  - otherwise call onCreate({ title: trimmed, priority, assigneeId: id or null, labels: string[] })
    (labels trimmed, empty ones dropped), reset every field to its initial value, and remove
    the error <p> if an earlier submit showed one.
Wrap each control in a <label> so the tests (and screen readers) can find it by its label text.
*/

const MAX_TITLE = 80;

interface NewIssueFormProps {
  users: User[];
  onCreate: (issue: NewIssue) => void;
}

export function NewIssueForm({ users, onCreate }: NewIssueFormProps) {
  void [useState, PRIORITIES, PRIORITY_LABELS, MAX_TITLE, users, onCreate];
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    void event;
  }
  void (null as Priority | null);

  return (
    <form onSubmit={handleSubmit} noValidate>
      <button type="submit">Create issue</button>
    </form>
  );
}
