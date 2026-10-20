// Generates course/index.html: node course/source/build.mjs course/index.html
import { writeFileSync } from 'node:fs';
import { FLAGS, dedent, escape as e, inline, md } from './model.mjs';
import { WEEK1 } from './week1.mjs';
import { WEEK2 } from './week2.mjs';
import { WEEK3, MOCK_INTERVIEW, CHEATSHEET } from './week3.mjs';

const REPO = 'https://github.com/linearza/react-for-ember-engineers';
const DAYS = [...WEEK1, ...WEEK2, ...WEEK3];
const WEEKS = { 1: 'Core mental model', 2: 'Architecture', 3: 'Modern & advanced' };
const PRISM = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components';
const PRISM_COMPONENTS = ['core', 'markup', 'clike', 'javascript', 'typescript', 'jsx', 'tsx', 'markup-templating', 'handlebars', 'bash'];

if (DAYS.length !== 15) throw new Error(`expected 15 days, got ${DAYS.length}`);
if (MOCK_INTERVIEW.length !== 30) throw new Error(`expected 30 mock questions, got ${MOCK_INTERVIEW.length}`);

function flagBadge(code) {
  const [emoji, label, cls] = FLAGS[code];
  return `<span class="flag flag--${cls}"><span aria-hidden="true">${emoji}</span> ${label}</span>`;
}

function codeBlock(code, lang, label) {
  const langCls = lang === 'text' ? 'none' : lang;
  return (
    `<figure class="code"><figcaption>${e(label)}</figcaption>` +
    `<pre class="language-${langCls}" tabindex="0"><code class="language-${langCls}">${e(dedent(code))}</code></pre></figure>`
  );
}

function planStrip(day) {
  const minutes = day.n === 15 ? [35, 20, 5] : [15, 35, 10];
  const items = day.plan
    .map((label, i) => `<li><span class="plan__min">${minutes[i]} min</span><span class="plan__label">${e(label)}</span></li>`)
    .join('');
  return `<ol class="plan" aria-label="60-minute plan">${items}</ol>`;
}

function concept(day, i, c) {
  const cid = `d${day.n}-c${i}`;
  return `
<section class="concept" aria-labelledby="${cid}">
  <header class="concept__head">
    <h3 id="${cid}">${inline(c.title)}</h3>
    ${flagBadge(c.flag)}
  </header>
  <div class="prose">${md(c.body)}</div>
  <div class="compare">
    ${codeBlock(c.ember, c.emberLang, c.emberLabel)}
    ${codeBlock(c.react, c.reactLang, c.reactLabel)}
  </div>
</section>`;
}

function exercise(day) {
  const ex = day.exercise;
  const files = ex.files
    .map((f) => `<li><a href="${REPO}/blob/main/${e(f.split(' ')[0])}"><code>${e(f)}</code></a></li>`)
    .join('');
  const criteria = ex.criteria.map((c) => `<li>${inline(c)}</li>`).join('');
  const intro = ex.intro ? `<p>${inline(ex.intro)}</p>` : '';
  return `
<section class="panel exercise" aria-labelledby="d${day.n}-ex">
  <h2 id="d${day.n}-ex">Hands-on</h2>
  ${intro}
  <div class="exercise__grid">
    <div>
      <h3>Open</h3>
      <ul class="files">${files}</ul>
    </div>
    <div>
      <h3>Run</h3>
      <pre class="cmd"><code>${e(ex.command)}</code></pre>
      <p class="muted small">Against the reference: <code>pnpm test:solutions</code></p>
    </div>
  </div>
  <h3>Done when</h3>
  <ul class="checklist">${criteria}</ul>
  <h3>Stretch</h3>
  <p>${inline(ex.stretch)}</p>
</section>`;
}

function qa(i, q, a, meta = '') {
  const metaHtml = meta ? `<span class="qa__meta">${e(meta)}</span>` : '';
  return `
<details class="qa">
  <summary><span class="qa__n">${i}</span><span class="qa__q">${inline(q)}</span>${metaHtml}</summary>
  <div class="qa__a prose">${md(a)}</div>
</details>`;
}

