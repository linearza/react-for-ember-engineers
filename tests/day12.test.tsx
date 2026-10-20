import { render, screen, within } from '@testing-library/react';
import IssuesPage from '@ex/day12/app/issues/page';
import { updateStatusAction } from '@ex/day12/app/issues/actions';
import { getDbSnapshot } from '@domain/api';
import pageSrc from '@ex/day12/app/issues/page.tsx?raw';
import filterBarSrc from '@ex/day12/app/issues/IssueFilterBar.tsx?raw';
import listSrc from '@ex/day12/app/issues/IssueList.tsx?raw';
import actionsSrc from '@ex/day12/app/issues/actions.ts?raw';

const files = {
  'page.tsx': pageSrc,
  'IssueFilterBar.tsx': filterBarSrc,
  'IssueList.tsx': listSrc,
  'actions.ts': actionsSrc,
};

// A directive must be the first statement; only comments may come before it.
const hasDirective = (src: string, directive: string) =>
  new RegExp(String.raw`^\s*(?:(?:\/\/[^\n]*\n|\/\*[\s\S]*?\*\/)\s*)*['"]${directive}['"]`).test(src);
const stripComments = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
const usesClientFeatures = (src: string) => /\buse[A-Z]\w*\s*\(|\son[A-Z]\w*=\{/.test(stripComments(src));

describe('Day 12 — Server Components boundaries', () => {
  test("every file that uses hooks or event handlers starts with 'use client'", () => {
    const offenders = Object.entries(files)
      .filter(([, src]) => usesClientFeatures(src) && !hasDirective(src, 'use client'))
      .map(([name]) => name);
    expect(offenders).toEqual([]);
    expect(usesClientFeatures(filterBarSrc)).toBe(true); // sanity: the filter bar has a handler
  });

  test('page.tsx is an async Server Component with no client hooks', () => {
    expect(hasDirective(pageSrc, 'use client')).toBe(false);
    expect(stripComments(pageSrc)).toMatch(/export\s+default\s+async\s+function/);
    expect(stripComments(pageSrc)).not.toMatch(/\buse(State|Effect)\b/);
  });

  test("actions.ts starts with 'use server'", () => {
    expect(hasDirective(actionsSrc, 'use server')).toBe(true);
  });

  test('the page renders on the "server" with awaited searchParams', async () => {
    render(await IssuesPage({ searchParams: Promise.resolve({ status: 'todo' }) }));
    const list = screen.getByRole('list');
    expect(within(list).getAllByRole('listitem').map((li) => li.querySelector('span')!.textContent)).toEqual([
      'Login button does nothing on Safari',
      'Slow issue list with 5k items',
    ]);
    expect(screen.getByLabelText('Status filter')).toHaveValue('todo');
  });

  test('a missing or invalid status shows every issue', async () => {
    render(await IssuesPage({ searchParams: Promise.resolve({ status: 'bogus' }) }));
    expect(within(screen.getByRole('list')).getAllByRole('listitem')).toHaveLength(4);
    expect(screen.getByLabelText('Status filter')).toHaveValue('all');
  });

  test('updateStatusAction rejects an invalid status (validate Server Function input!)', async () => {
    const form = new FormData();
    form.set('id', '4');
    form.set('status', 'archived');
    await expect(updateStatusAction(form)).rejects.toThrow();
    expect(getDbSnapshot().find((i) => i.id === '4')!.status).toBe('todo');
  });

  test('updateStatusAction updates the database from FormData', async () => {
    const form = new FormData();
    form.set('id', '4');
    form.set('status', 'in_progress');
    await updateStatusAction(form);
    expect(getDbSnapshot().find((i) => i.id === '4')!.status).toBe('in_progress');
  });
});
