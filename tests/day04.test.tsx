import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NewIssueForm } from '@ex/day04/NewIssueForm';
import { QuickSearch } from '@ex/day04/QuickSearch';
import { USERS } from '@domain/seed';

describe('Day 4 — events & forms', () => {
  describe('NewIssueForm (controlled)', () => {
    function setup() {
      const onCreate = vi.fn();
      const user = userEvent.setup();
      render(<NewIssueForm users={USERS} onCreate={onCreate} />);
      return { onCreate, user };
    }

    test('shows a live character counter', async () => {
      const { user } = setup();
      expect(screen.getByText('0/80')).toBeInTheDocument();
      await user.type(screen.getByLabelText('Title'), 'Hello');
      expect(screen.getByText('5/80')).toBeInTheDocument();
    });

    test('priority defaults to Medium; assignee to Unassigned', () => {
      setup();
      expect(screen.getByLabelText('Priority')).toHaveValue('medium');
      expect(screen.getByLabelText('Assignee')).toHaveValue('');
      expect(screen.getByRole('option', { name: 'Grace Hopper' })).toHaveValue('u2');
    });

    test('validates the title and does not submit', async () => {
      const { user, onCreate } = setup();
      await user.type(screen.getByLabelText('Title'), '  a ');
      await user.click(screen.getByRole('button', { name: 'Create issue' }));
      expect(screen.getByRole('alert')).toHaveTextContent('Title must be at least 3 characters');
      expect(onCreate).not.toHaveBeenCalled();
    });

    test('submits normalised data and resets', async () => {
      const { user, onCreate } = setup();
      await user.type(screen.getByLabelText('Title'), '  Fix the flaky test  ');
      await user.selectOptions(screen.getByLabelText('Priority'), 'high');
      await user.selectOptions(screen.getByLabelText('Assignee'), 'u3');
      await user.type(screen.getByLabelText('Labels'), 'ci, , testing ');
      await user.click(screen.getByRole('button', { name: 'Create issue' }));

      expect(onCreate).toHaveBeenCalledWith({
        title: 'Fix the flaky test',
        priority: 'high',
        assigneeId: 'u3',
        labels: ['ci', 'testing'],
      });
      expect(screen.getByLabelText('Title')).toHaveValue('');
      expect(screen.getByLabelText('Priority')).toHaveValue('medium');
      expect(screen.getByLabelText('Assignee')).toHaveValue('');
      expect(screen.getByLabelText('Labels')).toHaveValue('');
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    test('unassigned is sent as null', async () => {
      const { user, onCreate } = setup();
      await user.type(screen.getByLabelText('Title'), 'Valid title');
      await user.click(screen.getByRole('button', { name: 'Create issue' }));
      expect(onCreate).toHaveBeenCalledWith(expect.objectContaining({ assigneeId: null, labels: [] }));
    });
  });

  describe('QuickSearch (uncontrolled + ref)', () => {
    test('submits the trimmed value via FormData', async () => {
      const onSearch = vi.fn();
      const user = userEvent.setup();
      render(<QuickSearch onSearch={onSearch} />);
      await user.type(screen.getByLabelText('Search issues'), '  safari ');
      await user.click(screen.getByRole('button', { name: 'Go' }));
      expect(onSearch).toHaveBeenCalledWith('safari');
    });

    test('Enter submits too (it is a real form)', async () => {
      const onSearch = vi.fn();
      const user = userEvent.setup();
      render(<QuickSearch onSearch={onSearch} />);
      await user.type(screen.getByLabelText('Search issues'), 'dark{Enter}');
      expect(onSearch).toHaveBeenCalledWith('dark');
    });

    test('Escape clears the input via a ref', async () => {
      const user = userEvent.setup();
      render(<QuickSearch onSearch={() => {}} />);
      const input = screen.getByLabelText('Search issues');
      await user.type(input, 'something');
      await user.keyboard('{Escape}');
      expect(input).toHaveValue('');
    });
  });
});
