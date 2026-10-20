import { C, Day } from './model.mjs';

export const DAY6 = Day({
  n: 6, week: 2,
  title: 'Rendering performance: reconciliation, memoization, React Compiler',
  tagline: 'Glimmer updates what changed. React re-runs what *might* have changed, and lets you (or the Compiler) prove it didn\'t.',
  concepts: [
    C('r', 'Reconciliation: type + key',
      `
React diffs element trees with two heuristics. **Different type** at the same position (\`<div>\` → \`<span>\`, \`ComponentA\` → \`ComponentB\`) means the old subtree is unmounted and the new one mounted, so its state is lost. **Same type and same key** means the instance is kept and its props updated.

So defining a component *inside* another component is a bug: every render creates a new function type, and the child remounts every time. Conditionally wrapping in an extra \`<div>\` resets the state of everything below it, for the same reason.
`,
      `
{{!-- Glimmer reuses by template identity;
     you rarely think about this --}}
{{#if @compact}}
  <IssueRow @issue={{@issue}} />
{{else}}
  <div class="wrap"><IssueRow @issue={{@issue}} /></div>
{{/if}}
`,
      `
// ❌ new component type each render → remount, state lost
function Table() {
  const Row = (p: RowProps) => <tr>…</tr>;
  return <Row … />;
}

// ❌ toggling \`compact\` remounts IssueRow (different parent type)
{compact ? <IssueRow … /> : <div><IssueRow … /></div>}
`),
    C('r', 'Parent renders → children render',
      `
By default, when a component renders, **every child it returns renders too**, recursively, whether or not their props changed. That's usually fine, since renders are cheap and React only touches the DOM where output differs. It stops being fine with big lists, expensive children or high-frequency updates (typing, dragging). Glimmer never had this cost model, so it's easy to miss.
`,
      `
{{!-- typing in the draft only updates the input --}}
<Input @value={{this.draft}} />
{{#each @issues key="id" as |issue|}}
  <IssueRow @issue={{issue}} />
{{/each}}
`,
      `
// typing → IssueTable re-renders → every IssueRow re-renders
const [draft, setDraft] = useState('');
<input value={draft} onChange={(e) => setDraft(e.target.value)} />
{issues.map((i) => <IssueRow key={i.id} issue={i} />)}
`),
    C('r', '`memo`, `useMemo`, `useCallback` and referential stability',
      `
\`memo(Component)\` skips a re-render when every prop is \`Object.is\`-equal to last time. It is **defeated** by any prop that's a fresh object, array or function on each render, such as \`onSelect={() => …}\` or \`style={{…}}\`.

- \`useCallback(fn, deps)\` keeps the same function identity until the deps change.
- \`useMemo(() => value, deps)\` does the same for computed values, and also caches expensive work.
- Pass **primitives** where you can: \`isSelected={id === selectedId}\` instead of \`selectedId\`, so only the two rows whose boolean flipped re-render.

Memoization isn't free: there's comparison cost and memory, and it makes code noisier. Measure first.
`,
      `
{{!-- nothing to do: Glimmer only re-evaluates
     {{if (eq issue.id this.selectedId)}} where it changed --}}
<IssueRow @issue={{issue}}
          @selected={{eq issue.id this.selectedId}}
          @onSelect={{this.select}} />
`,
      `
const IssueRow = memo(function IssueRow({ issue, isSelected, onSelect }: Props) {
  …
});

const handleSelect = useCallback((id: string) => setSelectedId(id), []);

<IssueRow
  key={issue.id}
  issue={issue}
  isSelected={issue.id === selectedId}
  onSelect={handleSelect}
/>
`),
    C('g', 'Move state down, lift content up',
      `
Before memoizing, restructure. **Move state down:** put the draft input and its state in a \`<DraftNote/>\` component. Typing then re-renders only that component. **Lift content up:** if a stateful wrapper takes \`children\`, those children were created by *its parent*, so they don't re-render when the wrapper's state changes. These fixes are free and Compiler-proof.
`,
      `
{{!-- component boundaries are about reuse,
     not render cost --}}
<DraftNote />
<IssueTable @issues={{@issues}} />
`,
      `
function DraftNote() {
  const [draft, setDraft] = useState('');
  return <input value={draft} onChange={(e) => setDraft(e.target.value)} />;
}

// typing re-renders only DraftNote
<DraftNote />
<IssueTable issues={issues} />
`),
    C('r', 'React Compiler: auto-memoization',
      `
The React Compiler (v1, stable) is a build-time Babel or Rust plugin. It analyses each component and hook and inserts fine-grained memoization: it caches JSX subtrees, derived values and callbacks keyed on their real inputs. It's effectively \`memo\`/\`useMemo\`/\`useCallback\` everywhere, done correctly. It relies on the **Rules of React**: components are pure, props and state are never mutated, and hooks are called unconditionally at the top level. It skips (or bails out of) code that breaks the rules.

Manual memo still matters for code the compiler can't see or bails out of, for values passed to non-React libraries that compare identity, for effect dependencies you want to be explicit about, and on codebases that haven't adopted it. Day 6's stretch goal turns it on.
`,
      `
// Glimmer's compiler already knows static vs dynamic.
// Autotracking gives fine-grained updates at runtime.
`,
      `
// vite.config.ts
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import babel from '@rolldown/plugin-babel';

export default defineConfig({
  plugins: [react(), babel({ presets: [reactCompilerPreset()] })],
});
`, { emberLang: 'javascript', reactLang: 'typescript' }),
    C('y', 'Finding slow renders: the Profiler',
      `
React DevTools → **Profiler**: record an interaction and see which components rendered, why ("props changed: onSelect"), and how long each took. Turn on "Highlight updates when components render". In code, \`<Profiler id onRender>\` reports commit timings, which is how the Day 5 and Day 6 tests count renders. Measure before memoizing: the slow thing is usually one component, not "React".
`,
      `
// Ember Inspector → Render Performance tab
`,
      `
<Profiler id="table" onRender={(id, phase, actualDuration) => {
  console.log(id, phase, actualDuration);
}}>
  <IssueTable issues={issues} />
</Profiler>
`, { emberLang: 'javascript' }),
  ],
  exercise: {
    files: [
      'exercises/day06/IssueRow.tsx',
      'exercises/day06/IssueTable.tsx',
    ],
    command: 'pnpm test day06',
    criteria: [
      'Typing three characters in "Draft note" causes **zero** `IssueRow` renders (watch `renderLog`).',
      'Selecting row 2 re-renders only `[\'2\']`. Then selecting row 4 re-renders only `[\'2\', \'4\']`.',
      'When one issue object changes, only that row re-renders.',
    ],
    stretch: 'Turn on the React Compiler (see the README), delete your `memo` and `useCallback`, and confirm the tests still pass. Then try the "move state down" fix for the typing case without any memoization.',
  },
  drill: [
    ['Does a re-render mean a DOM update?',
      `
No. A re-render means React called your component and diffed its output. The DOM is only touched where the new output differs from the old. A component can re-render a hundred times and produce zero DOM mutations. The cost of an unnecessary re-render is the JS work (your function plus the diff), and that's what memoization saves.
`],
    ['When does `memo` fail to prevent a re-render?',
      `
When any prop is a **new reference** each render: inline arrow functions, object or array literals (\`style={{…}}\`, \`options={[…]}\`), \`children\` JSX (always a new element), or values derived without \`useMemo\`. Also when the component reads a context that changed, or its own state changes, since \`memo\` only guards props. Fix it with stable references (\`useCallback\`/\`useMemo\`), primitive props, or restructuring.
`],
    ['`useMemo` vs `useCallback`?',
      `
\`useCallback(fn, deps)\` is \`useMemo(() => fn, deps)\`: it memoizes the function itself. \`useMemo\` memoizes the *result* of calling a function. Use \`useMemo\` for expensive computations or stable object/array identities. Use \`useCallback\` for stable function props to memoized children, or for effect dependencies. Neither is a semantic guarantee: React may discard caches.
`],
    ['What does the React Compiler do, and which rules does it rely on?',
      `
At build time, it rewrites components and hooks to memoize values, callbacks and JSX at a fine granularity, keyed on their actual inputs. That removes most manual \`memo\`/\`useMemo\`/\`useCallback\`. It relies on the **Rules of React**: components and hooks are pure and idempotent; props, state and values passed to JSX are not mutated; hooks are called at the top level in the same order; and refs aren't read during render. Code that violates these is skipped or may behave incorrectly. The ESLint plugin flags violations.
`],
    ['How would you find a slow render?',
      `
Reproduce it, then record with the React DevTools **Profiler**. Look at the flamegraph for wide bars and at "why did this render?". Check whether many children render for an unrelated change (fix: move state down or memoize) or one component is slow on its own (fix: \`useMemo\` the computation, virtualise the list, or defer with \`useDeferredValue\`). Confirm with the Performance panel that the time is actually in scripting. Measure again after the fix.
`],
  ],
});

