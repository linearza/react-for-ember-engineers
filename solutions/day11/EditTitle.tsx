import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { updateIssue } from '@domain/api';
import type { Issue } from '@domain/types';

// Reads the pending state of the <form> it's rendered inside. No prop drilling.
// (Ember: `this.save.isRunning` on an ember-concurrency task.)
export function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending}>
      {pending ? 'Saving…' : 'Save'}
    </button>
  );
}

interface EditTitleState {
  issue: Issue;
  error: string | null;
}

interface EditTitleProps {
  issue: Issue;
}

export function EditTitle({ issue }: EditTitleProps) {
  // An Action: an async function React runs in a transition. It tracks pending, sequences
  // submissions, and hands you the result as state.
  const [state, formAction] = useActionState<EditTitleState, FormData>(
    async (prev, formData) => {
      try {
        const updated = await updateIssue(prev.issue.id, { title: String(formData.get('title') ?? '') });
        return { issue: updated, error: null };
      } catch (error) {
        return { ...prev, error: error instanceof Error ? error.message : 'Could not save' };
      }
    },
    { issue, error: null },
  );

  return (
    <section>
      <h2>{state.issue.title}</h2>
      <form action={formAction}>
        <label>
          Title
          {/* Uncontrolled: React resets the form after the action, back to this defaultValue. */}
          <input name="title" defaultValue={state.issue.title} />
        </label>
        <SaveButton />
        {state.error && <p role="alert">{state.error}</p>}
      </form>
    </section>
  );
}
