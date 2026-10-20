import { useEffect, useState } from 'react';
import { issueEvents, type IssueEvent } from '@domain/events';

// DAY 5 — useEffectEvent.
// Subscribes to `issueEvents` on `channel`, appends every message to a list, and calls
// `onNotify(event)` unless `muted`.
//
// Bugs in this version:
//   1. Toggling `muted` tears down and re-creates the subscription. `muted` isn't something we
//      synchronise WITH, it's something we READ when a message arrives. Only `channel` should
//      cause a resubscribe.
//   2. `onNotify` is captured from the first render. If the parent passes a new callback, the
//      old one is still called (stale closure). The linter would tell you to add it to the deps —
//      which would resubscribe on every parent render (inline arrows are new every time).
//
// TODO: move the "what to do with a message" logic into useEffectEvent and depend only on [channel].

interface LiveIssueFeedProps {
  channel: string;
  muted: boolean;
  onNotify: (event: IssueEvent) => void;
}

export function LiveIssueFeed({ channel, muted, onNotify }: LiveIssueFeedProps) {
  const [events, setEvents] = useState<IssueEvent[]>([]);

  useEffect(() => {
    return issueEvents.subscribe(channel, (event) => {
      setEvents((prev) => [...prev, event]);
      if (!muted) onNotify(event);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel, muted]);

  return (
    <section aria-label="Live feed">
      <p>Listening on {channel}</p>
      <ul>
        {events.map((event, i) => (
          <li key={i}>{event.message}</li>
        ))}
      </ul>
    </section>
  );
}
