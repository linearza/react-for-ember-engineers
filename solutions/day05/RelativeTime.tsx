import { useEffect, useState } from 'react';

interface RelativeTimeProps {
  date: string;
}

export function formatRelative(date: string, now: number): string {
  const minutes = Math.floor((now - new Date(date).getTime()) / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes === 1) return '1 minute ago';
  return `${minutes} minutes ago`;
}

export function RelativeTime({ date }: RelativeTimeProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    // The interval is the external system. Cleanup is the other half of the sync, not optional.
    // (Ember: a modifier with registerDestructor.)
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  return <time dateTime={date}>{formatRelative(date, now)}</time>;
}
