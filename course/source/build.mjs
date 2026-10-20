// Generates course/index.html: node course/source/build.mjs course/index.html
import { readFileSync, writeFileSync } from 'node:fs';
import { FLAGS, dedent, escape as e, inline, md } from './model.mjs';
import { WEEK1 } from './week1.mjs';
import { WEEK2 } from './week2.mjs';
import { WEEK3, FINAL_REVIEW, CHEATSHEET } from './week3.mjs';

// The logo, inlined so index.html stays one self-contained file
const ICON = 'data:image/svg+xml,' + encodeURIComponent(readFileSync(new URL('../icons/logo.svg', import.meta.url), 'utf8').replace(/\s*\n\s*/g, ''));
const LOGO = readFileSync(new URL('../icons/logo.svg', import.meta.url), 'utf8')
  .replace(/<title[^>]*>.*?<\/title>/, '')
  .replace('role="img" aria-labelledby="t"', 'aria-hidden="true" focusable="false"');
const REPO = 'https://github.com/linearza/react-for-ember-engineers';
const DAYS = [...WEEK1, ...WEEK2, ...WEEK3];
const WEEKS = { 1: 'Core mental model', 2: 'Architecture', 3: 'Modern & advanced' };
const PRISM = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components';
const PRISM_COMPONENTS = ['core', 'markup', 'clike', 'javascript', 'typescript', 'jsx', 'tsx', 'markup-templating', 'handlebars', 'bash'];

if (DAYS.length !== 15) throw new Error(`expected 15 days, got ${DAYS.length}`);
if (FINAL_REVIEW.length !== 30) throw new Error(`expected 30 review questions, got ${FINAL_REVIEW.length}`);

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
    .map((label, i) => `<li><span class="plan__n" aria-hidden="true">${i + 1}</span><span class="plan__text"><span class="plan__label">${e(label)}</span><span class="plan__min">${minutes[i]} min</span></span></li>`)
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
      <div class="file-only">
        <pre class="cmd"><code>${e(ex.command)}</code></pre>
        <p class="muted small">Or run <code>pnpm start</code> and this page tracks your tests live.</p>
      </div>
      <p class="live-only live-note">Already running in your <code>pnpm start</code> terminal. Save a file in <code>exercises/day${String(day.n).padStart(2, '0')}/</code> and watch your results below.${day.n === 15 ? ' <a href="/app/">Open your app →</a>' : ''}</p>
    </div>
  </div>
  <div class="live-tests live-only" data-live-tests="${day.n}" aria-live="polite"></div>
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
  <h2 id="d${day.n}-drill">Check yourself</h2>
  <p class="muted">Answer out loud first, then open the model answer.</p>
  <div class="qas">${items}</div>
</section>`;
}

function day15Extra() {
  const review = FINAL_REVIEW.map(([concern, q, a], i) => qa(i + 1, q, a, concern)).join('');
  const rows = CHEATSHEET
    .map(([ember, react, flag]) => `<tr><td>${inline(ember)}</td><td>${inline(react)}</td><td class="nowrap">${[...flag].map((c) => FLAGS[c][0]).join(' / ')}</td></tr>`)
    .join('');
  return `
<section class="panel" aria-labelledby="review">
  <h2 id="review">Final review: 30 questions</h2>
  <p class="muted">Set a timer: about 40 seconds per answer, out loud, before you reveal. Two per concern, plus a few that cut across the whole course.</p>
  <div class="qas">${review}</div>
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
    <button type="button" class="button button--complete file-only" data-complete="${day.n}" aria-pressed="false">Mark day complete</button>
    <p class="day-status live-only" data-day-status="${day.n}"></p>
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

// Dark palette, shared by the system-preference rule and the explicit [data-theme="dark"] rule
const DARK_TOKENS = String.raw`
  --bg: #111214; --surface: #18191c; --surface-2: #202226; --text: #e9e9ec; --muted: #9b9fa8;
  --border: #2a2c31; --accent: #fb923c; --accent-soft: #2a1c12; --link: #fdba74; --focus: #60a5fa;
  --green: #4ade80; --green-bg: #12261a; --yellow: #facc15; --yellow-bg: #29240f; --red: #f87171; --red-bg: #2c1515;
  --code-bg: #141518; --tok-comment: #7d828c; --tok-keyword: #d19af7; --tok-string: #8bd49c; --tok-fn: #82aaff;
  --tok-number: #f5b36b; --tok-tag: #fb923c; --tok-attr: #f0c674; --tok-punct: #a8adb7;
  --code-inline: #f9a8d4; --code-inline-bg: #2a1823;
  color-scheme: dark;`;

