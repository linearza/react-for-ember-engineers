import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppRoot } from '@ex/day15/App';

const cards = () => screen.queryAllByRole('article').filter((a) => a.classList.contains('issue-card'));
const cardTitles = () => cards().map((card) => within(card).getByRole('heading', { level: 3 }).textContent);

describe('Day 15 — capstone integration', () => {
  test('list → filter → detail → status change → create', async () => {
    const user = userEvent.setup();
    render(<AppRoot initialEntries={['/']} />);

    // 1. the list shows all 4 issues
    await waitFor(() => expect(cards()).toHaveLength(4));

    // 2. filtering by To do shows 2
    await user.selectOptions(screen.getByLabelText('Status filter'), 'todo');
    await waitFor(() =>
      expect(cardTitles()).toEqual(['Login button does nothing on Safari', 'Slow issue list with 5k items']),
    );

    // 3. clicking an issue shows its detail
    await user.click(screen.getByRole('link', { name: /Login button does nothing on Safari/ }));
    expect(await screen.findByRole('heading', { level: 2, name: 'Login button does nothing on Safari' })).toBeInTheDocument();

    // 4. marking it Done drops it from the filtered list
    await user.selectOptions(screen.getByLabelText('Status'), 'done');
    await waitFor(() => expect(cardTitles()).toEqual(['Slow issue list with 5k items']));

    // 5. creating an issue via the modal
    await user.click(screen.getByRole('button', { name: 'New issue' }));
    const dialog = await screen.findByRole('dialog', { name: 'New issue' });
    await user.type(within(dialog).getByLabelText('Title'), 'Write capstone');
    await user.click(within(dialog).getByRole('button', { name: 'Create issue' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    await user.selectOptions(screen.getByLabelText('Status filter'), 'all');
    await waitFor(() => expect(cardTitles()).toContain('Write capstone'));
    expect(cards()).toHaveLength(5);
  });

  test('deep-linking to an issue shows its detail next to the list', async () => {
    render(<AppRoot initialEntries={['/issues/3']} />);
    expect(await screen.findByRole('heading', { level: 2, name: 'Migrate settings page off ember-data' })).toBeInTheDocument();
    expect(screen.getByLabelText('Status')).toHaveValue('done');
    await waitFor(() => expect(cards()).toHaveLength(4));
  });

  test('the New issue modal validates, stays open on error, and closes on Escape', async () => {
    const user = userEvent.setup();
    render(<AppRoot initialEntries={['/issues']} />);
    await user.click(await screen.findByRole('button', { name: 'New issue' }));
    const dialog = await screen.findByRole('dialog', { name: 'New issue' });
    await user.click(within(dialog).getByRole('button', { name: 'Create issue' }));
    expect(within(dialog).getByRole('alert')).toHaveTextContent('Title must be at least 3 characters');
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('unknown routes render the 404 page inside the layout', async () => {
    render(<AppRoot initialEntries={['/nope']} />);
    expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'New issue' })).toBeInTheDocument();
  });
});
