import { C, Day } from './model.mjs';

export const DAY1 = Day({
  n: 1, week: 1,
  title: 'JSX, components, rendering',
  tagline: 'There is no autotracking: a component is a function that React calls again whenever anything upstream might have changed.',
  concepts: [
    C('r', 'Components are functions, re-run on every render',
      `
In Glimmer, reading a \`@tracked\` field during render registers a dependency, so only the parts that read it update. React tracks nothing. Instead, when state changes, React **calls your component function again**, top to bottom, along with every child it renders unless they opt out. It then diffs the new element tree against the previous one and commits the minimal DOM changes.

So UI = f(props, state), and a render is a function call plus a diff rather than DOM work. Because your function will run many times, keep it pure: no side effects, no mutation, and the same output for the same inputs.

A component re-renders when **its state changes**, **its parent re-renders** or **a context it reads changes**. New props aren't a separate trigger, because they only arrive when the parent renders.
`,
      `
// issue-card.gjs
export default class IssueCard extends Component {
  // Re-evaluated only when @issue.priority changes
  get isUrgent() {
    return this.args.issue.priority === 'urgent';
  }

  <template>
    <h3>{{@issue.title}}</h3>
    {{#if this.isUrgent}}🔥{{/if}}
  </template>
}
`,
      `
// IssueCard.tsx
export function IssueCard({ issue }: { issue: Issue }) {
  // Recomputed on EVERY render. That's fine: it's cheap.
  const isUrgent = issue.priority === 'urgent';

  return (
    <>
      <h3>{issue.title}</h3>
      {isUrgent && '🔥'}
    </>
  );
}
`),
    C('y', 'JSX is JavaScript, not a template language',
      `
JSX compiles to \`jsx(type, props)\` calls, so anything that works in an expression works in \`{}\`. Attribute *names* follow the DOM properties, which is why you write \`className\` and \`htmlFor\`. There are no block helpers:

- \`{{#if}}\` → \`cond && <X/>\`, a ternary, or an early \`return\`
- \`{{#each}}\` → \`array.map(item => <Li key={item.id} …/>)\`
- \`{{else}}\` → the other branch of the ternary
- \`{{!-- --}}\` → \`{/* */}\`

What you lose is Glimmer's compile-time knowledge of which parts are static, and the React Compiler (Day 6) exists partly to win that back.
`,
      `
<ul class="issues">
  {{#each @issues key="id" as |issue|}}
    <li class={{if issue.done "done"}}>
      {{issue.title}}
    </li>
  {{else}}
    <li>No issues</li>
  {{/each}}
</ul>
`,
      `
<ul className="issues">
  {issues.length === 0 ? (
    <li>No issues</li>
  ) : (
    issues.map((issue) => (
      <li key={issue.id} className={issue.done ? 'done' : undefined}>
        {issue.title}
      </li>
    ))
  )}
</ul>
`),
    C('r', 'The `0 &&` trap',
      `
\`a && b\` evaluates to \`a\` when \`a\` is falsy. React renders nothing for \`false\`, \`null\` and \`undefined\`, but it **renders numbers**, including \`0\`, so \`{labels.length && <Labels/>}\` prints a literal **0** when the list is empty.

This one bites Ember developers in particular, because \`{{#if}}\` treats \`0\` as falsy and renders nothing. Always give \`&&\` a boolean (\`labels.length > 0 &&\`, \`!!count &&\`) or use a ternary.
`,
      `
{{!-- Empty array is falsy in {{#if}}: renders nothing --}}
{{#if @issue.labels.length}}
  <p>Labels: {{join ", " @issue.labels}}</p>
{{/if}}
`,
      `
{/* ❌ renders "0" for an empty array */}
{issue.labels.length && <p>Labels: {issue.labels.join(', ')}</p>}

{/* ✅ */}
{issue.labels.length > 0 && <p>Labels: {issue.labels.join(', ')}</p>}
`),
    C('g', 'Plain functions replace helpers',
      `
There's no helper registry and no resolver: a helper is just a function you import. Hoist expensive setup, like an \`Intl.DateTimeFormat\`, to module scope so it isn't rebuilt on every render.
`,
      `
// app/helpers/format-date.js
import { helper } from '@ember/component/helper';
const fmt = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeZone: 'UTC' });
export default helper(([iso]) => fmt.format(new Date(iso)));

{{format-date @issue.createdAt}}
`,
      `
// formatDate.ts
const fmt = new Intl.DateTimeFormat('en-US', {
  month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC',
});
export const formatDate = (iso: string) => fmt.format(new Date(iso));

<time dateTime={issue.createdAt}>{formatDate(issue.createdAt)}</time>
`, { emberLang: 'javascript' }),
    C('g', 'Fragments',
      `
Glimmer templates can have several top-level nodes, so you've never needed this. A React component returns **one** node, so to return siblings without a wrapper \`<div>\` you use \`<>…</>\`, or \`<Fragment key={id}>\` when the fragment needs a key in a list.
`,
      `
<template>
  <dt>{{@term}}</dt>
  <dd>{{@definition}}</dd>
</template>
`,
      `
function Entry({ term, definition }: Props) {
  return (
    <>
      <dt>{term}</dt>
      <dd>{definition}</dd>
    </>
  );
}
`),
  ],
  exercise: {
    files: [
      'exercises/day01/StatusBadge.tsx',
      'exercises/day01/IssueCard.tsx',
      'exercises/day01/formatDate.ts',
    ],
    command: 'pnpm test day01',
    criteria: [
      '`StatusBadge` renders the status label in a `<span>` with classes `badge badge--{status}`.',
      '`IssueCard` is an `<article>` labelled by its `<h3>` title (`aria-labelledby`).',
      'Urgent issues show `🔥 Urgent`; other priorities show just the label.',
      'The assignee name is shown, or `Unassigned` when there is none.',
      'A `Labels: bug, auth` line appears only when there are labels, with **no stray 0**.',
      'Dates render as `<time dateTime="…">Oct 1, 2026</time>` (UTC).',
    ],
    stretch: 'Render each label as its own `<span className="label">` chip (with keys), and add a `compact` prop that hides the assignee and date. Keep the tests green.',
  },
  drill: [
    ['What triggers a re-render?',
      `
Three things: the component's **own state changes** (a \`useState\`/\`useReducer\` setter called with a new value), **its parent re-renders**, or **a context it consumes changes**. "Props changed" isn't a separate trigger, because props only change when the parent renders, and a child re-renders with its parent whether or not its props changed, unless it's wrapped in \`memo\`.
`],
    ['What is the difference between render and commit?',
      `
**Render** is React calling your components to get a new element tree and diffing it against the previous one. It's pure, has no DOM access and, in concurrent mode, can be interrupted, restarted or thrown away. **Commit** applies the diff to the DOM, runs layout effects and then, usually after paint, passive effects. Because a render may never be committed, side effects belong in event handlers or effects, never in render.
`],
    ['Why `className` and not `class`?',
      `
JSX attribute **names** follow DOM properties, not HTML attributes: \`className\` because the property is \`element.className\` (\`class\` was a reserved word in early JS), and \`htmlFor\` because of \`label.htmlFor\`. React still writes most of them to the DOM as attributes. For custom elements, React 19 sets a prop as a property when the element defines one, and as an attribute otherwise.
`],
    ['How do JSX and Glimmer templates differ in what the compiler knows?',
      `
Glimmer templates are a restricted language, so at build time the compiler knows which parts are static and emits opcodes that update only the dynamic bits, driven by autotracking. JSX, by contrast, is arbitrary JavaScript. To the compiler \`jsx('div', props)\` is an opaque function call, which is why React has to re-run the component and diff at runtime. The React Compiler closes that gap: assuming your components follow the rules of React, it analyses them and auto-memoizes values and JSX.
`],
    ['What does `{0 && <X/>}` render?',
      `
The text **"0"**. \`&&\` returns its left operand when that operand is falsy, and React renders numbers (including \`0\` and \`NaN\`) but skips \`false\`, \`null\`, \`undefined\` and \`true\`. Fix it with a real boolean: \`{count > 0 && <X/>}\`.
`],
  ],
});