function drill(day) {
  const items = day.drill.map(([q, a], i) => qa(i + 1, q, a)).join('');
  return `
<section class="panel" aria-labelledby="d${day.n}-drill">
  <h2 id="d${day.n}-drill">Interview drill</h2>
  <p class="muted">Answer out loud first, then open the model answer.</p>
  <div class="qas">${items}</div>
</section>`;
}

function day15Extra() {
  const mock = MOCK_INTERVIEW.map(([concern, q, a], i) => qa(i + 1, q, a, concern)).join('');
  const rows = CHEATSHEET
    .map(([ember, react, flag]) => `<tr><td>${inline(ember)}</td><td>${inline(react)}</td><td class="nowrap">${[...flag].map((c) => FLAGS[c][0]).join(' / ')}</td></tr>`)
    .join('');
  return `
<section class="panel" aria-labelledby="mock">
  <h2 id="mock">Mock interview: 30 questions</h2>
  <p class="muted">Set a timer: about 40 seconds per answer, out loud, before you reveal. Two per concern, plus the cross-cutting ones interviewers love.</p>
  <div class="qas">${mock}</div>
</section>
<section class="panel cheatsheet" id="cheatsheet" aria-labelledby="cheatsheet-title">
  <div class="cheatsheet__head">
    <h2 id="cheatsheet-title">React for Ember devs: cheat sheet</h2>
    <button type="button" class="button" data-print-cheatsheet>Print cheat sheet</button>
  </div>
  <p class="legend">${flagBadge('g')} ${flagBadge('y')} ${flagBadge('r')}</p>
  <div class="table-wrap" tabindex="0" role="region" aria-label="Ember to React mapping">
    <table>
      <thead><tr><th scope="col">Ember</th><th scope="col">React</th><th scope="col">Flag</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>
</section>`;
}

function dayView(day) {
  const concepts = day.concepts.map((c, i) => concept(day, i, c)).join('');
  const conceptsHtml = day.concepts.length
    ? `<section aria-labelledby="d${day.n}-concepts"><h2 id="d${day.n}-concepts">Concepts</h2>${concepts}</section>`
    : '';
  const prevLink = day.n > 1 ? `<a class="pager__link" href="#day-${day.n - 1}">← Day ${day.n - 1}</a>` : '<span></span>';
  const nextLink = day.n < 15 ? `<a class="pager__link" href="#day-${day.n + 1}">Day ${day.n + 1} →</a>` : '<span></span>';
  const extra = day.n === 15 ? day15Extra() : '';
  const drillHtml = day.drill.length ? drill(day) : '';
  return `
<article class="day" id="day-${day.n}" data-day="${day.n}" hidden aria-labelledby="day-${day.n}-title">
  <header class="day__head">
    <p class="eyebrow">Week ${day.week} · ${e(WEEKS[day.week])} · Day ${day.n}</p>
    <h1 id="day-${day.n}-title" tabindex="-1">${inline(day.title)}</h1>
    <p class="tagline">${inline(day.tagline)}</p>
    ${planStrip(day)}
  </header>
  ${conceptsHtml}
  ${exercise(day)}
  ${drillHtml}
  ${extra}
  <footer class="day__foot">
    <button type="button" class="button button--complete" data-complete="${day.n}" aria-pressed="false">Mark day complete</button>
    <nav class="pager" aria-label="Day navigation">${prevLink}${nextLink}</nav>
  </footer>
</article>`;
}

function nav() {
  return Object.entries(WEEKS).map(([week, name]) => {
    const links = DAYS.filter((d) => d.week === Number(week))
      .map((d) =>
        `<li><a href="#day-${d.n}" data-nav="${d.n}"><span class="nav__n">${d.n}</span>` +
        `<span class="nav__t">${inline(d.title)}</span><span class="nav__done" aria-hidden="true">✓</span></a></li>`)
      .join('');
    return `<li class="nav__week"><h2 class="nav__heading">Week ${week} · ${e(name)}</h2><ol>${links}</ol></li>`;
  }).join('');
}

