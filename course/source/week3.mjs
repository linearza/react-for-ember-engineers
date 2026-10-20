import { C, Day } from './model.mjs';

export const DAY11 = Day({
  n: 11, week: 3,
  title: 'React 19 Actions & concurrent features',
  tagline: 'Transitions mark updates as interruptible, and Actions are async transitions with pending, error and optimistic state built in. This is the closest React gets to ember-concurrency.',
  concepts: [
    C('r', 'Transitions: urgent vs non-urgent updates',
      `
Every update has a priority. Typing, clicking and hovering are **urgent**: the UI must respond immediately. Re-rendering a big filtered list or switching tabs can wait. \`startTransition(() => setX(…))\` marks an update as a **transition**: React renders it in the background, keeps showing the current UI, interrupts the work if something urgent happens, and **won't replace visible content with a Suspense fallback**. \`useTransition()\` also gives you \`isPending\`.

Ember has no equivalent. Rendering there is synchronous inside the runloop.
`,
      `
// no priority concept: every tracked change
// re-renders synchronously in the runloop
@action selectTab(tab) { this.tab = tab; }
`,
      `
const [isPending, startTransition] = useTransition();

function selectTab(next: Tab) {
  startTransition(() => setTab(next)); // stays responsive, no fallback flash
}

<TabButton aria-busy={isPending} … />
`, { emberLang: 'javascript' }),
    C('r', 'Actions: `<form action>`, `useActionState`, `useFormStatus`',
      `
In React 19, a transition can be **async**: that's an Action. Pass an async function to \`<form action={fn}>\` and React calls it with the \`FormData\`, inside a transition, and resets uncontrolled fields when it finishes. \`useActionState(action, initial)\` wraps it: it gives you \`[state, formAction, isPending]\`, where \`state\` is whatever the action returned last (a result or an error), and it queues submissions in order. \`useFormStatus()\` lets any component *inside* the form read \`pending\` without prop drilling.

This replaces the \`useState\` × 3 + \`onSubmit\` + \`try/finally\` boilerplate. The same Actions run as Server Functions (Day 12).
`,
      `
saveTitle = dropTask(async (event) => {
  event.preventDefault();
  try { this.issue = await updateIssue(this.issue.id, { title: … }); }
  catch (e) { this.error = e.message; }
});

<form {{on "submit" this.saveTitle.perform}}>
  <button disabled={{this.saveTitle.isRunning}}>Save</button>
</form>
`,
      `
const [state, formAction] = useActionState(async (prev, formData) => {
  try {
    return { issue: await updateIssue(prev.issue.id, { title: formData.get('title') }), error: null };
  } catch (e) {
    return { ...prev, error: (e as Error).message };
  }
}, { issue, error: null });

<form action={formAction}>
  <input name="title" defaultValue={state.issue.title} />
  <SaveButton /> {/* useFormStatus().pending inside */}
</form>
`, { emberLang: 'javascript' }),
    C('r', '`useOptimistic`',
      `
\`const [optimistic, addOptimistic] = useOptimistic(actual, reducer?)\` returns \`actual\`, except while a transition is pending, when it returns the optimistic value you set. When the transition settles, React drops the optimistic layer and shows \`actual\` again. On success you've updated \`actual\`, so nothing visibly changes. **On failure you haven't**, so the optimistic value just disappears: rollback comes for free. Call \`addOptimistic\` inside \`startTransition\` or an Action.
`,
      `
toggle = task(async () => {
  const previous = this.status;
  this.status = next; // optimistic
  try { await updateIssue(id, { status: next }); }
  catch { this.status = previous; this.error = '…'; } // manual rollback
});
`,
      `
const [status, setStatus] = useState(issue.status);
const [optimisticStatus, setOptimistic] = useOptimistic(status);

startTransition(async () => {
  setOptimistic(next);
  try {
    const saved = await updateIssue(issue.id, { status: next });
    startTransition(() => setStatus(saved.status));
  } catch {
    setError('Could not update status'); // optimistic layer just goes away
  }
});
`, { emberLang: 'javascript' }),
    C('y', '`useDeferredValue`',
      `
\`const deferred = useDeferredValue(query)\` returns a value that **lags behind** during heavy renders. React first re-renders urgently with the *old* deferred value (the input stays responsive), then renders with the new one in the background, abandoning that render if \`query\` changes again. Unlike debouncing, there's no fixed delay: on a fast device it's instant, and on a slow one it adapts. It doesn't reduce network calls, though. For requests, you still debounce.
`,
      `
search = restartableTask(async (q) => {
  await timeout(200); // debounce
  this.results = filter(this.issues, q);
});
`,
      `
const [query, setQuery] = useState('');
const deferredQuery = useDeferredValue(query);
const isStale = query !== deferredQuery;

<input value={query} onChange={(e) => setQuery(e.target.value)} />
<SlowList query={deferredQuery} style={{ opacity: isStale ? 0.6 : 1 }} />
`, { emberLang: 'javascript' }),
    C('y', 'ember-concurrency, mapped',
      `
- \`task.perform()\` → an Action or \`startTransition(async …)\`
- \`task.isRunning\` → \`isPending\` (\`useTransition\`, \`useActionState\`, \`useFormStatus\`, Query's \`isPending\`)
- \`task.last.value\` / \`.error\` → \`useActionState\`'s state, or the mutation's \`data\` / \`error\`
- \`restartable\` (cancel the previous one) → effect cleanup or \`AbortController\`; Query cancels for you
- \`enqueue\` → \`useActionState\` (submissions queue in order)
- \`drop\` → disable the button while pending, or check \`isPending\`
- \`timeout()\` debounce → \`useDeferredValue\` (render) or a debounced value (network)
`,
      `
@task({ restartable: true }) *search(q) { … }
`,
      `
// no single primitive: pick the one that fits the job
`, { emberLang: 'javascript' }),
    C('g', '`<ViewTransition>` (stable in 19.3)',
      `
Wrap content in \`<ViewTransition>\` and updates made in a **transition** (\`startTransition\`, Actions, router navigations) animate through the browser's View Transitions API: a cross-fade by default, customised with CSS (\`::view-transition-*\`) or by name for shared-element morphs. \`addTransitionType('forward')\` tags a transition so CSS can vary per type. Urgent updates don't animate, which is one more reason to use transitions for navigations.
`,
      `
// ember-animated: <AnimatedContainer>, {{#animated-each}}
`,
      `
import { ViewTransition, startTransition } from 'react';

<ViewTransition>
  <IssueDetail id={id} />
</ViewTransition>

startTransition(() => setId(nextId)); // animates
`),
  ],
  exercise: {
    files: [
      'exercises/day11/EditTitle.tsx',
      'exercises/day11/StatusToggle.tsx',
    ],
    command: 'pnpm test day11',
    criteria: [
      '`EditTitle` uses `useActionState` + `<form action>`. While saving, the button reads "Saving…" and is disabled (`useFormStatus` in `SaveButton`).',
      'On success the heading shows the new title. On a 422, `role="alert"` shows the server message and the old title stays.',
      'A successful save after a failed one clears the error.',
      '`StatusToggle` shows "Status: Done" **immediately** on click, before the server answers (`useOptimistic`).',
      'With `failNextRequest()` it reverts to "Status: To do" and shows "Could not update status".',
    ],
    stretch: 'Add a search box to the Day 3 board and use `useDeferredValue` with a deliberately slow list (render 5,000 rows) to feel the difference from debouncing.',
  },
  drill: [
    ['What is a transition?',
      `
An update marked as non-urgent with \`startTransition\` or \`useTransition\`. React renders it concurrently: it can be interrupted by urgent updates (typing), it keeps the current UI interactive, it avoids replacing already-visible content with Suspense fallbacks, and it reports \`isPending\`. Since React 19 transitions can be async, which makes them Actions.
`],
    ['What problem do Actions solve?',
      `
The boilerplate and the bugs around async mutations: tracking pending state, sequencing submissions, handling errors, resetting forms, optimistic UI. An Action is an async function run in a transition. React tracks its pending state (\`useActionState\`, \`useFormStatus\`), queues repeated submissions, integrates with \`useOptimistic\`, resets uncontrolled forms on success, and the same model works for Server Functions with progressive enhancement.
`],
    ['`useActionState` vs `useState` + `onSubmit`?',
      `
With \`useState\` + \`onSubmit\` you manage \`isSubmitting\`, \`error\` and \`result\` yourself, remember \`preventDefault\`, guard against double-submits and order async results by hand. \`useActionState\` returns the last result as state plus \`isPending\`, runs the action in a transition, queues calls so results arrive in order, receives \`FormData\` directly, and (when given a server function) works before hydration via a permalink. Less code, fewer race conditions.
`],
    ['How does `useOptimistic` roll back?',
      `
It doesn't keep a snapshot. The optimistic value is a temporary layer that only exists **while the surrounding transition is pending**. When the transition ends, React renders from the real state again. If the server call succeeded you updated the real state, so the UI stays put. If it failed you didn't, so the optimistic value simply disappears. You only need to surface the error.
`],
    ['`useDeferredValue` vs debouncing?',
      `
Debouncing delays the *update* by a fixed time, even on fast devices, and it's still the right tool for limiting **network** requests. \`useDeferredValue\` updates immediately at low priority. React renders the urgent UI first, then the deferred render in the background, interrupting it if the value changes again. There's no arbitrary delay, it adapts to device speed, and the input never janks. It doesn't reduce how often expensive work is *attempted*, only how it's scheduled.
`],
  ],
});

