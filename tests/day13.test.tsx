import { cleanup } from '@testing-library/react';
import { checks } from '@ex/day13/tabs.checks';
import { Tabs, type TabsComponent } from '../src/day13/Tabs';
import { mutants } from '../src/day13/mutants';

// A meta-test: it tests YOUR tests. Each check runs against the real Tabs and each mutant.
async function passes(check: (typeof checks)[number], Component: TabsComponent) {
  try {
    await check.run(Component);
    return true;
  } catch {
    return false;
  } finally {
    cleanup();
  }
}

describe('Day 13 — tests that catch bugs', () => {
  test('there are at least 4 checks', () => {
    expect(checks.length).toBeGreaterThanOrEqual(4);
  });

  test('every check passes against the real Tabs', async () => {
    const failing: string[] = [];
    for (const check of checks) {
      if (!(await passes(check, Tabs))) failing.push(check.name);
    }
    expect(failing).toEqual([]);
  });

  test.each(mutants)('catches mutant: $name', async ({ Tabs: Mutant }) => {
    let caught = false;
    for (const check of checks) {
      if (!(await passes(check, Mutant))) {
        caught = true;
        break;
      }
    }
    expect(caught, 'no check failed against this mutant').toBe(true);
  });
});