export const DAY2 = Day({
  n: 2, week: 1,
  title: 'Props, children, composition, lists & keys',
  tagline: 'Args become props and blocks become children, but keys are where Ember instincts quietly fail.',
  concepts: [
    C('g', 'Args → props',
      `
Props are the one argument to your function, so destructure them in the signature and give defaults there. There's no \`this.args\` proxy, no \`@\` sigil and no distinction between "args" and HTML attributes: everything is a prop, and \`{...rest}\` takes the place of \`...attributes\`.
`,
      `
<IssueCard @issue={{this.issue}} @compact={{true}} class="mb-2" />

// inside
{{@issue.title}}  <div ...attributes>
`,
      `
<IssueCard issue={issue} compact className="mb-2" />

function IssueCard({ issue, compact = false, ...rest }: Props) {
  return <div {...rest}>{issue.title}</div>;
}
`),
    C('g', '`{{yield}}` → `children`',
      `
Whatever you nest inside a component arrives as \`props.children\`, typed \`ReactNode\`, and you render it wherever the yield would go.
`,
      `
<Card @title="Bugs">
  <IssueList @issues={{this.bugs}} />
</Card>

{{!-- card.hbs --}}
<section><h2>{{@title}}</h2>{{yield}}</section>
`,
      `
<Card title="Bugs">
  <IssueList issues={bugs} />
</Card>

function Card({ title, children }: { title: string; children: ReactNode }) {
  return <section><h2>{title}</h2>{children}</section>;
}
`),
    C('y', 'Named blocks → ReactNode props',
      `
There's no named-block syntax, because a "slot" is just a prop whose value is JSX. That's more flexible than a named block, since you can compute it, pass it down or default it, and \`(has-block "footer")\` becomes a plain truthiness check.
`,
      `
<Card>
  <:actions><button>Add</button></:actions>
  <:default>…</:default>
  <:footer>4 issues</:footer>
</Card>

{{#if (has-block "footer")}}<footer>{{yield to="footer"}}</footer>{{/if}}
`,
      `
<Card actions={<button>Add</button>} footer="4 issues">
  …
</Card>

{footer && <footer>{footer}</footer>}
`),
    C('y', 'Block params → render props',
      `
\`{{yield issue index}}\` hands data back to the caller's block. The React equivalent is a **function prop** that returns JSX: the child calls it with data, and the caller decides the markup. Hooks now cover reusable logic, so render props survive mainly where the data comes from the *child's render*, such as list items or virtualised rows.
`,
      `
<IssueList @issues={{this.issues}} as |issue index|>
  <strong>{{index}}. {{issue.title}}</strong>
</IssueList>
`,
      `
<IssueList
  issues={issues}
  renderItem={(issue, index) => (
    <strong>{index}. {issue.title}</strong>
  )}
/>
`),
    C('r', 'Keys are identity, not a performance hint',
      `
React matches old and new children by **type + key**, and when the key matches it **reuses the component instance**, along with its state, refs and DOM nodes. So with \`key={index}\`, reordering a list keeps instance #0 at position 0 and hands it *different data*, leaving any local state (a typed input, an open dropdown, a focused element) next to the wrong item.

Use a stable id from the data instead. The flip side is useful too: changing a component's \`key\` on purpose is how you **reset** its state, because React unmounts it and mounts a fresh one.
`,
      `
{{!-- key="id" helps Glimmer reuse DOM; state lives in
     tracked objects, not in the list position --}}
{{#each @issues key="id" as |issue|}}
  <IssueNote @issue={{issue}} />
{{/each}}
`,
      `
{/* ❌ notes "jump" between issues on reorder */}
{issues.map((issue, i) => <IssueNote key={i} issue={issue} />)}

{/* ✅ identity follows the data */}
{issues.map((issue) => <IssueNote key={issue.id} issue={issue} />)}

{/* reset all form state when the issue changes */}
<EditIssueForm key={issue.id} issue={issue} />
`),
    C('y', 'Props are read-only; composition over configuration',
      `
Data flows down and changes flow up through callback props, which is DDAU, just enforced harder. In development React freezes the props object, so assigning to a prop throws in strict-mode code (which every ES module is). Nested objects aren't frozen, so mutating \`props.issue.title\` slips through, but it's just as wrong.

Prefer composition to configuration: rather than \`<Card showHeader headerTitle headerIcon …>\`, accept \`header={<CardHeader …/>}\` or \`children\`. It's also the first fix for prop drilling, before you reach for context.
`,
      `
{{!-- data down, actions up --}}
<IssueRow @issue={{issue}} @onSelect={{this.select}} />
`,
      `
<IssueRow issue={issue} onSelect={select} />

// inside: call it, never assign to props
<button onClick={() => onSelect(issue.id)}>Select</button>
`),
  ],
  exercise: {
    files: [
      'exercises/day02/Card.tsx',
      'exercises/day02/IssueList.tsx',
      'exercises/day02/IssueNotes.tsx',
    ],
    command: 'pnpm test day02',
    criteria: [
      '`Card` renders a `<section>` labelled by its title, with `children` in the body.',
      '`actions` and `footer` slots render in their wrappers **only** when given.',
      '`IssueList` renders titles by default, or `renderItem(issue, index)` when given.',
      'An empty list shows `emptyState`, or the default "No issues".',
      '**Bug hunt:** in `IssueNotes`, a note typed for one issue must stay with that issue after the list is reordered.',
    ],
    stretch: 'Give `IssueList` a generic signature, `IssueList<T extends { id: string }>`, so it works for users as well as issues. (The full treatment of generic components comes on Day 14.)',
  },
  drill: [
    ['Why not use the array index as a key?',
      `
A key is how React decides which **component instance**, with its state and DOM, lines up with which item between renders. With index keys, inserting, removing or reordering items shifts the data under the existing instances, so state, focus, uncontrolled input values and animations stay at the old *positions*. Index keys are only safe for static lists that never reorder and whose items have no state.
`],
    ['How do you reset a component\'s state?',
      `
Change its \`key\`. A different key means a different identity, so React unmounts the old instance and mounts a fresh one with initial state. That makes \`<ProfileForm key={userId} />\` the idiomatic way to reset a form when the entity changes, and far better than an effect that resets each field.
`],
    ['Render props vs children vs hooks: when would you use each?',
      `
Use **children** or ReactNode props when the parent just decides *what* goes in a slot. Use a **render prop** when the child owns data that the caller should turn into markup, such as list items, virtualised rows or a headless select's options. Use a **hook** when you want to reuse *stateful logic* with no opinion about markup. Hooks replaced most render props and HOCs for sharing logic, which leaves render props for per-item rendering.
`],
    ['What is prop drilling, and what fixes it?',
      `
It's passing a prop through intermediate components that don't use it, just to reach a deep child. The first fix is **composition**: pass the deep child down as \`children\` or an element prop, so the layers in between never see the data. Next comes **context** for genuinely tree-wide values (theme, current user, a store), and then an **external store** with selectors. Don't reach for context just to save typing.
`],
  ],
});