export const DAY12 = Day({
  n: 12, week: 3,
  title: 'Server Components & the Next.js App Router',
  tagline: 'The biggest model shift in the course. Components can run only on the server, and the boundary between server and client is something you design.',
  concepts: [
    C('r', 'React Server Components',
      `
A **Server Component** runs only on the server (at request time or build time) and never ships its code to the browser. It can be \`async\` and \`await\` data directly: the database, the filesystem, secrets. It **can't** use state, effects, refs, browser APIs or event handlers, because it never re-renders on the client. Its output is serialised (the RSC payload) and merged into the client tree. In the App Router, components are server components **by default**.
`,
      `
// FastBoot renders your whole (client) app in Node,
// then the browser downloads and runs all of it again.
`,
      `
// app/issues/page.tsx: a Server Component
export default async function IssuesPage() {
  const issues = await db.issue.findMany(); // runs on the server only
  return <IssueList issues={issues} />;     // zero JS for this file
}
`, { emberLang: 'javascript' }),
    C('r', '`\'use client\'` marks a boundary, not "client-only"',
      `
\`'use client'\` at the top of a file says: *this module, and everything it imports, is part of the client bundle*. Client components still **render on the server** (SSR) for the initial HTML, then hydrate. The directive marks the **entry point** where the server tree hands over to interactive code. You only need it on the boundary file, not on every component below it.

Props crossing the boundary must be **serialisable**: primitives, plain objects and arrays, Dates, Maps and Sets, promises, JSX, and Server Functions. Regular functions and class instances can't cross. Server components *can* be passed through client components as \`children\`.
`,
      `
// no equivalent: in Ember everything is client code
`,
      `
'use client';

export function IssueFilterBar({ status }: { status: string }) {
  return (
    <select name="status" defaultValue={status}
            onChange={(e) => e.currentTarget.form?.requestSubmit()}>
      …
    </select>
  );
}
`, { emberLang: 'javascript' }),
    C('r', 'Server Functions (`\'use server\'`)',
      `
A function in a \`'use server'\` module (or with the directive in its body) becomes a **Server Function**. The client gets an opaque reference, and calling it makes a POST that runs the function on the server. Pass one to \`<form action>\` and the form works **before JS loads** (progressive enhancement). Pair it with \`useActionState\` for results and pending state. Its arguments come from the network, so treat it as a public API endpoint: validate the input, check auth.
`,
      `
// an adapter call to your API, plus the API endpoint itself
await fetch(\`/api/issues/\${id}\`, { method: 'PATCH', body });
`,
      `
// actions.ts
'use server';
export async function updateStatusAction(formData: FormData) {
  const id = String(formData.get('id'));
  const status = parseStatus(formData.get('status')); // validate!
  await db.issue.update({ where: { id }, data: { status } });
  revalidatePath('/issues');
}

// any component, server or client
<form action={updateStatusAction}>…</form>
`, { emberLang: 'javascript', reactLang: 'typescript' }),
    C('r', 'Streaming + Suspense',
      `
On the server, every \`<Suspense>\` boundary is a **streaming point**. React sends the shell HTML right away with the fallbacks, then streams each boundary's HTML (and RSC payload) as its data resolves, inlined into the same response. Slow data no longer blocks the whole page. Client components inside hydrate selectively, prioritising whichever part the user interacts with. In Next.js, \`loading.tsx\` is a Suspense boundary around a route segment.
`,
      `
// FastBoot: wait for every model hook, then send everything
`,
      `
export default function Page() {
  return (
    <>
      <Header />                       {/* sent immediately */}
      <Suspense fallback={<Spinner />}>
        <SlowRecommendations />        {/* streamed in later */}
      </Suspense>
    </>
  );
}
`),
    C('y', 'SSR vs RSC vs FastBoot',
      `
- **SSR** (classic): render the *client* app to HTML on the server, then ship *all* of its JS and hydrate. FastBoot is this.
- **RSC**: some components exist **only** on the server. Their code and dependencies never ship, and their output arrives as a serialised tree. RSC is *orthogonal* to SSR: you usually do both (RSC builds the tree, SSR turns it into HTML for first paint).
- Benefit: less JS, direct data access, no client-server waterfalls. Cost: a server runtime, a mental boundary, and a bundler/framework (Next.js, React Router framework mode, Waku).

React 19.3: Server Components can render a \`<Context>\` provider directly. Providers no longer need their own \`'use client'\` wrapper file, although only client components can *read* context.
`,
      `
// ember-cli-fastboot + prember: SSR/SSG of a client app
`,
      `
// RSC payload (conceptually): a serialised tree with holes
// for client components and their props
["$","main",null,{"children":[["$","h1",null,{"children":"Issues"}],
  ["$","$L1",null,{"status":"todo"}] /* IssueFilterBar (client) */ ]}]
`, { emberLang: 'javascript', reactLang: 'javascript' }),
    C('y', 'Where the Next.js App Router fits',
      `
File-system routes under \`app/\`. \`layout.tsx\` is a persistent wrapper (your \`application.hbs\` / parent route), \`page.tsx\` is a route's UI, and \`loading.tsx\` and \`error.tsx\` are Suspense and error-boundary substates. Pages are server components that receive \`params\` and \`searchParams\` **as Promises** (Next 15+): \`const { status } = await searchParams\`. Mutations use Server Functions plus \`revalidatePath\` / \`revalidateTag\`, and the client router caches RSC payloads between navigations.
`,
      `
app/router.js            Router.map(...)
app/templates/application.hbs
app/routes/issues.js      model()
app/templates/issues-loading.hbs
`,
      `
app/layout.tsx            root layout
app/issues/page.tsx       async server component
app/issues/loading.tsx    Suspense fallback
app/issues/error.tsx      error boundary ('use client')
app/issues/actions.ts     'use server'
`, { emberLang: 'text', reactLang: 'text' }),
  ],
  exercise: {
    files: [
      'exercises/day12/app/issues/page.tsx',
      'exercises/day12/app/issues/IssueFilterBar.tsx',
      'exercises/day12/app/issues/IssueList.tsx',
      'exercises/day12/app/issues/actions.ts',
    ],
    command: 'pnpm test day12',
    criteria: [
      'Every file that uses hooks or `on*` handlers starts with `\'use client\'` (the filter bar), and nothing else does.',
      '`page.tsx` has no `\'use client\'`, is an `async` default export, and has no `useState` or `useEffect`.',
      '`actions.ts` starts with `\'use server\'`.',
      '`render(await IssuesPage({ searchParams: Promise.resolve({ status: \'todo\' }) }))` shows only to-do issues and the filter bar. An invalid status shows everything.',
      '`updateStatusAction(formData)` updates the db, and rejects an invalid status.',
    ],
    stretch: '`pnpm create next-app@latest`, copy `exercises/day12/app/issues` into `app/`, point `@domain` at the course\'s `src/domain`, and add `revalidatePath(\'/issues\')` to the action. Then disable JavaScript and confirm that filtering and "Mark done" still work.',
  },
  drill: [
    ['RSC vs SSR?',
      `
**SSR** renders client components to HTML on the server for a fast first paint, then ships all of that code to the browser to hydrate. **RSC** introduces components that run *only* on the server. Their code never ships, they can access server resources directly, and their output is a serialised React tree, not HTML. They're complementary: frameworks use RSC to build the tree and SSR to turn it into initial HTML. RSC reduces bundle size and client waterfalls. SSR improves first paint.
`],
    ['What does `\'use client\'` actually mean?',
      `
It marks a module as a **client entry point**: the boundary where the server module graph hands over to modules that are bundled for the browser. That file and everything it imports become client code, which is still SSR'd and then hydrated. It doesn't mean "skip SSR", and it isn't needed on every interactive component, only at the boundary. Props passed into it from the server must be serialisable.
`],
    ['Why can\'t you pass a function from a server component to a client component?',
      `
Server and client run in different environments, separated by a network. Props crossing the boundary are serialised into the RSC payload, and closures can't be serialised: they capture server scope and code that never ships. The exception is a **Server Function** (\`'use server'\`), which is passed as a reference ID the client can invoke over the network. Pass data, JSX (\`children\`) or server functions, never plain callbacks.
`],
    ['How do Server Functions work?',
      `
The bundler replaces each exported function in a \`'use server'\` module with a reference (an ID plus the endpoint) in client code. When the client calls it, or a form submits to it, React serialises the arguments and POSTs them. The framework runs the real function on the server and serialises the result back. In Next.js the response can also carry an updated RSC payload after \`revalidatePath\`. Forms with a Server Function action work before hydration. They are public endpoints: authenticate and validate every call.
`],
    ['When would you *not* use RSC?',
      `
Highly interactive, client-state-heavy apps (editors, canvases, offline-first tools, dashboards behind auth with little SEO need), where most components would be \`'use client'\` anyway. Also when you can't or don't want to run a Node server (static hosting, an existing non-JS backend), when the team or tooling isn't ready for the boundary model, or for embedded widgets. A well-built SPA with a server cache is still a valid architecture.
`],
  ],
});

