/*
DAY 12 — Server Functions.
TODO:
  1. This module should only ever run on the server. Mark it with the 'use server' directive
     (first statement in the file, above the imports).
  2. Implement updateStatusAction: read `id` and `status` from the FormData, validate the status
     against STATUSES (throw on anything else), and call updateIssue(id, { status }).
In Next.js you'd then call revalidatePath('/issues').
*/
import { updateIssue } from '@domain/api';
import { STATUSES, type Status } from '@domain/types';

export async function updateStatusAction(formData: FormData) {
  void [formData, updateIssue, STATUSES];
  void (null as Status | null);
}
