import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IssueBoard } from '@ex/day03/IssueBoard';
import { freshIssues } from '@domain/seed';
import { deepFreeze } from '@domain/testing';

function setup() {
  const issues = deepFreeze(freshIssues());
  const user = userEvent.setup();
  render(<IssueBoard initialIssues={issues} />);
  const titles = () =>
    screen.queryAllByRole('listitem').map((li) => within(li).getByRole('checkbox').closest('label')!.textContent);
  return { user, titles };
}

describe('Day 3 — state, immutability & derived state', () => {
  test('shows all issues and a count initially', () => {
    const { titles } = setup();
    expect(titles()).toHaveLength(4);
    expect(screen.getByText('Showing 4 of 4')).toBeInTheDocument();
  });

  test('filters by status (derived during render)', async () => {
    const { user, titles } = setup();
    await user.click(screen.getByRole('button', { name: 'To do' }));
    expect(titles()).toEqual(['Login button does nothing on Safari', 'Slow issue list with 5k items']);
    expect(screen.getByText('Showing 2 of 4')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'To do' })).toHaveAttribute('aria-pressed', 'true');
  });

  test('filters by search text, case-insensitive, combined with status', async () => {
    const { user, titles } = setup();
    await user.type(screen.getByLabelText('Search'), 'SAFARI');
    expect(titles()).toEqual(['Login button does nothing on Safari']);
    await user.click(screen.getByRole('button', { name: 'Done' }));
    expect(titles()).toEqual([]);
    expect(screen.getByText('Showing 0 of 4')).toBeInTheDocument();
  });

  test('toggling done is an immutable update (frozen data must not throw)', async () => {
    const { user } = setup();
    const checkbox = screen.getByRole('checkbox', { name: 'Mark "Add dark mode" done' });
    expect(checkbox).not.toBeChecked();
    await user.click(checkbox);
    expect(checkbox).toBeChecked();
    await user.click(screen.getByRole('button', { name: 'Done' }));
    expect(screen.getByText('Showing 2 of 4')).toBeInTheDocument();
  });

  test('"+2 points" adds 2 (updater functions see queued state)', async () => {
    const { user } = setup();
    const row = screen.getByRole('checkbox', { name: 'Mark "Add dark mode" done' }).closest('li')!;
    expect(within(row).getByText('5 pts')).toBeInTheDocument();
    await user.click(within(row).getByRole('button', { name: /\+2 points/ }));
    expect(within(row).getByText('7 pts')).toBeInTheDocument();
  });
});