export const DAY13 = Day({
  n: 13, week: 3,
  title: 'Testing React well',
  tagline: 'Same philosophy as @ember/test-helpers: test what the user sees. The difference is that nothing waits for "settled". You wait for the outcome.',
  concepts: [
    C('g', '`@ember/test-helpers` → Testing Library',
      `
\`render(<Comp/>)\` mounts into a container attached to \`document.body\`. \`screen.*\` queries the document. \`userEvent\` drives real event sequences. Assertions come from \`@testing-library/jest-dom\` (\`toBeInTheDocument\`, \`toHaveAttribute\`, \`toBeVisible\`). It's the same "test like a user" philosophy as \`@ember/test-helpers\` + qunit-dom. React has no container or owner to set up. You wrap the component in whatever providers it needs (a QueryClient, a router, context).
`,
      `
await render(<template><IssueCard @issue={{issue}} /></template>);
assert.dom('h3').hasText('Add dark mode');
await click('button');
`,
      `
render(<IssueCard issue={issue} />);
expect(screen.getByRole('heading', { name: 'Add dark mode' })).toBeInTheDocument();
await user.click(screen.getByRole('button', { name: 'Select' }));
`, { emberLang: 'javascript' }),
    C('g', 'Query priority',
      `
In order: \`getByRole\` (with \`name\`) → \`getByLabelText\` → \`getByPlaceholderText\` → \`getByText\` → \`getByDisplayValue\` → \`getByAltText\` / \`getByTitle\` → \`getByTestId\` as a last resort. Role queries check what assistive tech sees. If you can't find an element by role and name, a screen reader user probably can't either. Variants: \`getBy\` (throws if missing), \`queryBy\` (returns null, for asserting absence) and \`findBy\` (async, waits).
`,
      `
assert.dom('[data-test-save]').exists();
`,
      `
screen.getByRole('button', { name: 'Save' });
screen.getByRole('tab', { name: 'Mine', selected: true });
screen.queryByRole('dialog'); // null when absent
`, { emberLang: 'javascript' }),
    C('g', '`userEvent` vs `fireEvent`',
      `
\`fireEvent.click(el)\` dispatches **one** synthetic DOM event. \`userEvent.click(el)\` simulates the whole interaction: pointer events, mousedown, focus change, mouseup, click. It also respects \`disabled\` and \`pointer-events\`, and \`user.type\` fires per-key events. Always \`const user = userEvent.setup()\` and \`await\` every call. Reach for \`fireEvent\` only for events that userEvent doesn't model.
`,
      `
await click('button');
await fillIn('input', 'hello');
await triggerKeyEvent('input', 'keydown', 'Escape');
`,
      `
const user = userEvent.setup();
await user.click(button);
await user.type(input, 'hello');
await user.keyboard('{Escape}');
`, { emberLang: 'javascript' }),
    C('y', '`findBy` / `waitFor` vs `await settled()`',
      `
Ember's test waiters track the runloop, pending AJAX and timers, so \`await settled()\` waits until *everything* is idle. React has **no global settled state**. Instead you wait for the **outcome you expect**: \`await screen.findByRole(…)\` retries until the element appears (1 s default), and \`await waitFor(() => expect(…))\` retries an assertion. \`act()\` flushes React's own work and is already wrapped around render, userEvent and RTL's async utilities. Don't wrap those in \`act\` yourself.

Fake timers: \`vi.useFakeTimers()\` + \`act(() => vi.advanceTimersByTime(ms))\`.
`,
      `
await click('[data-test-load]');
await settled(); // waits for fetch, runloop, timers
assert.dom('li').exists({ count: 4 });
`,
      `
await user.click(screen.getByRole('button', { name: 'Load' }));
expect(await screen.findAllByRole('listitem')).toHaveLength(4);

await waitFor(() => expect(getDbSnapshot()[0].status).toBe('done'));
`, { emberLang: 'javascript' }),
    C('g', 'Mocking the network: MSW',
      `
Mock at the **network** boundary, not at the module boundary. Mock Service Worker intercepts \`fetch\` in Node and in the browser, so your real data layer (Query, loaders) runs unchanged. That's the closest thing to Mirage, with handlers per test (\`server.use(http.get(…))\`). This course uses an in-memory fake API instead, so the exercises stay dependency-free.
`,
      `
this.server.get('/issues', () => [...]); // Mirage
`,
      `
const server = setupServer(
  http.get('/api/issues', () => HttpResponse.json(issues)),
);
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
`, { emberLang: 'javascript', reactLang: 'typescript' }),
    C('g', 'Test behaviour, use accessibility as the strategy',
      `
A good test survives a refactor that doesn't change behaviour, and fails when behaviour breaks. Avoid asserting state values, hook calls, class names you don't need, component internals or snapshot blobs. Query by role, name and state (\`selected\`, \`expanded\`, \`pressed\`), drive with the keyboard, and you're testing accessibility for free. The Day 13 exercise turns this into a measurement: your tests are only as good as the bugs they catch.
`,
      `
assert.dom('[data-test-tab].active').hasText('Mine');
`,
      `
expect(screen.getByRole('tab', { name: 'Mine' })).toHaveAttribute('aria-selected', 'true');
await user.keyboard('{ArrowRight}');
expect(screen.getByRole('tab', { name: 'Closed' })).toHaveFocus();
`, { emberLang: 'javascript' }),
  ],
  exercise: {
    intro: 'This is mutation testing: the meta-test runs *your* tests against a correct component and five subtly broken ones.',
    files: [
      'exercises/day13/tabs.checks.tsx',
      'src/day13/Tabs.tsx (read only)',
    ],
    command: 'pnpm test day13',
    criteria: [
      'Export at least **4** checks, each `{ name, run(Tabs) }`, that render the component and assert behaviour.',
      'Every check **passes** against the real `Tabs`.',
      'Every one of the 5 mutants in `src/day13/mutants/` **fails** at least one check. Don\'t peek at the mutants until you\'ve written your checks.',
    ],
    stretch: 'Write a sixth mutant that your checks *don\'t* catch (for example, the panel loses `aria-labelledby`), add it to `mutants/index.ts`, and then add the check that kills it.',
  },
  drill: [
    ['Why prefer `getByRole`?',
      `
It queries the accessibility tree, the same thing assistive technology uses, by role and accessible name. That makes tests resilient to markup and styling changes, documents intent ("the Save button"), and fails when accessibility breaks (a missing label, the wrong role). If an element can't be found by role, that's often a real a11y bug.
`],
    ['What\'s wrong with testing implementation details?',
      `
Such tests break on refactors that don't change behaviour (false negatives that erode trust) and pass when behaviour is broken (false positives). Examples: asserting on component state, calling instance methods, checking which hook was used, shallow rendering, or snapshotting markup. Test inputs and outputs the user or caller can observe: rendered text and roles, focus, callbacks invoked, network effects.
`],
    ['`waitFor` vs `findBy`?',
      `
\`findBy*\` is \`waitFor\` + \`getBy*\`. It retries a query until an element appears or the timeout passes. Use it to wait for something to *appear*. \`waitFor(cb)\` retries any callback until it stops throwing. Use it for other assertions (disappearance, call counts, db state). Keep \`waitFor\` callbacks side-effect-free, with one assertion each, and never put \`userEvent\` calls inside them.
`],
    ['How do you test a component that fetches?',
      `
Render it with its real data layer (a fresh \`QueryClient\` per test with \`retry: false\`, or a memory router for loaders) and mock the **network**, using MSW or a fake API, not the hook. Assert the loading state, then \`await findBy…\` for the data, and cover the error path (a handler returning 500, then "Retry"). Isolate tests with fresh caches and handlers reset between them.
`],
    ['How do you test a custom hook?',
      `
Ideally through a component that uses it. For reusable hooks, use \`renderHook(() => useX(props), { initialProps, wrapper })\`, read \`result.current\`, change inputs with \`rerender\`, trigger updates in \`act()\`, and use fake timers for time-based hooks. Assert observable results (returned values, side effects such as storage), not internal state.
`],
    ['What makes a test flaky?',
      `
Hidden dependence on timing or shared state: fixed \`setTimeout\` sleeps instead of waiting for an outcome, forgetting to \`await\` userEvent or \`findBy\`, leaking state between tests (a shared QueryClient, module singletons, unrestored fake timers, leftover listeners), real network calls, animation or transition timing, and order-dependent tests. Fix it with outcome-based waiting, per-test setup and teardown, and deterministic fakes.
`],
  ],
});

