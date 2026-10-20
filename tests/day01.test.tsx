import { render, screen } from '@testing-library/react';
import { StatusBadge } from '@ex/day01/StatusBadge';
import { IssueCard } from '@ex/day01/IssueCard';
import { formatDate } from '@ex/day01/formatDate';
import { ISSUES } from '@domain/seed';

const [login, darkMode, migrate, slowList] = ISSUES;

describe('Day 1 — JSX & components', () => {
  test('formatDate formats ISO dates as "Oct 1, 2026"', () => {
    expect(formatDate('2026-10-01T09:00:00.000Z')).toBe('Oct 1, 2026');
    expect(formatDate('2026-09-20T23:59:00.000Z')).toBe('Sep 20, 2026');
  });

  test('StatusBadge renders the label with a status modifier class', () => {
    render(<StatusBadge status="in_progress" />);
    const badge = screen.getByText('In progress');
    expect(badge).toHaveClass('badge', 'badge--in_progress');
  });

  test('IssueCard renders the title as a heading and labels the article with it', () => {
    render(<IssueCard issue={darkMode} assigneeName="Grace Hopper" />);
    expect(screen.getByRole('heading', { level: 3, name: 'Add dark mode' })).toBeInTheDocument();
    expect(screen.getByRole('article', { name: 'Add dark mode' })).toBeInTheDocument();
  });

  test('IssueCard shows the status badge', () => {
    render(<IssueCard issue={darkMode} />);
    expect(screen.getByText('In progress')).toHaveClass('badge--in_progress');
  });

  test('urgent issues get a 🔥 prefix, others do not', () => {
    const { unmount } = render(<IssueCard issue={login} />);
    expect(screen.getByText('🔥 Urgent')).toBeInTheDocument();
    unmount();
    render(<IssueCard issue={slowList} />);
    expect(screen.getByText('High')).toBeInTheDocument();
    expect(screen.queryByText(/🔥/)).not.toBeInTheDocument();
  });

  test('shows the assignee, or "Unassigned"', () => {
    const { unmount } = render(<IssueCard issue={login} assigneeName="Ada Lovelace" />);
    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
    unmount();
    render(<IssueCard issue={slowList} />);
    expect(screen.getByText('Unassigned')).toBeInTheDocument();
  });

  test('shows labels when present', () => {
    render(<IssueCard issue={login} />);
    expect(screen.getByText('Labels: bug, auth')).toBeInTheDocument();
  });

  test('renders nothing for empty labels — no stray "0" (the && trap)', () => {
    const { container } = render(<IssueCard issue={migrate} />);
    expect(screen.queryByText(/Labels:/)).not.toBeInTheDocument();
    expect(container.innerHTML).not.toMatch(/>0</);
  });

  test('renders a <time> element with a machine-readable dateTime', () => {
    render(<IssueCard issue={login} />);
    const time = screen.getByText('Oct 1, 2026');
    expect(time.tagName).toBe('TIME');
    expect(time).toHaveAttribute('datetime', login.createdAt);
  });
});
