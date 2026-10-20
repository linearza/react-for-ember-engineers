// A tiny pub/sub — stands in for a WebSocket / SSE feed. Used on Day 5.

export interface IssueEvent {
  issueId: string;
  message: string;
}

type Listener = (event: IssueEvent) => void;

const channels = new Map<string, Set<Listener>>();

export const issueEvents = {
  /** Listen on a channel. Returns an unsubscribe function (Ember: what you'd pass to registerDestructor). */
  subscribe(channel: string, listener: Listener): () => void {
    let listeners = channels.get(channel);
    if (!listeners) {
      listeners = new Set();
      channels.set(channel, listeners);
    }
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  emit(channel: string, event: IssueEvent) {
    channels.get(channel)?.forEach((listener) => listener(event));
  },

  /** For tests: how many listeners are attached to a channel right now. */
  listenerCount(channel: string): number {
    return channels.get(channel)?.size ?? 0;
  },

  /** For tests: drop every listener. */
  reset() {
    channels.clear();
  },
};