export const DAY14 = Day({
  n: 14, week: 3,
  title: 'Patterns, TypeScript & modern APIs',
  tagline: 'Patterns you already know from Ember, in React\'s vocabulary, plus the APIs React 19 added.',
  concepts: [
    C('y', 'Compound components via context',
      `
\`<Accordion><Accordion.Item><Accordion.Trigger/>…\` gives the caller full control of the markup while the parent owns the state. The parent provides state through **context**, and each part reads it (and throws a helpful error outside a parent). That's the React spelling of yielding contextual components with \`hash\`. Attach the parts with \`Object.assign(Root, { Item, Trigger, Panel })\`.
`,
      `
{{!-- accordion.hbs --}}
{{yield (hash Item=(component "accordion/item"
                     openId=this.openId toggle=this.toggle))}}

<Accordion as |acc|>
  <acc.Item @id="a" as |item|>
    <item.Trigger>Q</item.Trigger><item.Panel>A</item.Panel>
  </acc.Item>
</Accordion>
`,
      `
const AccordionContext = createContext<Ctx | null>(null);

function Root({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState<string | null>(null);
  return <AccordionContext value={{ open, setOpen }}>{children}</AccordionContext>;
}
export const Accordion = Object.assign(Root, { Item, Trigger, Panel });

<Accordion>
  <Accordion.Item value="a">
    <Accordion.Trigger>Q</Accordion.Trigger>
    <Accordion.Panel>A</Accordion.Panel>
  </Accordion.Item>
</Accordion>
`),
    C('y', 'Portals',
      `
\`createPortal(jsx, domNode)\` renders children into another DOM node, usually \`document.body\`, so modals, toasts and popovers escape \`overflow: hidden\` and stacking contexts. The surprise: in the **React tree** the portal is still a child of the component that rendered it. Context flows into it, and synthetic events **bubble to React ancestors**, not DOM ancestors. Don't \`stopPropagation\` inside a dialog just to stop backdrop clicks: check \`e.target === e.currentTarget\` on the backdrop instead. (Also consider the native \`<dialog>\` element with \`showModal()\`.)
`,
      `
{{#in-element this.destination insertBefore=null}}
  <div role="dialog">…</div>
{{/in-element}}
`,
      `
return createPortal(
  <div className="backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
    <div role="dialog" aria-modal="true" aria-labelledby={titleId}>…</div>
  </div>,
  document.body,
);
`),
    C('g', '`ref` is just a prop now',
      `
In React 19, function components receive \`ref\` like any other prop, so \`forwardRef\` is obsolete (still supported, slated for deprecation). Type it with \`ComponentProps<'input'>\`, which already includes \`ref\`, and pass it on to the element. Ref callbacks can return a **cleanup** function, so a ref callback is now a complete "element modifier".
`,
      `
<TextField @label="Title" {{autofocus}} />
{{!-- inside: <input ...attributes /> --}}
`,
      `
type TextFieldProps = ComponentProps<'input'> & { label: string };

function TextField({ label, ref, ...inputProps }: TextFieldProps) {
  return <label>{label}<input ref={ref} {...inputProps} /></label>;
}

<TextField label="Title" ref={titleRef} />
`),
    C('r', '`<Activity>`: hide without unmounting',
      `
Conditional rendering **unmounts**: state, DOM and scroll position are gone. \`<Activity mode="hidden">\` (stable since 19.2) keeps the subtree mounted but hidden (\`display: none\`), **preserves its state and DOM**, unmounts its effects (subscriptions pause) and renders updates to it at the lowest priority. \`mode="visible"\` restores it instantly, with effects re-mounted. Use it for tabs, back/forward caches and pre-rendering the likely next screen.
`,
      `
{{!-- keep it rendered and toggle a class:
     state survives, but modifiers keep running --}}
<div class={{unless this.active "hidden"}}><Comments /></div>
`,
      `
// ❌ draft lost when switching tabs
{tab === 'comment' && <CommentTab />}

// ✅ state preserved, effects paused while hidden
<Activity mode={tab === 'comment' ? 'visible' : 'hidden'}>
  <CommentTab />
</Activity>
`),
    C('y', 'Typing components',
      `
- Extend native props: \`ComponentProps<'button'>\` (or \`ComponentPropsWithoutRef\` when you omit ref) and \`Omit<…, 'onChange'>\` when you change a signature.
- **Generic components**: \`function Select<T>({ items, getLabel, onChange }: SelectProps<T>)\`. TypeScript infers \`T\` from usage. In \`.tsx\`, arrow generics need \`<T,>\`.
- **Discriminated-union props** make invalid combinations unrepresentable: \`{ variant: 'link'; href: string } | { variant: 'button'; onClick(): void }\`.
- \`ReactNode\` for anything renderable, \`ReactElement\` only when you must have an element.

Ember's Glint gave you template type-checking. With JSX it's just TypeScript.
`,
      `
interface Signature<T> {
  Args: { items: T[]; onSelect: (item: T) => void };
  Blocks: { default: [item: T] };
}
export default class Select<T> extends Component<Signature<T>> {}
`,
      `
interface SelectProps<T> {
  items: T[];
  getLabel: (item: T) => string;
  onSelect: (item: T) => void;
}
function Select<T>({ items, getLabel, onSelect }: SelectProps<T>) { … }

type ButtonProps =
  | ({ as: 'a' } & ComponentProps<'a'>)
  | ({ as?: 'button' } & ComponentProps<'button'>);
`, { emberLang: 'typescript' }),
    C('r', 'Fragment refs and `<ViewTransition>` (19.3)',
      `
**Fragment refs** (stable in 19.3): \`<Fragment ref={ref}>\` gives you a \`FragmentInstance\` that addresses **all of its first-level DOM children** without a wrapper element: \`addEventListener\`, \`observeUsing(intersectionObserver)\`, \`getClientRects()\`, \`focus()\`. That's useful for visibility tracking and focus management around arbitrary children. **\`<ViewTransition>\`** (Day 11) animates transition-driven updates with the View Transitions API.
`,
      `
// a modifier on a wrapper element, or
// {{did-insert}} with querySelectorAll
`,
      `
const ref = useRef<FragmentInstance>(null);

useEffect(() => {
  const io = new IntersectionObserver(onVisible);
  ref.current!.observeUsing(io);
  return () => ref.current?.unobserveUsing(io);
}, []);

<Fragment ref={ref}>{children}</Fragment>
`, { emberLang: 'javascript' }),
  ],
  exercise: {
    files: [
      'exercises/day14/Accordion.tsx',
      'exercises/day14/Modal.tsx',
      'exercises/day14/TextField.tsx',
      'exercises/day14/KeepAliveTabs.tsx',
    ],
    command: 'pnpm test day14',
    criteria: [
      '`Accordion` (+ `.Item`, `.Trigger`, `.Panel`): one item open at a time, `aria-expanded`, closed panels `hidden`, panels labelled by their trigger, `defaultValue`. The parts throw outside `<Accordion>`.',
      '`Modal` portals to `document.body` (not inside the render container), with `role="dialog"`, `aria-modal`, and a label from the title.',
      'Escape calls `onClose`. Focus moves into the dialog on open and returns to the opener on close. Clicks inside still bubble to React ancestors.',
      '`TextField` passes `ref` (a plain prop) to its `<input>`.',
      '`KeepAliveTabs`: a typed draft survives switching tabs away and back (`<Activity>`), and the hidden tab isn\'t visible.',
    ],
    stretch: 'Trap focus inside the Modal (Tab and Shift+Tab cycle through its focusable elements), or rebuild it on the native `<dialog>` element with `showModal()` and compare.',
  },
  drill: [
    ['What are compound components, and how do you build them?',
      `
A set of components that work together under a parent, such as \`<Tabs><Tabs.List><Tabs.Tab/>…\`, sharing implicit state. The caller composes the markup freely and the parent owns the behaviour. Build them with a context created by the parent (state + actions), consumed by each part through a hook that throws outside the parent. Attach the parts as static properties. They're the React equivalent of yielding contextual components via \`hash\`.
`],
    ['Why portals, and how do events bubble through them?',
      `
Portals render into a different DOM node (usually \`body\`) to escape clipping, \`overflow\` and \`z-index\` stacking: modals, tooltips, toasts. Events bubble through the **React tree**, not the DOM tree. A click inside a portal reaches the \`onClick\` of the React component that rendered it, even though DOM-wise it's elsewhere. Context also flows through. Native listeners attached to DOM ancestors won't see those events.
`],
    ['What changed with refs in React 19?',
      `
\`ref\` is a regular prop for function components, so \`forwardRef\` is no longer needed. Ref callbacks can return a cleanup function, called on detach, instead of being called with \`null\`. \`useRef\` requires an argument. \`<Context>\` replaced \`<Context.Provider>\` in the same release. In 19.3, \`<Fragment ref>\` exposes a \`FragmentInstance\` spanning the fragment's children.
`],
    ['`<Activity>` vs conditional rendering?',
      `
Conditional rendering unmounts the hidden branch, which destroys its state and DOM and runs effect cleanups. Showing it again mounts fresh. \`<Activity mode="hidden">\` keeps the component mounted and hidden with \`display: none\`, preserves its state and DOM, tears down its effects while hidden (re-running them when visible), and renders its updates at low priority. Use Activity when returning to a view should be instant and stateful. Use conditional rendering when hidden UI should really go away.
`],
    ['How do you type a generic component?',
      `
Declare the type parameter on the function and use it in the props: \`function List<T>({ items, renderItem }: { items: T[]; renderItem: (t: T) => ReactNode })\`. TypeScript infers \`T\` from the props at the call site. Constrain it when you need fields (\`T extends { id: string }\`). With arrow functions in \`.tsx\`, write \`<T,>\` so it isn't parsed as JSX. With \`memo\` or \`forwardRef\` wrappers you used to need a cast. In 19, with ref as a prop, plain generic functions just work.
`],
  ],
});