export const DAY3 = Day({
  n: 3, week: 1,
  title: 'State: useState, immutability, derived state',
  tagline: 'Mutation is invisible to React: state is a snapshot, setters schedule a new render, and derived values belong in render.',
  concepts: [
    C('r', '`@tracked` mutation → immutable replacement',
      `
Autotracking notices \`this.issue.status = 'done'\` because the setter is instrumented. React instruments nothing: it compares the new state with the old using \`Object.is\`, and a mutated object is the **same reference**, so React sees no change and nothing re-renders. Worse, other code holding that object now sees a change that was never rendered.

So instead of mutating, you replace: a new array, a new object for the item that changed, and the same references for everything else, which is what later lets \`memo\` skip work.
`,
      `
class Board {
  @tracked issues = [];

  @action toggleDone(issue) {
    issue.status = issue.status === 'done' ? 'todo' : 'done';
    this.issues = [...this.issues]; // or TrackedArray
  }
}
`,
      `
const [issues, setIssues] = useState(initialIssues);

function toggleDone(id: string) {
  setIssues((prev) =>
    prev.map((issue) =>
      issue.id === id
        ? { ...issue, status: issue.status === 'done' ? 'todo' : 'done' }
        : issue,
    ),
  );
}
`, { emberLang: 'javascript' }),
    C('r', 'State is a snapshot per render',
      `
\`count\` is a \`const\` captured by the closure of *this* render, so \`setCount(count + 1)\` can't change it. The setter schedules a re-render instead, and only in that **next** render, when your function runs again, does \`useState\` return the new value. That's why logging right after the setter prints the old value, the single most common "React is broken" moment for people coming from mutable models.
`,
      `
@tracked count = 0;

@action inc() {
  this.count = this.count + 1;
  console.log(this.count); // 1, immediately
}
`,
      `
const [count, setCount] = useState(0);

function inc() {
  setCount(count + 1);
  console.log(count); // still 0: this render's snapshot
}
`, { emberLang: 'javascript' }),
    C('y', 'Batching',
      `
React batches every state update made in the same tick, whether in an event handler, a timeout or a promise, into **one** re-render, so ten setter calls produce one render. Ember coalesces through the runloop too, but there you can read the new value straight away, whereas here you can't (see the previous section). \`flushSync\` forces a synchronous commit, though you'll rarely need it.
`,
      `
@action reset() {
  this.title = '';
  this.priority = 'medium'; // one re-render via the runloop
}
`,
      `
function reset() {
  setTitle('');
  setPriority('medium'); // one re-render, batched
}
`, { emberLang: 'javascript' }),
    C('g', 'Updater functions',
      `
When the next state depends on the previous one, pass a function: \`setCount(c => c + 1)\`. React queues the updaters and runs them in order against the latest state, so calling it twice adds 2. Calling \`setCount(count + 1)\` twice adds only 1, because both calls read the same snapshot.
`,
      `
@action addTwo() {
  this.points += 1;
  this.points += 1; // 2: reads the live value
}
`,
      `
function addTwo() {
  setPoints((p) => p + 1);
  setPoints((p) => p + 1); // 2: each updater sees the queued result
}
`, { emberLang: 'javascript' }),
    C('g', 'Derived state = compute during render',
      `
A filtered list, a count or a "Showing X of Y" are **getters**, not state, so compute them in the component body. Mirroring props or other state into \`useState\` + \`useEffect\` costs an extra render and a frame of stale UI, and it's a sync bug waiting to happen. Reach for \`useMemo\` only when the computation is measurably expensive.
`,
      `
@tracked filter = 'all';

get visible() {
  return this.args.issues.filter(
    (i) => this.filter === 'all' || i.status === this.filter,
  );
}
`,
      `
const [filter, setFilter] = useState<Filter>('all');

// derived: no state, no effect
const visible = issues.filter(
  (i) => filter === 'all' || i.status === filter,
);
`, { emberLang: 'javascript' }),
    C('y', 'Lazy initial state',
      `
\`useState(expensive())\` calls \`expensive()\` on **every render** and throws the result away after the first. Pass the function instead, \`useState(() => expensive())\`, and React calls it only once, on mount. The same idea explains the \`initial…\` naming convention for props (\`initialIssues\`): it signals "read once, then owned locally".
`,
      `
// constructor runs once per instance
constructor() {
  super(...arguments);
  this.draft = JSON.parse(localStorage.draft ?? '""');
}
`,
      `
// ❌ parses on every render
const [draft, setDraft] = useState(JSON.parse(localStorage.draft ?? '""'));

// ✅ parses once
const [draft, setDraft] = useState(() => JSON.parse(localStorage.draft ?? '""'));
`, { emberLang: 'javascript' }),
  ],
  exercise: {
    files: [
      'exercises/day03/IssueBoard.tsx',
    ],
    command: 'pnpm test day03',
    criteria: [
      'Status filter buttons (`aria-pressed`) and a case-insensitive search filter the list together, **derived during render** with no extra state.',
      '"Showing X of Y" reflects the derived list.',
      '`toggleDone` works on deep-frozen data: an immutable update, no mutation.',
      '"+2 points" adds 2. Fix it inside `addPoint` without changing the `onClick`.',
    ],
    stretch: 'Add a "Sort by estimate" toggle. Sorting is derived too, but remember that `.sort()` mutates: use `toSorted()`.',
  },
  drill: [
    ['Why must React state be treated as immutable?',
      `
Because React detects changes by **reference** (\`Object.is\`), and a mutated object keeps its reference, so React bails out and the UI doesn't update. Immutability also keeps each render a consistent snapshot, which concurrent rendering needs because a render can be paused or discarded. It makes \`memo\` and \`useMemo\` comparisons cheap and correct, too, and lets features like transitions and undo keep older versions around.
`],
    ['What does `console.log(count)` print right after `setCount(count + 1)`?',
      `
The **old** value. \`count\` is a constant captured by this render's closure, and the setter only schedules a new render, so the new value appears when your component function runs again. If you need it straight away, compute it into a local first: \`const next = count + 1; setCount(next); use(next)\`.
`],
    ['What is batching?',
      `
React groups all the state updates triggered in the same tick into a single re-render and commit, so several setters still produce one render. Since React 18 this covers timeouts, promises and native handlers as well as React events. You can opt out with \`flushSync\`, though that's rarely needed, for example before measuring the DOM.
`],
    ['When should you use an updater function?',
      `
Whenever the next state is computed from the previous one: counters, toggles and appending to arrays. It matters most when several updates might be queued in one tick, or when the setter runs inside a stale closure such as a timer or subscription, because \`set(prev => …)\` always operates on the latest queued value.
`],
    ['Derived state vs `useEffect` + `setState`?',
      `
Derive it. An effect that sets state from props or other state causes a second render, so the first one shows stale data, and it can drift out of sync and is harder to follow. Compute the value in render, adding \`useMemo\` only if it's expensive, and keep effects for syncing with *external* systems rather than with other React state.
`],
    ['How is this different from `@tracked`?',
      `
\`@tracked\` gives you **fine-grained, mutable** reactivity: you mutate a field, Glimmer knows exactly which template bits read it, and the new value is readable straight away. React state is **coarse and immutable**: you replace values, the *whole component* re-renders and diffs, and the new value only appears in the next render's snapshot. The precision moves from the framework to you, through memoization and where you place state.
`],
  ],
});