const CSS = String.raw`
:root {
  --bg: #f7f7f5; --surface: #ffffff; --surface-2: #f0f0ec; --text: #17181c; --muted: #5f636d;
  --border: #e2e2dc; --accent: #c2410c; --accent-soft: #fff1e8; --link: #9a3412; --focus: #2563eb;
  --green: #15803d; --green-bg: #e9f7ee; --yellow: #a16207; --yellow-bg: #fdf6dd; --red: #b91c1c; --red-bg: #fdecec;
  --code-bg: #fbfbf9; --tok-comment: #7c7f88; --tok-keyword: #a626a4; --tok-string: #2f7d32; --tok-fn: #2759c4;
  --tok-number: #b45309; --tok-tag: #c2410c; --tok-attr: #8a5a00; --tok-punct: #4b4f58;
  --radius: 12px; --sidebar: 300px;
  color-scheme: light;
  font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;
  line-height: 1.6;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #111214; --surface: #18191c; --surface-2: #202226; --text: #e9e9ec; --muted: #9b9fa8;
    --border: #2a2c31; --accent: #fb923c; --accent-soft: #2a1c12; --link: #fdba74; --focus: #60a5fa;
    --green: #4ade80; --green-bg: #12261a; --yellow: #facc15; --yellow-bg: #29240f; --red: #f87171; --red-bg: #2c1515;
    --code-bg: #141518; --tok-comment: #7d828c; --tok-keyword: #d19af7; --tok-string: #8bd49c; --tok-fn: #82aaff;
    --tok-number: #f5b36b; --tok-tag: #fb923c; --tok-attr: #f0c674; --tok-punct: #a8adb7;
    color-scheme: dark;
  }
}
* { box-sizing: border-box; }
html { scroll-padding-top: 1rem; }
body { margin: 0; background: var(--bg); color: var(--text); font-size: 16px; }
a { color: var(--link); }
:focus-visible { outline: 2px solid var(--focus); outline-offset: 2px; border-radius: 4px; }
code, pre, kbd { font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace; font-variant-ligatures: none; }
:not(pre) > code { font-size: 0.875em; background: var(--surface-2); padding: 0.1em 0.35em; border-radius: 5px; overflow-wrap: anywhere; }
h1, h2, h3 { line-height: 1.25; margin: 0; }
.skip { position: absolute; left: -9999px; top: 0; }
.skip:focus { left: 1rem; top: 1rem; z-index: 100; background: var(--surface); padding: 0.5rem 1rem; }
.muted { color: var(--muted); }
.small { font-size: 0.85rem; }
.nowrap { white-space: nowrap; }

/* Shell */
.shell { display: grid; grid-template-columns: var(--sidebar) minmax(0, 1fr); min-height: 100vh; }
.sidebar { position: sticky; top: 0; height: 100vh; overflow-y: auto; border-right: 1px solid var(--border); background: var(--surface); padding: 1.25rem 1rem 2rem; }
.brand { display: block; font-weight: 800; font-size: 1.05rem; letter-spacing: -0.01em; text-decoration: none; color: var(--text); }
.brand span { color: var(--accent); }
.sub { margin: 0.15rem 0 1rem; font-size: 0.8rem; color: var(--muted); }
.progress { margin: 0 0 1.25rem; }
.progress__label { display: flex; justify-content: space-between; font-size: 0.8rem; color: var(--muted); margin-bottom: 0.35rem; }
.progress__bar { height: 6px; border-radius: 99px; background: var(--surface-2); overflow: hidden; }
.progress__fill { height: 100%; width: 0; background: var(--accent); transition: width 200ms ease; }
.nav, .nav ol { list-style: none; margin: 0; padding: 0; }
.nav__week + .nav__week { margin-top: 1rem; }
.nav__heading { font-size: 0.7rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--muted); margin: 0 0 0.35rem 0.5rem; }
.nav a { display: grid; grid-template-columns: 1.75rem 1fr auto; gap: 0.4rem; align-items: baseline; padding: 0.4rem 0.5rem; border-radius: 8px; text-decoration: none; color: var(--text); font-size: 0.875rem; line-height: 1.35; }
.nav a:hover { background: var(--surface-2); }
.nav a[aria-current='page'] { background: var(--accent-soft); color: var(--text); font-weight: 600; }
.nav__n { font-variant-numeric: tabular-nums; color: var(--muted); font-size: 0.8rem; }
.nav__done { color: var(--green); visibility: hidden; font-weight: 700; }
.nav a.is-done .nav__done { visibility: visible; }
.sidebar__foot { margin-top: 1.5rem; font-size: 0.8rem; color: var(--muted); }
.topbar { display: none; }

main { padding: 2.5rem clamp(16px, 4vw, 3.5rem) 4rem; max-width: 1080px; width: 100%; }

/* Day */
.eyebrow { margin: 0 0 0.4rem; font-size: 0.8rem; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; color: var(--accent); }
.day__head h1 { font-size: clamp(1.6rem, 3.2vw, 2.25rem); letter-spacing: -0.02em; }
.day__head h1:focus { outline: none; }
.tagline { font-size: 1.1rem; color: var(--muted); max-width: 62ch; margin: 0.6rem 0 1.25rem; }
.plan { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.5rem; list-style: none; padding: 0; margin: 0 0 2.5rem; }
.plan li { background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 0.6rem 0.8rem; display: flex; flex-direction: column; }
.plan li:nth-child(1) { border-top: 3px solid var(--accent); }
.plan li:nth-child(2) { border-top: 3px solid var(--focus); }
.plan li:nth-child(3) { border-top: 3px solid var(--green); }
.plan__min { font-weight: 700; font-variant-numeric: tabular-nums; }
.plan__label { font-size: 0.85rem; color: var(--muted); }
.day h2 { font-size: 1.3rem; margin: 0 0 1rem; letter-spacing: -0.01em; }
.concept { padding: 1.5rem 0; border-top: 1px solid var(--border); }
.concept__head { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem 0.75rem; margin-bottom: 0.5rem; }
.concept__head h3 { font-size: 1.1rem; }
.prose { max-width: 72ch; }
.prose p { margin: 0.5rem 0; }
.prose ul { margin: 0.5rem 0; padding-left: 1.25rem; }
.prose li { margin: 0.25rem 0; }
.flag { display: inline-flex; align-items: center; gap: 0.3rem; font-size: 0.75rem; font-weight: 600; padding: 0.15rem 0.55rem; border-radius: 99px; white-space: nowrap; }
.flag--green { color: var(--green); background: var(--green-bg); }
.flag--yellow { color: var(--yellow); background: var(--yellow-bg); }
.flag--red { color: var(--red); background: var(--red-bg); }
.compare { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.75rem; margin-top: 1rem; }
.code { margin: 0; min-width: 0; border: 1px solid var(--border); border-radius: 10px; background: var(--code-bg); overflow: hidden; }
.code figcaption { font-size: 0.72rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; padding: 0.4rem 0.8rem; border-bottom: 1px solid var(--border); color: var(--muted); background: var(--surface-2); }
.code:first-child figcaption::before { content: '◆ '; color: #e04e39; }
.code:last-child figcaption::before { content: '⚛ '; color: var(--focus); }
.code pre { margin: 0; padding: 0.8rem; overflow-x: auto; font-size: 0.8rem; line-height: 1.55; tab-size: 2; }

/* Panels */
.panel { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 1.5rem; margin-top: 2rem; }
.panel h3 { font-size: 0.95rem; margin: 1.25rem 0 0.5rem; }
.exercise__grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; }
.exercise__grid h3 { margin-top: 0; }
.files { list-style: none; padding: 0; margin: 0; }
.files li + li { margin-top: 0.3rem; }
.cmd { margin: 0; background: var(--code-bg); border: 1px solid var(--border); border-radius: 8px; padding: 0.6rem 0.8rem; overflow-x: auto; }
.cmd code::before { content: '$ '; color: var(--muted); }
.checklist { list-style: none; padding: 0; margin: 0; }
.checklist li { position: relative; padding-left: 1.6rem; margin: 0.4rem 0; }
.checklist li::before { content: '✓'; position: absolute; left: 0.2rem; color: var(--green); font-weight: 700; }
.qas { display: grid; gap: 0.5rem; }
.qa { border: 1px solid var(--border); border-radius: 10px; background: var(--bg); }
.qa summary { cursor: pointer; display: grid; grid-template-columns: 1.75rem 1fr auto; gap: 0.5rem; align-items: baseline; padding: 0.75rem 0.9rem; font-weight: 600; list-style: none; }
.qa summary::-webkit-details-marker { display: none; }
.qa summary::after { content: 'Reveal'; font-size: 0.75rem; font-weight: 600; color: var(--link); grid-column: 3; grid-row: 1; }
.qa[open] summary::after { content: 'Hide'; }
.qa__n { color: var(--muted); font-variant-numeric: tabular-nums; font-size: 0.85rem; }
.qa__meta { grid-column: 2; font-size: 0.72rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--accent); }
.qa__a { padding: 0 0.9rem 0.9rem 3.15rem; border-top: 1px dashed var(--border); padding-top: 0.6rem; }
.button { font: inherit; font-weight: 600; cursor: pointer; border: 1px solid var(--border); background: var(--surface); color: var(--text); border-radius: 9px; padding: 0.55rem 1rem; }
.button:hover { border-color: var(--accent); }
.button--complete[aria-pressed='true'] { background: var(--green-bg); color: var(--green); border-color: var(--green); }
.button--complete[aria-pressed='true']::before { content: '✓ '; }
.day__foot { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 1rem; margin-top: 2.5rem; padding-top: 1.5rem; border-top: 1px solid var(--border); }
.pager { display: flex; gap: 1rem; }
.pager__link { font-weight: 600; text-decoration: none; }
.cheatsheet__head { display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: center; justify-content: space-between; margin-bottom: 0.5rem; }
.cheatsheet__head h2 { margin: 0; }
.legend { display: flex; flex-wrap: wrap; gap: 0.4rem; margin: 0 0 1rem; }
.table-wrap { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
th, td { text-align: left; padding: 0.5rem 0.6rem; border-bottom: 1px solid var(--border); vertical-align: top; }
th { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--muted); }
noscript p { background: var(--yellow-bg); padding: 0.75rem 1rem; border-radius: 8px; }

/* Prism tokens */
.token.comment, .token.prolog, .token.cdata { color: var(--tok-comment); font-style: italic; }
.token.keyword, .token.boolean, .token.important, .token.atrule { color: var(--tok-keyword); }
.token.string, .token.char, .token.template-string, .token.attr-value, .token.regex { color: var(--tok-string); }
.token.function, .token.class-name, .token.builtin { color: var(--tok-fn); }
.token.number, .token.constant, .token.symbol { color: var(--tok-number); }
.token.tag, .token.selector { color: var(--tok-tag); }
.token.attr-name, .token.property, .token.variable { color: var(--tok-attr); }
.token.punctuation, .token.operator { color: var(--tok-punct); }
.token.handlebars .token.delimiter, .language-handlebars .token.delimiter { color: var(--tok-keyword); }

/* Mobile */
@media (max-width: 900px) {
  .shell { display: block; }
  .topbar { display: flex; position: sticky; top: 0; z-index: 20; align-items: center; justify-content: space-between; gap: 0.75rem; padding: 0.6rem 16px; background: var(--surface); border-bottom: 1px solid var(--border); }
  .topbar .brand { font-size: 0.95rem; }
  .topbar__right { display: flex; align-items: center; gap: 0.6rem; font-size: 0.8rem; color: var(--muted); white-space: nowrap; font-variant-numeric: tabular-nums; }
  .sidebar { display: none; position: fixed; inset: 3.1rem 0 0 0; height: auto; z-index: 19; border-right: 0; }
  body.nav-open .sidebar { display: block; }
  body.nav-open { overflow: hidden; }
  .sidebar .brand, .sidebar .sub { display: none; }
  main { padding: 1.5rem 16px 3rem; }
  .compare, .exercise__grid { grid-template-columns: minmax(0, 1fr); }
  .plan { grid-template-columns: minmax(0, 1fr); }
  .plan li { flex-direction: row; gap: 0.6rem; align-items: baseline; }
  .panel { padding: 1.1rem; }
  .qa__a { padding-left: 0.9rem; }
}

/* Print */
@media print {
  .sidebar, .topbar, .day__foot, .skip, [data-print-cheatsheet] { display: none !important; }
  .shell { display: block; }
  main { padding: 0; max-width: none; }
  .qa .qa__a { display: block; }
  body.print-cheatsheet .day > *:not(.cheatsheet) { display: none !important; }
  body.print-cheatsheet .cheatsheet { border: 0; margin: 0; padding: 0; }
  .code pre { white-space: pre-wrap; }
}
`;

