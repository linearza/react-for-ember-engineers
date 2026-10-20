import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EditTitle } from '@ex/day11/EditTitle';
import { StatusToggle } from '@ex/day11/StatusToggle';
import { failNextRequest, getDbSnapshot, setLatency } from '@domain/api';
import { freshIssues } from '@domain/seed';

const login = () => freshIssues()[0];

describe('Day 11 — Actions & concurrent features', () => {
  describe('EditTitle (useActionState + useFormStatus)', () => {
    test('shows "Saving…" and disables the button while pending, then updates the heading', async () => {
      setLatency(30);
      const user = userEvent.setup();
      render(<EditTitle issue={login()} />);

      const input = screen.getByLabelText('Title');
      await user.clear(input);
      await user.type(input, 'Login broken on Safari 18');
      await user.click(screen.getByRole('button', { name: 'Save' }));

      expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled();
      expect(await screen.findByRole('heading', { name: 'Login broken on Safari 18' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
      expect(getDbSnapshot()[0].title).toBe('Login broken on Safari 18');
    });

    test('shows the server message on a 422 and keeps the old title', async () => {
      const user = userEvent.setup();
      render(<EditTitle issue={login()} />);
      const input = screen.getByLabelText('Title');
      await user.clear(input);
      await user.type(input, 'ab');
      await user.click(screen.getByRole('button', { name: 'Save' }));

      expect(await screen.findByRole('alert')).toHaveTextContent('Title must be at least 3 characters');
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Login button does nothing on Safari');
    });

    test('a successful save after a failed one clears the error', async () => {
      const user = userEvent.setup();
      render(<EditTitle issue={login()} />);
      const input = () => screen.getByLabelText('Title');
      await user.clear(input());
      await user.type(input(), 'no');
      await user.click(screen.getByRole('button', { name: 'Save' }));
      await screen.findByRole('alert');

      await user.clear(input());
      await user.type(input(), 'Safari login fixed');
      await user.click(screen.getByRole('button', { name: 'Save' }));
      expect(await screen.findByRole('heading', { name: 'Safari login fixed' })).toBeInTheDocument();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('StatusToggle (useOptimistic)', () => {
    test('shows the new status immediately, before the request resolves', async () => {
      setLatency(30);
      const user = userEvent.setup();
      render(<StatusToggle issue={login()} />);
      expect(screen.getByText('Status: To do')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Mark done' }));
      expect(screen.getByText('Status: Done')).toBeInTheDocument();
      expect(getDbSnapshot()[0].status).toBe('todo'); // server hasn't answered yet

      await waitFor(() => expect(getDbSnapshot()[0].status).toBe('done'));
      expect(screen.getByText('Status: Done')).toBeInTheDocument();
    });

    test('rolls back and shows an error when the request fails', async () => {
      setLatency(30);
      failNextRequest();
      const user = userEvent.setup();
      render(<StatusToggle issue={login()} />);

      await user.click(screen.getByRole('button', { name: 'Mark done' }));
      expect(screen.getByText('Status: Done')).toBeInTheDocument();

      expect(await screen.findByRole('alert')).toHaveTextContent('Could not update status');
      expect(screen.getByText('Status: To do')).toBeInTheDocument();
    });

    test('after a successful toggle, toggling back is optimistic too', async () => {
      setLatency(30);
      const user = userEvent.setup();
      render(<StatusToggle issue={login()} />);
      await user.click(screen.getByRole('button', { name: 'Mark done' }));
      await waitFor(() => expect(getDbSnapshot()[0].status).toBe('done'));

      await user.click(await screen.findByRole('button', { name: 'Reopen' }));
      expect(screen.getByText('Status: To do')).toBeInTheDocument();
      await waitFor(() => expect(getDbSnapshot()[0].status).toBe('todo'));
    });
  });
});