const CSS = String.raw`
:root {
  --bg: #f7f7f5; --surface: #ffffff; --surface-2: #f0f0ec; --text: #17181c; --muted: #5f636d;
  --border: #e2e2dc; --accent: #c2410c; --accent-soft: #fff1e8; --link: #9a3412; --focus: #2563eb;
  --green: #15803d; --green-bg: #e9f7ee; --yellow: #a16207; --yellow-bg: #fdf6dd; --red: #b91c1c; --red-bg: #fdecec;
  --code-bg: #fbfbf9; --tok-comment: #7c7f88; --tok-keyword: #a626a4; --tok-string: #2f7d32; --tok-fn: #2759c4;
  --tok-number: #b45309; --tok-tag: #c2410c; --tok-attr: #8a5a00; --tok-punct: #4b4f58;
  --code-inline: #a3195b; --code-inline-bg: #fbeef4;
  --radius: 12px; --sidebar: 300px;
  color-scheme: light;
  font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;
  line-height: 1.6;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
${DARK_TOKENS}
  }
}
:root[data-theme="dark"] {
${DARK_TOKENS}
}
* { box-sizing: border-box; }
html { scroll-padding-top: 1rem; }
body { margin: 0; background: var(--bg); color: var(--text); font-size: 16px; }
a { color: var(--link); }
:focus-visible { outline: 2px solid var(--focus); outline-offset: 2px; border-radius: 4px; }
code, pre, kbd { font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace; font-variant-ligatures: none; }
:not(pre) > code { font-size: 0.875em; color: var(--code-inline); background: var(--code-inline-bg); padding: 0.1em 0.35em; border-radius: 5px; overflow-wrap: anywhere; }
a code { color: inherit; }
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
.theme { display: flex; gap: 2px; margin: 0 0 1.25rem; padding: 3px; border: 1px solid var(--border); border-radius: 10px; background: var(--surface-2); }
.theme button { flex: 1; font: inherit; font-size: 0.78rem; padding: 0.3rem 0.4rem; border: 0; border-radius: 7px; background: transparent; color: var(--muted); cursor: pointer; }
.theme button:hover { color: var(--text); }
.theme button[aria-pressed='true'] { background: var(--surface); color: var(--text); font-weight: 600; box-shadow: 0 1px 2px rgb(0 0 0 / 0.12); }
.sidebar__foot { margin-top: 1.5rem; font-size: 0.8rem; color: var(--muted); }
.topbar { display: none; }

main { padding: 2.5rem clamp(16px, 4vw, 3.5rem) 4rem; max-width: 1080px; width: 100%; }

/* Day */
.eyebrow { margin: 0 0 0.4rem; font-size: 0.8rem; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; color: var(--accent); }
.day__head h1 { font-size: clamp(1.6rem, 3.2vw, 2.25rem); letter-spacing: -0.02em; }
.day__head h1:focus { outline: none; }
.tagline { font-size: 1.1rem; color: var(--muted); max-width: 62ch; margin: 0.6rem 0 1.25rem; }
.plan { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1.75rem; list-style: none; padding: 0; margin: 0 0 2.5rem; }
.plan li { position: relative; background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 0.7rem 0.85rem; display: flex; align-items: center; gap: 0.75rem; }
.plan li:not(:last-child)::after { content: ""; position: absolute; top: 50%; right: -1.2rem; width: 0.6rem; height: 0.6rem; border-top: 2px solid var(--muted); border-right: 2px solid var(--muted); transform: translate(0, -50%) rotate(45deg); }
.plan__n { flex: none; display: grid; place-items: center; width: 2rem; height: 2rem; border-radius: 50%; background: var(--accent-soft); color: var(--accent); font-weight: 800; font-size: 0.9rem; }
.plan__text { display: flex; flex-direction: column; min-width: 0; }
.plan__label { font-weight: 700; }
.plan__min { font-size: 0.85rem; color: var(--muted); font-variant-numeric: tabular-nums; }
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
  .plan { grid-template-columns: minmax(0, 1fr); gap: 1.25rem; }
  .plan li:not(:last-child)::after { top: auto; right: auto; bottom: -0.95rem; left: 1.6rem; transform: rotate(135deg); }
  .panel { padding: 1.1rem; }
  .qa__a { padding-left: 0.9rem; }
}

/* Live mode (served by pnpm start) */
.live-only { display: none !important; }
body.is-live .live-only { display: revert !important; }
body.is-live .file-only { display: none !important; }
.live-note { margin: 0; padding: 0.6rem 0.8rem; border-radius: 8px; background: var(--accent-soft); font-size: 0.9rem; }
.live-status { display: flex; align-items: center; gap: 0.45rem; margin: -0.5rem 0 1.25rem; font-size: 0.8rem; color: var(--muted); }
.live-status__dot { width: 8px; height: 8px; border-radius: 50%; background: var(--green); box-shadow: 0 0 0 3px var(--green-bg); }
.live-status.is-running .live-status__dot { background: var(--yellow); box-shadow: 0 0 0 3px var(--yellow-bg); animation: pulse 1s ease-in-out infinite; }
.live-status.is-offline .live-status__dot { background: var(--muted); box-shadow: none; }
@keyframes pulse { 50% { opacity: 0.35; } }
.button--cert { width: 100%; margin: 0 0 1.25rem; border-color: var(--accent); }
.button--cert[hidden] { display: none; }
.button--primary { background: var(--accent); border-color: var(--accent); color: #fff; }
.button--primary:hover { filter: brightness(1.08); }
.live-tests { margin-top: 1.25rem; border: 1px solid var(--border); border-radius: 10px; padding: 0.9rem 1rem; background: var(--bg); }
.live-tests__head { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem 0.75rem; font-weight: 600; }
.live-tests__count { font-variant-numeric: tabular-nums; color: var(--muted); font-weight: 600; }
.live-tests__bar { flex: 1 1 120px; height: 6px; border-radius: 99px; background: var(--surface-2); overflow: hidden; }
.live-tests__bar span { display: block; height: 100%; background: var(--focus); transition: width 300ms ease; }
.live-tests.is-green { border-color: var(--green); background: var(--green-bg); }
.live-tests.is-green .live-tests__bar span { background: var(--green); }
.live-tests__fails { list-style: none; margin: 0.75rem 0 0; padding: 0; display: grid; gap: 0.4rem; font-size: 0.875rem; }
.live-tests__fails li { padding-left: 1.4rem; position: relative; }
.live-tests__fails li::before { content: '○'; position: absolute; left: 0.2rem; color: var(--muted); }
.live-tests__fails small { display: block; color: var(--muted); font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 0.75rem; overflow-wrap: anywhere; }
.live-tests__more { color: var(--muted); font-size: 0.8rem; }
.day-status { margin: 0; font-weight: 600; color: var(--muted); }
.day-status.is-done { color: var(--green); }

/* Celebration */
dialog { color: var(--text); }
dialog::backdrop { background: rgb(10 10 12 / 0.55); backdrop-filter: blur(3px); }
.celebrate { width: min(440px, calc(100vw - 32px)); border: 1px solid var(--border); border-radius: 18px; background: var(--surface); padding: 2rem 1.5rem 1.5rem; text-align: center; }
.celebrate[open] { animation: pop 380ms cubic-bezier(0.2, 1.4, 0.4, 1); }
@keyframes pop { from { transform: scale(0.85); opacity: 0; } }
.celebrate__emoji { font-size: 3.25rem; line-height: 1; margin: 0 0 0.75rem; }
.celebrate h2 { font-size: 1.45rem; letter-spacing: -0.02em; }
.celebrate__text { color: var(--muted); margin: 0.5rem 0 1.25rem; }
.celebrate__actions { display: flex; flex-wrap: wrap; justify-content: center; gap: 0.5rem; margin-top: 1.5rem; }
.pips { display: flex; flex-wrap: wrap; justify-content: center; gap: 4px; list-style: none; margin: 0; padding: 0; }
.pips li { width: 20px; height: 20px; border-radius: 50%; display: grid; place-items: center; font-size: 0.62rem; font-weight: 700; background: var(--surface-2); color: var(--muted); }
.pips li.is-done { background: var(--accent); color: #fff; }
.pips li.is-new { animation: pip 700ms ease 200ms both; }
@keyframes pip { 0% { transform: scale(0.4); } 60% { transform: scale(1.35); } }
.confetti { position: fixed; inset: 0; width: 100vw; height: 100vh; max-width: none; max-height: none; margin: 0; padding: 0; border: 0; background: transparent; pointer-events: none; z-index: 1000; overflow: visible; }

/* How it works */
.icon-button { display: inline-grid; place-items: center; width: 34px; height: 34px; padding: 0; border: 1px solid var(--border); border-radius: 50%; background: var(--surface); color: var(--muted); cursor: pointer; flex: none; }
.icon-button:hover { color: var(--text); border-color: var(--accent); }
.sidebar__head { display: flex; align-items: flex-start; justify-content: space-between; gap: 0.5rem; }
.intro { width: min(520px, calc(100vw - 32px)); max-height: calc(100vh - 32px); border: 1px solid var(--border); border-radius: 18px; background: var(--surface); padding: 1.75rem 1.5rem 1.5rem; }
.intro[open] { animation: pop 380ms cubic-bezier(0.2, 1.4, 0.4, 1); }
.intro__head { display: flex; align-items: center; gap: 0.85rem; margin-bottom: 0.4rem; }
.intro__head svg { width: 48px; height: 48px; flex: none; }
.intro h2 { font-size: 1.35rem; letter-spacing: -0.02em; }
.intro__lead { color: var(--muted); margin: 0 0 1.1rem; }
.intro__steps { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.85rem; }
.intro__steps li { display: grid; grid-template-columns: 2rem 1fr; gap: 0.75rem; align-items: start; }
.intro__n { display: grid; place-items: center; width: 2rem; height: 2rem; border-radius: 50%; background: var(--accent-soft); color: var(--accent); font-weight: 800; font-size: 0.9rem; }
.intro__steps h3 { font-size: 1rem; margin: 0.15rem 0 0.1rem; }
.intro__steps h3 small { font-weight: 400; color: var(--muted); font-size: 0.85rem; margin-left: 0.35rem; }
.intro__steps p { margin: 0; color: var(--muted); font-size: 0.92rem; }
.intro__foot { margin: 1.25rem 0 0; padding-top: 1rem; border-top: 1px solid var(--border); font-size: 0.88rem; color: var(--muted); }
.intro__actions { display: flex; justify-content: flex-end; margin-top: 1.25rem; }

/* Certificate: always on paper, whatever the theme */
.cert-dialog { width: min(900px, calc(100vw - 32px)); max-height: calc(100vh - 32px); border: 0; border-radius: 16px; padding: 1rem; background: var(--surface); }
.cert-dialog__controls { display: flex; flex-wrap: wrap; align-items: end; gap: 0.6rem; margin-top: 1rem; }
.field { display: grid; gap: 0.25rem; font-size: 0.8rem; font-weight: 600; color: var(--muted); flex: 1 1 220px; }
.field input { font: inherit; font-size: 1rem; font-weight: 400; color: var(--text); background: var(--bg); border: 1px solid var(--border); border-radius: 9px; padding: 0.5rem 0.7rem; }
.certificate { container-type: inline-size; aspect-ratio: 297 / 210; background: #fffaf2; color: #1c1917; padding: 3.2cqi; border-radius: 6px; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
.certificate__inner { position: relative; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; border: 0.35cqi solid #c2410c; outline: 0.12cqi solid #c2410c; outline-offset: -1.1cqi; background: radial-gradient(ellipse at 50% 0%, #fff1e3 0%, transparent 60%), radial-gradient(ellipse at 50% 100%, #fdf2e4 0%, transparent 55%); }
.certificate__inner::before, .certificate__inner::after { content: ''; position: absolute; width: 7cqi; height: 7cqi; border: 0.35cqi solid #f59e0b; }
.certificate__inner::before { top: 2cqi; left: 2cqi; border-right: 0; border-bottom: 0; }
.certificate__inner::after { bottom: 2cqi; right: 2cqi; border-left: 0; border-top: 0; }
.certificate__logo svg { display: block; width: 8.5cqi; height: 8.5cqi; margin: 0 auto 1.6cqi; }
.certificate p { margin: 0; }
.certificate__kicker { font-size: 1.45cqi; font-weight: 700; letter-spacing: 0.32em; text-transform: uppercase; color: #c2410c; }
.certificate__lead { font-size: 1.6cqi; color: #57534e; margin-top: 1.6cqi !important; }
.certificate__name { font-family: 'Fraunces', Georgia, 'Times New Roman', serif; font-style: italic; font-weight: 500; font-size: 6.2cqi; line-height: 1.15; color: #1c1917; margin-top: 0.8cqi !important; padding: 0 4cqi 0.6cqi; border-bottom: 0.12cqi solid #d6d3d1; min-width: 45cqi; overflow-wrap: anywhere; }
.certificate__course { font-size: 3.6cqi; font-weight: 800; letter-spacing: -0.02em; margin-top: 0.6cqi !important; }
.certificate__meta { font-size: 1.55cqi; color: #57534e; margin-top: 0.8cqi !important; }
.certificate__foot { display: flex; gap: 5cqi; margin-top: 3.4cqi; }
.certificate__foot p { display: grid; gap: 0.3cqi; min-width: 16cqi; padding-top: 0.8cqi; border-top: 0.12cqi solid #d6d3d1; font-size: 1.6cqi; font-weight: 600; font-variant-numeric: tabular-nums; }
.certificate__foot small { font-size: 1.1cqi; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: #78716c; }
.cert-print { display: none; }

/* Print */
@media print {
  body.print-certificate > :not(.cert-print) { display: none !important; }
  body.print-certificate .cert-print { display: block; }
  .cert-print .certificate { width: 100%; border-radius: 0; }
  dialog { display: none !important; }
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
      saveCompleted();
      renderProgress();
      if (completed.has(n) && !celebrated.has(n)) celebrate([n]);
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

  // ---------------------------------------------------------------- celebrations
  var COURSE = window.COURSE || { days: {}, concepts: 0 };
  var CELEBRATED = 'react-for-ember:celebrated';
  var NAME = 'react-for-ember:name';
  var DONE_AT = 'react-for-ember:completed-at';
  var celebrated = new Set(readList(CELEBRATED));
  var completedAt = {};
  try { completedAt = JSON.parse(store.get(DONE_AT) || '{}') || {}; } catch (e) { completedAt = {}; }
  var live = null; // state from pnpm start, when connected

  function readList(key) {
    try { var v = JSON.parse(store.get(key) || '[]'); return Array.isArray(v) ? v.map(Number) : []; } catch (e) { return []; }
  }
  // Theme: 'system' (default, follows the OS), 'light' or 'dark'
  function applyTheme(choice) {
    if (choice === 'light' || choice === 'dark') document.documentElement.dataset.theme = choice;
    else { choice = 'system'; delete document.documentElement.dataset.theme; }
    document.querySelectorAll('[data-theme-choice]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.themeChoice === choice));
    });
    return choice;
  }
  applyTheme(store.get('react-for-ember:theme'));
  document.addEventListener('click', function (event) {
    var b = event.target.closest('[data-theme-choice]');
    if (b) store.set('react-for-ember:theme', applyTheme(b.dataset.themeChoice));
  });

  function sorted(set) { return Array.from(set).sort(function (a, b) { return a - b; }); }
  function saveCompleted() {
    store.set(KEY, JSON.stringify(sorted(completed)));
    completed.forEach(function (n) { if (!completedAt[n]) completedAt[n] = new Date().toISOString(); });
    store.set(DONE_AT, JSON.stringify(completedAt));
  }
  function listDays(ns) {
    if (ns.length === 1) return 'Day ' + ns[0];
    return 'Days ' + ns.slice(0, -1).join(', ') + ' and ' + ns[ns.length - 1];
  }

  var celebrateDialog = document.querySelector('[data-celebrate]');
  var nextAction = null;

  function celebrate(ns) {
    ns = ns.slice().sort(function (a, b) { return a - b; });
    ns.forEach(function (n) { celebrated.add(n); });
    store.set(CELEBRATED, JSON.stringify(sorted(celebrated)));
    var last = ns[ns.length - 1];
    var count = completed.size;
    var finished = count === TOTAL;
    var q = function (sel) { return celebrateDialog.querySelector(sel); };
    var emoji = '🎉', title, text, next;
    if (finished) {
      emoji = '🎓';
      title = 'You finished the course!';
      text = 'All 15 days, done. You can now build with React and explain why it works the way it does, not just how. Your certificate is ready.';
      next = { label: 'See your certificate', run: openCertificate };
    } else {
      title = listDays(ns) + ' complete';
      text = ns.length === 1 ? (COURSE.days[last] || '') + ': nailed it.' : 'Nice streak.';
      if (count === 5 && ns.indexOf(5) !== -1) { emoji = '🔥'; text = 'Week 1 is done: you have the core mental model. Next week: architecture.'; }
      else if (count === 10 && ns.indexOf(10) !== -1) { emoji = '🚀'; text = 'Week 2 is done: two thirds of the way. Next week: modern and advanced React.'; }
      else text += ' ' + count + ' of 15 done, ' + (TOTAL - count) + ' to go.';
      var upcoming = 0;
      for (var d = 1; d <= TOTAL; d++) { if (!completed.has(d)) { upcoming = d; break; } }
      next = upcoming
        ? { label: 'On to Day ' + upcoming + ' →', run: function () { window.location.hash = '#day-' + upcoming; } }
        : { label: 'Keep going', run: function () {} };
    }
    q('[data-celebrate-emoji]').textContent = emoji;
    q('[data-celebrate-title]').textContent = title;
    q('[data-celebrate-text]').textContent = text;
    q('[data-celebrate-next]').textContent = next.label;
    nextAction = next.run;
    celebrateDialog.querySelectorAll('[data-pips] li').forEach(function (li, i) {
      li.classList.toggle('is-done', completed.has(i + 1));
      li.classList.toggle('is-new', ns.indexOf(i + 1) !== -1);
    });
    if (celebrateDialog.open) celebrateDialog.close();
    celebrateDialog.showModal();
    confetti(finished);
    renderCertificateButton();
  }

  celebrateDialog.addEventListener('click', function (event) {
    if (event.target.closest('[data-celebrate-next]')) { celebrateDialog.close(); if (nextAction) nextAction(); }
    else if (event.target.closest('[data-celebrate-close]') || event.target === celebrateDialog) celebrateDialog.close();
  });

  function confetti(big) {
    try { if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return; } catch (e) { /* old browser: animate */ }
    var canvas = document.createElement('canvas');
    canvas.className = 'confetti';
    canvas.setAttribute('aria-hidden', 'true');
    var popover = typeof canvas.showPopover === 'function';
    if (popover) canvas.setAttribute('popover', 'manual');
    document.body.appendChild(canvas);
    if (popover) canvas.showPopover(); // above the dialog's top layer
    var ctx = canvas.getContext('2d');
    var dpr = window.devicePixelRatio || 1;
    var W = window.innerWidth, H = window.innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr; ctx.scale(dpr, dpr);
    var colors = ['#fb923c', '#fbbf24', '#f97316', '#60a5fa', '#4ade80', '#f472b6', '#c084fc'];
    var parts = [];
    var n = big ? 320 : 160;
    for (var i = 0; i < n; i++) {
      var left = i % 2 === 0;
      parts.push({
        x: left ? -10 : W + 10, y: H * (0.75 + Math.random() * 0.2),
        vx: (left ? 1 : -1) * (4 + Math.random() * (W / 90)), vy: -(9 + Math.random() * (H / 45)),
        s: 6 + Math.random() * 7, r: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.35,
        c: colors[i % colors.length], round: i % 4 === 0, delay: big ? Math.random() * 900 : Math.random() * 250,
      });
    }
    var life = big ? 4800 : 3200;
    var start = performance.now();
    function frame(t) {
      var el = t - start;
      ctx.clearRect(0, 0, W, H);
      parts.forEach(function (p) {
        if (el < p.delay) return;
        p.vy += 0.32; p.vx *= 0.985; p.vy *= 0.992;
        p.x += p.vx; p.y += p.vy; p.r += p.vr;
        ctx.save();
        ctx.globalAlpha = Math.max(0, 1 - el / life);
        ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c;
        if (p.round) { ctx.beginPath(); ctx.arc(0, 0, p.s / 2.6, 0, 6.283); ctx.fill(); }
        else ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2 * (0.6 + 0.4 * Math.abs(Math.cos(p.r * 2))));
        ctx.restore();
      });
      if (el < life) window.requestAnimationFrame(frame);
      else canvas.remove();
    }
    window.requestAnimationFrame(frame);
  }

  // ---------------------------------------------------------------- certificate
  var certDialog = document.querySelector('[data-cert-dialog]');
  var certButton = document.querySelector('[data-open-certificate]');
  var certInput = certDialog.querySelector('[data-cert-input]');

  function doneDates() {
    var source = live ? live.completed : completedAt;
    return Object.keys(source).map(function (k) { return new Date(source[k]); }).filter(function (d) { return !isNaN(d); });
  }
  function hash(s) {
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return (h >>> 0).toString(36).toUpperCase().padStart(7, '0').slice(0, 7);
  }
  function fillCertificate() {
    var name = (store.get(NAME) || '').trim();
    var dates = doneDates().sort(function (a, b) { return a - b; });
    var end = dates.length ? dates[dates.length - 1] : new Date();
    var begin = dates.length ? dates[0] : end;
    var spanDays = Math.max(1, Math.round((end - begin) / 86400000) + 1);
    var tests = 0;
    if (live) Object.keys(live.days).forEach(function (k) { tests += live.days[k].passed; });
    var meta = ['15 days', COURSE.concepts + ' concepts', tests ? tests + ' tests passing' : '30-question final review'];
    var q = function (sel) { return certDialog.querySelector(sel); };
    q('[data-cert-name]').textContent = name || 'Your name';
    q('[data-cert-name]').style.opacity = name ? '1' : '0.35';
    q('[data-cert-meta]').textContent = meta.join(' · ');
    q('[data-cert-date]').textContent = end.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    q('[data-cert-span]').textContent = spanDays + (spanDays === 1 ? ' day' : ' days');
    q('[data-cert-id]').textContent = 'RFE-' + hash(name + '|' + end.toISOString().slice(0, 10));
  }
  function openCertificate() {
    certInput.value = store.get(NAME) || '';
    fillCertificate();
    certDialog.showModal();
    if (!certInput.value) certInput.focus();
  }
  function renderCertificateButton() { certButton.hidden = completed.size !== TOTAL; }

  certButton.addEventListener('click', openCertificate);
  certInput.addEventListener('input', function () { store.set(NAME, certInput.value); fillCertificate(); });
  certDialog.addEventListener('click', function (event) {
    if (event.target.closest('[data-cert-close]') || event.target === certDialog) certDialog.close();
    if (event.target.closest('[data-cert-print]')) {
      var root = document.querySelector('[data-cert-print-root]');
      root.innerHTML = certDialog.querySelector('[data-certificate]').outerHTML;
      var page = document.createElement('style');
      page.textContent = '@page { size: A4 landscape; margin: 10mm; }';
      document.head.appendChild(page);
      document.body.classList.add('print-certificate');
      certDialog.close();
      window.print();
      window.setTimeout(function () {
        document.body.classList.remove('print-certificate');
        page.remove();
        root.innerHTML = '';
      }, 500);
    }
  });

  // ---------------------------------------------------------------- live mode (pnpm start)
  var liveStatus = document.querySelector('[data-live-status]');
  var liveText = document.querySelector('[data-live-status-text]');

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }
  function shortName(name) { var parts = name.split(' > '); return parts.length > 1 ? parts.slice(1).join(' › ') : name; }
  function fmtDate(iso) { return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }); }

  function renderLive() {
    var running = live.running;
    liveStatus.classList.toggle('is-running', running);
    liveStatus.classList.remove('is-offline');
    liveText.textContent = running ? 'Checking your tests…' : 'Watching your tests';
    for (var n = 1; n <= TOTAL; n++) {
      var d = live.days[n];
      var doneAt = live.completed[n];
      var status = document.querySelector('[data-day-status="' + n + '"]');
      status.classList.toggle('is-done', !!doneAt);
      status.textContent = doneAt ? '✓ Completed ' + fmtDate(doneAt) : 'Completes by itself when all of today\'s tests pass.';
      var box = document.querySelector('[data-live-tests="' + n + '"]');
      box.textContent = '';
      if (!d) { box.appendChild(el('p', 'muted small', 'Waiting for the first test run…')); continue; }
      var green = d.total > 0 && d.passed === d.total && !d.loadError;
      box.classList.toggle('is-green', green);
      var head = el('div', 'live-tests__head');
      head.appendChild(el('span', null, green ? '✓ All tests passing' : 'Your tests'));
      head.appendChild(el('span', 'live-tests__count', d.passed + ' / ' + d.total));
      var bar = el('span', 'live-tests__bar');
      var fill = el('span');
      fill.style.width = (d.total ? d.passed / d.total * 100 : 0) + '%';
      bar.appendChild(fill);
      head.appendChild(bar);
      box.appendChild(head);
      if (d.loadError) {
        var err = el('ul', 'live-tests__fails');
        var li = el('li', null, "The test file couldn't load your code");
        li.appendChild(el('small', null, d.loadError));
        err.appendChild(li);
        box.appendChild(err);
      } else if (!green) {
        var list = el('ul', 'live-tests__fails');
        d.failures.slice(0, 6).forEach(function (f) {
          var item = el('li', null, shortName(f.name));
          if (f.message) item.appendChild(el('small', null, f.message));
          list.appendChild(item);
        });
        box.appendChild(list);
        if (d.failures.length > 6) box.appendChild(el('p', 'live-tests__more', '+ ' + (d.failures.length - 6) + ' more. Full output: pnpm test day' + String(n).padStart(2, '0')));
      }
    }
  }

  function applyLive(state) {
    var first = !live;
    live = state;
    if (first) document.body.classList.add('is-live');
    completed = new Set(Object.keys(state.completed).map(Number).filter(function (n) { return n >= 1 && n <= TOTAL; }));
    Object.keys(state.completed).forEach(function (k) { completedAt[k] = state.completed[k]; });
    saveCompleted();
    renderProgress();
    renderLive();
    renderCertificateButton();
    celebrateFresh();
  }

  function celebrateFresh() {
    var fresh = sorted(completed).filter(function (n) { return !celebrated.has(n); });
    if (fresh.length && !introDialog.open) celebrate(fresh);
  }

  // How it works: shown on the first visit, then from the ? buttons
  var INTRO_SEEN = 'react-for-ember:intro-seen';
  var introDialog = document.querySelector('[data-intro]');
  function openIntro() {
    var nav = document.querySelector('[data-nav-toggle][aria-expanded="true"]');
    if (nav) nav.click();
    if (introDialog.open) return;
    introDialog.showModal();
    introDialog.scrollTop = 0;
  }
  introDialog.addEventListener('close', function () {
    store.set(INTRO_SEEN, '1');
    celebrateFresh();
  });
  introDialog.addEventListener('click', function (event) {
    if (event.target.closest('[data-intro-close]') || event.target === introDialog) introDialog.close();
  });
  document.addEventListener('click', function (event) {
    if (event.target.closest('[data-open-intro]')) openIntro();
  });

  if (/^https?:$/.test(window.location.protocol) && typeof window.EventSource === 'function') {
    var events = new window.EventSource('/__course/events');
    events.onmessage = function (message) {
      try { applyLive(JSON.parse(message.data)); } catch (e) { /* ignore a bad frame */ }
    };
    events.onerror = function () {
      if (!live) { events.close(); return; } // not served by pnpm start: stay in manual mode
      liveStatus.classList.add('is-offline');
      liveStatus.classList.remove('is-running');
      liveText.textContent = 'pnpm start stopped: reconnecting…';
    };
  }

  renderCertificateButton();
  renderProgress();
  if (!store.get(INTRO_SEEN)) openIntro();
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
<meta name="description" content="A 15-day React 19 course for experienced Ember engineers: concepts, hands-on exercises and self-checks.">
<link rel="icon" href="${ICON}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=JetBrains+Mono:wght@400;600&family=Fraunces:ital,opsz,wght@1,9..144,500&display=swap" rel="stylesheet">
<script>try { var t = localStorage.getItem('react-for-ember:theme'); if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t; } catch (e) {}</script>
<style>${CSS}</style>
<script>window.Prism = window.Prism || {}; window.Prism.manual = true;</script>
${prism}
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="topbar">
  <a class="brand" href="#day-1">React <span>for</span> Ember Engineers</a>
  <div class="topbar__right">
    <button type="button" class="icon-button" data-open-intro aria-label="How this course works" title="How this course works"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 2.5-3 4.5"/><path d="M12 17.5h.01"/></svg></button>
    <span data-progress-short aria-label="Days complete">0/15</span>
    <button type="button" class="button" data-nav-toggle aria-expanded="false" aria-controls="sidebar">Days</button>
  </div>
</header>
<div class="shell">
  <aside class="sidebar" id="sidebar">
    <div class="sidebar__head"><a class="brand" href="#day-1">React <span>for</span> Ember Engineers</a><button type="button" class="icon-button" data-open-intro aria-label="How this course works" title="How this course works"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 2.5-3 4.5"/><path d="M12 17.5h.01"/></svg></button></div>
    <p class="sub">15 days · 60 minutes each · React 19.3</p>
    <div class="theme" role="group" aria-label="Colour theme"><button type="button" data-theme-choice="system">System</button><button type="button" data-theme-choice="light">Light</button><button type="button" data-theme-choice="dark">Dark</button></div>
    ${progress}
    <p class="live-status live-only" data-live-status><span class="live-status__dot"></span><span data-live-status-text>Connecting…</span></p>
    <button type="button" class="button button--cert" data-open-certificate hidden>🎓 Your certificate</button>
    <nav aria-label="Course days"><ol class="nav">${nav()}</ol></nav>
    <div class="sidebar__foot">
      <p class="file-only">Tip: run <code>pnpm start</code> in the repo and open <a href="http://localhost:1515/">localhost:1515</a>. Days then complete by themselves as your tests pass.</p>
      <p>Exercises, tests and solutions: <a href="${REPO}">github.com/linearza/react-for-ember-engineers</a></p>
      <p><span class="flag flag--green">🟢 translate</span> <span class="flag flag--yellow">🟡 re-learn</span> <span class="flag flag--red">🔴 unlearn</span></p>
    </div>
  </aside>
  <main id="main">
    <noscript><p>JavaScript is off: every day is shown below in order, and progress tracking is disabled.</p><style>.day[hidden]{display:block}</style></noscript>
    ${daysHtml}
  </main>
</div>
<dialog class="intro" data-intro aria-labelledby="intro-title">
  <div class="intro__head">${LOGO}<h2 id="intro-title">How this course works</h2></div>
  <p class="intro__lead">15 days, about an hour each. Every day follows the same four steps.</p>
  <ol class="intro__steps">
    <li><span class="intro__n">1</span><div><h3>Read <small>15 min</small></h3><p>Today's ideas, with the Ember way and the React way side by side.</p></div></li>
    <li><span class="intro__n">2</span><div><h3>Build <small>35 min</small></h3>
      <p class="live-only">Open today's folder in <code>exercises/</code> and follow the TODO comments. Each time you save, the tests run and this page shows what's left.</p>
      <p class="file-only">Open today's folder in <code>exercises/</code> and follow the TODO comments. Run <code>pnpm start</code> in the repo and this page shows your tests passing as you go.</p></div></li>
    <li><span class="intro__n">3</span><div><h3>Check yourself <small>10 min</small></h3><p>Answer each question out loud, then reveal the answer to compare.</p></div></li>
    <li><span class="intro__n">4</span><div><h3>Done</h3>
      <p class="live-only">When all of today's tests pass, the day ticks off by itself and the next one is ready.</p>
      <p class="file-only">When today's tests pass, press "Mark day complete" and move on to the next day.</p></div></li>
  </ol>
  <p class="intro__foot">Finish all 15 days to get your certificate. Stuck for more than 10 minutes? Peek at <code>solutions/</code> for that day. You can reopen this from the <strong>?</strong> button.</p>
  <div class="intro__actions"><button type="button" class="button button--primary" data-intro-close>Let's go</button></div>
</dialog>
<dialog class="celebrate" data-celebrate aria-labelledby="celebrate-title">
  <p class="celebrate__emoji" data-celebrate-emoji aria-hidden="true">🎉</p>
  <h2 id="celebrate-title" data-celebrate-title></h2>
  <p class="celebrate__text" data-celebrate-text></p>
  <ol class="pips" data-pips aria-hidden="true">${Array.from({ length: 15 }, (_, i) => `<li>${i + 1}</li>`).join('')}</ol>
  <div class="celebrate__actions">
    <button type="button" class="button button--primary" data-celebrate-next></button>
    <button type="button" class="button" data-celebrate-close>Stay here</button>
  </div>
</dialog>
<dialog class="cert-dialog" data-cert-dialog aria-label="Your certificate">
  <div class="certificate" data-certificate>
    <div class="certificate__inner">
      <div class="certificate__logo">${LOGO}</div>
      <p class="certificate__kicker">Certificate of completion</p>
      <p class="certificate__lead">This certifies that</p>
      <p class="certificate__name" data-cert-name>Your name</p>
      <p class="certificate__lead">has completed</p>
      <p class="certificate__course">React for Ember Engineers</p>
      <p class="certificate__meta" data-cert-meta></p>
      <div class="certificate__foot">
        <p><span data-cert-date></span><small>Completed</small></p>
        <p><span data-cert-span></span><small>Duration</small></p>
        <p><span data-cert-id></span><small>Certificate no.</small></p>
      </div>
    </div>
  </div>
  <div class="cert-dialog__controls">
    <label class="field">Name on the certificate <input type="text" data-cert-input name="name" autocomplete="name" placeholder="Your name"></label>
    <button type="button" class="button button--primary" data-cert-print>Print or save as PDF</button>
    <button type="button" class="button" data-cert-close>Close</button>
  </div>
</dialog>
<div class="cert-print" data-cert-print-root></div>
<script>window.COURSE = ${JSON.stringify({
    days: Object.fromEntries(DAYS.map((d) => [d.n, d.title.replace(/[`*]/g, '')])),
    concepts: DAYS.reduce((n, d) => n + d.concepts.length, 0),
  })};</script>
<script>${JS}</script>
</body>
</html>
`;
}

const out = process.argv[2];
if (!out) throw new Error('usage: node course/source/build.mjs <out.html>');
writeFileSync(out, page());
console.log('wrote', out);
