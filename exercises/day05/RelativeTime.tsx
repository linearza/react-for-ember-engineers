import { useEffect, useState } from 'react';

// DAY 5 — effects: subscribing to an external system (a timer) and cleaning up.
// Renders <time dateTime={date}>5 minutes ago</time> and re-renders every 60 s.
//
// TODO: the interval is never cleared. Unmount the component and it keeps ticking (and calling
// setState on an unmounted component). Return a cleanup function from the effect.
// Ember: a modifier that calls registerDestructor — same idea, but here the cleanup is the
// return value of the effect, and it also runs before every re-run.

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
    setInterval(() => setNow(Date.now()), 60_000);
  }, []);

  return <time dateTime={date}>{formatRelative(date, now)}</time>;
}