export const DAY15 = Day({
  n: 15, week: 3,
  title: 'Capstone + final review',
  tagline: 'Assemble the app from your own parts, then work through the final review out loud.',
  concepts: [],
  exercise: {
    files: [
      'exercises/day15/App.tsx',
    ],
    command: 'pnpm test day15',
    criteria: [
      '`AppRoot({ initialEntries? })` uses a memory router when entries are given and a browser router otherwise. The `QueryClient` and the router are each held in `useState`.',
      'It composes earlier days through `@ex/…`: Day 10\'s route structure, Day 9\'s hooks, Day 4\'s `NewIssueForm`, Day 14\'s `Modal`, and Day 1\'s `IssueCard` / `StatusBadge`.',
      'Flow: the list shows 4 issues → "Status filter" To do shows 2 → clicking an issue shows its detail → setting the detail\'s "Status" to Done drops it from the filtered list → "New issue" opens the modal, submitting "Write capstone" closes it, and the new issue appears under All.',
      'Deep links (`/issues/3`) work, the modal validates and closes on Escape, and unknown routes show "Page not found" inside the layout.',
      'Then open [localhost:1515/app/](http://localhost:1515/app/) (served by `pnpm start`) to use *your* app at 300 ms latency. `pnpm dev:solutions` runs the reference.',
    ],
    stretch: 'Add the Day 11 `EditTitle` to the detail pane and the Day 5 `LiveIssueFeed` to the layout, and wrap navigations in `<ViewTransition>`.',
  },
  drill: [],
  plan: ['Capstone', 'Final review', 'Cheat sheet'],
});

