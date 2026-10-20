import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Card } from '@ex/day02/Card';
import { IssueList } from '@ex/day02/IssueList';
import { IssueNotes } from '@ex/day02/IssueNotes';
import { ISSUES } from '@domain/seed';

describe('Day 2 — props, children, lists & keys', () => {
  describe('Card (children + named slots)', () => {
    test('renders title and children', () => {
      render(<Card title="Bugs">body content</Card>);
      const card = screen.getByRole('region', { name: 'Bugs' });
      expect(within(card).getByRole('heading', { name: 'Bugs' })).toBeInTheDocument();
      expect(within(card).getByText('body content')).toBeInTheDocument();
    });

    test('renders the actions and footer slots when given', () => {
      render(
        <Card title="Bugs" actions={<button>Add</button>} footer={<span>4 issues</span>}>
          body
        </Card>,
      );
      expect(screen.getByRole('button', { name: 'Add' }).parentElement).toHaveClass('card__actions');
      expect(screen.getByText('4 issues').closest('footer')).toHaveClass('card__footer');
    });

    test('omits slot wrappers when slots are not given', () => {
      const { container } = render(<Card title="Bugs">body</Card>);
      expect(container.querySelector('.card__actions')).toBeNull();
      expect(container.querySelector('footer')).toBeNull();
    });
  });

  describe('IssueList (lists + render props)', () => {
    test('renders titles by default, in order', () => {
      render(<IssueList issues={ISSUES} />);
      const items = screen.getAllByRole('listitem').map((li) => li.textContent);
      expect(items).toEqual(ISSUES.map((i) => i.title));
    });

    test('uses renderItem when given (like {{yield issue index}})', () => {
      render(<IssueList issues={ISSUES.slice(0, 2)} renderItem={(issue, i) => <strong>{`${i + 1}. ${issue.id}`}</strong>} />);
      expect(screen.getByText('1. 1')).toBeInTheDocument();
      expect(screen.getByText('2. 2')).toBeInTheDocument();
    });

    test('renders a default empty state', () => {
      render(<IssueList issues={[]} />);
      expect(screen.getByText('No issues')).toBeInTheDocument();
      expect(screen.queryByRole('list')).not.toBeInTheDocument();
    });

    test('renders a custom empty state (like {{else}})', () => {
      render(<IssueList issues={[]} emptyState={<p>Inbox zero 🎉</p>} />);
      expect(screen.getByText('Inbox zero 🎉')).toBeInTheDocument();
    });
  });

  describe('IssueNotes (keys)', () => {
    test('a typed note stays with its issue after the list is reordered', async () => {
      const user = userEvent.setup();
      const [a, b] = ISSUES;
      const { rerender } = render(<IssueNotes issues={[a, b]} />);

      await user.type(screen.getByLabelText(`Note for ${a.title}`), 'check Safari 18');
      rerender(<IssueNotes issues={[b, a]} />);

      expect(screen.getByLabelText(`Note for ${a.title}`)).toHaveValue('check Safari 18');
      expect(screen.getByLabelText(`Note for ${b.title}`)).toHaveValue('');
    });
  });
});
