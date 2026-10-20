const formatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
});

/** '2026-10-01T09:00:00.000Z' → 'Oct 1, 2026'. A plain function — in Ember this would be a helper. */
export function formatDate(iso: string): string {
  return formatter.format(new Date(iso));
}
