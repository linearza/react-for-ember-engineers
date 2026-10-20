# Build Brief — "React for Ember Engineers" (15-day course)

> Hand this whole file to Claude Code. It is the spec. Where it says **MUST**, treat it as an acceptance criterion.

## 1. Goal & learner

- **Learner:** a very experienced Ember engineer (Octane/Polaris era: Glimmer components, `@tracked`, services, modifiers, ember-data/WarpDrive, ember-concurrency, `.gjs`/template-tag). Knows JS/TS, testing and SPA architecture deeply. New to React.
- **Outcome:** in 15 sessions of **≤ 60 minutes each**, the learner can (a) write idiomatic modern React 19, and (b) clearly explain every major React concern to a teammate.
- **Teaching stance:** never explain what a component, route or test *is*. Explain how React's *model* differs from Ember's, and spend time where Ember instincts will mislead.

## 2. Deliverables

1. **A GitHub repo** `react-for-ember-devs` with exercises, failing tests, and reference solutions for all 15 days (spec §4–§6). One commit per day.
2. **A course page**: a single self-contained HTML file `course/index.html` holding all 15 lessons (spec §7). It must be usable without the repo, and link to the repo where it helps.
3. **README.md**: setup, the daily loop, and how to run tests against your work vs. the solutions.

## 3. Daily session format (every day, 60 min)

| Block | Time | Content |
|---|---|---|
| Concept read | ~15 min | 3–6 short concept sections with code. Each section has an **Ember → React** side-by-side and a flag (below). |
| Hands-on | ~35 min | `npm test -- dayNN` → make the failing tests pass in `exercises/dayNN/`. |
| Check yourself | ~10 min | 4–6 questions. Model answer hidden behind a reveal. Learner answers out loud first. |

**Ember flags.** Every concept gets exactly one:
- 🟢 **Direct translation**: same idea, new syntax.
- 🟡 **Same goal, different mechanics**: the idea carries over but the details will trip you up.
- 🔴 **New mental model**: unlearn the Ember instinct.

## 4. Tech stack (versions verified against npm on 2026-10-20)

| Package | Version | Notes |
|---|---|---|
| react / react-dom | ^19.3.1 | 19.3 stabilised `<ViewTransition>`, `addTransitionType` and Fragment refs, and added `browser()` in react-dom. `useEffectEvent` and `<Activity>` are stable (19.2). |
| react-router | ^8.5.0 | **v8: `react-router-dom` is removed.** Import everything from `react-router`, and `RouterProvider` for DOM from `react-router/dom` if needed. ESM-only. Middleware is on by default. Data-mode APIs (`createMemoryRouter`, `createBrowserRouter`, `RouterProvider`, `loader`, `useLoaderData`, `Outlet`, `useSearchParams`, `errorElement`, `data()`, `redirect()`) are all exported and confirmed. |
| @tanstack/react-query | ^5.104.5 | |
| vite / @vitejs/plugin-react | ^8.3.4 / ^6.1.2 | |
| vitest | ^5.0.5 | jsdom environment, globals on |
| @testing-library/react / user-event / jest-dom / dom | ^16.3.3 / ^14.6 / ^6.6 / ^10.4 | |
| typescript | ^5.9 | TS 7 (native) exists. Stay on 5.9 for tooling stability; mention TS 7 in the README. |
| jsdom | ^26 | |
| Node | ≥ 22.22 | required by React Router 8 |

No React Compiler in the default build: Day 6 teaches manual memoization first. A stretch exercise enables the compiler.

## 5. Repo architecture

```
react-for-ember-devs/
  README.md
  package.json            scripts below
  vite.config.ts          alias switch + vitest config
  tsconfig.json           paths: @ex/* → exercises/*, @domain/* → src/domain/*
  index.html, src/main.tsx, src/styles.css   dev app = Day 15 capstone
  src/domain/             shared issue-tracker domain (types, seed, fake API, events, test helpers)
  src/day13/              Tabs + mutants for the testing exercise (shared by both modes)
  exercises/dayNN/        learner's files: stubs with TODO comments (FAIL the tests)
  solutions/dayNN/        reference implementations (PASS the tests)
  tests/dayNN.test.tsx    ONE test file per day, imports only from '@ex/dayNN/...' and '@domain/...'
  tests/setup.ts          jest-dom, cleanup, resetDb() + setLatency(0) before each test
  course/index.html       the course page
```