export const DAY4 = Day({
  n: 4, week: 1,
  title: 'Events & forms: controlled vs uncontrolled, refs',
  tagline: 'An input\'s value is owned either by React or by the DOM, so choose deliberately.',
  concepts: [
    C('y', '`{{on "click"}}` → `onClick`',
      `
Handlers are camelCase props that take a function, and they receive **synthetic events**: React attaches one listener per event type at the root container and dispatches through the *React* tree. The event object is a cross-browser wrapper, unpooled since React 17. One surprise: \`onChange\` on inputs fires on **every keystroke**, like the native \`input\` event, not on blur.
`,
      `
<button {{on "click" (fn this.select @issue.id)}}>Select</button>
<input {{on "input" this.updateTitle}} />
`,
      `
<button onClick={() => select(issue.id)}>Select</button>
<input onChange={(e) => setTitle(e.target.value)} />
`),
    C('g', '`preventDefault` and real forms',
      `
As in Ember, call \`event.preventDefault()\` in \`onSubmit\` to stop the full-page post. Prefer a real \`<form>\` with a submit button over a click handler on a div, because it gives you Enter-to-submit, a11y and \`FormData\` for free. (On Day 11, \`<form action={fn}>\` handles all of this for you.)
`,
      `
<form {{on "submit" this.save}}>…</form>

@action save(event) {
  event.preventDefault();
}
`,
      `
<form onSubmit={save}>…</form>

function save(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();
}
`),
    C('y', 'Controlled vs uncontrolled inputs',
      `
**Controlled** inputs use \`value={state}\` + \`onChange\`, so React state is the single source of truth and the component re-renders on every keystroke. Use them for live validation, character counters, dependent fields and formatting as you type.

**Uncontrolled** inputs take a \`defaultValue\` and let the DOM keep the value, which you read on submit with \`new FormData(form)\` or through a ref. That's less code and fewer renders, and it suits simple forms and React 19 Actions.

Mixing the two is a bug. \`value\` without \`onChange\` makes the input read-only, and switching between \`undefined\` and a string triggers the "changing an uncontrolled input to be controlled" warning.
`,
      `
{{!-- one-way value + input handler --}}
<input value={{this.title}} {{on "input" this.updateTitle}} />
<span>{{this.title.length}}/80</span>
`,
      `
// controlled
<input value={title} onChange={(e) => setTitle(e.target.value)} />
<span>{title.length}/80</span>

// uncontrolled
<input name="q" defaultValue="" />
// on submit: new FormData(e.currentTarget).get('q')
`),
    C('y', '`useRef` for DOM access',
      `
\`useRef\` returns a mutable box, \`{ current }\`, that survives renders and **doesn't trigger a render when it changes**. Pass it as \`ref={inputRef}\` and React sets \`current\` to the DOM node after commit, ready for you to focus, measure, scroll or reset an uncontrolled input. Don't read refs during render, though: they're unset on the first render and sit outside React's data flow.

Where Ember hands the element to a modifier, React 19 has the closer match of **ref callbacks with cleanup**: \`ref={el => { setup(el); return () => teardown(); }}\`.
`,
      `
// modifiers/autofocus.js
export default modifier((element) => {
  element.focus();
});

<input {{autofocus}} />
`,
      `
const inputRef = useRef<HTMLInputElement>(null);

<input ref={inputRef} />

// later, in a handler or effect
inputRef.current?.focus();
`, { emberLang: 'javascript' }),
    C('g', 'Labels and a11y',
      `
Wrap the control in a \`<label>\`, or link the two with \`htmlFor\` + \`id\`, using \`useId()\` for unique ids rather than \`Math.random()\`. Screen readers and Testing Library's \`getByLabelText\` both depend on it. Put errors in an element with \`role="alert"\` so they're announced.
`,
      `
<label for={{this.id}}>Title</label>
<input id={{this.id}} />
`,
      `
const id = useId();
<label htmlFor={id}>Title</label>
<input id={id} />

// or simply
<label>Title <input /></label>
`),
  ],
  exercise: {
    files: [
      'exercises/day04/NewIssueForm.tsx',
      'exercises/day04/QuickSearch.tsx',
    ],
    command: 'pnpm test day04',
    criteria: [
      '`NewIssueForm` is fully controlled: a live `n/80` counter, Priority defaults to Medium, and Assignee offers "Unassigned" (`""`) plus each user.',
      'A title under 3 characters (trimmed) shows `role="alert"` "Title must be at least 3 characters" and does not submit.',
      'Valid submit calls `onCreate` with a normalised `NewIssue` (trimmed title, `assigneeId: null` when unassigned, labels split, trimmed and filtered), then resets every field.',
      '`QuickSearch` is uncontrolled: a `role="search"` form read with `FormData`, Enter submits, Escape clears the input through a ref.',
    ],
    stretch: 'Make `NewIssueForm` autofocus its title input using a ref callback, and move focus to the error message when validation fails.',
  },
  drill: [
    ['Controlled vs uncontrolled inputs: trade-offs, and when to use each?',
      `
With **controlled** inputs (\`value\` + \`onChange\`), React state always mirrors the input, which allows instant validation, derived UI, programmatic resets and input masking, at the cost of a render per keystroke and more code. With **uncontrolled** inputs (\`defaultValue\`, read via \`FormData\` or a ref), the DOM owns the value, so they're simpler, render less, and work with progressive enhancement and React 19 form Actions. Use controlled when other UI depends on the value as it changes; otherwise uncontrolled is fine, and often preferable.
`],
    ['What is a synthetic event?',
      `
It's React's cross-browser wrapper around a native event, with a consistent interface (\`target\`, \`currentTarget\`, \`preventDefault\`, \`stopPropagation\`). React delegates, attaching one native listener per event type to the root container and dispatching through the **React component tree**, which is why events from portals bubble to their React parents. \`e.nativeEvent\` gives you the original.
`],
    ['`useRef` vs `useState`?',
      `
Both persist across renders, but they behave differently when they change. Changing **state** schedules a re-render, and the value is a per-render snapshot, whereas changing a **ref** (\`ref.current = x\`) is a silent mutation: no render, and visible immediately. So use state for anything that affects output, and refs for DOM nodes, timer ids, previous values and other instance-like data that render doesn't read.
`],
    ['Why avoid reading the DOM (or refs) during render?',
      `
Render must be pure, and it may run without ever committing (in Strict Mode, concurrent rendering or Suspense retries). On the first render the DOM doesn't exist yet, so \`ref.current\` is \`null\`, and later the DOM reflects the *previous* commit rather than the one you're computing. Read it after commit instead, in effects, layout effects or event handlers.
`],
  ],
});