export const DAY7 = Day({
  n: 7, week: 2,
  title: 'State architecture: Context, reducers, external stores',
  tagline: 'There is no container. "Services" are values placed in the tree, and a context is a transport, not a store.',
  concepts: [
    C('y', 'Services → Context + a provider',
      `
An Ember service is a lazily created singleton from the DI container, available anywhere with \`@service\`. React has no container. \`createContext\` defines a slot, a **provider** puts a value into the tree, and \`useContext\` (or \`use(Context)\`) reads the nearest provider above. Scope comes from *where you render the provider*: two providers give two independent "services", which is great for tests and for embedding.

Context is **dependency injection, not state management**. It carries whatever you put in it: a reducer's state, a store, a client. In React 19, \`<MyContext value={…}>\` is the provider; \`.Provider\` is no longer needed.
`,
      `
// app/services/issues.js
export default class IssuesService extends Service {
  @tracked issues = [];
}

// anywhere
@service issues;
`,
      `
const IssuesContext = createContext<IssuesValue | null>(null);

function IssuesProvider({ children }: { children: ReactNode }) {
  const [issues, dispatch] = useReducer(issuesReducer, []);
  const value = useMemo(() => ({ issues, dispatch }), [issues]);
  return <IssuesContext value={value}>{children}</IssuesContext>;
}

function useIssues() {
  const v = useContext(IssuesContext);
  if (!v) throw new Error('useIssues must be used inside <IssuesProvider>');
  return v;
}
`, { emberLang: 'javascript' }),
    C('r', 'Every consumer re-renders when the value changes',
      `
When a provider's \`value\` changes (by \`Object.is\`), **every** component that reads that context re-renders, even if it only uses one field, and even if it's wrapped in \`memo\`. There's no selector. Two consequences:

- **Memoize the value object.** \`value={{ issues, dispatch }}\` is a new object on every provider render, so every consumer re-renders every time.
- **Split contexts** by update frequency: put \`dispatch\` (stable) in one, \`issues\` (changes) in another, and the theme in a third. Or put a *store* in context and subscribe with selectors.
`,
      `
{{!-- consumers only update where they read
     the specific tracked field that changed --}}
{{this.issues.count}}
`,
      `
// ❌ new object every render → all consumers re-render
<IssuesContext value={{ issues, dispatch }}>

// ✅ stable unless issues changes
const value = useMemo(() => ({ issues, dispatch }), [issues]);

// ✅✅ split: dispatch never changes
<DispatchContext value={dispatch}>
  <IssuesContext value={issues}>…</IssuesContext>
</DispatchContext>
`),
    C('g', '`useReducer`',
      `
\`useReducer(reducer, initial)\` moves the update logic into a pure \`(state, action) => newState\` function, the same as Redux. You can test it without React, it centralises the transitions, and \`dispatch\` has a stable identity (good for context). Use it when the next state depends on the previous state in several ways, or when updates are naturally named events (\`added\`, \`statusChanged\`). Throw on unknown actions, and type actions as a discriminated union for exhaustiveness.
`,
      `
// a service's @actions, each mutating this.issues
@action add(issue) { this.issues = [...this.issues, issue]; }
@action remove(id) { this.issues = this.issues.filter(i => i.id !== id); }
`,
      `
function issuesReducer(state: Issue[], action: IssuesAction): Issue[] {
  switch (action.type) {
    case 'added':   return [...state, action.issue];
    case 'removed': return state.filter((i) => i.id !== action.id);
    default: throw new Error(\`Unknown action: \${(action as any).type}\`);
  }
}
const [issues, dispatch] = useReducer(issuesReducer, initialIssues);
`, { emberLang: 'javascript' }),
    C('y', 'External stores with `useSyncExternalStore`',
      `
For state shared widely and updated often, keep it **outside** React and subscribe with a selector: \`useSyncExternalStore(subscribe, getSnapshot)\`. A component re-renders only when *its* selected snapshot changes. It also prevents **tearing**: during a concurrent render, React makes sure every component sees the same version of the store. This is the primitive under Zustand, Redux (\`useSelector\`), Jotai and friends.

The snapshot must be stable for unchanged data: return a slice, not a fresh object or array on each call.
`,
      `
// a service with @tracked fields IS an external store
// with fine-grained subscriptions built in
@service filters;
{{this.filters.status}}
`,
      `
function useStore<T, S>(store: Store<T>, selector: (s: T) => S): S {
  return useSyncExternalStore(store.subscribe, () => selector(store.getState()));
}

const status = useStore(filterStore, (s) => s.status);
// re-renders only when status changes
`),
    C('y', 'Where should state live?',
      `
Escalate only as needed:

- **Local** \`useState\` in the component that uses it.
- **Lifted** to the nearest common parent when siblings share it.
- **URL** for anything that should survive reload or be shareable: filters, tabs, selection (Day 10).
- **Context** for tree-wide, low-frequency values (current user, theme, feature flags) or for injecting a client or store.
- **External store** (Zustand, Redux) for high-frequency, app-wide client state with many readers.
- **Server cache** (TanStack Query, loaders) for anything that comes from the server, which is usually *most* of your "state" (Day 9).
`,
      `
// Ember defaults: component @tracked → service → ember-data store.
`,
      `
// React defaults: useState → lift → URL / context → store → Query cache.
`, { emberLang: 'javascript', reactLang: 'typescript' }),
  ],
  exercise: {
    files: [
      'exercises/day07/issuesReducer.ts',
      'exercises/day07/IssuesContext.tsx',
      'exercises/day07/store.ts',
    ],
    command: 'pnpm test day07',
    criteria: [
      '`issuesReducer` handles `added`, `updated`, `removed` and `statusChanged` **immutably** (state is frozen), keeps untouched items\' identity, and throws on unknown actions.',
      '`useIssues()` throws "useIssues must be used inside <IssuesProvider>" with no provider.',
      'The context value is memoized: an unrelated provider re-render doesn\'t re-render a `memo`\'d consumer.',
      '`createStore` notifies subscribers. `useStore(store, selector)` re-renders a consumer only when its slice changes.',
    ],
    stretch: 'Split `IssuesContext` into a state context and a dispatch context, and write a test proving a dispatch-only consumer never re-renders.',
  },
  drill: [
    ['How does Context compare to an Ember service?',
      `
Both inject shared things without prop drilling. A service is a **container-managed singleton**: lazily created, globally addressable by name, and fine-grained reactive through \`@tracked\`. Context is **tree-scoped**: the value comes from the nearest provider above, and there can be many providers. It has no lifecycle of its own and no fine-grained reactivity, so any value change re-renders all consumers. Context is the injection mechanism. State lives in whatever you put in it (\`useReducer\`, a store, a client).
`],
    ['Why can context cause performance problems?',
      `
Every consumer re-renders whenever the provider's \`value\` changes by reference, regardless of which part it uses, and \`memo\` doesn't help. Common causes are an un-memoized object literal as the value, or one giant context holding fast-changing state. Fixes: memoize the value, split contexts by concern and update frequency, keep \`dispatch\` separate, or put a store in context and subscribe with selectors (\`useSyncExternalStore\`).
`],
    ['`useReducer` vs `useState`?',
      `
They're the same mechanism (\`useState\` is a reducer that replaces the state). Use \`useReducer\` when there are several related fields or transitions, when the next state depends on the previous state in non-trivial ways, when you want the logic as a pure, testable function, or when you want a stable \`dispatch\` to pass down instead of many callbacks. Use \`useState\` for independent, simple values.
`],
    ['What problem does `useSyncExternalStore` solve?',
      `
Subscribing safely to state that lives outside React. Without it, a concurrent render could read the store at different moments for different components and show inconsistent UI (**tearing**). It also handles subscribe/unsubscribe and server snapshots. Combined with a selector, it gives fine-grained re-renders: only components whose selected value changed update.
`],
    ['When would you reach for Zustand or Redux?',
      `
When client state is shared across distant parts of the tree, updated often, and read by many components, so context would cause broad re-renders: editors, canvases, complex UI state, multi-step workflows. Redux (Toolkit) adds strict conventions, devtools and middleware for large teams. Zustand is minimal. Not for server data: that belongs in a server cache.
`],
  ],
});