**The alias switch (key design).** Tests import `@ex/dayNN/Thing`. In `vite.config.ts`, `@ex` resolves to `exercises/` by default and to `solutions/` when `SOLUTIONS=1`. This means:

```json
"scripts": {
  "dev": "vite",
  "dev:solutions": "SOLUTIONS=1 vite",
  "test": "vitest",
  "test:solutions": "SOLUTIONS=1 vitest run",
  "typecheck": "tsc --noEmit -p ."
}
```

- `npm test -- day05` is the learner's daily loop (watch mode).
- `npm run test:solutions` MUST pass 100%.
- Running against `exercises/` MUST fail every day's tests except at most 1–2 trivial ones.
- Cross-day imports inside solutions (e.g. Day 15 using Day 9 hooks) go through `@ex/...` so the switch stays consistent.
- Exercise stubs MUST export the same names and signatures as solutions, so `npm run typecheck` passes in both modes.

## 6. Shared domain: an issue tracker

All exercises build features of one issue-tracker app. Day 15 assembles them into the running app.

**`src/domain/types.ts`**: `Status = 'todo'|'in_progress'|'done'`; `Priority = 'low'|'medium'|'high'|'urgent'`; `User {id,name}`; `Issue {id,title,description,status,priority,assigneeId|null,labels[],estimate,createdAt}`; `NewIssue`; `STATUS_LABELS` (`To do`/`In progress`/`Done`); `PRIORITY_LABELS`; `STATUSES`; `PRIORITIES`.

**`src/domain/seed.ts`**: 3 users (`u1` Ada Lovelace, `u2` Grace Hopper, `u3` Yehuda Katz) and 4 issues:

| id | title | status | priority | assignee | labels | estimate | createdAt |
|---|---|---|---|---|---|---|---|
| 1 | Login button does nothing on Safari | todo | urgent | u1 | bug, auth | 3 | 2026-10-01T09:00Z |
| 2 | Add dark mode | in_progress | medium | u2 | feature, ui | 5 | 2026-10-03T14:30Z |
| 3 | Migrate settings page off ember-data | done | low | u3 | *(none)* | 8 | 2026-09-20T08:15Z |
| 4 | Slow issue list with 5k items | todo | high | *(null)* | performance | 5 | 2026-10-10T11:45Z |

Also `freshIssues()`, which returns a `structuredClone` of the seed.

**`src/domain/api.ts`**: a fake async backend (like Mirage), in memory.
- Functions: `fetchIssues({status?, q?})`, `fetchIssue(id)` (404 `ApiError` if missing), `updateIssue(id, patch)` (422 if the title is under 3 chars), `createIssue(input)`, `fetchUsers()`, `getDbSnapshot()`.
- Test controls: `resetDb()`, `setLatency(ms)` (default 300 in dev, 0 in tests), `setIssueLatency(id, ms)` for race-condition demos, `failNextRequest(msg)`.
- All responses are `structuredClone`d.

**`src/domain/events.ts`**: a tiny pub/sub `issueEvents.subscribe(channel, cb) → unsubscribe`, `emit(channel, msg)`. Used on Day 5.

**`src/domain/testing.ts`**: `deepFreeze()`. Tests freeze input data so any mutation throws.

## 7. Course page spec (`course/index.html`)

- Single self-contained HTML file. No build step. Fonts may come from Google Fonts; everything else is inline.
- **Layout:** a sidebar or top nav with Days 1–15 grouped into 3 weeks, plus a progress bar ("6 / 15 complete"). Each day is one view.
- **Per day:**
  - title and week
  - a "60-minute plan" strip
  - concept sections, each with its Ember flag badge and an Ember ↔ React side-by-side code block (two columns on desktop, stacked on mobile)
  - an exercise brief: the files to open, the command to run, the acceptance criteria in plain words, and a stretch goal
  - the self-check: each question in a `<details>` that hides the model answer
  - a "Mark day complete" button
