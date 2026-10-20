import { useState, type FormEvent } from 'react';
import { updateIssue } from '@domain/api';
import type { Issue } from '@domain/types';

// DAY 11 — React 19 Actions.
// This is the "classic" version: onSubmit + useState + manual everything. It has no pending state
// and swallows server errors.
//
// TODO: rewrite it with Actions.
//   - EditTitle: useActionState(async (prevState, formData) => …, { issue, error: null })
//       success → { issue: updated, error: null }   (the <h2> shows the new title)
//       failure → keep the issue, set `error` to the server message (e.g. a 422)
//     and <form action={formAction}> instead of onSubmit. Render the error as <p role="alert">.
//   - SaveButton: useFormStatus() from 'react-dom' → while pending, label "Saving…" and disabled.
//     Otherwise "Save".
// Ember: an ember-concurrency task: `drop`/`enqueue` semantics, `isRunning`, `last.error`.

export function SaveButton() {
  return <button type="submit">Save</button>;
}

interface EditTitleProps {
  issue: Issue;
}

export function EditTitle({ issue }: EditTitleProps) {
  const [current, setCurrent] = useState(issue);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = String(new FormData(event.currentTarget).get('title') ?? '');
    const updated = await updateIssue(current.id, { title });
    setCurrent(updated);
  }

  return (
    <section>
      <h2>{current.title}</h2>
      <form onSubmit={handleSubmit}>
        <label>
          Title
          <input name="title" defaultValue={current.title} />
        </label>
        <SaveButton />
      </form>
    </section>
  );
}