export const DAY8 = Day({
  n: 8, week: 2,
  title: 'Custom hooks',
  tagline: 'A hook is just a function that calls hooks. That makes it the unit of reuse for stateful logic.',
  concepts: [
    C('y', 'Hooks are the unit of reusable stateful logic',
      `
A custom hook is a function named \`useX\` that calls other hooks. It can own state and effects and return anything: values, setters, tuples, objects. Each **call site gets its own state**. Nothing is shared unless the hook reads a context or an external store.

Ember spread this across ember-resources (reactive values with teardown), stateful helpers, and services for shared state. In React they're all custom hooks.
`,
      `
// ember-resources
const Clock = resource(({ on }) => {
  const time = cell(new Date());
  const id = setInterval(() => (time.current = new Date()), 1000);
  on.cleanup(() => clearInterval(id));
  return time;
});

{{Clock}}
`,
      `
function useClock() {
  const [time, setTime] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

const time = useClock();
`, { emberLang: 'javascript' }),
    C('r', 'The Rules of Hooks, and why',
      `
Call hooks **only at the top level** of a component or custom hook: never in conditions, loops, nested functions or after an early return. Call them **only from React functions**.

Why: React stores hook state in a list on the component instance and matches it up by **call order**. Hook #1 is the first \`useState\`, hook #2 the next, and so on. If a condition skips a hook on one render, every later hook reads the wrong slot. There are no names or keys, only order. (\`use()\` is the exception: it may be called conditionally.)
`,
      `
// no equivalent: tracked fields are named properties
// on an object, so order never matters
`,
      `
// ❌ order changes when \`issue\` toggles between null and set
if (issue) {
  const [draft, setDraft] = useState(issue.title);
}

// ✅ always call; branch on the value
const [draft, setDraft] = useState(issue?.title ?? '');
`, { emberLang: 'javascript' }),
    C('y', 'Composing hooks',
      `
Hooks compose like functions: \`useIssueSearch\` = \`useLocalStorage\` (persisted query) + \`useDebouncedValue\` (settled query) + a derived filter. Keep each hook small, return stable identities (\`useCallback\`) for anything a consumer might pass to \`memo\` or effect deps, and derive rather than store.
`,
      `
// compose resources / helpers / services
@service search;
get results() { return filter(this.args.issues, this.search.debouncedQuery); }
`,
      `
function useIssueSearch(issues: Issue[]) {
  const [query, setQuery] = useLocalStorage('issue-search:query', '');
  const debounced = useDebouncedValue(query, 200);
  const results = issues.filter((i) => matches(i, debounced));
  return { query, setQuery, results };
}
`, { emberLang: 'javascript' }),
    C('g', 'Testing hooks with `renderHook`',
      `
\`renderHook(() => useThing(args), { initialProps, wrapper })\` mounts a throwaway component and gives you \`result.current\`. Wrap state changes in \`act()\`, call \`rerender(newProps)\` to change inputs, and use \`wrapper\` for providers (a QueryClient, a context). Use fake timers for debounce and intervals. Better still, test hooks *through* a component when the hook only exists to serve that component.
`,
      `
// tests/unit/resources/clock-test.js
const owner = this.owner;
const clock = Clock.from(owner);
assert.ok(clock.current instanceof Date);
`,
      `
const { result, rerender } = renderHook(({ v }) => useDebouncedValue(v, 300), {
  initialProps: { v: 'a' },
});
rerender({ v: 'ab' });
act(() => vi.advanceTimersByTime(300));
expect(result.current).toBe('ab');
`, { emberLang: 'javascript' }),
  ],
  exercise: {
    files: [
      'exercises/day08/useToggle.ts',
      'exercises/day08/useDebouncedValue.ts',
      'exercises/day08/useLocalStorage.ts',
      'exercises/day08/useIssueSearch.ts',
    ],
    command: 'pnpm test day08',
    criteria: [
      '`useToggle(initial)` returns `[on, toggle, set]`, and `toggle` keeps the same identity across renders.',
      '`useDebouncedValue(value, ms)` only updates after the value has stopped changing for `ms` (fake timers).',
      '`useLocalStorage(key, initial)` reads lazily (once), falls back on bad JSON, and writes JSON on set (including updater functions).',
      '`useIssueSearch(issues)` composes both: results debounced by 200 ms, query persisted and restored on mount.',
    ],
    stretch: 'Make `useLocalStorage` sync across browser tabs by listening to the `storage` event. Bonus: build it on `useSyncExternalStore`.',
  },
  drill: [
    ['Why can\'t hooks be called conditionally?',
      `
React identifies each hook's state by its **position in the call order** during a render, not by name. If a hook is skipped or added conditionally, every later hook shifts slots and reads another hook's state. That means corrupted state and React's "rendered fewer/more hooks than expected" error. The lint rule \`react-hooks/rules-of-hooks\` enforces this. \`use()\` is the deliberate exception.
`],
    ['Do two components using the same hook share state?',
      `
No. Each call creates independent state in that component's instance. A hook shares **logic**, not data. To share data, the hook must read from something shared: a context, an external store (\`useSyncExternalStore\`), a server cache (TanStack Query, where two \`useQuery\` calls with the same key do share the cache), or module-level state.
`],
    ['Hooks vs HOCs vs render props?',
      `
All three reuse behaviour. **HOCs** (\`withX(Component)\`) wrap components. They're hard to type, create wrapper hell and cause prop-name collisions, so they're mostly legacy. **Render props** invert control over markup, which is still useful when a child owns per-item data. **Hooks** reuse stateful logic with no extra components, compose naturally and type cleanly. Hooks are the default today.
`],
    ['How do you test a custom hook?',
      `
Prefer testing through the component that uses it (behaviour over implementation). For reusable library hooks, use \`renderHook\` from Testing Library: assert on \`result.current\`, drive changes with \`act()\` and \`rerender()\`, provide context with \`wrapper\`, and control time with fake timers. Assert outcomes (values, calls, storage), not internal state.
`],
  ],
});