- **Progress:** stored in `localStorage` with every read and write wrapped in try/catch. The page must work without it.
- **Day 15:** a final review of 30 questions across all concerns, each with a hidden model answer, plus a printable "React for Ember devs" cheat sheet (the full Ember → React mapping table, §9).
- **Quality bar:**
  - Syntax-highlighted code (Prism or highlight.js from cdnjs is fine).
  - Light and dark themes via `prefers-color-scheme`.
  - Readable at 375 px wide.
  - Keyboard accessible.
- **Tone:** senior-to-senior. Terse, precise, opinionated. No "React is a library for building UIs" filler.

## 8. Day-by-day spec

Each day lists: **Concepts** (with flags), **Exercise** (files + behaviours the tests MUST check), and **Check yourself** (questions + key points the model answer must hit). Days 1–4 are already built and verified. Treat them as the reference for style and granularity.

---

### WEEK 1 — Core mental model

#### Day 1 — JSX, components, rendering ✅ built
**Concepts**
- 🔴 Components are functions re-run on every render: UI = f(props, state). There is no autotracking. React re-renders a component when its state changes or its parent re-renders, and then diffs the output.
- 🟡 JSX vs Glimmer templates: JSX is JS, so you get `className`, `{expr}`, and `map` instead of `{{#each}}`. There is no `{{if}}` helper: use `&&`, ternaries or an early return.
- 🔴 The `0 &&` trap.
- 🟢 Plain functions replace helpers.
- 🟢 Fragments.

**Exercise:** `StatusBadge`, `IssueCard`, `formatDate`. Tests check:
- badge text and `badge--{status}` class
- `<h3>` title, with the article labelled by it
- `🔥 Urgent` prefix only for urgent
- `Unassigned` fallback
- labels line only when there are labels, with **no stray `0`**
- `<time dateTime>` formatted `Oct 1, 2026` (UTC)

**Check yourself**
- What triggers a re-render? Key points: state change, parent render, context change. Props changing is not itself the trigger.
- Render vs commit.
- Why `className`?
- How do JSX and templates differ in what the compiler knows? Key points: Glimmer statically knows dynamic vs static parts; JSX is opaque JS, which motivates the Compiler.
- What does `{0 && <X/>}` render?

#### Day 2 — Props, children, composition, lists & keys ✅ built
**Concepts**
- 🟢 Args → props.
- 🟢 `{{yield}}` → `children`.
- 🟡 Named blocks → ReactNode props.
- 🟡 `{{yield x}}` with block params → render props.
- 🟢 `{{#each key=}}` → `map` + `key`.
- 🔴 Index keys and identity: keys decide which component instance (and its state and DOM) is reused.
- 🟡 Props are read-only.
- 🟢 Composition over configuration.

**Exercise:** `Card` (`children` plus `actions`/`footer` slots), `IssueList` (`renderItem`, `emptyState`, default "No issues"), and an `IssueNotes` **bug hunt** (the stub uses `key={index}`; the test types a note, reorders the list, and asserts the note stays with its issue).

**Check yourself**
- Why not index keys?
- How do you reset a component's state? (`key`)
- Render props vs children vs hooks: when would you use each?
- What is prop drilling, and what fixes it?

#### Day 3 — State: `useState`, immutability, derived state ✅ built
**Concepts**
- 🔴 `@tracked` mutation → immutable replacement. React compares by reference with `Object.is`.
- 🔴 State is a snapshot per render: setters don't change the variable in the current closure.
- 🟡 Batching.
- 🟢 Updater functions `set(prev => …)`.
- 🟢 Derived state = compute during render (Ember getters). Don't mirror props into state.
- 🟡 Lazy initial state.

**Exercise:** `IssueBoard` ported by "someone thinking in @tracked", with frozen input data. The learner must:
1. implement status-filter buttons (`aria-pressed`), case-insensitive search, and "Showing X of Y", all derived without extra state;
2. fix `toggleDone`, which mutates;
3. fix "+2 points", which calls a non-updater setter twice and only adds 1.

