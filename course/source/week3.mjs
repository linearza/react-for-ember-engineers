import { C, Day } from './model.mjs';

export const DAY11 = Day({
  n: 11, week: 3,
  title: 'React 19 Actions & concurrent features',
  tagline: 'Transitions mark updates as interruptible, and Actions are async transitions with pending, error and optimistic state built in. This is the closest React gets to ember-concurrency.',
  concepts: [
    C('r', 'Transitions: urgent vs non-urgent updates',
      `
Ember renders every change synchronously inside the runloop, whereas React gives each update a priority. Typing, clicking and hovering are **urgent**, because the UI must respond immediately. Re-rendering a big filtered list or switching tabs can wait.

\`startTransition(() => setX(…))\` marks an update as one that can wait, a **transition**. React renders it in the background while the current UI stays on screen, interrupts the work if something urgent happens, and **won't replace visible content with a Suspense fallback**. \`useTransition()\` adds an \`isPending\` flag.
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
In React 19 a transition can be **async**, and an async transition is an Action. Pass an async function to \`<form action={fn}>\` and React calls it with the \`FormData\` inside a transition, then resets uncontrolled fields when it finishes.

\`useActionState(action, initial)\` wraps the action and returns \`[state, formAction, isPending]\`. \`state\` is whatever the action returned last, a result or an error, and submissions queue in order. Inside the form, \`useFormStatus()\` lets any component read \`pending\` without prop drilling. Together they replace the \`useState\` × 3 + \`onSubmit\` + \`try/finally\` boilerplate that an ember-concurrency task saved you from.

One gotcha: the reset also happens when your action *returns* an error, so fields snap back to their \`defaultValue\`. If the user should keep what they typed, return the submitted values in the state and use them as defaults. The same Actions run as Server Functions on Day 12.
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
In an ember-concurrency task you save the previous value and restore it by hand. \`useOptimistic\` needs no snapshot. \`const [optimistic, addOptimistic] = useOptimistic(actual, reducer?)\` returns \`actual\`, except while a transition is pending, when it returns the optimistic value you set. Once the transition settles, React drops that layer and shows \`actual\` again.

So on success, where you've updated \`actual\`, nothing visibly changes. **On failure you haven't**, so the optimistic value just disappears, and rollback comes for free. Call \`addOptimistic\` inside \`startTransition\` or an Action.
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
\`const deferred = useDeferredValue(query)\` returns a value that **lags behind** during heavy renders. React first re-renders urgently with the *old* deferred value, so the input stays responsive, then renders the new one in the background and abandons that render if \`query\` changes again. Unlike a \`timeout()\` debounce there's no fixed delay, which means it's instant on a fast device and adapts on a slow one. But it doesn't reduce network calls, so for requests you still debounce.
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
Where Ember reaches for ember-animated, React wraps content in \`<ViewTransition>\`. Updates made in a **transition**, whether \`startTransition\`, an Action or a router navigation, then animate through the browser's View Transitions API. The default is a cross-fade, which you customise with CSS (\`::view-transition-*\`) or by name for shared-element morphs, and \`addTransitionType('forward')\` tags a transition so the CSS can vary per type. Urgent updates don't animate, which is one more reason to make navigations transitions.
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
It's an update marked as non-urgent with \`startTransition\` or \`useTransition\`, which React renders concurrently. That means urgent updates such as typing can interrupt it, the current UI stays interactive, already-visible content isn't replaced by Suspense fallbacks, and you get \`isPending\`. Since React 19 transitions can also be async, and then they're called Actions.
`],
    ['What problem do Actions solve?',
      `
They remove the boilerplate and the bugs around async mutations: pending state, submission order, errors, form resets and optimistic UI. An Action is an async function run in a transition, so React can own all of that. It tracks the pending state for \`useActionState\` and \`useFormStatus\`, queues repeated submissions, integrates with \`useOptimistic\` and resets uncontrolled forms on success. The same model also works for Server Functions, with progressive enhancement.
`],
    ['`useActionState` vs `useState` + `onSubmit`?',
      `
\`useActionState\` does by itself what \`useState\` + \`onSubmit\` makes you do by hand. With the manual version you manage \`isSubmitting\`, \`error\` and \`result\`, remember \`preventDefault\`, guard against double submits and order async results yourself. \`useActionState\` instead returns the last result as state plus \`isPending\`, runs the action in a transition, queues calls so results arrive in order and receives \`FormData\` directly. Given a server function, it even works before hydration via a permalink. So it's less code with fewer race conditions.
`],
    ['How does `useOptimistic` roll back?',
      `
It doesn't need a snapshot, because the optimistic value is a temporary layer that only exists **while the surrounding transition is pending**. When the transition ends, React renders from the real state again. If the server call succeeded, you updated the real state, so the UI stays put. If it failed, you didn't, so the optimistic value simply disappears and all you do is surface the error.
`],
    ['`useDeferredValue` vs debouncing?',
      `
Debouncing delays the *update* by a fixed time, even on fast devices, whereas \`useDeferredValue\` updates immediately at low priority. React renders the urgent UI first, then the deferred render in the background, and interrupts that if the value changes again. So there's no arbitrary delay, it adapts to device speed and the input never janks. But it only changes how expensive work is *scheduled*, not how often it's attempted, which is why debouncing is still the tool for limiting **network** requests.
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
FastBoot renders your client app in Node, and then the browser downloads and runs all of it again. A **Server Component** is different: it runs only on the server, at request or build time, and never ships its code to the browser. That's why it can be \`async\` and \`await\` the database, the filesystem or secrets directly. It's also why it **can't** use state, effects, refs, browser APIs or event handlers, since it never re-renders on the client. Its output is serialised as the RSC payload and merged into the client tree. In the App Router, components are server components **by default**.
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
\`'use client'\` at the top of a file says *this module, and everything it imports, is part of the client bundle*. It marks the **entry point** where the server tree hands over to interactive code, so you only need it on the boundary file, not on every component below it. Client components still **render on the server** (SSR) for the initial HTML, then hydrate.

Props crossing the boundary must be **serialisable**: primitives, plain objects and arrays, Dates, Maps and Sets, promises, JSX and Server Functions. Regular functions and class instances can't cross. Server components *can*, though, as the \`children\` of a client component.
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
In Ember a write is an adapter call plus an API endpoint you also maintain. A **Server Function** collapses the two: a function in a \`'use server'\` module, or with the directive in its body, gives the client an opaque reference, and calling it makes a POST that runs the function on the server. Pass one to \`<form action>\` and the form works **before JS loads**, which is progressive enhancement, and pair it with \`useActionState\` for results and pending state.

But its arguments come from the network, so treat it as a public API endpoint: validate the input and check auth.
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
FastBoot waits for every model hook, then sends everything. On the server, by contrast, every \`<Suspense>\` boundary is a **streaming point**. React sends the shell HTML right away with the fallbacks, then streams each boundary's HTML and RSC payload into the same response as its data resolves, so slow data no longer blocks the whole page. Client components inside hydrate selectively, starting with whichever part the user interacts with. In Next.js, \`loading.tsx\` is a Suspense boundary around a route segment.
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
- **RSC**: some components exist **only** on the server, so their code and dependencies never ship and their output arrives as a serialised tree. RSC is *orthogonal* to SSR, and you usually do both: RSC builds the tree, then SSR turns it into HTML for first paint.
- The benefit is less JS, direct data access and no client-server waterfalls. The cost is a server runtime, a mental boundary, and a bundler or framework (Next.js, Waku, or React Router's RSC support).

One catch: context doesn't exist on the server. Server components can't call \`createContext\`, and only client components can read context. So put providers in a small \`'use client'\` wrapper, and render it from a server layout around server-rendered \`children\`.
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
The App Router replaces \`Router.map\` with file-system routes under \`app/\`. \`layout.tsx\` is a persistent wrapper, like \`application.hbs\` or a parent route, and \`page.tsx\` is a route's UI. \`loading.tsx\` and \`error.tsx\` are the substates, built on Suspense and error boundaries. Pages are server components that receive \`params\` and \`searchParams\` **as Promises** (Next 15+), so you write \`const { status } = await searchParams\`. Mutations use Server Functions plus \`revalidatePath\` / \`revalidateTag\`, and the client router caches RSC payloads between navigations.
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
They solve different problems, so frameworks use both. **SSR** renders client components to HTML on the server for a fast first paint, then ships all of that code to the browser to hydrate. **RSC** introduces components that run *only* on the server, so their code never ships, they can reach server resources directly, and their output is a serialised React tree rather than HTML. RSC builds the tree and SSR turns it into initial HTML. So RSC cuts bundle size and client waterfalls, whereas SSR improves first paint.
`],
    ['What does `\'use client\'` actually mean?',
      `
It marks a module as a **client entry point**, the boundary where the server module graph hands over to modules bundled for the browser. That file and everything it imports become client code, which is still SSR'd and then hydrated. So it doesn't mean "skip SSR", and it only belongs at the boundary, not on every interactive component. Props passed into it from the server must be serialisable.
`],
    ['Why can\'t you pass a function from a server component to a client component?',
      `
Because server and client are separate environments with a network between them. Props crossing the boundary are serialised into the RSC payload, and a closure can't be serialised, since it captures server scope and code that never ships. The exception is a **Server Function** (\`'use server'\`), which crosses as a reference ID the client can invoke over the network. So pass data, JSX as \`children\`, or server functions, but never plain callbacks.
`],
    ['How do Server Functions work?',
      `
In client code, the bundler replaces each exported function in a \`'use server'\` module with a reference, an ID plus the endpoint. When the client calls it, or a form submits to it, React serialises the arguments and POSTs them, and the framework runs the real function on the server and serialises the result back. In Next.js that response can also carry an updated RSC payload after \`revalidatePath\`. Forms with a Server Function action work before hydration. And because they're public endpoints, you authenticate and validate every call.
`],
    ['When would you *not* use RSC?',
      `
When most components would be \`'use client'\` anyway, as in highly interactive, client-state-heavy apps: editors, canvases, offline-first tools, or dashboards behind auth with little need for SEO. Also when you can't or don't want to run a Node server, because you host statically or have an existing non-JS backend, when the team or tooling isn't ready for the boundary model, and for embedded widgets. A well-built SPA with a server cache is still a valid architecture.
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
Testing Library shares the "test like a user" philosophy of \`@ember/test-helpers\` + qunit-dom. \`render(<Comp/>)\` mounts into a container attached to \`document.body\`, \`screen.*\` queries the document, and \`userEvent\` drives real event sequences. Assertions such as \`toBeInTheDocument\`, \`toHaveAttribute\` and \`toBeVisible\` come from \`@testing-library/jest-dom\`. What's missing is a container or owner to set up, so instead you wrap the component in whatever providers it needs: a QueryClient, a router, a context.
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
Where Ember tests lean on \`data-test-*\` selectors, Testing Library has a preferred order: \`getByRole\` (with \`name\`) → \`getByLabelText\` → \`getByPlaceholderText\` → \`getByText\` → \`getByDisplayValue\` → \`getByAltText\` / \`getByTitle\` → \`getByTestId\` as a last resort. Role queries come first because they check what assistive tech sees: if you can't find an element by role and name, a screen reader user probably can't either.

Each query has three variants. \`getBy\` throws if the element is missing, \`queryBy\` returns null for asserting absence, and \`findBy\` waits asynchronously.
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
\`fireEvent.click(el)\` dispatches **one** synthetic DOM event, whereas \`userEvent.click(el)\` simulates the whole interaction: pointer events, mousedown, focus change, mouseup, click. It also respects \`disabled\` and \`pointer-events\`, and \`user.type\` fires per-key events, which makes it the closer match to Ember's \`click\` and \`fillIn\`. Always create \`const user = userEvent.setup()\` and \`await\` every call. Reach for \`fireEvent\` only for events userEvent doesn't model.
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
Ember's test waiters track the runloop, pending AJAX and timers, so \`await settled()\` waits until *everything* is idle. React has **no global settled state**, so you wait for the **outcome you expect** instead. \`await screen.findByRole(…)\` retries until the element appears (1 s by default), and \`await waitFor(() => expect(…))\` retries an assertion. \`act()\` flushes React's own work, but render, userEvent and RTL's async utilities already wrap it, so don't add your own.

Fake timers are \`vi.useFakeTimers()\` + \`act(() => vi.advanceTimersByTime(ms))\`. Tell userEvent about them with \`userEvent.setup({ advanceTimers: vi.advanceTimersByTime })\`, or its internal delays hang.
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
Mock at the **network** boundary, not the module boundary, so your real data layer runs unchanged. Mock Service Worker, the closest thing to Mirage, does this by intercepting \`fetch\` in Node and the browser, with per-test handlers through \`server.use(http.get(…))\`. This course uses an in-memory fake API instead, which keeps the exercises dependency-free.
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
A good test survives a refactor that doesn't change behaviour, and fails when behaviour breaks. So avoid asserting on state values, hook calls, incidental class names, internals or snapshot blobs. Query by role, name and state (\`selected\`, \`expanded\`, \`pressed\`) and drive with the keyboard, and you test accessibility for free. Today's exercise makes this measurable, because your tests are only as good as the bugs they catch.
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
Because it queries the accessibility tree, by role and accessible name, which is what assistive technology uses. So tests survive markup and styling changes, document intent ("the Save button"), and fail when accessibility breaks, say a missing label or the wrong role. An element you can't find by role is often a real a11y bug.
`],
    ['What\'s wrong with testing implementation details?',
      `
They fail both ways. They break on refactors that don't change behaviour, which erodes trust, and they pass when behaviour is broken. Asserting on component state, calling instance methods, checking which hook was used, shallow rendering and snapshotting markup all do this. Instead, test what the user or caller can observe: rendered text and roles, focus, callbacks invoked and network effects.
`],
    ['`waitFor` vs `findBy`?',
      `
\`findBy*\` is just \`waitFor\` + \`getBy*\`: it retries a query until the element appears or the timeout passes, so use it to wait for something to *appear*. \`waitFor(cb)\` retries any callback until it stops throwing, which suits everything else, such as disappearance, call counts or db state. Keep \`waitFor\` callbacks free of side effects, with one assertion each and never a \`userEvent\` call.
`],
    ['How do you test a component that fetches?',
      `
Render it with its real data layer and mock the **network**, not the hook. That means a fresh \`QueryClient\` per test with \`retry: false\`, or a memory router for loaders, in front of MSW or a fake API. Assert the loading state, \`await findBy…\` for the data, and cover the error path with a handler that returns 500, then "Retry". Fresh caches and reset handlers keep tests isolated.
`],
    ['How do you test a custom hook?',
      `
Ideally through a component that uses it. For reusable hooks, use \`renderHook(() => useX(props), { initialProps, wrapper })\`: read \`result.current\`, change inputs with \`rerender\`, trigger updates in \`act()\`, and use fake timers for anything time-based. Assert on observable results, such as returned values and storage, not on internal state.
`],
    ['What makes a test flaky?',
      `
Hidden dependence on timing or shared state. On the timing side, that's fixed \`setTimeout\` sleeps, a forgotten \`await\` on userEvent or \`findBy\`, real network calls, and animation or transition timing. On the state side, it's a shared QueryClient, module singletons, unrestored fake timers, leftover listeners and order-dependent tests. The fixes mirror the causes: outcome-based waiting, per-test setup and teardown, and deterministic fakes.
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
Compound components are the React spelling of yielding contextual components with \`hash\`. \`<Accordion><Accordion.Item><Accordion.Trigger/>…\` gives the caller full control of the markup while the parent owns the state. The parent provides that state through **context**, and each part reads it, throwing a helpful error outside a parent. Attach the parts with \`Object.assign(Root, { Item, Trigger, Panel })\`.
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
Like \`{{#in-element}}\`, \`createPortal(jsx, domNode)\` renders children into another DOM node, usually \`document.body\`, so modals, toasts and popovers escape \`overflow: hidden\` and stacking contexts.

The surprise is that in the **React tree** the portal is still a child of the component that rendered it. Context flows into it, and synthetic events **bubble to React ancestors**, not DOM ancestors. So don't \`stopPropagation\` inside a dialog just to stop backdrop clicks; check \`e.target === e.currentTarget\` on the backdrop instead. The native \`<dialog>\` element with \`showModal()\` is also worth considering.
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
In React 19, function components receive \`ref\` like any other prop, so \`forwardRef\` is obsolete: still supported, but slated for deprecation. Type it with \`ComponentProps<'input'>\`, which already includes \`ref\`, and pass it on to the element. Ref callbacks can also return a **cleanup** function, which makes a ref callback a complete element modifier.
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
Conditional rendering **unmounts**, so state, DOM and scroll position are gone. In Ember you'd keep the element and toggle a class, but its modifiers keep running. \`<Activity mode="hidden">\` (stable since 19.2) does better: the subtree stays mounted behind \`display: none\` and **keeps its state and DOM**, while its effects unmount, so subscriptions pause, and updates to it render at the lowest priority. \`mode="visible"\` restores it instantly and re-mounts the effects. Use it for tabs, back/forward caches and pre-rendering the likely next screen.
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

Ember needed Glint to type-check templates, whereas JSX is just TypeScript.
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
Ember reaches a group of elements through a modifier on a wrapper, or \`querySelectorAll\`. **Fragment refs** (stable in 19.3) need no wrapper: \`<Fragment ref={ref}>\` gives you a \`FragmentInstance\` that addresses **all of its first-level DOM children** through \`addEventListener\`, \`observeUsing(intersectionObserver)\`, \`getClientRects()\` and \`focus()\`. That makes visibility tracking and focus management around arbitrary children straightforward. **\`<ViewTransition>\`**, from Day 11, animates transition-driven updates with the View Transitions API.
`,
      `
// a modifier on a wrapper element, or
// {{did-insert}} with querySelectorAll
`,
      `
const ref = useRef<FragmentInstance>(null);

useEffect(() => {
  const fragment = ref.current!;
  const io = new IntersectionObserver(onVisible);
  fragment.observeUsing(io);
  return () => { fragment.unobserveUsing(io); io.disconnect(); };
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
They're a set of components that work together under a parent and share implicit state, such as \`<Tabs><Tabs.List><Tabs.Tab/>…\`, so the caller composes the markup freely while the parent owns the behaviour. The parent creates a context holding state and actions, each part consumes it through a hook that throws outside the parent, and the parts hang off the parent as static properties. They're the React equivalent of yielding contextual components via \`hash\`.
`],
    ['Why portals, and how do events bubble through them?',
      `
Portals render into a different DOM node, usually \`body\`, so modals, tooltips and toasts escape clipping, \`overflow\` and \`z-index\` stacking. Events, though, bubble through the **React tree**, not the DOM tree. So a click inside a portal reaches the \`onClick\` of the component that rendered it, even though the DOM node lives elsewhere, and context flows through the same way. Native listeners on the DOM ancestors won't see those events.
`],
    ['What changed with refs in React 19?',
      `
\`ref\` became a regular prop for function components, so \`forwardRef\` is no longer needed. Ref callbacks can now return a cleanup function that runs on detach, instead of being called with \`null\`, and \`useRef\` requires an argument. The same release replaced \`<Context.Provider>\` with \`<Context>\`. Then 19.3 added \`<Fragment ref>\`, which exposes a \`FragmentInstance\` spanning the fragment's children.
`],
    ['`<Activity>` vs conditional rendering?',
      `
Conditional rendering unmounts the hidden branch, destroying its state and DOM and running effect cleanups, so showing it again mounts fresh. \`<Activity mode="hidden">\` instead keeps it mounted behind \`display: none\` with its state and DOM intact. Its effects are torn down while hidden and re-run when visible, and its updates render at low priority. So use Activity when returning to a view should be instant and stateful, and conditional rendering when hidden UI should really go away.
`],
    ['How do you type a generic component?',
      `
Declare the type parameter on the function and use it in the props, as in \`function List<T>({ items, renderItem }: { items: T[]; renderItem: (t: T) => ReactNode })\`, and TypeScript infers \`T\` at the call site. Constrain it when you need fields (\`T extends { id: string }\`). For arrow functions in \`.tsx\`, write \`<T,>\` so it isn't parsed as JSX. Wrapping in \`memo\` or \`forwardRef\` used to need a cast, but with ref as a prop in 19, plain generic functions just work.
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
The setter enqueues an update on that component's fiber with a priority, or lane. Inside an event it's batched with other updates, and inside a transition it gets a lower priority. Then React schedules a render, which happens in two phases.

During **render**, React walks down from the root, re-running the updated component and, by default, its descendants, while memoized subtrees bail out when their props are \`Object.is\`-equal. It computes the new state by applying the queued updates in order, reconciles the new elements against the current fiber tree by type and key, and collects DOM mutations. A concurrent render can be interrupted at this point.

During **commit**, React applies the DOM changes synchronously, attaches refs and runs layout effects. The browser paints, then passive effects (\`useEffect\`) run. And if the new state is \`Object.is\`-equal to the old, React can bail out before any of this.
`],
  ['Rendering', 'React has no fine-grained reactivity. Why is it still fast enough, and when isn\'t it?',
    `
Because a re-render is only a JS function call plus a diff of lightweight element objects, and the expensive part, DOM work, happens only where the output changed. On top of that, batching collapses updates, concurrent rendering keeps input responsive during heavy work, and the React Compiler skips unchanged subtrees. It struggles when very large trees re-render on high-frequency updates, such as typing in a big form or dragging, and when render functions are expensive. The fixes are state colocation, memoization, \`useDeferredValue\`, virtualisation, or an external store with selectors.
`],
  ['Components', 'How do keys affect component identity and state?',
    `
React matches children between renders by type and key. With the same type and key, the instance is reused along with its state, refs and DOM, whereas a different key means unmount and remount. That's why index keys are risky: they tie state to positions, so reordering moves state onto the wrong items. Stable data ids prevent this, and changing a key on purpose resets a component, as in \`<Form key={id}/>\`.
`],
  ['Components', 'How would you design a reusable Select that works with any item type?',
    `
As a generic component, \`Select<T>\`, with \`items: T[]\`, \`getKey\`, \`getLabel\`, and \`value\` / \`onChange\` typed by \`T\`. Beyond the types, it should be controlled with an optional uncontrolled default, accessible through a listbox or combobox pattern or a native \`<select>\`, and compositional, with render props or compound parts for custom options. Native props and \`ref\` pass through to the trigger. Ideally I'd build it on a headless library such as React Aria, Radix or Ariakit, so keyboard handling and a11y are already solved.
`],
  ['State', 'How would you structure state in a large app?',
    `
By ownership and lifetime, not by "global vs local". First, **server state**, usually most of it, goes in a server cache: TanStack Query, loaders or RSC. Second, **URL state** such as filters, tabs, selection and pagination goes in the router. Third, **local UI state** stays colocated in components, lifted only as far as needed. Fourth, **cross-cutting client state** such as the auth session, preferences or a complex editor goes in context when it changes rarely, or in an external store with selectors when it changes often and is widely read. Throughout, derive rather than duplicate, keep one source of truth per fact, use reducers for complex transitions, and put feature boundaries around providers.
`],
  ['State', 'Why is mutating state a bug, even when the UI seems to update?',
    `
Because React decides whether to re-render by reference equality, and a mutated object is still the same reference. So \`memo\`, \`useMemo\`, effect deps and bail-outs all treat it as unchanged, and the UI only appeared to update because something else triggered a render. Mutation also corrupts the previous render's snapshot, which breaks concurrent rendering, transitions and Strict Mode's double renders, and it makes behaviour depend on timing.
`],
  ['Events & forms', 'Controlled or uncontrolled for a 30-field settings form?',
    `
Mostly uncontrolled, because controlled inputs re-render the form on every keystroke and need a state field each. So use native inputs with \`defaultValue\`, read them through \`FormData\` in a form Action, and validate on submit or blur with native constraints plus a schema. Make a field controlled only where other UI depends on its live value. For field arrays, dirty tracking and richer validation, a form library such as React Hook Form, which is itself uncontrolled and ref-based, is the next step.
`],
  ['Events & forms', 'How do React events differ from native DOM events?',
    `
They're synthetic wrappers, dispatched by delegation from the root container and propagating through the React component tree, portals included. The handlers are props, and \`e.nativeEvent\` gives you the original. A few behaviours differ. \`onChange\` fires on every input, unlike the native \`change\` event. \`stopPropagation\` stops React propagation, but native listeners on ancestors may still see the event, depending on where they're attached. And returning \`false\` doesn't prevent the default, so call \`preventDefault()\`.
`],
  ['Effects', 'When is `useEffect` the right tool, and when is it a code smell?',
    `
It's right for synchronising with **external systems** keyed on props or state: subscriptions, timers, non-React widgets, imperative DOM APIs and analytics on visibility. It's a smell when it computes derived state, responds to a user event that belongs in the handler, resets state on a prop change where \`key\` would do, fetches without a race guard or cache, or chains state updates. The rule of thumb is that if there's no external system, there's no effect.
`],
  ['Effects', 'Explain stale closures with an example, and how you avoid them.',
    `
Each render's functions capture that render's props and state. So a \`setInterval(() => setCount(count + 1), 1000)\` created in an effect with \`[]\` deps sees \`count = 0\` forever. There are four ways out. First, an updater function, \`setCount(c => c + 1)\`. Second, a correct dependency array, so the effect re-subscribes when inputs change. Third, \`useEffectEvent\`, which reads the latest values in an effect callback without re-syncing. Fourth, for imperative code, a ref holding the latest value.
`],
  ['Performance', 'When do you use `memo`, `useMemo` and `useCallback`, and what changes with the React Compiler?',
    `
Without the compiler, after measuring, I use \`memo\` for expensive components that often re-render with the same props, such as list rows and charts. \`useCallback\` and \`useMemo\` then keep those components' props stable, cache expensive computations and stabilise effect deps. With the compiler most of this is automatic, so manual memoization comes out. What's left is code the compiler skips because it breaks the rules, identity for third-party libraries, and architectural fixes such as state colocation and virtualisation, which no compiler does for you.
`],
  ['Performance', 'A list of 5,000 issues stutters when typing in its filter. What do you do?',
    `
Profile first, then work through the fixes. First, keep the input responsive by applying the filter to the list through \`useDeferredValue\` or \`startTransition\`. Second, **virtualise** the list with TanStack Virtual so only visible rows render. Third, memoize rows with stable props, or let the compiler do it. Fourth, make the filter itself cheap, for example by precomputing lower-cased titles with \`useMemo\`. And if the data allows, move filtering to the server with debounced queries.
`],
  ['Architecture', 'Context vs an external store vs TanStack Query: how do you choose?',
    `
By where the data comes from and how often it changes. **Query** is for anything fetched from a server, because it brings caching, invalidation and background refresh. **Context** is for injecting dependencies and rarely changing tree-wide values such as the theme, the user or a client instance, since every consumer re-renders on change. **An external store** with selector subscriptions, like Zustand or Redux on \`useSyncExternalStore\`, is for frequently changing client state shared across distant components. They often combine: context provides a store, and components select from it.
`],
  ['Architecture', 'What is tearing, and how does React prevent it?',
    `
Tearing is when one render shows inconsistent versions of the same external data. A concurrent render yielded mid-way, the store changed in between, and so some components read the old value and some the new. \`useSyncExternalStore\` prevents it by checking snapshots during render and forcing a synchronous re-render if the store changed. React-managed state, \`useState\` and context, can't tear in the first place.
`],
  ['Hooks', 'Why do the Rules of Hooks exist?',
    `
Because React associates hook state with a component by **call order**, not by name. Calling hooks conditionally, in loops or after early returns changes that order between renders, so state is read from the wrong slot. The rules, top level only and only from components and hooks, keep the order stable. The lint plugin enforces them, and the Compiler relies on them.
`],
  ['Hooks', 'Design a `useFetch(url)` hook. Then tell me why you wouldn\'t ship it.',
    `
It holds \`{ data, error, status }\` in state, with an effect on \`[url]\` that resets to loading, fetches with an \`AbortController\` or an ignore flag cleaned up on change, and sets state on resolve or reject. I wouldn't ship it because of everything it lacks: caching and dedupe across components, background revalidation, invalidation after mutations, retries, pagination, SSR and Suspense integration, and ordering guarantees beyond the latest url. It also produces render-then-fetch waterfalls. TanStack Query, router loaders or RSC solve all of that.
`],
  ['Data', 'Explain stale-while-revalidate and query invalidation in TanStack Query.',
    `
A query's data becomes stale after \`staleTime\`, which is 0 by default. Stale data is still served instantly from the cache, while a background refetch fires on mount, window focus, reconnect or invalidation, and \`isFetching\` is true as the old data stays on screen. After a mutation, \`invalidateQueries({ queryKey })\` marks keys matching that prefix stale and refetches the active ones. That's how you keep views consistent without a normalised store.
`],
  ['Data', 'How does Suspense change data loading, and what are its pitfalls?',
    `
Components declare what they need and suspend until it's ready. The nearest \`<Suspense>\` shows a fallback and error boundaries handle failures, so loading and error UI move wherever you want them in the tree, and components get non-nullable data. There are four pitfalls. First, sequential suspenses cause **waterfalls**, so prefetch in loaders or use parallel queries. Second, promises must be cached, not created during render. Third, fallbacks can flash, so make updates transitions. Fourth, you need error boundaries that reset, such as \`QueryErrorResetBoundary\`.
`],
  ['Routing', 'Where should filter, sort and pagination state live, and why?',
    `
In the URL search params, as the single source of truth. That makes them shareable, bookmarkable and reload-safe, Back and Forward work, they're server-renderable, and loaders can read them before render, so nothing flashes. Read them with \`useSearchParams\` and validate them, because the URL is user input. Write them through navigation, and don't copy them into \`useState\`.
`],
  ['Routing', 'Compare React Router loaders with Ember route model hooks.',
    `
Both fetch before the route renders and feed the component, and both support redirects and error substates. The differences start with timing: loaders for all matched routes run **in parallel**, whereas Ember resolves parent models first. There are no controllers, so query params are plain \`URLSearchParams\`. There are no default loading substates either; the old UI stays while \`useNavigation()\` reports pending. Errors bubble to the nearest \`errorElement\`. And loaders re-run after actions or on navigation, which pairs well with a query cache for client-side caching.
`],
  ['Concurrent', 'What are transitions, and when would you use one?',
    `
They're updates marked as non-urgent with \`startTransition\` or \`useTransition\`. React can interrupt them for urgent input, and it doesn't replace visible content with Suspense fallbacks while they run. So use them for tab switches, navigations, filtering large lists, or any update that renders heavily or suspends, and the current UI stays interactive with an \`isPending\` hint. In React 19 they can also be async, which makes them Actions.
`],
  ['Concurrent', 'How do Actions, `useActionState` and `useOptimistic` fit together?',
    `
An Action is an async function run inside a transition, either as a form \`action\` or through \`startTransition(async…)\`. The hooks layer onto it. \`useActionState\` wraps the Action, exposing the last result as state plus \`isPending\`, and queues submissions. \`useFormStatus\` exposes pending to the form's children. \`useOptimistic\` shows a temporary value while the Action is pending, which disappears when it settles, so failure rolls back automatically. Together they replace manual loading, error and optimistic plumbing, and they work with Server Functions too.
`],
  ['Server', 'Explain the server/client boundary in React Server Components.',
    `
Server components run only on the server, so they can be async, access server resources and ship no JS. \`'use client'\` marks the module where the client graph starts: it and everything it imports are bundled for the browser, still SSR'd, then hydrated. Props crossing that boundary must be serialisable, so functions can't cross unless they're Server Function references, although server components can be passed into client components as \`children\`. You design the boundary to keep heavy, non-interactive code on the server and push interactivity to the leaves.
`],
  ['Server', 'How would you protect a Server Function?',
    `
Treat it as a public HTTP endpoint, because it is one. First, authenticate the session inside the function and authorise per resource, rather than relying on the UI hiding the button. Second, validate and parse every argument with a schema, since FormData is untrusted. Third, don't leak internals in errors, and rate-limit where needed. Finally, remember that closure-captured values travel to the client and back, encrypted in Next.js, so don't capture secrets.
`],
  ['Testing', 'How do you test a React app, and how is that different from Ember?',
    `
Mostly at the component level, with Testing Library and userEvent querying by role and label, MSW mocking the network, fresh providers such as a QueryClient and memory router per test, and async assertions through \`findBy\`/\`waitFor\`. A thin layer of Playwright end-to-end tests sits on top. Three things differ from Ember. There's no global \`settled()\`, so you wait for the expected outcome. There's no container or owner, so you compose providers. And component, integration and acceptance tests blur together, because rendering a route tree is just rendering components.
`],
  ['Testing', 'A test passes locally but fails on CI one time in twenty. How do you approach it?',
    `
First, reproduce it under stress with \`--repeat\`, CPU throttling or \`--sequence.shuffle\`. Then look for the usual suspects: un-awaited userEvent or \`findBy\` calls, fixed sleeps, state shared between tests (a module singleton, a reused QueryClient, unrestored fake timers or mocks, leaking listeners), dependence on wall-clock time or timezones, and assertions that race background refetches. The fix is to replace sleeps with outcome-based waits, isolate state per test, and make time and data deterministic.
`],
  ['Patterns', 'Compound components vs a config-object API: trade-offs?',
    `
It's control against simplicity. A **config** API (\`<Tabs items=[…]>\`) is concise and easy to validate and type, but rigid, because every customisation becomes a new prop. **Compound components** (\`<Tabs><Tabs.Tab/>…\`) give callers control over markup, ordering and wrappers with less prop bloat. In exchange they need context plumbing, are looser about invalid structures, and are harder to iterate over, since you can't easily inspect children. So libraries often offer both: compound primitives with a convenience config wrapper.
`],
  ['Patterns', 'What does `<Activity>` give you over conditional rendering?',
    `
Hidden-but-mounted UI, whereas conditional rendering destroys and recreates. State and DOM survive, so form drafts and scroll positions do too. Effects are torn down while hidden and restored when visible. And hidden content pre-renders at low priority, so the next tab can render before you click it. The costs are memory for hidden trees and effects that must clean up properly, which Strict Mode already checks.
`],
  ['Migration', 'How would you migrate an Ember app to React incrementally?',
    `
With the strangler pattern, by route or by leaf. First, stand up a React build next to Ember, sharing design tokens and an API client. Second, mount React "islands" inside Ember: a component or modifier calls \`createRoot(element).render(<Widget {...args}/>)\`, passes args as props and callbacks for actions, and unmounts in \`willDestroy\`. Third, bridge state, starting with server data through a shared TanStack Query client or the same REST/GraphQL API rather than ember-data, and bridge auth and session explicitly. Fourth, once the leaves are done, migrate whole routes, ideally behind a top-level router that delegates unknown routes to Ember, or a reverse proxy that splits by path. Fifth, port tests with the features, using Testing Library for components and Playwright across both. Throughout, avoid a big-bang rewrite and two-way state sync between the frameworks, and keep a running list of what's left.
`],
  ['Migration', 'Which Ember instincts are most dangerous in React?',
    `
The worst is **mutating state** and expecting the UI to follow, which is the \`@tracked\` habit. Close behind it:

- Expecting fine-grained updates, being surprised that children re-render, then over- or under-memoizing.
- Treating \`useEffect\` like \`didInsert\` or an observer, and syncing state with state.
- Expecting a DI container. Services become context, which isn't a store and re-renders every consumer.
- Reading a value right after setting it, when state is a snapshot.
- Waiting for \`settled()\` in tests instead of for outcomes.
- Assuming the framework owns data, as ember-data did, when React leaves server state to a library.
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
