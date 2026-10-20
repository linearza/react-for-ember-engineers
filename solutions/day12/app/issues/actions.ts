'use server';

// A Server Function. The client never gets this code, only an opaque reference it can POST to.
// Its arguments arrive serialized (FormData here), so validate them like any request body.
import { updateIssue } from '@domain/api';
import { STATUSES, type Status } from '@domain/types';

export async function updateStatusAction(formData: FormData) {
  const id = String(formData.get('id') ?? '');
  const status = String(formData.get('status') ?? '') as Status;
  if (!id || !STATUSES.includes(status)) throw new Error('Invalid status update');
  await updateIssue(id, { status });
  // In Next.js you'd follow with revalidatePath('/issues') so the server component re-renders.
}