export const DAY9 = Day({
  n: 9, week: 2,
  title: 'Data fetching: TanStack Query, Suspense, error boundaries',
  tagline: 'Server state is a cache you don\'t own. Stop putting it in useState.',
  concepts: [
    C('y', 'Server state ≠ client state',
      `
Client state (UI toggles, form drafts) is synchronous, owned by you, and always current. Server state is **remote, asynchronous, shared and possibly stale** the moment you receive it. It needs caching, dedupe, background refetch, invalidation after writes, retries and pagination. Hand-rolling that with \`useEffect\` + \`useState\` is how codebases accumulate race conditions (Day 5). Use a server-cache library: TanStack Query, router loaders, or RSC.
`,
      `
// ember-data/WarpDrive: a normalised identity-map
// store with records, relationships and request caching.
model() { return this.store.findAll('issue'); }
`,
      `
const { data, isPending, isError } = useQuery({
  queryKey: ['issues', 'list', { status }],
  queryFn: () => fetchIssues({ status }),
});
`, { emberLang: 'javascript' }),
    C('y', 'The query cache vs the ember-data store',
      `
TanStack Query caches **by query key**, not by type + id. There's no normalisation and no identity map: \`['issues','list',{status:'todo'}]\` and \`['issues','detail','1']\` are separate entries that both contain issue 1. You keep them consistent by **invalidating** related keys after a mutation, or by writing to them with \`setQueryData\`.

Defaults to know: \`staleTime: 0\` (data is stale immediately, so remounting, refocusing or reconnecting refetches *in the background* while the cached data shows: stale-while-revalidate), \`gcTime: 5 min\` for unused entries, 3 retries, and identical in-flight requests deduped. ember-concurrency's \`isRunning\` / \`last.error\` map to \`isPending\` / \`isFetching\` / \`isError\` / \`error\`.
`,
      `
this.store.peekRecord('issue', '1'); // identity map
await this.store.findRecord('issue', '1', { reload: true });
task.isRunning; task.last.error;
`,
      `
queryClient.getQueryData(issueKeys.detail('1'));
queryClient.invalidateQueries({ queryKey: issueKeys.all });
const { isPending, isFetching, isError, error } = useIssueQuery('1');
`, { emberLang: 'javascript', reactLang: 'typescript' }),
    C('g', 'Query-key factories',
      `
Keys are arrays, compared structurally and **hierarchically**. Invalidating \`['issues']\` hits every key that starts with it. Centralise them in a factory so components never hand-write keys, and include **every input of the queryFn** in the key (filters, ids, page). If it isn't in the key, different inputs share one cache entry.
`,
      `
// adapters + serializers define the URL / shape per type
`,
      `
export const issueKeys = {
  all: ['issues'] as const,
  lists: () => [...issueKeys.all, 'list'] as const,
  list: (f: IssueQuery) => [...issueKeys.lists(), f] as const,
  details: () => [...issueKeys.all, 'detail'] as const,
  detail: (id: string) => [...issueKeys.details(), id] as const,
};
`, { emberLang: 'javascript', reactLang: 'typescript' }),
    C('y', 'Mutations and invalidation',
      `
\`useMutation({ mutationFn, onSuccess })\` gives you \`mutate\`/\`mutateAsync\`, \`isPending\` and \`error\`. After a successful write, **invalidate** the affected keys. Active queries refetch and inactive ones are marked stale. Return the invalidation promise from \`onSuccess\` to keep the mutation pending until the fresh data has arrived. For instant UI, do an optimistic update: \`onMutate\` writes the cache, \`onError\` rolls back, \`onSettled\` invalidates.
`,
      `
issue.status = 'done';
await issue.save(); // store updates the record everywhere
`,
      `
const qc = useQueryClient();
const update = useMutation({
  mutationFn: ({ id, status }) => updateIssue(id, { status }),
  onSuccess: () => qc.invalidateQueries({ queryKey: issueKeys.all }),
});
update.mutate({ id: '1', status: 'done' });
`, { emberLang: 'javascript' }),
    C('r', 'Suspense for data',
      `
With Suspense, a component that isn't ready **suspends**: it throws a promise (or calls \`use(promise)\`), and the nearest \`<Suspense fallback>\` above it shows the fallback until the promise settles. \`useSuspenseQuery\` does this for you, and \`data\` is then always defined. Loading UI moves *out* of the component and up the tree, where you choose the granularity. Errors work the same way: thrown, then caught by the nearest **error boundary**.

Caveats: sibling suspending queries inside one component run in series (a waterfall), so hoist or prefetch them. Promises passed to \`use()\` must be cached, not created during render.
`,
      `
// routes/issue-loading.hbs: a loading substate
// per route, while model() resolves
`,
      `
<ErrorBoundary fallback={…}>
  <Suspense fallback={<p>Loading issue…</p>}>
    <IssueDetail id={id} />
  </Suspense>
</ErrorBoundary>

function IssueDetail({ id }: { id: string }) {
  const { data } = useSuspenseQuery({ queryKey: issueKeys.detail(id), queryFn: … });
  return <h2>{data.title}</h2>; // never undefined
}
`),
    C('r', 'Error boundaries are still class components',
      `
There's still no hook for catching render errors. An error boundary is a class with \`static getDerivedStateFromError\` (switch to the fallback) and optionally \`componentDidCatch\` (report the error). It catches errors thrown during **render, lifecycle and effects** of its subtree. It does *not* catch errors in event handlers or async code you didn't render with, which you handle yourself. Most apps use the \`react-error-boundary\` package. With Query, wrap it in \`QueryErrorResetBoundary\` so "Try again" clears the cached error and refetches.
`,
      `
// routes/issue-error.hbs: an error substate
// per route
`,
      `
class ErrorBoundary extends Component<Props, { error: Error | null }> {
  state = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  reset = () => { this.props.onReset?.(); this.setState({ error: null }); };
  render() {
    return this.state.error
      ? this.props.fallback({ error: this.state.error, reset: this.reset })
      : this.props.children;
  }
}
`),
  ],
  exercise: {
    files: [
      'exercises/day09/queries.ts',
      'exercises/day09/IssueListScreen.tsx',
      'exercises/day09/ErrorBoundary.tsx',
      'exercises/day09/IssueDetailBoundary.tsx',
    ],
    command: 'pnpm test day09',
    criteria: [
      '`issueKeys` is a hierarchical factory, and every filter gets its own cache entry.',
      '`IssueListScreen` shows "Loading issues…", then the list. On error it shows a `role="alert"` with a "Retry" button that refetches.',
      'Changing an issue\'s status (`Status for {title}`) mutates, invalidates `issueKeys.all`, and the issue drops out of a filtered list.',
      '`ErrorBoundary` renders `fallback({ error, reset })`, and `reset` re-renders the children.',
      '`IssueDetailBoundary` suspends ("Loading issue…"), shows "Something went wrong" for id 999, and "Try again" resets the boundary **and** the query.',
    ],
    stretch: 'Make the status change optimistic: `onMutate` updates the list cache, `onError` restores the snapshot, `onSettled` invalidates. Test it with `failNextRequest()`.',
  },
  drill: [
    ['Server state vs client state?',
      `
**Client state** is owned by the UI: synchronous, always correct, private (open menus, drafts, selection). **Server state** is owned by the server: async, shared, and stale as soon as it's fetched, so it needs caching, background refresh, dedupe, invalidation after mutations and error/retry handling. Treating server data as client state (copying it into \`useState\`) is the root of most data bugs. Keep it in a server cache and derive from it.
`],
    ['What is stale-while-revalidate?',
      `
Serve cached data immediately, even if stale, while refetching in the background, then swap in the fresh result. In TanStack Query, data becomes stale after \`staleTime\` (default 0). When a stale query is used again (mount, window focus, reconnect, invalidation), it shows the cached data with \`isFetching: true\` and refetches. Users see instant UI and eventual freshness.
`],
    ['How do query keys work?',
      `
A key is a serialisable array that uniquely identifies a cache entry. It's hashed deterministically (object key order doesn't matter) and matched by prefix for invalidation. Every input to the \`queryFn\` must be in the key, so different inputs give different entries. Key factories keep them consistent and make hierarchical invalidation (\`['issues']\` → all lists and details) easy.
`],
    ['Optimistic update vs invalidation?',
      `
**Invalidation:** after the server confirms, mark the related keys stale and refetch. Always correct, and the UI updates after a round trip. **Optimistic:** update the cache (or show \`useOptimistic\` state) *before* the server answers, roll back on error, and usually invalidate on settle to reconcile. It feels instant, but you need rollback logic and you risk briefly showing something false. Use optimistic updates for high-confidence, low-stakes interactions (toggles, likes, reordering).
`],
    ['How does Suspense work?',
      `
During render, a component that needs unavailable data **suspends**: it throws a promise (libraries do this for you), or calls \`use(promise)\`. React stops rendering that subtree and shows the nearest \`<Suspense>\` fallback. When the promise resolves, React retries the render. Already-visible content isn't replaced by a fallback for updates made inside a transition. On the server, Suspense boundaries are streaming points.
`],
    ['Why aren\'t error boundaries hooks?',
      `
Catching an error thrown while rendering *children* requires a component that can render a different tree in response, in the same commit, after a child failed. That ties into class lifecycle hooks (\`getDerivedStateFromError\`, \`componentDidCatch\`) that have no hook equivalent yet. In practice you write one class, or use \`react-error-boundary\`, and compose it like any component.
`],
    ['How does this compare with ember-data?',
      `
ember-data/WarpDrive is a **normalised identity map**: one record per type + id, relationships, and a single source of truth that every view shares. TanStack Query is a **request cache** keyed by query, with no normalisation. You keep views consistent through invalidation or \`setQueryData\`. That's simpler and protocol-agnostic, but consistency is explicit. Query's lifecycle features (stale-while-revalidate, focus refetch, retries, dedupe, gc) are richer out of the box. WarpDrive's newer request-centric APIs are converging on the same model.
`],
  ],
});

