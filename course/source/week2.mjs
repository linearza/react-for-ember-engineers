import { C, Day } from './model.mjs';

export const DAY6 = Day({
  n: 6, week: 2,
  title: 'Rendering performance: reconciliation, memoization, React Compiler',
  tagline: 'Glimmer updates what changed. React re-runs what *might* have changed, and lets you (or the Compiler) prove it didn\'t.',
  concepts: [
    C('r', 'Reconciliation: type + key',
      `
Glimmer reuses by template identity, so you rarely think about this. React diffs element trees with two heuristics instead. A **different type** at the same position (\`<div>\` → \`<span>\`, \`ComponentA\` → \`ComponentB\`) unmounts the old subtree and mounts a new one, so its state is lost. The **same type and same key** keep the instance and update its props.

That makes defining a component *inside* another component a bug: every render creates a new function, which is a new type, so the child remounts every time. Conditionally wrapping in an extra \`<div>\` resets everything below it for the same reason.
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
When a component renders, **every child it returns renders too**, recursively, whether or not their props changed. Glimmer never had this cost model, so it's easy to miss.

Usually it doesn't matter, because renders are cheap and React only touches the DOM where the output differs. It starts to matter with big lists, expensive children or high-frequency updates such as typing and dragging.
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
\`memo(Component)\` skips a re-render when every prop is \`Object.is\`-equal to last time. That means a single prop that's a fresh object, array or function on each render, such as \`onSelect={() => …}\` or \`style={{…}}\`, **defeats** it. So you keep references stable:

- \`useCallback(fn, deps)\` keeps the same function identity until the deps change.
- \`useMemo(() => value, deps)\` does the same for computed values, and caches expensive work too.
- **Primitives** are stable for free: pass \`isSelected={id === selectedId}\` instead of \`selectedId\`, and only the two rows whose boolean flipped re-render.

But memoization isn't free. It costs comparisons and memory, and it makes code noisier, so measure first.
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
Before memoizing, restructure. In Ember, component boundaries are about reuse; in React they also decide what re-renders.

- **Move state down.** Put the draft input and its state in a \`<DraftNote/>\` component, and typing re-renders only that component.
- **Lift content up.** When a stateful wrapper takes \`children\`, its *parent* created those children, so they don't re-render when the wrapper's state changes.

Both fixes cost nothing and keep working when the Compiler arrives.
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
Glimmer's compiler already knows what's static and what's dynamic. The React Compiler (v1, stable) closes much of that gap at build time. It's a Babel plugin (an experimental Rust port also exists) that analyses each component and hook and caches JSX subtrees, derived values and callbacks, keyed on their real inputs. In effect it's \`memo\`/\`useMemo\`/\`useCallback\` everywhere, done correctly.

The catch is that it relies on the **Rules of React**: components are pure, props and state are never mutated, and hooks run unconditionally at the top level. Code that breaks the rules is skipped.

So manual memo still matters: for code the compiler skips, for values handed to non-React libraries that compare identity, for effect dependencies you want explicit, and on codebases that haven't adopted it. This day's stretch goal turns it on.
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
Measure before memoizing, because the slow thing is usually one component, not "React". The React DevTools **Profiler** is the Ember Inspector's render tab: record an interaction and it shows which components rendered, why ("props changed: onSelect") and how long each took. "Highlight updates when components render" makes the same thing visible live. In code, \`<Profiler id onRender>\` reports commit timings, which is how the Day 5 and Day 6 tests count renders.
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
No. A re-render means React called your component and diffed its output, and it only touches the DOM where the new output differs. So a component can re-render a hundred times with zero DOM mutations. What an unnecessary re-render costs is the JavaScript work, your function plus the diff, and that's what memoization saves.
`],
    ['When does `memo` fail to prevent a re-render?',
      `
When any prop is a **new reference** each render. The usual culprits are inline arrow functions, object or array literals (\`style={{…}}\`, \`options={[…]}\`), \`children\` JSX, which is always a new element, and values derived without \`useMemo\`. It also fails when the component's own state or a context it reads changes, because \`memo\` only guards props. The fixes are stable references (\`useCallback\`/\`useMemo\`), primitive props, or restructuring.
`],
    ['`useMemo` vs `useCallback`?',
      `
\`useMemo\` memoizes the *result* of calling a function, whereas \`useCallback\` memoizes the function itself: \`useCallback(fn, deps)\` is just \`useMemo(() => fn, deps)\`. So reach for \`useMemo\` for expensive computations or stable object and array identities, and for \`useCallback\` when passing functions to memoized children or into effect dependencies. Neither is a semantic guarantee, because React may discard its caches.
`],
    ['What does the React Compiler do, and which rules does it rely on?',
      `
It rewrites components and hooks at build time to memoize values, callbacks and JSX at a fine grain, keyed on their actual inputs, which removes most manual \`memo\`/\`useMemo\`/\`useCallback\`. In return it relies on the **Rules of React**. First, components and hooks are pure and idempotent. Second, props, state and values passed to JSX are never mutated. Third, hooks are called at the top level in the same order, and refs aren't read during render. Code that breaks these is skipped or may misbehave, which is why the ESLint plugin flags it.
`],
    ['How would you find a slow render?',
      `
Reproduce it, record it with the React DevTools **Profiler**, and look for wide bars in the flamegraph and at "why did this render?". Then work out which of two problems you have. Either many children render for an unrelated change, so you move state down or memoize. Or one component is slow on its own, so you \`useMemo\` the computation, virtualise the list, or defer it with \`useDeferredValue\`. Check in the Performance panel that the time really is in scripting, and measure again after the fix.
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
An Ember service is a lazily created singleton from the DI container, available anywhere with \`@service\`. React has no container. Instead, \`createContext\` defines a slot, a **provider** puts a value into the tree, and \`useContext\` (or \`use(Context)\`) reads the nearest provider above. Scope therefore comes from *where you render the provider*: two providers give two independent "services", which is great for tests and for embedding.

Context is **dependency injection, not state management**. It carries whatever you put in it, whether that's a reducer's state, a store or a client. In React 19 the context itself is the provider (\`<MyContext value={…}>\`), so \`.Provider\` is no longer needed.
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
Ember consumers update only where they read the tracked field that changed. Context has no selector, so when a provider's \`value\` changes (by \`Object.is\`), **every** component that reads it re-renders, even if it uses one field and even inside \`memo\`. Two habits follow:

- **Memoize the value object.** \`value={{ issues, dispatch }}\` is a new object on every provider render, so every consumer re-renders every time.
- **Split contexts** by update frequency: the stable \`dispatch\` in one, the changing \`issues\` in another, the theme in a third. Alternatively, put a *store* in context and subscribe with selectors.
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
Where a service spreads its updates across \`@action\` methods, \`useReducer(reducer, initial)\` gathers them into one pure \`(state, action) => newState\` function, as Redux does. That function is testable without React and centralises every transition, and \`dispatch\` keeps a stable identity, which suits context.

Reach for it when the next state depends on the previous one in several ways, or when updates are naturally named events (\`added\`, \`statusChanged\`). Type the actions as a discriminated union for exhaustiveness, and throw on unknown ones.
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
A service with \`@tracked\` fields is already an external store with fine-grained subscriptions. React's equivalent is to keep widely shared, often updated state **outside** React and subscribe with a selector through \`useSyncExternalStore(subscribe, getSnapshot)\`, so a component re-renders only when *its* snapshot changes. It also prevents **tearing**, because React makes sure every component in a concurrent render sees the same version of the store. This is the primitive under Zustand, Redux (\`useSelector\`), Jotai and friends.

The catch is that the snapshot must be stable for unchanged data, so return a slice rather than a fresh object or array on each call.
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
Start local and escalate only when you need to:

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
Both inject shared things without prop drilling, but they're built differently. A service is a **container-managed singleton**: lazily created, addressable by name, and fine-grained reactive through \`@tracked\`. Context is **tree-scoped**, so the value comes from the nearest of possibly many providers above. It has no lifecycle of its own and no fine-grained reactivity, which means any value change re-renders all consumers. So context is only the injection mechanism, and the state lives in whatever you put in it: \`useReducer\`, a store or a client.
`],
    ['Why can context cause performance problems?',
      `
Because every consumer re-renders whenever the provider's \`value\` changes by reference, whichever part it uses, and \`memo\` doesn't help. The usual causes are an un-memoized object literal as the value, or one giant context holding fast-changing state. So memoize the value, split contexts by concern and update frequency with \`dispatch\` kept separate, or put a store in context and subscribe with selectors through \`useSyncExternalStore\`.
`],
    ['`useReducer` vs `useState`?',
      `
They're the same mechanism, since \`useState\` is just a reducer that replaces the state, so the choice is about shape. \`useState\` suits simple, independent values. \`useReducer\` pays off when there are several related fields or transitions, when the next state depends on the previous one in non-trivial ways, when you want the logic as a pure, testable function, or when one stable \`dispatch\` beats passing down many callbacks.
`],
    ['What problem does `useSyncExternalStore` solve?',
      `
It lets components subscribe safely to state that lives outside React. Without it, a concurrent render could read the store at different moments for different components and show inconsistent UI, which is called **tearing**. It also handles subscribing, unsubscribing and server snapshots. Add a selector and you get fine-grained re-renders, because only components whose selected value changed update.
`],
    ['When would you reach for Zustand or Redux?',
      `
When client state is shared across distant parts of the tree, updated often and read by many components, so context would cause broad re-renders. Think editors, canvases, complex UI state and multi-step workflows. Redux Toolkit adds strict conventions, devtools and middleware for large teams, whereas Zustand stays minimal. Neither is for server data, which belongs in a server cache.
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
Ember spreads reusable stateful logic across ember-resources (reactive values with teardown), stateful helpers and services. In React all of that is a custom hook: a function named \`useX\` that calls other hooks. It can own state and effects, and return anything from a value to a tuple or an object.

Each **call site gets its own state**, so nothing is shared unless the hook reads a context or an external store.
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
Call hooks **only at the top level** of a component or custom hook, never in conditions, loops, nested functions or after an early return, and call them **only from React functions**.

The reason is that tracked fields are named properties, but hooks have no names or keys. React stores hook state in a list on the component instance and matches it up by **call order**: hook #1 is the first \`useState\`, hook #2 the next, and so on. So if a condition skips a hook on one render, every later hook reads the wrong slot. \`use()\` is the one exception, and may be called conditionally.
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
Hooks compose like functions. \`useIssueSearch\`, for example, is \`useLocalStorage\` for the persisted query, plus \`useDebouncedValue\` for the settled query, plus a derived filter. Keep each hook small and derive rather than store. Anything a consumer might pass to a \`memo\`'d child or an effect's deps should keep a stable identity, so wrap it in \`useCallback\`.
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
\`renderHook(() => useThing(args), { initialProps, wrapper })\` mounts a throwaway component and exposes the hook's return value as \`result.current\`. Wrap state changes in \`act()\`, change inputs with \`rerender(newProps)\`, supply providers such as a QueryClient through \`wrapper\`, and control debounces and intervals with fake timers. But when a hook only exists to serve one component, test it *through* that component instead.
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
Because React identifies each hook's state by its **position in the call order**, not by name. If a hook is skipped or added conditionally, every later hook shifts a slot and reads another hook's state, which gives you corrupted state and the "rendered fewer/more hooks than expected" error. The lint rule \`react-hooks/rules-of-hooks\` enforces this, and \`use()\` is the deliberate exception.
`],
    ['Do two components using the same hook share state?',
      `
No. Each call creates independent state in its own component, because a hook shares **logic**, not data. To share data, the hook has to read from something shared: a context, an external store through \`useSyncExternalStore\`, module-level state, or a server cache. That's why two \`useQuery\` calls with the same key do see the same data.
`],
    ['Hooks vs HOCs vs render props?',
      `
All three reuse behaviour, but hooks are the default today. **HOCs** (\`withX(Component)\`) wrap components, which makes them hard to type, nests wrappers deeply and invites prop-name collisions, so they're mostly legacy. **Render props** invert control over markup, and that's still useful when a child owns per-item data. **Hooks** reuse stateful logic without extra components, so they compose naturally and type cleanly.
`],
    ['How do you test a custom hook?',
      `
Preferably through the component that uses it, because that tests behaviour rather than implementation. For reusable hooks, use \`renderHook\` from Testing Library: assert on \`result.current\`, drive changes with \`act()\` and \`rerender()\`, provide context through \`wrapper\`, and control time with fake timers. Either way, assert on outcomes such as values, calls and storage, not on internal state.
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
Client state, such as UI toggles and form drafts, is synchronous, owned by you and always current. Server state is **remote, asynchronous, shared and possibly stale** the moment it arrives, so it needs caching, dedupe, background refetch, invalidation after writes, retries and pagination. Ember gave you a store for that. In React, hand-rolling it with \`useEffect\` + \`useState\` is how codebases accumulate the race conditions from Day 5, so use a server cache instead: TanStack Query, router loaders or RSC.
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
Where ember-data keeps one record per type + id, TanStack Query caches **by query key**, with no normalisation and no identity map. So \`['issues','list',{status:'todo'}]\` and \`['issues','detail','1']\` are separate entries that both contain issue 1, and you keep them consistent yourself: **invalidate** related keys after a mutation, or write to them with \`setQueryData\`.

A few defaults are worth knowing:

- \`staleTime: 0\` makes data stale immediately, so remounting, refocusing or reconnecting refetches *in the background* while the cached data shows. That's stale-while-revalidate.
- \`gcTime: 5 min\` clears unused entries, failed queries retry 3 times, and identical in-flight requests are deduped.
- ember-concurrency's \`isRunning\` and \`last.error\` map to \`isPending\`, \`isFetching\`, \`isError\` and \`error\`.
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
Keys are arrays compared structurally and **hierarchically**, so invalidating \`['issues']\` hits every key that starts with it. Centralise them in a factory so components never hand-write one. And include **every input of the queryFn** in the key, whether filters, ids or page, because an input that isn't in the key makes different requests share one cache entry.
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
An ember-data \`save()\` updates the record everywhere. A query cache can't do that, so after a write you tell it what changed. \`useMutation({ mutationFn, onSuccess })\` gives you \`mutate\`/\`mutateAsync\`, \`isPending\` and \`error\`, and on success you **invalidate** the affected keys: active queries refetch and inactive ones are marked stale. Returning the invalidation promise from \`onSuccess\` keeps the mutation pending until the fresh data has arrived.

For instant UI, update optimistically instead: \`onMutate\` writes the cache, \`onError\` rolls back and \`onSettled\` invalidates.
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
Ember gives each route a loading substate. Suspense generalises that to any component: one that isn't ready **suspends** by throwing a promise (or calling \`use(promise)\`), and the nearest \`<Suspense fallback>\` above it shows the fallback until the promise settles. \`useSuspenseQuery\` does this for you, which means \`data\` is always defined. Loading UI therefore moves *out* of the component and up the tree, where you choose the granularity. Errors work the same way: thrown, then caught by the nearest **error boundary**.

There are two catches. Sibling suspending queries inside one component run in series, a waterfall, so hoist or prefetch them. And promises passed to \`use()\` must be cached rather than created during render.
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
Ember's per-route error substate becomes an error boundary, and there's still no hook for catching render errors. So a boundary is a class: \`static getDerivedStateFromError\` switches to the fallback, and an optional \`componentDidCatch\` reports the error.

A boundary catches errors thrown during the **render, lifecycle and effects** of its subtree. It does *not* catch errors in event handlers or in async code outside rendering, which you handle yourself. Most apps use the \`react-error-boundary\` package, and with Query you wrap it in \`QueryErrorResetBoundary\` so "Try again" clears the cached error and refetches.
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
The difference is ownership. **Client state** belongs to the UI, so it's synchronous, private and always correct: open menus, drafts, selection. **Server state** belongs to the server, so it's async, shared and stale once fetched, which is why it needs caching, background refresh, dedupe, invalidation and retries. Copying server data into \`useState\` is the root of most data bugs. Keep it in a server cache and derive from it.
`],
    ['What is stale-while-revalidate?',
      `
It means serving cached data immediately, even if stale, while refetching in the background, then swapping in the fresh result. In TanStack Query data goes stale after \`staleTime\`, which defaults to 0. When a stale query is used again, on mount, focus, reconnect or invalidation, it shows the cached data with \`isFetching: true\` and refetches. So users get instant UI and eventual freshness.
`],
    ['How do query keys work?',
      `
A key is a serialisable array that identifies one cache entry. It's hashed deterministically, so object key order doesn't matter, and matched by prefix for invalidation. Every input to the \`queryFn\` belongs in the key, so different inputs get different entries. A key factory keeps them consistent and makes hierarchical invalidation easy: \`['issues']\` hits every list and detail.
`],
    ['Optimistic update vs invalidation?',
      `
It's a trade between correctness and speed. **Invalidation** waits for the server to confirm, then marks related keys stale and refetches, so it's always correct but the UI updates after a round trip. An **optimistic** update writes the cache, or shows \`useOptimistic\` state, *before* the server answers, rolls back on error, and usually invalidates on settle to reconcile. It feels instant, but it needs rollback logic and can briefly show something false. So save it for high-confidence, low-stakes interactions like toggles, likes and reordering.
`],
    ['How does Suspense work?',
      `
A component that needs unavailable data **suspends** during render, by throwing a promise (libraries do this for you) or calling \`use(promise)\`. React stops rendering that subtree, shows the nearest \`<Suspense>\` fallback, and retries once the promise resolves. Inside a transition, though, already-visible content isn't swapped for a fallback. On the server, Suspense boundaries are also streaming points.
`],
    ['Why aren\'t error boundaries hooks?',
      `
Because catching an error thrown while rendering *children* needs a component that can render a different tree in the same commit, after a child failed. That relies on class lifecycle methods, \`getDerivedStateFromError\` and \`componentDidCatch\`, which have no hook equivalent yet. In practice you write one class, or use \`react-error-boundary\`, and compose it like any other component.
`],
    ['How does this compare with ember-data?',
      `
ember-data/WarpDrive is a **normalised identity map**: one record per type + id, with relationships, so every view shares a single source of truth. TanStack Query is a **request cache** keyed by query, with no normalisation, so you keep views consistent through invalidation or \`setQueryData\`. That's simpler and protocol-agnostic, but consistency becomes explicit. In return, Query's lifecycle features, such as stale-while-revalidate, focus refetch, retries, dedupe and gc, are richer out of the box. WarpDrive's newer request-centric APIs are converging on the same model.
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
In data mode, \`Router.map\` becomes an array of route objects, \`{ path, element, loader, errorElement, children }\`, and nesting in the config is nesting in the UI. Pass them to \`createBrowserRouter\` (or \`createMemoryRouter\` in tests) and render \`<RouterProvider router={router}/>\`.

**v8 notes:** everything is imported from \`react-router\`, because \`react-router-dom\` is gone (the DOM \`RouterProvider\` lives in \`react-router/dom\` if you need \`flushSync\`). The library is ESM-only, needs Node ≥ 22.22, and turns route **middleware** on by default. If you want fully type-safe params and search-param schemas, **TanStack Router** is the main alternative.
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
A parent route renders \`<Outlet/>\` where its matched child goes, exactly like \`{{outlet}}\`. Layouts stay mounted across child navigations, so their state survives. An \`index: true\` route is Ember's \`index\` route: it renders at the parent's own URL.
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
A \`loader({ params, request })\` is the model hook: it runs **before** the route renders, and the component reads its result with \`useLoaderData<typeof loader>()\`. Unlike Ember, which resolves models parent-first in series, all matched loaders run **in parallel**. Search params live on \`new URL(request.url)\`. Loaders re-run on navigation and after actions, and can \`redirect()\` or \`throw\`.
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
Throw from a loader or during render, and the **nearest** route's \`errorElement\` replaces that route's element, so parents, and the list next to a failing detail, stay on screen. For HTTP-style errors, throw \`data('Not found', { status: 404 })\` and check for them with \`isRouteErrorResponse(error)\`.

Loading substates have no default equivalent. Instead the **old page stays** while the next one loads, and \`useNavigation().state === 'loading'\` drives a global pending indicator, which is usually better UX than flashing a spinner page.
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
Filters, sorting, tabs and pagination belong in the URL, because then they're shareable, survive reloads and work with Back. \`useSearchParams()\` reads them as a \`URLSearchParams\`, and setting them navigates, which re-runs loaders. Unlike Ember's controller query params, there's no declaration, no defaults, no type coercion and no sticky state. So parse and validate on read, and drop default values from the URL yourself.
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
\`<Link to="/issues/2">\` is \`<LinkTo @route="issues.issue" @model="2">\`, except that it takes a URL string rather than a route name. \`<NavLink>\` adds an \`active\` class, and \`useNavigate()\` replaces \`router.transitionTo\`. Relative paths resolve against the *route* hierarchy, and to keep the filter when opening a detail you carry the search string along: \`to={{ pathname, search }}\`.
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
The difference is when fetching starts. **Loaders** start as soon as navigation begins, before anything renders, and all matched loaders run in parallel, so there are no render-then-fetch waterfalls. They also bring route-level errors, redirects and revalidation after actions. **Fetching in components**, with effects or even Query, starts only after render, so nested components fetch in series. The common combination is both: loaders *prefetch* into the Query cache with \`queryClient.ensureQueryData\`, and components read with \`useQuery\` for caching and background updates.
`],
    ['How do nested routes and outlets work?',
      `
Routes form a tree that mirrors the UI, and a URL matches one *branch* of it, from root to leaf. Each matched route renders its element, with a parent rendering \`<Outlet/>\` where its matched child goes. Parents stay mounted, state and all, while children change. And because each level can have its own loader, \`errorElement\` and \`handle\`, loading and failure are scoped to the part of the screen they affect.
`],
    ['Where should filter state live, and why the URL?',
      `
In the URL search params. That makes it shareable as a link, persistent across reloads, undoable with Back and server-renderable, and loaders can read it before render. \`useState\` loses it on reload, whereas a global store hides it. Just validate it on read, because the URL is user input.
`],
    ['How do you handle 404s and other errors per route?',
      `
Throw from the loader, either \`data('Not found', { status: 404 })\` or a \`redirect()\`, and give the relevant route an \`errorElement\`. The router renders the nearest one in place of the failing route, so parents and siblings keep working. Inside it, \`useRouteError()\` and \`isRouteErrorResponse()\` tell HTTP-style errors apart from crashes. Unknown URLs go to a catch-all \`path: '*'\`.
`],
    ['How does this compare with the Ember router?',
      `
Conceptually it's close: a nested route tree, a model hook in the loader, outlets, error substates and URL-driven state. The differences are in the details. First, routes are config objects with string paths rather than named routes. Second, loaders run in **parallel** rather than parent-first. Third, there are no controllers, so query params are plain \`URLSearchParams\` with no declaration, defaults or stickiness. Fourth, there are no default loading substates, because the old UI stays up while \`useNavigation()\` reports progress. And the router owns no data store, which is why it pairs with Query.
`],
  ],
});

export const WEEK2 = [DAY6, DAY7, DAY8, DAY9, DAY10];
