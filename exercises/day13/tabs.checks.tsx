import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, vi } from 'vitest';
import type { TabItem, TabsComponent } from '../../src/day13/Tabs';

// DAY 13 — tests that catch bugs.
// src/day13/Tabs.tsx is a correct, accessible Tabs component. src/day13/mutants/ holds five broken
// copies. Write checks that PASS against the real Tabs and FAIL against every mutant.
// Don't open the mutants first: write checks from the spec below, then see what you missed.
//
// The spec (WAI-ARIA "Tabs with automatic activation"):
//   - role="tablist" with an accessible name (the `label` prop); each tab has role="tab"
//   - the selected tab has aria-selected="true", the others "false"
//   - the visible role="tabpanel" is labelled by its tab (aria-labelledby) and shows its content
//   - roving tabindex: only the selected tab is reachable with Tab
//   - ArrowRight / ArrowLeft move selection AND focus, wrapping at both ends; Home / End jump
//   - onChange(id) is called when the selection changes
//
// Rules:
//   - query like a user: getByRole / getByLabelText, userEvent (not fireEvent)
//   - at least 4 checks; each check renders its own Tabs (the meta-test calls cleanup() between them)
// Ember: same instincts as @ember/test-helpers + qunit-dom, but there's no `await settled()`.
// userEvent calls are awaited; use findBy* when something async happens.
//
// Example shape:
//   {
//     name: 'shows the first tab by default',
//     async run(Tabs) {
//       render(<Tabs label="Issue views" tabs={TABS} />);
//       expect(screen.getByRole('tab', { name: 'Open' })).toHaveAttribute('aria-selected', 'true');
//     },
//   },

export interface TabsCheck {
  name: string;
  run: (Tabs: TabsComponent) => void | Promise<void>;
}

const TABS: TabItem[] = [
  { id: 'open', label: 'Open', content: 'Open issues panel' },
  { id: 'mine', label: 'Mine', content: 'My issues panel' },
  { id: 'closed', label: 'Closed', content: 'Closed issues panel' },
];

export const checks: TabsCheck[] = [];

void [render, screen, userEvent, expect, vi, TABS];