export const DAY10 = Day({
  n: 10, week: 2,
  title: 'Routing with React Router 8 (data mode)',
  tagline: 'Closest to home. Route objects, loaders and outlets map almost 1:1 to the Ember router.',
  concepts: [
    C('g', '`Router.map` → route objects',
      `
In data mode you declare routes as objects: \`{ path, element, loader, errorElement, children }\`. Pass them to \`createBrowserRouter\` (or \`createMemoryRouter\` in tests) and render \`<RouterProvider router={router}/>\`. Nesting in the config is nesting in the UI. **v8 notes:** everything is imported from \`react-router\` (the \`react-router-dom\` package is gone; the DOM \`RouterProvider\` lives in \`react-router/dom\` if you need \`flushSync\`), the library is ESM-only, it needs Node ≥ 22.22, and route **middleware** is on by default. **TanStack Router** is the main alternative if you want fully type-safe params and search-param schemas.
`,
      `
Router.map(function () {
  this.route('issues', function () {
    this.route('issue', { path: '/:issue_id' });
  });
  this.route('not-found', { path: '/*path' });
});
`,
      `
const routes: RouteObject[] = [{
  path: '/', element: <Layout />, errorElement: <RootError />,
  children: [
    { index: true, loader: () => redirect('/issues') },
    { path: 'issues', element: <IssuesPage />, loader: issuesLoader,
      children: [{ path: ':issueId', element: <IssueDetail />, loader: issueLoader }] },
    { path: '*', element: <NotFound /> },
  ],
}];
`, { emberLang: 'javascript' }),
    C('g', 'Nested routes and `{{outlet}}` → `<Outlet/>`',
      `
A parent route renders \`<Outlet/>\` where its matched child goes, exactly like \`{{outlet}}\`. Layouts persist across child navigations, so their state survives. An \`index: true\` route renders at the parent's own URL (Ember's \`index\` route).
`,
      `
{{!-- templates/issues.hbs --}}
<IssueList @issues={{@model}} />
{{outlet}}
`,
      `
function IssuesPage() {
  const { issues } = useLoaderData<typeof issuesLoader>();
  return (
    <>
      <IssueList issues={issues} />
      <Outlet />
    </>
  );
}
`),
    C('g', 'The model hook → `loader` + `useLoaderData`',
      `
A \`loader({ params, request })\` runs **before** the route renders, and all matched loaders run **in parallel** (Ember resolves models parent-first, in series). The component reads the result with \`useLoaderData()\`. Type it with \`useLoaderData<typeof loader>()\`. Search params live on \`new URL(request.url)\`. Loaders re-run on navigation and after actions, and you can \`redirect()\` or \`throw\` from them.
`,
      `
// routes/issues/issue.js
model({ issue_id }) {
  return fetchIssue(issue_id);
}
// template: @model
`,
      `
export async function issueLoader({ params }: LoaderFunctionArgs) {
  return fetchIssue(params.issueId!);
}

function IssueDetail() {
  const issue = useLoaderData<typeof issueLoader>();
  return <h2>{issue.title}</h2>;
}
`, { emberLang: 'javascript' }),
    C('g', 'Error and loading substates → `errorElement` and `useNavigation()`',
      `
Throw from a loader (or render) and the **nearest** route's \`errorElement\` renders in place of that route's element. Parents (and the list next to a failing detail) stay on screen. Throw \`data('Not found', { status: 404 })\` for HTTP-style errors, and check them with \`isRouteErrorResponse(error)\`.

There are no loading substates by default: the **old page stays** while the next one loads, and \`useNavigation().state === 'loading'\` lets you show a global pending indicator. That's usually better UX than flashing a spinner page.
`,
      `
// routes/issues/issue-error.hbs + issue-loading.hbs
`,
      `
export async function issueLoader({ params }: LoaderFunctionArgs) {
  try { return await fetchIssue(params.issueId!); }
  catch (e) {
    if (e instanceof ApiError && e.status === 404) throw data('Issue not found', { status: 404 });
    throw e;
  }
}

function IssueError() {
  const error = useRouteError();
  return isRouteErrorResponse(error) && error.status === 404
    ? <p role="alert">Issue not found</p>
    : <p role="alert">Something went wrong</p>;
}
`),
    C('y', 'Query params → `useSearchParams`: the URL as state',
      `
\`const [searchParams, setSearchParams] = useSearchParams()\`. Reading gives you a \`URLSearchParams\`. Setting it navigates, which re-runs loaders. Unlike Ember's controller query params, there's no declaration, no defaults, no type coercion and no sticky state. Parse and validate on read, and drop default values from the URL yourself. Filters, sorting, tabs and pagination belong here: shareable, reload-proof, with working Back.
`,
      `
// controllers/issues.js
queryParams = ['status'];
@tracked status = 'all';
`,
      `
const [params, setParams] = useSearchParams();
const status = parseStatus(params.get('status')); // validate!

<select value={status} onChange={(e) =>
  setParams(e.target.value === 'all' ? {} : { status: e.target.value })}>
`, { emberLang: 'javascript' }),
    C('g', '`<Link>`, `useNavigate`',
      `
\`<Link to="/issues/2">\` is \`<LinkTo @route="issues.issue" @model="2">\`. URLs are strings, not route names. \`<NavLink>\` adds an \`active\` class. Use \`useNavigate()\` for programmatic transitions (\`router.transitionTo\`). Relative paths resolve against the *route* hierarchy. To keep the filter when opening a detail, carry the search string along: \`to={{ pathname, search }}\`.
`,
      `
<LinkTo @route="issues.issue" @model={{issue.id}}>{{issue.title}}</LinkTo>
this.router.transitionTo('issues');
`,
      `
<Link to={\`/issues/\${issue.id}\`}>{issue.title}</Link>
const navigate = useNavigate();
navigate('/issues');
`),
  ],
  exercise: {
    files: [
      'exercises/day10/routes.tsx',
    ],
    command: 'pnpm test day10',
    criteria: [
      '`/` redirects to `/issues` (an index route with a `redirect()` loader).',
      'The issues loader reads `?status=`. The "Status filter" select updates the search param, and the list follows.',
      'Clicking an issue shows its detail **nested** inside the layout, next to the still-visible list, and keeps the filter in the URL.',
      '`/issues/999` shows a nested "Issue not found" (thrown as `data(…, { status: 404 })`) while the list stays visible.',
      'Unknown URLs render "Page not found" inside the layout.',
    ],
    stretch: 'Add a pending indicator per link (`NavLink` exposes `isPending`) and wrap navigations in `<ViewTransition>` for a cross-fade.',
  },
  drill: [
    ['Loaders vs fetching in components?',
      `
**Loaders** start fetching as soon as navigation begins, before any component renders, and all matched routes' loaders run in parallel, so there are no render-then-fetch waterfalls. They also give you route-level error handling, redirects and revalidation after actions. **Fetching in components** (effects, or even Query) starts only after render, and nested components fetch in series. Common combination: loaders *prefetch* into the Query cache (\`queryClient.ensureQueryData\`), and components read with \`useQuery\` for caching and background updates.
`],
    ['How do nested routes and outlets work?',
      `
Routes form a tree that mirrors the UI. A URL matches a *branch*, from root to leaf. Each matched route renders its element, and a parent renders \`<Outlet/>\` where its matched child goes. Parents stay mounted (with their state) while children change. Each level can have its own loader, \`errorElement\` and \`handle\`, so loading and failure are scoped to the part of the screen that's affected.
`],
    ['Where should filter state live, and why the URL?',
      `
In the URL search params. That makes it shareable (send a link), persistent across reloads, navigable (Back undoes a filter change) and server-renderable, and loaders can read it before render. \`useState\` loses it on reload, and global stores make it invisible. Validate on read, since the URL is user input.
`],
    ['How do you handle 404s and other errors per route?',
      `
Throw from the loader, for example \`throw data('Not found', { status: 404 })\` or a \`redirect()\`. Give the relevant route an \`errorElement\`. The router renders the nearest one in place of the failing route, so parents and siblings keep working. Inside it, \`useRouteError()\` + \`isRouteErrorResponse()\` tell HTTP-style errors apart from crashes. A catch-all \`path: '*'\` handles unknown URLs.
`],
    ['How does this compare with the Ember router?',
      `
Conceptually close: a nested route tree, a model hook (loader), outlets, error substates and URL-driven state. Differences: routes are config objects with string paths instead of named routes, loaders run in **parallel** rather than parent-first, there are no controllers (query params are just \`URLSearchParams\`, with no declaration, defaults or stickiness), there are no default loading substates (the old UI stays, with \`useNavigation()\`), and the router doesn't own a data store, which pairs with Query.
`],
  ],
});

export const WEEK2 = [DAY6, DAY7, DAY8, DAY9, DAY10];
