import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IssueTable } from '@ex/day06/IssueTable';
import { renderLog, resetRenderLog } from '@ex/day06/IssueRow';
import { freshIssues } from '@domain/seed';

function setup() {
  const issues = freshIssues();
  const user = userEvent.setup();
  render(<IssueTable issues={issues} />);
  resetRenderLog();
  return { user, issues };
}

describe('Day 6 — rendering performance', () => {
  test('renders one row per issue, then typing in the unrelated Draft note input renders zero rows', async () => {
    const user = userEvent.setup();
    resetRenderLog();
    render(<IssueTable issues={freshIssues()} />);
    expect(renderLog).toEqual(['1', '2', '3', '4']);
    expect(screen.getAllByRole('row')).toHaveLength(5); // header + 4
    resetRenderLog();
    await user.type(screen.getByLabelText('Draft note'), 'abc');
    expect(screen.getByLabelText('Draft note')).toHaveValue('abc');
    expect(renderLog).toEqual([]);
  });

  test('selecting a row only re-renders the rows whose selection changed', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: 'Select Add dark mode' }));
    expect(renderLog).toEqual(['2']);
    expect(screen.getByRole('button', { name: 'Select Add dark mode' })).toHaveAttribute('aria-pressed', 'true');

    resetRenderLog();
    await user.click(screen.getByRole('button', { name: 'Select Slow issue list with 5k items' }));
    expect(renderLog).toEqual(['2', '4']);
    expect(screen.getByRole('button', { name: 'Select Add dark mode' })).toHaveAttribute('aria-pressed', 'false');
  });

  test('when one issue object changes, only that row re-renders', () => {
    const issues = freshIssues();
    const { rerender } = render(<IssueTable issues={issues} />);
    resetRenderLog();
    const next = issues.map((issue) => (issue.id === '3' ? { ...issue, title: 'Settings page migrated' } : issue));
    rerender(<IssueTable issues={next} />);
    expect(renderLog).toEqual(['3']);
    expect(screen.getByText('Settings page migrated')).toBeInTheDocument();
  });
});
