# React for Ember Engineers

A 15-day course, at most an hour a day, for engineers who know Octane/Polaris Ember well and are new to React. It skips the basics of components, routes and tests. It covers how React's model differs from Ember's, and spends most of its time where Ember instincts will mislead you.

- **Course page:** open [`course/index.html`](course/index.html) in a browser. It's one self-contained file and works offline (fonts and syntax highlighting load from CDNs). It holds every day's concepts, exercise briefs and interview drills, plus a 30-question mock interview and a cheat sheet.
- **This repo:** the exercises, the failing tests that define them, and reference solutions.

Every exercise builds part of one small issue tracker. On Day 15 you put the parts together into a running app.

## Setup

Requires **Node ≥ 22.22** (React Router 8 needs it).

```sh
git clone https://github.com/linearza/learnreact.git react-for-ember-devs
cd react-for-ember-devs
npm install
npm run test:solutions   # sanity check: everything should be green
```

Stack: React 19.3, React Router 8 (data mode), TanStack Query 5, Vite 8, Vitest 5 + Testing Library, TypeScript 5.9. TypeScript 7 (the native Go port) exists. This repo stays on 5.9 for editor and tooling stability, and nothing here depends on the difference.

## The daily loop (60 minutes)

| Block | Time | What you do |
|---|---|---|
| Concepts | ~15 min | Read the day on the course page. Each concept has an Ember ↔ React side-by-side and a flag: 🟢 direct translation · 🟡 same goal, different mechanics · 🔴 new mental model. |
| Hands-on | ~35 min | `npm test -- day05` (watch mode), then edit `exercises/day05/` until it's green. Each stub has TODO comments naming the behaviour and the Ember equivalent. |
| Interview drill | ~10 min | Answer each question **out loud** before you reveal the model answer. |

## Your work vs. the solutions

Tests import `@ex/dayNN/...`. One switch in `vite.config.ts` decides what `@ex` points at:

| Command | `@ex` resolves to | Use |
|---|---|---|
| `npm test -- day05` | `exercises/` | your daily loop (watch mode) |
| `npx vitest run` | `exercises/` | check everything you've done so far |
| `npm run test:solutions` | `solutions/` | reference run: 109/109 pass |
| `npm run dev` | `exercises/` | run *your* Day 15 app |
| `npm run dev:solutions` | `solutions/` | run the reference app |
| `npm run typecheck` | — | `tsc --noEmit`: passes for both trees |

The stubs fail on purpose. Against an untouched `exercises/`, every day's tests fail except for at most one or two trivial ones. Cross-day imports (for example, Day 15 importing Day 9's hooks) also go through `@ex`. So `npm run dev` runs the app on *your* earlier days, which makes it a good integration check.

Read a solution only after your tests pass, or after you've been stuck for 10 minutes. `git diff --no-index exercises/day05 solutions/day05` is a quick way to compare.

## Layout

```
src/domain/       shared issue-tracker domain: types, seed data, fake async API (like Mirage), pub/sub, test helpers
src/day13/        the Tabs component + 5 mutants for the testing exercise
exercises/dayNN/  your files: stubs with TODOs
solutions/dayNN/  reference implementations
tests/dayNN.test.tsx  one test file per day
course/index.html the course
index.html, src/main.tsx, src/styles.css   the dev app (= Day 15 capstone)
```

The fake API (`@domain/api`) has test controls: `setLatency(ms)` (300 in dev, 0 in tests), `setIssueLatency(id, ms)` for race conditions, `failNextRequest(msg)`, `resetDb()`, `getDbSnapshot()`.

## The 15 days

| Week | Day | Topic |
|---|---|---|
| 1 · Core model | 1 | JSX, components, rendering |
| | 2 | Props, children, composition, lists & keys |
| | 3 | State: `useState`, immutability, derived state |
| | 4 | Events & forms: controlled vs uncontrolled, refs |
| | 5 | Effects: synchronising with external systems |
| 2 · Architecture | 6 | Rendering performance: reconciliation, memoization, React Compiler |
| | 7 | State architecture: Context, reducers, external stores |
| | 8 | Custom hooks |
| | 9 | Data fetching: TanStack Query, Suspense, error boundaries |
| | 10 | Routing with React Router 8 (data mode) |
| 3 · Modern & advanced | 11 | React 19 Actions & concurrent features |
| | 12 | Server Components & the Next.js App Router |
| | 13 | Testing React well (mutation testing) |
| | 14 | Patterns, TypeScript & modern APIs |
| | 15 | Capstone + mock interview |

## Stretch goals

- **Day 6: React Compiler.** Remove the `memo`/`useCallback` from your `IssueTable` and let the compiler do it:
  ```sh
  npm install -D @rolldown/plugin-babel @babel/core babel-plugin-react-compiler
  ```
  ```ts
  // vite.config.ts
  import react, { reactCompilerPreset } from '@vitejs/plugin-react';
  import babel from '@rolldown/plugin-babel';
  // plugins: [react(), babel({ presets: [reactCompilerPreset()] })]
  ```
  The Day 6 tests should still pass. (`@vitejs/plugin-react` also has an experimental Rust compiler: `react({ compiler: true })` with `oxc-transform-react`.)
  Another way to fix Day 6's typing case: extract the "Draft note" input and its state into its own component. Then typing never re-renders the table at all ("move state down"). No memo needed.
- **Day 8:** make `useLocalStorage` sync across tabs (the `storage` event, ideally via `useSyncExternalStore`).
- **Day 9:** make the status change optimistic with `onMutate` / `onError` rollback / `onSettled` invalidate.
- **Day 10:** add `<ViewTransition>` or a pending UI with `useNavigation()`; try the same routes in TanStack Router for type-safe params.
- **Day 12:** `npx create-next-app@latest`, drop `exercises/day12/app/issues` into `app/`, and watch the boundaries work for real (add `revalidatePath` to the action).
- **Day 13:** write a sixth mutant your checks *don't* catch, then add a check for it.
- **Day 15:** add the Day 11 `EditTitle` to the detail pane, and the Day 5 `LiveIssueFeed`.

## Ember → React cheat sheet

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