**Check yourself**
- Why must state be immutable?
- What does `console.log(count)` after `setCount(count+1)` print?
- What is batching?
- When should you use an updater function?
- Derived state vs `useEffect` + `setState`.
- How is this different from `@tracked`?

#### Day 4 — Events & forms: controlled vs uncontrolled, refs ✅ built
**Concepts**
- 🟡 `{{on "click"}}` → `onClick`. These are synthetic events, delegated at the root.
- 🟢 `preventDefault`.
- 🟡 Controlled inputs (`value` + `onChange`) vs uncontrolled (`defaultValue` + `FormData` or a ref).
- 🟡 `useRef` for DOM access (Ember: a modifier receiving the element).
- 🟢 Labels and a11y.

**Exercise:**
- `NewIssueForm`, controlled:
  - live `n/80` counter
  - Priority defaults to `medium`; Assignee options are "Unassigned" (`""`) plus users
  - validation `<p role="alert">Title must be at least 3 characters</p>`
  - submits a normalised `NewIssue` (trimmed title, `assigneeId` null when empty, labels split/trimmed/filtered)
  - resets every field
- `QuickSearch`, uncontrolled:
  - `role="search"` form
  - `FormData` read on submit; Enter submits
  - Escape clears the input via a ref

**Check yourself**
- Controlled vs uncontrolled: trade-offs, and when to use each.
- What is a synthetic event?
- `useRef` vs `useState`.
- Why should you avoid reading the DOM during render?

#### Day 5 — Effects: synchronising with external systems
**Concepts**
- 🟡 `useEffect` is for synchronising with something *outside* React. It is not a lifecycle hook.
  - Ember: modifiers + `registerDestructor`, and `did-insert`/`will-destroy`.
- 🟡 The dependency array.
- 🟡 Cleanup.
- 🟡 Strict Mode double-invoke in dev, and why.
- 🔴 "You Might Not Need an Effect": derived data, event-driven logic, resetting state with `key`.
- 🟡 Race conditions: an ignore flag or `AbortController`. Ember: ember-concurrency's `restartable` gave you this for free.
- 🟡 `useEffectEvent` for reading the latest values without re-running the effect.

**Exercise** (all stubs are *buggy but plausible*):
- `IssueDetail({issueId})`: fetches via `fetchIssue`. The stub has no stale-response guard.
  - Test: `setIssueLatency('1', 50)`, render id 1, rerender id 2 → after 80 ms the heading shows issue 2.
  - Also "Loading…" and `role="alert"` "Could not load issue" for a missing id.
- `RelativeTime({date})`: updates every 60 s with `setInterval`.
  - Test with fake timers: the text updates after advancing; `vi.getTimerCount()` is 0 after unmount.
- `LiveIssueFeed({channel, muted, onNotify})`: subscribes to `issueEvents`.
  - The stub's effect depends on `[channel, muted]`.
  - Test (spy on `subscribe`): toggling `muted` must NOT resubscribe; changing `channel` must. `onNotify` is not called while muted. Solution: `useEffectEvent`.
- `IssueStats({issues})`: the stub computes counts with `useState` + `useEffect`.
  - Test with `<Profiler onRender>`: exactly 1 commit on mount. Solution: derive during render.

**Check yourself**
- When do effects run?
- What is the dependency array really for?
- Why does Strict Mode run effects twice?
- How do you handle fetch race conditions?
- Name 3 cases where you don't need an effect.
- What does `useEffectEvent` solve?
- Effects vs Ember modifiers.

---

### WEEK 2 — Architecture

#### Day 6 — Rendering performance: reconciliation, memoization, React Compiler
**Concepts**
- 🔴 Reconciliation and the diffing heuristics: element type + key.
- 🔴 Parent render → children render by default.
- 🔴 `memo`, `useMemo`, `useCallback` and referential stability.
- 🟢 "Move state down" / lift content up (`children` as an optimisation).
- 🔴 React Compiler (v1 stable): auto-memoization. Teach when manual memo still matters, and how to enable the compiler.
- Profiler DevTools.