export const DAY5 = Day({
  n: 5, week: 1,
  title: 'Effects: synchronising with external systems',
  tagline: '`useEffect` is not `didInsert`: it keeps something outside React in sync with your props and state, and most code that reaches for it doesn\'t need it.',
  concepts: [
    C('y', '`useEffect` synchronises with the outside world',
      `
An effect says: *once this render has committed, make the outside world (a subscription, a timer, a socket, a non-React widget) match these values*. When the values change, React tears down the old sync and sets up a new one, so think in terms of **starting and stopping synchronisation** rather than "on mount" and "on update". If that sounds like a modifier, it is the closest Ember analogue: a function modifier also returns its teardown (class modifiers use \`registerDestructor\`), and it also re-runs when its arguments change.
`,
      `
// modifiers/subscribe.js
export default modifier((el, [channel, onMessage]) => {
  const unsubscribe = issueEvents.subscribe(channel, onMessage);
  return unsubscribe; // teardown
});

<ul {{subscribe @channel this.onMessage}}></ul>
`,
      `
useEffect(() => {
  const unsubscribe = issueEvents.subscribe(channel, onMessage);
  return unsubscribe; // cleanup: before re-run and on unmount
}, [channel]);
`, { emberLang: 'javascript' }),
    C('y', 'The dependency array',
      `
The dependency array lists **every reactive value the effect reads**: props, state and anything derived from them. It isn't a "run when X changes" knob to tune by hand, which is why the \`react-hooks/exhaustive-deps\` lint rule, not intuition, is the source of truth. Omit the array and the effect runs after every render; pass \`[]\` and it runs once per mount, which is only correct when it genuinely reads nothing reactive. When a dependency changes too often, such as an inline object or function, fix the **value**: move it inside the effect, memoize it, or read it through an Effect Event. Never lie in the array.
`,
      `
{{!-- modifier re-runs when its args change --}}
<div {{chart @data @options}}></div>
`,
      `
useEffect(() => {
  const chart = new Chart(el.current!, { data, options });
  return () => chart.destroy();
}, [data, options]); // everything the effect reads
`),
    C('y', 'Cleanup, and the Strict Mode double-invoke',
      `
Return a function from the effect and React calls it **before the next run** and **on unmount**. Without it, intervals keep ticking, listeners stack up and sockets leak.

To prove that your cleanup really undoes your setup, \`<StrictMode>\` deliberately mounts, unmounts and remounts every component in development, so each effect runs setup → cleanup → setup. The check pays off beyond Strict Mode, because \`<Activity>\` and Fast Refresh hide and restore components in the same way. So if the double run breaks something, the bug is in your effect, not in Strict Mode.
`,
      `
export default modifier(() => {
  const id = setInterval(tick, 60_000);
  return () => clearInterval(id);
});
`,
      `
useEffect(() => {
  const id = setInterval(() => setNow(Date.now()), 60_000);
  return () => clearInterval(id);
}, []);
`, { emberLang: 'javascript' }),
    C('r', 'You might not need an effect',
      `
Most effects in real codebases are unnecessary, so before writing one, check whether it's really one of these:

- **Derived data:** compute it during render (Day 3). An effect that calls \`setState\` costs an extra render and shows stale UI first.
- **Event-driven logic:** "when the user clicks Save, POST and show a toast" belongs in the **event handler**, not in an effect watching \`saved\`.
- **Resetting state when a prop changes:** give the component a \`key\`.
- **Fetching data:** use a data layer (Query, a router loader or RSC), which Day 9 covers.

The test is simple: *is this synchronising with something outside React?* If not, it isn't an effect.
`,
      `
// observers/didUpdate are the Ember-era version of this smell
@tracked counts;

@action updateCounts() { // did-update
  this.counts = countByStatus(this.args.issues);
}
`,
      `
// ❌ two commits, one stale
const [counts, setCounts] = useState(ZERO);
useEffect(() => setCounts(countByStatus(issues)), [issues]);

// ✅ one commit, never stale
const counts = countByStatus(issues);
`, { emberLang: 'javascript' }),
    C('y', 'Race conditions: ignore stale responses',
      `
Fetch in an effect, change \`issueId\` quickly, and the responses can arrive out of order, so the slow, stale one lands last and wins. ember-concurrency's \`restartable\` cancelled the previous run for you, whereas in React the previous run's cleanup *is* your cancellation point. Give each run a flag that its cleanup flips, or an \`AbortController\` that its cleanup aborts. That bookkeeping is also why you'll use a data library for real fetching.
`,
      `
loadIssue = restartableTask(async (id) => {
  // previous instance is cancelled automatically
  this.issue = await fetchIssue(id);
});
`,
      `
useEffect(() => {
  let ignore = false;
  fetchIssue(issueId).then((issue) => {
    if (!ignore) setIssue(issue);
  });
  return () => { ignore = true; };
}, [issueId]);
`, { emberLang: 'javascript' }),
    C('y', '`useEffectEvent`: read the latest values without re-syncing',
      `
Sometimes an effect needs to *read* a value it shouldn't *react* to. Take a subscription that calls \`onNotify\` unless \`muted\`: putting both in the deps resubscribes on every toggle and on every parent render (an inline callback is new each time), but leaving them out makes the closure stale.

\`useEffectEvent\` (stable since React 19.2) resolves the dilemma. It wraps a function that always sees the latest props and state and doesn't belong in the deps, provided you call it **only from inside effects**.
`,
      `
// any arg change (muted, onNotify too) tears down and resubscribes
export default modifier((el, [channel], { muted, onNotify }) => {
  return issueEvents.subscribe(channel, (e) => {
    if (!muted) onNotify(e);
  });
});
`,
      `
const onMessage = useEffectEvent((event: IssueEvent) => {
  if (!muted) onNotify(event); // always the latest
});

useEffect(() => {
  return issueEvents.subscribe(channel, onMessage);
}, [channel]); // only what we sync with
`, { emberLang: 'javascript' }),
  ],
  exercise: {
    files: [
      'exercises/day05/IssueDetail.tsx',
      'exercises/day05/RelativeTime.tsx',
      'exercises/day05/LiveIssueFeed.tsx',
      'exercises/day05/IssueStats.tsx',
    ],
    command: 'pnpm test day05',
    criteria: [
      '`IssueDetail`: a slow response for the previous id never overwrites the current one; a missing issue shows `role="alert"` "Could not load issue".',
      '`RelativeTime`: re-renders every 60 s, and leaves **zero** timers behind after unmount.',
      '`LiveIssueFeed`: toggling `muted` or passing a new `onNotify` does **not** resubscribe; changing `channel` does; the latest `onNotify` is always called.',
      '`IssueStats`: exactly **one** commit on mount (measured with `<Profiler>`), meaning no effect at all.',
    ],
    stretch: 'Rewrite `IssueDetail` with an `AbortController` instead of an ignore flag. (The fake API ignores the signal, so keep the guard too, and see why the flag is still needed.)',
  },
  drill: [
    ['When do effects run?',
      `
After the render is **committed**, and usually after the browser has painted, although effects triggered by a discrete input such as a click are flushed before paint. (\`useLayoutEffect\` always runs before paint.) On mount the setup runs. On a later render where a dependency changed, compared with \`Object.is\`, the previous cleanup runs and then the new setup, and on unmount the cleanup runs one last time. Effects never run during server rendering.
`],
    ['What is the dependency array really for?',
      `
It tells React which reactive values the effect's *synchronisation* depends on, so React can skip re-syncing when none of them changed. That's why it must include every prop, state or derived value the effect reads, and why the lint rule enforces it: the array describes the effect rather than scheduling it. If you're tempted to leave something out, restructure instead: move it inside the effect, memoize it, or read it through \`useEffectEvent\`.
`],
    ['Why does Strict Mode run effects twice in development?',
      `
To surface missing or incorrect cleanup. Because it mounts, unmounts and remounts each component, every effect goes setup → cleanup → setup. A correct effect behaves exactly as if it ran once, whereas a leaky one, with a double subscription, an uncleared timer or an unguarded duplicate request, shows up immediately. None of this happens in production.
`],
    ['How do you handle race conditions when fetching in an effect?',
      `
Give each effect run a way to know it has gone stale. Either declare \`let ignore = false\`, set it to \`true\` in cleanup and check it before \`setState\`, or create an \`AbortController\` and abort it in cleanup, which also cancels the network request. Better still, use a library such as TanStack Query or router loaders, which keys requests and handles ordering, caching and dedupe for you.
`],
    ['Name three cases where you don\'t need an effect.',
      `
First, **derived values**: compute them during render, with \`useMemo\` if they're expensive. Second, **responding to user events**: do the work in the event handler. Third, **resetting state when a prop changes**: use a \`key\`. Notifying a parent, chaining state updates and initialising app-wide singletons don't need one either: call the callback in the same handler, combine the updates, or use module scope.
`],
    ['What does `useEffectEvent` solve?',
      `
It lets an effect read the **latest** props or state without making them dependencies, which separates what you synchronise with (the deps) from what you read when something happens (the event). Typical uses are logging with the current user, checking the current \`muted\` flag before notifying, or calling the latest \`onX\` prop from a subscription. The rules: call it only from effects, never during render, and never pass it to other components.
`],
    ['How do effects compare to Ember modifiers?',
      `
The lifecycle is the same: both set up against something external and tear down when their arguments change or on destroy. The differences lie in where they live and what drives them. A modifier is bound to an **element** and used in a template, whereas an effect is bound to a **component** and declared in its body. Its re-runs follow an explicit deps array rather than autotracking, and it runs after the commit, never during render. The most direct "element modifier" equivalent is a ref callback with cleanup.
`],
  ],
});

export const WEEK1 = [DAY1, DAY2, DAY3, DAY4, DAY5];