export const WEEK3 = [DAY11, DAY12, DAY13, DAY14, DAY15];

// [concern, question, answer]
export const FINAL_REVIEW = [
  ['Rendering', 'Walk me through what happens when `setState` is called.',
    `
The setter enqueues an update on that component's fiber with a priority (lane). In an event it's batched with others, and it's lower priority inside a transition. React schedules a render. During **render** it walks down from the root, re-running the updated component and (by default) its descendants. Memoized subtrees bail out when their props are \`Object.is\`-equal. The new state is computed by applying the queued updates in order. React reconciles the new elements against the current fiber tree (type + key) and collects DOM mutations. Concurrent renders can be interrupted. Then **commit**: apply the DOM changes synchronously, attach refs, run layout effects, paint, then run passive effects (\`useEffect\`). If the new state is \`Object.is\`-equal to the old, React can bail out early.
`],
  ['Rendering', 'React has no fine-grained reactivity. Why is it still fast enough, and when isn\'t it?',
    `
Re-rendering is a JS function call plus a diff of lightweight element objects. DOM work, which is the expensive part, happens only where output changed. Batching collapses updates, concurrent rendering keeps input responsive during heavy work, and the React Compiler auto-memoizes to skip unchanged subtrees. It struggles with very large trees re-rendering on high-frequency updates (typing in a big form, dragging) and with expensive render functions. Fix those with state colocation, memoization, \`useDeferredValue\`, virtualisation, or an external store with selectors.
`],
  ['Components', 'How do keys affect component identity and state?',
    `
React matches children between renders by type and key. Same type and key: the instance is reused with its state, refs and DOM. A different key means unmount and remount. Index keys tie state to positions, so reordering moves state to the wrong items. Stable data ids prevent this, and changing a key on purpose resets a component (\`<Form key={id}/>\`).
`],
  ['Components', 'How would you design a reusable Select that works with any item type?',
    `
A generic component, \`Select<T>\`, with \`items: T[]\`, \`getKey\`, \`getLabel\` and \`value\` / \`onChange\` typed by \`T\`. Make it controlled with an optional uncontrolled default, accessible (a listbox/combobox pattern or native \`<select>\`), and compositional (render props or compound parts for custom options), with native props passed through to the trigger and \`ref\` as a prop. Ideally it's built on a headless library (React Aria, Radix, Ariakit) so keyboard handling and a11y are solved.
`],
  ['State', 'How would you structure state in a large app?',
    `
By ownership and lifetime, not by "global vs local". **Server state** goes in a server cache (TanStack Query, or loaders/RSC), which is usually most of it. **URL state** (filters, tabs, selection, pagination) goes in the router. **Local UI state** stays colocated in components and is lifted only as far as needed. **Cross-cutting client state** (auth session, preferences, complex editors) goes in context for low-frequency values, or an external store with selectors (Zustand/Redux) for high-frequency, widely read values. Derive rather than duplicate, keep a single source of truth per fact, use reducers for complex transitions, and put feature boundaries around providers.
`],
  ['State', 'Why is mutating state a bug, even when the UI seems to update?',
    `
React decides whether to re-render by reference equality. A mutated object is the same reference, so \`memo\`, \`useMemo\`, effect deps and bail-outs treat it as unchanged. The UI only appeared to update because something else triggered a render. Mutation also corrupts the previous render's snapshot (breaking concurrent rendering, transitions and Strict Mode double renders) and makes behaviour depend on timing.
`],
  ['Events & forms', 'Controlled or uncontrolled for a 30-field settings form?',
    `
Mostly uncontrolled: native inputs with \`defaultValue\`, read via \`FormData\` in a form Action, and validation on submit or blur (with native constraints plus a schema). Controlled re-renders the form on every keystroke and needs a state field per input. Use controlled fields only where other UI depends on the live value. Or use a form library (React Hook Form is uncontrolled and ref-based) for field arrays, dirty tracking and validation.
`],
  ['Events & forms', 'How do React events differ from native DOM events?',
    `
They're synthetic wrappers dispatched via delegation from the root container, propagating through the React component tree (including through portals). The handlers are props. \`onChange\` fires on every input, unlike the native \`change\` event. \`e.nativeEvent\` gives you the original. \`stopPropagation\` stops React propagation, and native listeners on ancestors may still see the event depending on attachment. Return values don't prevent defaults: call \`preventDefault()\`.
`],
  ['Effects', 'When is `useEffect` the right tool, and when is it a code smell?',
    `
It's right for synchronising with **external systems** keyed on props or state: subscriptions, timers, non-React widgets, imperative DOM APIs, analytics on visibility. It's a smell when it computes derived state, responds to user events (put that in the handler), resets state on prop change (use \`key\`), fetches without a race guard or cache (use a data library), or chains state updates. Rule of thumb: if there's no external system, there's no effect.
`],
  ['Effects', 'Explain stale closures with an example, and how you avoid them.',
    `
Each render's functions capture that render's props and state. A \`setInterval(() => setCount(count + 1), 1000)\` created in an effect with \`[]\` deps keeps seeing \`count = 0\` forever. Avoid it with updater functions (\`setCount(c => c + 1)\`), correct dependency arrays (re-subscribe when inputs change), \`useEffectEvent\` for reading the latest values in an effect callback without re-syncing, or a ref holding the latest value for imperative code.
`],
  ['Performance', 'When do you use `memo`, `useMemo` and `useCallback`, and what changes with the React Compiler?',
    `
Without the compiler: \`memo\` for components that re-render often with the same props and are expensive (list rows, charts). \`useCallback\` and \`useMemo\` to keep the props to those components stable, to cache expensive computations, and to stabilise effect deps. Measure first. With the compiler, most of this is automatic and you remove manual memoization. You still care about code the compiler skips (rule violations), identity for third-party libraries, and architectural fixes (state colocation, virtualisation), which no compiler does for you.
`],
  ['Performance', 'A list of 5,000 issues stutters when typing in its filter. What do you do?',
    `
Profile first. Then: keep the input responsive with \`useDeferredValue\` (or \`startTransition\`) for the filter applied to the list. **Virtualise** the list (TanStack Virtual) so only visible rows render. Memoize rows with stable props (or let the compiler do it). Make the filter itself cheap (precompute lower-cased titles with \`useMemo\`). And, if the data allows, move filtering server-side with debounced queries.
`],
  ['Architecture', 'Context vs an external store vs TanStack Query: how do you choose?',
    `
**Query** for anything fetched from a server: caching, invalidation and background refresh. **Context** for injecting dependencies and low-frequency tree-wide values (theme, user, a client instance), because every consumer re-renders on change. **An external store** with selector subscriptions (Zustand/Redux via \`useSyncExternalStore\`) for frequently changing client state shared across distant components. These are often combined: context provides a store, and components select from it.
`],
  ['Architecture', 'What is tearing, and how does React prevent it?',
    `
Tearing is when one render shows inconsistent versions of the same external data, because a concurrent render yielded mid-way and the store changed in between, so some components read the old value and some the new. \`useSyncExternalStore\` prevents it by checking snapshots during render and forcing a synchronous re-render if the store changed during a concurrent render. React-managed state (useState/context) can't tear.
`],
  ['Hooks', 'Why do the Rules of Hooks exist?',
    `
React associates hook state with a component by **call order**, not by name. Calling hooks conditionally, in loops or after early returns changes that order between renders, so state is read from the wrong slot. The rules (top level only, only from components and hooks) keep the order stable. The lint plugin enforces them, and the Compiler relies on them.
`],
  ['Hooks', 'Design a `useFetch(url)` hook. Then tell me why you wouldn\'t ship it.',
    `
State \`{ data, error, status }\`. An effect on \`[url]\` with an \`AbortController\` (or an ignore flag) cleaned up on change, that sets state on resolve or reject, and resets to loading when the url changes. I wouldn't ship it because it lacks caching and dedupe across components, background revalidation, invalidation after mutations, retries, pagination, SSR and Suspense integration, and request-ordering guarantees beyond the latest url. It produces render-then-fetch waterfalls. TanStack Query (or router loaders/RSC) solves all of that.
`],
  ['Data', 'Explain stale-while-revalidate and query invalidation in TanStack Query.',
    `
A query's data becomes stale after \`staleTime\` (0 by default). Stale data is still served instantly from the cache, and a background refetch fires on mount, window focus, reconnect or invalidation. \`isFetching\` is true while the old data stays on screen. After a mutation, \`invalidateQueries({ queryKey })\` marks matching keys (prefix match) stale and refetches the active ones. That's how you keep views consistent without a normalised store.
`],
  ['Data', 'How does Suspense change data loading, and what are its pitfalls?',
    `
Components declare what they need and suspend until it's ready. The nearest \`<Suspense>\` shows a fallback, and error boundaries handle failures, so loading and error UI move to wherever you want them in the tree, and components get non-nullable data. Pitfalls: sequential suspenses cause **waterfalls** (prefetch in loaders, or use parallel queries), promises must be cached and not created during render, fallbacks can flash (use transitions for updates), and you need error boundaries with reset (\`QueryErrorResetBoundary\`).
`],
  ['Routing', 'Where should filter, sort and pagination state live, and why?',
    `
In the URL search params, which become the single source of truth. That makes them shareable, bookmarkable and reload-safe, Back/Forward works, they're server-renderable, and loaders can read them before render, so there's no flash. Read with \`useSearchParams\` and validate (the URL is user input), and write through navigation. Avoid copying them into \`useState\`.
`],
  ['Routing', 'Compare React Router loaders with Ember route model hooks.',
    `
Both fetch before the route renders and feed the component, and both support redirects and error substates. Loaders for all matched routes run **in parallel**, while Ember resolves parent models first. There are no controllers: query params are plain \`URLSearchParams\`. There are no default loading substates (the old UI stays, with \`useNavigation()\` for pending). Errors bubble to the nearest \`errorElement\`. Loaders re-run after actions or on navigation, and they pair well with a query cache for client-side caching.
`],
  ['Concurrent', 'What are transitions, and when would you use one?',
    `
Updates marked as non-urgent (\`startTransition\`/\`useTransition\`) that React can interrupt for urgent input, and during which visible content isn't replaced by Suspense fallbacks. Use them for tab switches, navigations, filtering large lists, or any update that triggers heavy rendering or suspends, so the current UI stays interactive with an \`isPending\` hint. In React 19 they can be async (Actions).
`],
  ['Concurrent', 'How do Actions, `useActionState` and `useOptimistic` fit together?',
    `
An Action is an async function run inside a transition (a form \`action\` or \`startTransition(async…)\`). \`useActionState\` wraps it, exposing the last result as state plus \`isPending\`, and queueing submissions. \`useFormStatus\` exposes pending to children of the form. \`useOptimistic\` shows a temporary value while the Action is pending, which disappears when it settles, giving automatic rollback on failure. Together they replace manual loading, error and optimistic plumbing, and they work with Server Functions.
`],
  ['Server', 'Explain the server/client boundary in React Server Components.',
    `
Server components run only on the server, can be async and access server resources, and ship no JS. \`'use client'\` marks the module where the client graph starts. Those components (and everything they import) are bundled for the browser, still SSR'd, then hydrated. Props crossing the boundary must be serialisable. Functions can't cross, except Server Function references. Server components can be passed into client components as \`children\`. You design the boundary to keep heavy, non-interactive code on the server and push interactivity to the leaves.
`],
  ['Server', 'How would you protect a Server Function?',
    `
Treat it as a public HTTP endpoint, because it is one. Authenticate the session inside the function and authorise per resource. Validate and parse every argument with a schema (FormData is untrusted). Avoid leaking internals in errors. Rate-limit where needed. Don't rely on the UI hiding the button. Remember that closure-captured values are sent to the client (encrypted in Next.js) and come back, so don't capture secrets.
`],
  ['Testing', 'How do you test a React app, and how is that different from Ember?',
    `
Testing Library and userEvent at the component level, querying by role and label. Network-level mocking with MSW. Fresh providers per test (QueryClient, memory router). Async assertions with \`findBy\`/\`waitFor\`. Plus a thin layer of Playwright end-to-end tests. Unlike Ember there's no global \`settled()\` (you wait for the expected outcome), no container or owner (you compose providers), and component, integration and acceptance tests blur together because rendering a route tree is just rendering components.
`],
  ['Testing', 'A test passes locally but fails on CI one time in twenty. How do you approach it?',
    `
Reproduce under stress (\`--repeat\`, CPU throttling, \`--sequence.shuffle\`). Look for un-awaited userEvent or \`findBy\` calls, fixed sleeps, shared state between tests (a module singleton, a reused QueryClient, unrestored fake timers or mocks, leaking listeners), dependence on wall-clock time or timezones, and assertions that race background refetches. Replace sleeps with outcome-based waits, isolate state per test, and make time and data deterministic.
`],
  ['Patterns', 'Compound components vs a config-object API: trade-offs?',
    `
**Config** (\`<Tabs items=[…]>\`) is concise, easy to validate and type, and rigid: every customisation becomes a new prop. **Compound components** (\`<Tabs><Tabs.Tab/>…\`) give callers control over markup, ordering and wrappers with less prop bloat, but they need context plumbing, are looser about invalid structures, and are harder to iterate over (you can't easily inspect children). Libraries often offer both: compound primitives with a convenience config wrapper.
`],
  ['Patterns', 'What does `<Activity>` give you over conditional rendering?',
    `
Hidden-but-mounted UI: state and DOM preserved (form drafts, scroll), effects torn down while hidden and restored when visible, and low-priority pre-rendering of hidden content (the next tab can render before you click it). Conditional rendering destroys and recreates. Costs: memory for hidden trees, and the need for effects that clean up properly (Strict Mode already checks that).
`],
  ['Migration', 'How would you migrate an Ember app to React incrementally?',
    `
Strangler pattern, by route or by leaf. 1) Stand up a React build next to Ember with shared design tokens and an API client. 2) Mount React "islands" inside Ember: a component or modifier that calls \`createRoot(element).render(<Widget {...args}/>)\` and unmounts in \`willDestroy\`, passing args as props and callbacks for actions. 3) Bridge state: start with server data through a shared TanStack Query client or the same REST/GraphQL API (not ember-data). Bridge auth and session explicitly. 4) Migrate whole routes at a time once leaves are done, ideally behind a top-level router that delegates unknown routes to Ember (or a reverse proxy splitting by path). 5) Port tests with the features, using Testing Library for components and Playwright across both. Avoid a big-bang rewrite, avoid two-way state sync between the frameworks, and keep a running list of what's left.
`],
  ['Migration', 'Which Ember instincts are most dangerous in React?',
    `
1) **Mutating state** and expecting the UI to follow (\`@tracked\` habit). 2) Expecting fine-grained updates and being surprised that children re-render, then over- or under-memoizing. 3) Treating \`useEffect\` like \`didInsert\`/observers and syncing state with state. 4) Expecting a DI container: services become context, which isn't a store and re-renders every consumer. 5) Reading a value right after setting it (state is a snapshot). 6) Waiting for \`settled()\` in tests instead of for outcomes. 7) Assuming the framework owns data (ember-data), when React leaves server state to a library.
`],
];