**Exercise:** `IssueTable({issues})` with an unrelated "Draft note" input and row selection. `IssueRow` logs each render to an exported `renderLog`, with a `resetRenderLog()`.
- Test: typing 3 chars in Draft note → 0 row renders.
- Test: selecting row 2 → only `['2']` re-renders; then selecting row 4 → `['2','4']`.
- The stub passes `selectedId` and an inline arrow function to every row, with no `memo`.
- Solution: `memo` + `useCallback` + an `isSelected` boolean prop. The README notes that extracting the draft into its own component also fixes the typing case.

**Stretch:** enable `babel-plugin-react-compiler` and remove the manual memoization.

**Check yourself**
- Does a re-render mean a DOM update?
- When does `memo` fail? (New object/function props.)
- `useMemo` vs `useCallback`.
- What does the React Compiler do, and what are the rules of React it relies on?
- How would you find a slow render?

#### Day 7 — State architecture: Context, reducers, external stores
**Concepts**
- 🟡 Services → Context + a provider. There is no DI container; scope comes from the tree, and context is not a store.
- 🔴 Every consumer re-renders when the context value changes. Split contexts or memoize the value.
- 🟢 `useReducer`: Redux-style, and a pure function you can test.
- 🟡 External stores via `useSyncExternalStore` (how Zustand/Redux work) with selector subscriptions.
- When to use which: local state → lifted → context → external store → server cache (Day 9).

**Exercise:**
- `issuesReducer` with actions `added`/`updated`/`removed`/`statusChanged`, immutable (frozen state in tests), throwing on unknown actions.
- `IssuesProvider` + `useIssues()`, which throws `"useIssues must be used inside <IssuesProvider>"` outside a provider.
- `createStore<T>()` (`getState`/`setState`/`subscribe`) + `useStore(store, selector)`.
  - Test: two consumers of different slices; updating slice A does not re-render consumer B (render counters).

**Check yourself**
- Context vs an Ember service.
- Why can context cause performance problems?
- `useReducer` vs `useState`.
- What problem does `useSyncExternalStore` solve (tearing)?
- When would you reach for Zustand or Redux?

#### Day 8 — Custom hooks
**Concepts**
- 🟡 Hooks as the unit of reusable stateful logic (Ember: resources / ember-resources, helpers with state, services).
- 🔴 Rules of Hooks and *why* (call-order identity).
- 🟡 Composing hooks.
- 🟢 Testing hooks with `renderHook`.

**Exercise:**
- `useToggle(initial)` → `[on, toggle, set]`.
- `useDebouncedValue(value, ms)`, tested with fake timers.
- `useLocalStorage(key, initial)`: lazy initial read, JSON, falls back on bad JSON, writes on set.
- `useIssueSearch(issues)` composing the above → `{query, setQuery, results}`. Results are debounced at 200 ms.

**Check yourself**
- Why can't hooks be called conditionally?
- Do two components using the same hook share state?
- Hooks vs HOCs vs render props.
- How do you test a hook?

#### Day 9 — Data fetching: TanStack Query, Suspense, error boundaries
**Concepts**
- 🟡 Server state ≠ client state.
- 🟡 Query cache vs the ember-data/WarpDrive store: keys, stale-while-revalidate, invalidation, dedupe. ember-concurrency patterns map to query/mutation status.
- 🟢 Query-key factories.
- 🟡 Mutations + invalidation.
- 🔴 Suspense for data (`useSuspenseQuery`, `use(promise)`).
- 🔴 Error boundaries are still class components (or use `react-error-boundary`).
- Why not fetch in `useEffect` (Day 5 recap): races, caching, waterfalls.

**Exercise:**
- `queries.ts`: an `issueKeys` factory, `useIssuesQuery(filters)`, `useIssueQuery(id)`, `useUpdateIssueStatus()`. The mutation invalidates `issueKeys.all`.
- `IssueListScreen({status})`:
  - "Loading issues…" state
  - error alert plus a "Retry" button that refetches
  - each issue has a status `<select>` labelled `Status for {title}`; changing it removes the issue from a filtered list after invalidation
- `ErrorBoundary` class component.
- `IssueDetailBoundary({id})`: Suspense fallback "Loading issue…", detail via `useSuspenseQuery`, "Something went wrong" + reset for id `999`.
- Tests use a fresh `QueryClient({defaultOptions:{queries:{retry:false}}})` per test.