const JS = String.raw`
(function () {
  var KEY = 'react-for-ember:completed';
  var LAST = 'react-for-ember:last-day';
  var TOTAL = 15;
  var store = {
    get: function (k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { window.localStorage.setItem(k, v); } catch (e) { /* storage unavailable: progress lives in memory */ } }
  };
  var completed = new Set();
  try {
    var raw = JSON.parse(store.get(KEY) || '[]');
    if (Array.isArray(raw)) raw.forEach(function (n) { if (n >= 1 && n <= TOTAL) completed.add(Number(n)); });
  } catch (e) { /* bad JSON: start fresh */ }

  var days = Array.prototype.slice.call(document.querySelectorAll('.day'));
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('[data-nav]'));
  var highlighted = new Set();

  function renderProgress() {
    var count = completed.size;
    document.querySelectorAll('[data-progress-text]').forEach(function (el) { el.textContent = count + ' / ' + TOTAL + ' complete'; });
    document.querySelectorAll('[data-progress-short]').forEach(function (el) { el.textContent = count + '/' + TOTAL + ' ✓'; el.setAttribute('aria-label', count + ' of ' + TOTAL + ' days complete'); });
    document.querySelectorAll('.progress__fill').forEach(function (el) { el.style.width = (count / TOTAL * 100) + '%'; });
    document.querySelectorAll('.progress__bar').forEach(function (el) { el.setAttribute('aria-valuenow', String(count)); });
    navLinks.forEach(function (a) {
      var done = completed.has(Number(a.dataset.nav));
      a.classList.toggle('is-done', done);
      var label = a.querySelector('.nav__t').textContent;
      a.setAttribute('aria-label', 'Day ' + a.dataset.nav + ': ' + label + (done ? ' (complete)' : ''));
    });
    document.querySelectorAll('[data-complete]').forEach(function (btn) {
      var done = completed.has(Number(btn.dataset.complete));
      btn.setAttribute('aria-pressed', String(done));
      btn.textContent = done ? 'Day complete' : 'Mark day complete';
    });
  }

  function show(n, focus) {
    if (!(n >= 1 && n <= TOTAL)) n = 1;
    days.forEach(function (d) { d.hidden = Number(d.dataset.day) !== n; });
    navLinks.forEach(function (a) {
      if (Number(a.dataset.nav) === n) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    var day = document.getElementById('day-' + n);
    if (window.Prism && typeof window.Prism.highlightAllUnder === 'function' && !highlighted.has(n)) { window.Prism.highlightAllUnder(day); highlighted.add(n); }
    document.title = 'Day ' + n + ' · React for Ember Engineers';
    store.set(LAST, String(n));
    document.body.classList.remove('nav-open');
    var toggle = document.querySelector('[data-nav-toggle]');
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
    if (focus) { window.scrollTo(0, 0); day.querySelector('h1').focus({ preventScroll: true }); }
  }

  function fromHash() {
    var m = /^#day-(\d+)$/.exec(window.location.hash);
    return m ? Number(m[1]) : null;
  }

  window.addEventListener('hashchange', function () { show(fromHash() || 1, true); });

  document.addEventListener('click', function (event) {
    var btn = event.target.closest('[data-complete]');
    if (btn) {
      var n = Number(btn.dataset.complete);
      if (completed.has(n)) completed.delete(n); else completed.add(n);
      store.set(KEY, JSON.stringify(Array.from(completed).sort(function (a, b) { return a - b; })));
      renderProgress();
      return;
    }
    if (event.target.closest('[data-print-cheatsheet]')) {
      document.body.classList.add('print-cheatsheet');
      window.print();
      return;
    }
    var toggle = event.target.closest('[data-nav-toggle]');
    if (toggle) {
      var open = document.body.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', String(open));
    }
  });
  window.addEventListener('afterprint', function () { document.body.classList.remove('print-cheatsheet'); });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && document.body.classList.contains('nav-open')) {
      document.body.classList.remove('nav-open');
      var t = document.querySelector('[data-nav-toggle]');
      t.setAttribute('aria-expanded', 'false');
      t.focus();
    }
  });

  renderProgress();
  var initial = fromHash() || Number(store.get(LAST)) || 1;
  show(initial, false);
  window.addEventListener('load', function () {
    // Prism may arrive after first paint
    highlighted.clear();
    show(fromHash() || initial, false);
  });
})();
`;

