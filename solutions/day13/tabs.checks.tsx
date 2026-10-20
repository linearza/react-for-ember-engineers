import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, vi } from 'vitest';
import type { TabItem, TabsComponent } from '../../src/day13/Tabs';

export interface TabsCheck {
  name: string;
  run: (Tabs: TabsComponent) => void | Promise<void>;
}

const TABS: TabItem[] = [
  { id: 'open', label: 'Open', content: 'Open issues panel' },
  { id: 'mine', label: 'Mine', content: 'My issues panel' },
  { id: 'closed', label: 'Closed', content: 'Closed issues panel' },
];

// Every check talks to the component the way a user or a screen reader would:
// by role, name and keyboard. None of them knows how Tabs is implemented.
export const checks: TabsCheck[] = [
  {
    name: 'exposes a labelled tablist where exactly the selected tab is aria-selected',
    async run(Tabs) {
      const user = userEvent.setup();
      render(<Tabs label="Issue views" tabs={TABS} />);
      expect(screen.getByRole('tablist', { name: 'Issue views' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Open' })).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByRole('tab', { name: 'Mine' })).toHaveAttribute('aria-selected', 'false');

      await user.click(screen.getByRole('tab', { name: 'Mine' }));
      expect(screen.getByRole('tab', { name: 'Mine' })).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByRole('tab', { name: 'Open' })).toHaveAttribute('aria-selected', 'false');
    },
  },
  {
    name: 'clicking a tab shows its panel, labelled by that tab',
    async run(Tabs) {
      const user = userEvent.setup();
      render(<Tabs label="Issue views" tabs={TABS} />);
      expect(screen.getByRole('tabpanel', { name: 'Open' })).toHaveTextContent('Open issues panel');

      await user.click(screen.getByRole('tab', { name: 'Closed' }));
      const panel = screen.getByRole('tabpanel', { name: 'Closed' });
      expect(panel).toHaveTextContent('Closed issues panel');
      expect(screen.getByRole('tab', { name: 'Closed' })).toHaveAttribute('aria-controls', panel.id);
    },
  },
  {
    name: 'roving tabindex: only the selected tab is in the tab order',
    async run(Tabs) {
      const user = userEvent.setup();
      render(
        <>
          <button type="button">before</button>
          <Tabs label="Issue views" tabs={TABS} defaultSelectedId="mine" />
        </>,
      );
      await user.click(screen.getByRole('button', { name: 'before' }));
      await user.tab();
      expect(screen.getByRole('tab', { name: 'Mine' })).toHaveFocus();
      await user.tab();
      expect(screen.getByRole('tabpanel')).toHaveFocus(); // skipped the other tabs
    },
  },
  {
    name: 'arrow keys move selection and focus, wrapping at both ends',
    async run(Tabs) {
      const user = userEvent.setup();
      render(<Tabs label="Issue views" tabs={TABS} defaultSelectedId="closed" />);
      await user.click(screen.getByRole('tab', { name: 'Closed' }));

      await user.keyboard('{ArrowRight}');
      expect(screen.getByRole('tab', { name: 'Open' })).toHaveFocus();
      expect(screen.getByRole('tab', { name: 'Open' })).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByRole('tabpanel')).toHaveTextContent('Open issues panel');

      await user.keyboard('{ArrowLeft}');
      expect(screen.getByRole('tab', { name: 'Closed' })).toHaveFocus();
    },
  },
  {
    name: 'Home and End jump to the first and last tab',
    async run(Tabs) {
      const user = userEvent.setup();
      render(<Tabs label="Issue views" tabs={TABS} defaultSelectedId="mine" />);
      await user.click(screen.getByRole('tab', { name: 'Mine' }));
      await user.keyboard('{End}');
      expect(screen.getByRole('tab', { name: 'Closed' })).toHaveFocus();
      await user.keyboard('{Home}');
      expect(screen.getByRole('tab', { name: 'Open' })).toHaveFocus();
    },
  },
  {
    name: 'calls onChange with the newly selected id',
    async run(Tabs) {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<Tabs label="Issue views" tabs={TABS} onChange={onChange} />);
      await user.click(screen.getByRole('tab', { name: 'Closed' }));
      expect(onChange).toHaveBeenCalledWith('closed');
    },
  },
];