**Check yourself**
- Server state vs client state.
- What is stale-while-revalidate?
- How do query keys work?
- Optimistic update vs invalidation.
- How does Suspense work (throwing promises / `use`)?
- Why aren't error boundaries hooks?
- Compare with ember-data.

#### Day 10 — Routing with React Router 8 (data mode)
**Concepts**
- 🟢 `Router.map` → route objects.
- 🟢 Nested routes + `{{outlet}}` → `<Outlet/>`.
- 🟢 Model hook → `loader` + `useLoaderData`.
- 🟢 Error substates → `errorElement`; loading substates → `useNavigation()`.
- 🟡 Query params → `useSearchParams`: the URL as state.
- 🟢 `<Link>`, `useNavigate`.
- 🟡 v8 notes: no `react-router-dom`; middleware is on by default.
- Mention TanStack Router as the type-safe alternative.

**Exercise:** `routes.tsx` exports `routes: RouteObject[]`:
- `/` → `Layout`, with nav and an `errorElement`.
- index → `redirect('/issues')`.
- `issues` → loader reads `?status=` and calls `fetchIssues`; the page shows a "Status filter" select that updates the search param, plus links.
- child `:issueId` → loader calls `fetchIssue`; a 404 is thrown as `data(…, {status:404})`; `errorElement` shows "Issue not found" while the list stays visible.
- `*` → "Page not found".

Tests use `createMemoryRouter` + `RouterProvider`. They check:
- the filtered list from the URL
- clicking a link shows detail inside the layout (nested)
- the nested error
- the redirect
- the 404 route
- changing the select updates the list

**Check yourself**
- Loaders vs fetching in components.
- How do nested routes and outlets work?
- Where should filter state live, and why the URL?
- How do you handle 404s and errors per route?
- Compare with the Ember router.

---

### WEEK 3 — Modern & advanced

#### Day 11 — React 19 Actions & concurrent features
**Concepts**
- 🔴 Transitions (`startTransition`, `useTransition`): urgent vs non-urgent updates.
- 🔴 Actions: `<form action={fn}>`, `useActionState`, `useFormStatus`, `useOptimistic`.
- 🟡 `useDeferredValue`.
- Compare with ember-concurrency tasks and `isRunning`.
- Brief mention of `<ViewTransition>` (stable in 19.3).

**Exercise:**
- `EditTitle({issue})`:
  - `useActionState` calling `updateIssue`
  - `SaveButton` uses `useFormStatus` → "Saving…" and disabled while pending
  - the heading updates on success
  - on a 422, `role="alert"` shows the server message
- `StatusToggle({issue})`, using `useOptimistic` inside `startTransition`:
  - "Status: Done" shows immediately on click, before the request resolves (use `setLatency(30)`)
  - with `failNextRequest()`, it reverts to "Status: To do" and shows "Could not update status"

**Check yourself**
- What is a transition?
- What problem do Actions solve?
- `useActionState` vs `useState` + `onSubmit`.
- How does `useOptimistic` roll back?
- `useDeferredValue` vs debouncing.

#### Day 12 — Server Components & Next.js App Router
**Concepts**
- 🔴 RSC: components that run only on the server. They are async, have no state or effects, and ship zero JS.
- 🔴 `'use client'` marks the *boundary*, not "client-only". Props crossing it must be serializable.
- 🔴 Server Functions (`'use server'`).
- 🔴 Streaming + Suspense.
- 🟡 SSR vs RSC vs FastBoot.
- 19.3: Server Components can render `<Context>` directly.
- Where Next.js App Router fits: layouts, `page.tsx`, `searchParams` as a Promise.

**Exercise ("fix the boundaries"):** `exercises/day12/app/issues/` contains:
- `page.tsx`: the stub wrongly has `'use client'` and fetches in `useEffect`
- `IssueFilterBar.tsx`: a GET form whose select auto-submits on change; the stub is missing `'use client'`
- `IssueList.tsx` (server)
- `actions.ts` (`'use server'`, `updateStatusAction(formData)`)