// [ember, react, flags]
export const CHEATSHEET = [
  ['Glimmer component class', 'Function component', 'y'],
  ['`@arg` / `this.args`', 'props', 'g'],
  ['`@tracked` + mutation', '`useState` + immutable replace', 'r'],
  ['getter over tracked state', 'value computed during render (`useMemo` only if expensive)', 'g'],
  ['`{{yield}}` / named blocks', '`children` / ReactNode props', 'gy'],
  ['`{{yield x}}` block params', 'render prop', 'y'],
  ['`{{yield (hash Item=(component …))}}`', 'compound components + context', 'y'],
  ['`{{#each key=}}`', '`.map()` + `key`', 'g'],
  ['`{{on "click"}}`', '`onClick`', 'g'],
  ['modifiers / `registerDestructor`', '`useEffect` + cleanup, refs', 'y'],
  ['helpers', 'plain functions / hooks', 'g'],
  ['services (DI)', 'Context + provider, external stores', 'y'],
  ['ember-resources', 'custom hooks', 'y'],
  ['ember-concurrency (`restartable`, `isRunning`)', 'effect cleanup, Query status, transitions / `useActionState`', 'y'],
  ['ember-data / WarpDrive store', 'TanStack Query cache', 'y'],
  ['Router.map / model hook / `{{outlet}}`', 'route objects / loader / `<Outlet/>`', 'g'],
  ['query params', '`useSearchParams`', 'y'],
  ['loading / error substates', '`useNavigation` / `errorElement`, Suspense / error boundaries', 'gy'],
  ['`{{#in-element}}`', '`createPortal`', 'g'],
  ['FastBoot', 'SSR / RSC', 'r'],
  ['`@ember/test-helpers` + `await settled()`', 'Testing Library + `findBy` / `waitFor`', 'y'],
  ['autotracking (fine-grained)', 're-render + reconcile (+ Compiler)', 'r'],
];
