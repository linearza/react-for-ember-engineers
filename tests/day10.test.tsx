import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { routes } from '@ex/day10/routes';

function renderAt(url: string) {
  const router = createMemoryRouter(routes, { initialEntries: [url] });
  render(<RouterProvider router={router} />);
  return router;
}

const listTitles = () =>
  within(screen.getByRole('list')).getAllByRole('link').map((a) => a.textContent);

describe('Day 10 — routing (data mode)', () => {
  test('/ redirects to /issues', async () => {
    const router = renderAt('/');
    expect(await screen.findByRole('heading', { name: 'Issues', level: 1 })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/issues');
  });

  test('the loader reads ?status= from the URL', async () => {
    renderAt('/issues?status=todo');
    await screen.findByRole('heading', { name: 'Issues', level: 1 });
    expect(listTitles()).toEqual(['Login button does nothing on Safari', 'Slow issue list with 5k items']);
    expect(screen.getByLabelText('Status filter')).toHaveValue('todo');
  });

  test('changing the Status filter updates the search param and the list', async () => {
    const user = userEvent.setup();
    const router = renderAt('/issues');
    await screen.findByRole('heading', { name: 'Issues', level: 1 });
    expect(listTitles()).toHaveLength(4);

    await user.selectOptions(screen.getByLabelText('Status filter'), 'done');
    await waitFor(() => expect(listTitles()).toEqual(['Migrate settings page off ember-data']));
    expect(router.state.location.search).toBe('?status=done');
  });

  test('clicking an issue shows its detail nested inside the layout and list', async () => {
    const user = userEvent.setup();
    renderAt('/issues');
    await user.click(await screen.findByRole('link', { name: 'Add dark mode' }));
    expect(await screen.findByRole('heading', { level: 2, name: 'Add dark mode' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument();
    expect(listTitles()).toHaveLength(4);
  });

  test('opening an issue keeps the filter in the URL (and the list filtered)', async () => {
    const user = userEvent.setup();
    const router = renderAt('/issues?status=todo');
    await user.click(await screen.findByRole('link', { name: 'Slow issue list with 5k items' }));
    expect(await screen.findByRole('heading', { level: 2, name: 'Slow issue list with 5k items' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/issues/4');
    expect(router.state.location.search).toBe('?status=todo');
    expect(listTitles()).toHaveLength(2);
  });

  test('a missing issue shows a nested 404 while the list stays visible', async () => {
    renderAt('/issues/999');
    expect(await screen.findByRole('alert')).toHaveTextContent('Issue not found');
    expect(listTitles()).toHaveLength(4);
  });

  test('unknown URLs show "Page not found" inside the layout', async () => {
    renderAt('/nope');
    expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument();
  });
});