Tests:
- **Static checks** reading the source files:
  - files using hooks or `on*` handlers start with `'use client'`
  - `page.tsx` has no `'use client'`, is an `async` function, and has no `useState`/`useEffect`
  - `actions.ts` starts with `'use server'`
- **Render check:** `render(await IssuesPage({ searchParams: Promise.resolve({status:'todo'}) }))` shows only todo issues and the filter bar.
- **Action check:** calling `updateStatusAction` with `FormData` updates the db.

**Stretch:** `npx create-next-app` and drop the folder in.

**Check yourself**
- RSC vs SSR.
- What does `'use client'` actually mean?
- Why can't you pass a function from a server to a client component?
- How do Server Functions work?
- When would you *not* use RSC?

#### Day 13 — Testing React well
**Concepts**
- 🟢 `@ember/test-helpers` → Testing Library.
- 🟢 Query priority: `getByRole` > `getByLabelText` > … > `getByTestId`.
- 🟢 `userEvent` vs `fireEvent`.
- 🟡 `findBy`/`waitFor` vs `await settled()`: there is no global settled in React.
- Mocking the network: MSW, mentioned.
- Test behaviour, not implementation.
- 🟢 Accessibility as a testing strategy.

**Exercise ("tests that catch bugs" — mutation testing):** `src/day13/Tabs.tsx` is a correct accessible Tabs component:
- `role` tablist/tab/tabpanel, `aria-selected`, `aria-controls`/`aria-labelledby`
- roving `tabIndex`; Arrow keys wrap; Home/End
- `onChange`

`src/day13/mutants/` holds 5 buggy variants:
1. `aria-selected` is always false
2. ArrowRight doesn't wrap
3. the panel never changes
4. every tab has `tabIndex=0`
5. `onChange` is never called

The learner writes `exercises/day13/tabs.checks.tsx` exporting `checks: {name, run(Tabs)}[]`. The meta-test requires:
- at least 4 checks
- every check passes against the real `Tabs`
- every mutant fails at least one check

The meta-test calls `cleanup()` between runs. The stub exports `checks = []`.

**Check yourself**
- Why prefer `getByRole`?
- What's wrong with testing implementation details?
- `waitFor` vs `findBy`.
- How do you test a component that fetches?
- How do you test a custom hook?
- What makes a test flaky?

#### Day 14 — Patterns, TypeScript & modern APIs
**Concepts**
- 🟡 Compound components via context (Ember: yielded contextual components, `{{yield (hash Item=(component …))}}`).
- 🟡 Portals (Ember: `{{#in-element}}`).
- 🟢 `ref` as a prop: no more `forwardRef` in React 19.
- 🔴 `<Activity>` (keep hidden UI mounted and preserve its state).
- 🟡 Typing components: `ComponentProps<'input'>`, generic components, discriminated-union props.
- 🔴 Fragment refs (19.3) and `<ViewTransition>`, briefly.

**Exercise:**
- `Accordion` compound component (`Accordion`, `Accordion.Item`, `.Trigger`, `.Panel`):
  - single open item
  - `aria-expanded`; closed panels are `hidden`
  - subcomponents throw outside `Accordion`
- `Modal({open,onClose,title,children})` rendered via a portal to `document.body`:
  - not inside the render container
  - `role="dialog"`, `aria-modal`, labelled by the title
  - Escape calls `onClose`
  - focus moves into the dialog on open
  - the stub renders inline
- `TextField({label, ref, ...inputProps})`: the parent's ref receives the `<input>`. The stub drops the ref.
- `KeepAliveTabs`: a typed draft survives switching tabs away and back via `<Activity mode>`, and the hidden tab is not visible. The stub conditionally renders and loses state.

**Check yourself**
- What are compound components and how do you build them?
- Why portals, and how do events bubble through them? (Through the React tree, not the DOM tree.)
- What changed with refs in 19?
- `<Activity>` vs conditional rendering.
- How do you type a generic component?

#### Day 15 — Capstone + final review
**Exercise:** `exercises/day15/App.tsx` exports `AppRoot({initialEntries?})`:
- memory router when entries are given, browser router otherwise
- a `QueryClient` held in `useState`

