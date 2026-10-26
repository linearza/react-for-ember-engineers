import { Profiler } from 'react';
import { act, render, screen, within } from '@testing-library/react';
import { IssueDetail } from '@ex/day05/IssueDetail';
import { RelativeTime } from '@ex/day05/RelativeTime';
import { LiveIssueFeed } from '@ex/day05/LiveIssueFeed';
import { IssueStats } from '@ex/day05/IssueStats';
import { setIssueLatency } from '@domain/api';
import { issueEvents } from '@domain/events';
import { freshIssues } from '@domain/seed';

const sleep = (ms: number) => act(() => new Promise<void>((resolve) => setTimeout(resolve, ms)));

describe('Day 5 — effects', () => {
  describe('IssueDetail (fetching + races)', () => {
    test('shows Loading…, and a slow stale response never overwrites a newer one', async () => {
      setIssueLatency('1', 50);
      const { rerender } = render(<IssueDetail issueId="1" />);
      expect(screen.getByText('Loading…')).toBeInTheDocument();
      rerender(<IssueDetail issueId="2" />);
      await sleep(80);
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Add dark mode');
    });

    test('shows an alert when the issue cannot be loaded', async () => {
      render(<IssueDetail issueId="999" />);
      expect(await screen.findByRole('alert')).toHaveTextContent('Could not load issue');
    });
  });

  describe('RelativeTime (timers + cleanup)', () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    test('ticks every minute and clears its interval on unmount', () => {
      vi.useFakeTimers();
      const created = '2026-10-20T10:00:00.000Z';
      vi.setSystemTime(new Date('2026-10-20T10:05:00.000Z'));

      const { unmount } = render(<RelativeTime date={created} />);
      expect(screen.getByText('5 minutes ago')).toHaveAttribute('datetime', created);

      act(() => vi.advanceTimersByTime(60_000));
      expect(screen.getByText('6 minutes ago')).toBeInTheDocument();

      unmount();
      expect(vi.getTimerCount()).toBe(0);
    });
  });

  describe('LiveIssueFeed (useEffectEvent)', () => {
    const msg = (message: string) => ({ issueId: '1', message });

    test('toggling muted does not resubscribe; changing channel does; unmount unsubscribes', () => {
      const subscribe = vi.spyOn(issueEvents, 'subscribe');
      const onNotify = vi.fn();
      const { rerender, unmount } = render(<LiveIssueFeed channel="team-a" muted={false} onNotify={onNotify} />);
      expect(subscribe).toHaveBeenCalledTimes(1);

      rerender(<LiveIssueFeed channel="team-a" muted onNotify={onNotify} />);
      act(() => issueEvents.emit('team-a', msg('Issue 1 closed')));
      expect(onNotify).not.toHaveBeenCalled();
      expect(within(screen.getByRole('list')).getByText('Issue 1 closed')).toBeInTheDocument();

      rerender(<LiveIssueFeed channel="team-a" muted={false} onNotify={onNotify} />);
      act(() => issueEvents.emit('team-a', msg('Issue 1 reopened')));
      expect(onNotify).toHaveBeenCalledWith(msg('Issue 1 reopened'));
      expect(subscribe).toHaveBeenCalledTimes(1);

      rerender(<LiveIssueFeed channel="team-b" muted={false} onNotify={onNotify} />);
      expect(subscribe).toHaveBeenCalledTimes(2);
      expect(subscribe).toHaveBeenLastCalledWith('team-b', expect.any(Function));
      expect(issueEvents.listenerCount('team-a')).toBe(0);

      unmount();
      expect(issueEvents.listenerCount('team-b')).toBe(0);
    });

    test('always calls the latest onNotify (no stale closure)', () => {
      const first = vi.fn();
      const second = vi.fn();
      const { rerender } = render(<LiveIssueFeed channel="team-a" muted={false} onNotify={first} />);
      rerender(<LiveIssueFeed channel="team-a" muted={false} onNotify={second} />);
      act(() => issueEvents.emit('team-a', msg('ping')));
      expect(first).not.toHaveBeenCalled();
      expect(second).toHaveBeenCalledTimes(1);
    });
  });

  describe('IssueStats (you might not need an effect)', () => {
    test('counts issues per status in a single commit on mount', () => {
      const onRender = vi.fn();
      render(
        <Profiler id="stats" onRender={onRender}>
          <IssueStats issues={freshIssues()} />
        </Profiler>,
      );
      expect(onRender).toHaveBeenCalledTimes(1);
      const value = (label: string) => screen.getByText(label).nextElementSibling;
      expect(value('To do')).toHaveTextContent('2');
      expect(value('In progress')).toHaveTextContent('1');
      expect(value('Done')).toHaveTextContent('1');
    });
  });
});