function page() {
  const daysHtml = DAYS.map(dayView).join('');
  const prism = PRISM_COMPONENTS.map((c) => `<script src="${PRISM}/prism-${c}.min.js" defer></script>`).join('');
  const progress = `
<div class="progress">
  <div class="progress__label"><span>Progress</span><span data-progress-text>0 / 15 complete</span></div>
  <div class="progress__bar" role="progressbar" aria-label="Days complete" aria-valuemin="0" aria-valuemax="15" aria-valuenow="0"><div class="progress__fill"></div></div>
</div>`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<title>React for Ember Engineers</title>
<meta name="description" content="A 15-day React 19 course for experienced Ember engineers: concepts, exercises and interview drills.">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 32 32%22%3E%3Crect width=%2232%22 height=%2232%22 rx=%227%22 fill=%22%23c2410c%22/%3E%3Ctext x=%2216%22 y=%2222%22 font-size=%2216%22 text-anchor=%22middle%22 fill=%22white%22 font-family=%22sans-serif%22 font-weight=%22700%22%3ER%3C/text%3E%3C/svg%3E">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
<style>${CSS}</style>
<script>window.Prism = window.Prism || {}; window.Prism.manual = true;</script>
${prism}
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="topbar">
  <a class="brand" href="#day-1">React <span>for</span> Ember Engineers</a>
  <div class="topbar__right">
    <span data-progress-short aria-label="Days complete">0/15</span>
    <button type="button" class="button" data-nav-toggle aria-expanded="false" aria-controls="sidebar">Days</button>
  </div>
</header>
<div class="shell">
  <aside class="sidebar" id="sidebar">
    <a class="brand" href="#day-1">React <span>for</span> Ember Engineers</a>
    <p class="sub">15 days · 60 minutes each · React 19.3</p>
    ${progress}
    <nav aria-label="Course days"><ol class="nav">${nav()}</ol></nav>
    <div class="sidebar__foot">
      <p>Exercises, tests and solutions: <a href="${REPO}">github.com/linearza/react-for-ember-engineers</a></p>
      <p><span class="flag flag--green">🟢 translate</span> <span class="flag flag--yellow">🟡 re-learn</span> <span class="flag flag--red">🔴 unlearn</span></p>
    </div>
  </aside>
  <main id="main">
    <noscript><p>JavaScript is off: every day is shown below in order, and progress tracking is disabled.</p><style>.day[hidden]{display:block}</style></noscript>
    ${daysHtml}
  </main>
</div>
<script>${JS}</script>
</body>
</html>
`;
}

const out = process.argv[2];
if (!out) throw new Error('usage: node course/source/build.mjs <out.html>');
writeFileSync(out, page());
console.log('wrote', out);