It composes earlier days through `@ex/...`:
- Day 10 route structure
- Day 9 hooks
- Day 4 `NewIssueForm`
- Day 14 `Modal`
- Day 1 `IssueCard` / `StatusBadge`

The integration test drives:
1. the list shows 4 issues
2. "Status filter" → To do shows 2
3. clicking an issue shows the detail
4. changing the detail's "Status" select to Done drops it from the filtered list
5. "New issue" opens the modal; submitting "Write capstone" closes it, and the issue appears under All

`npm run dev:solutions` shows a decent-looking running app with `styles.css` and the API latency at 300 ms.

**Final review:** 30 questions on the course page, 2 per day's concern plus cross-cutting ones:
- "How would you structure state in a large app?"
- "Walk me through what happens when setState is called."
- "How would you migrate an Ember app to React incrementally?"

## 9. Ember → React cheat sheet (include on Day 15 and in the README)

| Ember | React | Flag |
|---|---|---|
| Glimmer component class | Function component | 🟡 |
| `@arg` / `this.args` | props | 🟢 |
| `@tracked` + mutation | `useState` + immutable replace | 🔴 |
| getter over tracked state | value computed during render (`useMemo` only if expensive) | 🟢 |
| `{{yield}}` / named blocks | `children` / ReactNode props | 🟢 / 🟡 |
| `{{yield x}}` block params | render prop | 🟡 |
| `{{yield (hash Item=(component …))}}` | compound components + context | 🟡 |
| `{{#each key=}}` | `.map()` + `key` | 🟢 |
| `{{on "click"}}` | `onClick` | 🟢 |
| modifiers / `registerDestructor` | `useEffect` + cleanup, refs | 🟡 |
| helpers | plain functions / hooks | 🟢 |
| services (DI) | Context + provider, external stores | 🟡 |
| ember-resources | custom hooks | 🟡 |
| ember-concurrency (`restartable`, `isRunning`) | effect cleanup, Query status, transitions / `useActionState` | 🟡 |
| ember-data / WarpDrive store | TanStack Query cache | 🟡 |
| Router.map / model hook / `{{outlet}}` | route objects / loader / `<Outlet/>` | 🟢 |
| query params | `useSearchParams` | 🟡 |
| loading / error substates | `useNavigation` / `errorElement`, Suspense / error boundaries | 🟢 / 🟡 |
| `{{#in-element}}` | `createPortal` | 🟢 |
| FastBoot | SSR / RSC | 🔴 |
| `@ember/test-helpers` + `await settled()` | Testing Library + `findBy` / `waitFor` | 🟡 |
| autotracking (fine-grained) | re-render + reconcile (+ Compiler) | 🔴 |

## 10. Acceptance checklist

- [ ] `npm install && npm run test:solutions` → all tests pass (expected ~110–140 tests).
- [ ] `npm test` (exercises) → every day's tests fail, except at most 1–2 trivial ones per day.
- [ ] `npm run typecheck` passes.
- [ ] Every stub has clear TODO comments naming the files, the behaviours, and the relevant Ember comparison.
- [ ] `npm run dev:solutions` runs the capstone app.
- [ ] `course/index.html` opens directly in a browser, has all 15 days, the progress tracking works, it is readable on mobile, and it works in dark mode.
- [ ] Every concept section carries exactly one 🟢/🟡/🔴 flag.
- [ ] README covers setup (Node ≥ 22.22), the daily loop, the solutions switch, and the stretch goals.
- [ ] One git commit per day: `Day NN: <topic>`.

## 11. Head start

The attached `react-for-ember-devs-scaffold.zip` already contains:
- `package.json`, `vite.config.ts` with the alias switch, `tsconfig.json`, and `tests/setup.ts`
- `src/domain/` (types, seed, api, testing)
- **Days 1–4 complete**: exercises, solutions and tests (30 tests: 30/30 pass on solutions, 28/30 fail on stubs)

Extend it rather than starting over. Still to add: `src/domain/events.ts`, Days 5–15, `src/main.tsx` + `index.html` + `styles.css`, the README, and the course page.
