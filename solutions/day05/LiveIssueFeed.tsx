import { useEffect, useEffectEvent, useState } from 'react';
import { issueEvents, type IssueEvent } from '@domain/events';

interface LiveIssueFeedProps {
  channel: string;
  muted: boolean;
  onNotify: (event: IssueEvent) => void;
}

export function LiveIssueFeed({ channel, muted, onNotify }: LiveIssueFeedProps) {
  const [events, setEvents] = useState<IssueEvent[]>([]);

  // An Effect Event reads the *latest* props without being a dependency.
  // `muted` and `onNotify` are not things we synchronise with; they're read when a message arrives.
  const onMessage = useEffectEvent((event: IssueEvent) => {
    setEvents((prev) => [...prev, event]);
    if (!muted) onNotify(event);
  });

  useEffect(() => {
    // The only thing we synchronise with is the channel subscription.
    return issueEvents.subscribe(channel, (event) => onMessage(event));
  }, [channel]);

  return (
    <section aria-label="Live feed">
      <p>Listening on {channel}</p>
      <ul>
        {events.map((event, i) => (
          // Append-only log that never reorders: the index is a fine key here.
          <li key={i}>{event.message}</li>
        ))}
      </ul>
    </section>
  );
}
