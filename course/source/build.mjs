// Generates course/index.html: node course/source/build.mjs course/index.html
import { readFileSync, writeFileSync } from 'node:fs';
import { FLAGS, dedent, escape as e, inline, md } from './model.mjs';
import { WEEK1 } from './week1.mjs';
import { WEEK2 } from './week2.mjs';
import { WEEK3, FINAL_REVIEW, CHEATSHEET } from './week3.mjs';
import { scenery, sprite, HERO_A, HERO_B, HERO_PAL, FOX_A, FOX_B, FOX_PAL } from './scenery.mjs';
import { QUIZ } from './quiz.mjs';
import { wordmarkSvg } from './logo.mjs';

// The favicon, inlined so index.html stays one self-contained file
const ICON = 'data:image/svg+xml,' + encodeURIComponent(readFileSync(new URL('../icons/favicon.svg', import.meta.url), 'utf8').trim());
const REPO = 'https://github.com/linearza/react-for-ember-engineers';
const DAYS = [...WEEK1, ...WEEK2, ...WEEK3];
const WEEKS = { 1: 'Core mental model', 2: 'Architecture', 3: 'Modern & advanced' };
const PRISM = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components';
const PRISM_COMPONENTS = ['core', 'markup', 'clike', 'javascript', 'typescript', 'jsx', 'tsx', 'markup-templating', 'handlebars', 'bash'];

if (DAYS.length !== 15) throw new Error(`expected 15 days, got ${DAYS.length}`);
if (FINAL_REVIEW.length !== 30) throw new Error(`expected 30 review questions, got ${FINAL_REVIEW.length}`);
for (const day of DAYS) {
  const quiz = QUIZ[day.n] ?? [];
  if (quiz.length !== day.drill.length) throw new Error(`day ${day.n}: ${day.drill.length} drill questions but ${quiz.length} in quiz.mjs`);
  quiz.forEach(({ q, choices }, i) => {
    if (q !== day.drill[i][0]) throw new Error(`day ${day.n} question ${i + 1}: quiz.mjs has "${q}", drill has "${day.drill[i][0]}"`);
    if (choices.length !== 4) throw new Error(`day ${day.n} question ${i + 1}: expected 4 choices, got ${choices.length}`);
  });
}

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

// 8-bit sprites for the quiz, drawn like the scenery
const pixelSvg = (rows, palette, cls) =>
  `<svg class="${cls}" viewBox="0 0 ${rows[0].length} ${rows.length}" shape-rendering="crispEdges" aria-hidden="true" focusable="false">${sprite(rows, palette)}</svg>`;
const COIN_PAL = { k: '#7a4a00', y: '#f8b800', w: '#fff6c0', o: '#c87800' };
const COIN = ['..kkkk..', '.kyyyyk.', 'kyywyyok', 'kywyyyok', 'kyyyyyok', 'kyyyyook', '.kooook.', '..kkkk..'];
const TROPHY = ['.kkkkkkk.', 'kywyyyyok', 'kywyyyyok', '.kyyyyok.', '..kyyok..', '...kyk...', '...kok...', '..kkkkk..', '..kyyok..', '..kkkkk..'];
const coinSvg = (cls = 'pixel-coin') => pixelSvg(COIN, COIN_PAL, cls);
const LOCK_PAL = { k: '#3a2a10', s: '#9aa3b8', y: '#f8b800', o: '#c87800' };
const PADLOCK = ['..ssss..', '.s....s.', '.s....s.', 'kkkkkkkk', 'kyyyyyok', 'kyykkyok', 'kyykkyok', 'kyyyyyok', 'kkkkkkkk'];
const padlockSvg = (cls) => pixelSvg(PADLOCK, LOCK_PAL, cls);
const twoFrames = (a, b, pal) => `<g class="f1">${sprite(a, pal)}</g><g class="f2">${sprite(b, pal)}</g>`;
// The Konami-code parade: the scenery's fox chasing its hero along the bottom of the screen
const PARADE = '<div class="parade__run">' +
  `<svg class="parade__fox" viewBox="0 0 10 5" shape-rendering="crispEdges">${twoFrames(FOX_A, FOX_B, FOX_PAL)}</svg>` +
  `<svg class="parade__hero" viewBox="0 0 9 11" shape-rendering="crispEdges">${twoFrames(HERO_A, HERO_B, HERO_PAL)}</svg></div>`;
// The reading bar: fills as you read the day's concepts, and a coin pops in at the end
const READBAR = `<div class="readbar" data-readbar hidden role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-label="Reading progress">
  <span class="readbar__bar"><span class="readbar__fill" data-readbar-fill></span></span>
  ${coinSvg('readbar__coin')}
</div>`;

// A deterministic shuffle, so the correct choice isn't always first but the page builds the same every time
function shuffled(items, seed) {
  let h = 2166136261;
  for (const ch of seed) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0;
    const j = h % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function quizQuestion(day, i, [q, a], { choices }) {
  const id = `d${day.n}-q${i + 1}`;
  const options = shuffled(choices.map((text, k) => ({ text, correct: k === 0 })), id)
    .map((c, k) => `<button type="button" class="quiz__opt" data-quiz-opt${c.correct ? ' data-correct' : ''}><span class="quiz__key" aria-hidden="true">${k + 1}</span><span>${inline(c.text)}</span></button>`)
    .join('');
  return `
<li class="quiz__q" data-quiz-q data-qid="${id}" hidden>
  <p class="quiz__count" data-quiz-count>Question ${i + 1} of ${day.drill.length}</p>
  <h3 class="quiz__legend" id="${id}" tabindex="-1">${inline(q)}</h3>
  <div class="quiz__opts" role="group" aria-labelledby="${id}">${options}</div>
  <p class="quiz__verdict" data-quiz-verdict role="status"></p>
  <div class="quiz__why prose" data-quiz-why hidden>${md(a)}</div>
</li>`;
}

function drill(day) {
  const n = day.drill.length;
  const items = day.drill.map((d, i) => quizQuestion(day, i, d, QUIZ[day.n][i])).join('');
  const sub = `${n} questions on today's ideas${day.n > 1 ? ', plus a few from earlier days to keep them fresh' : ''}. Pick an answer and see why it's right.`;
  return quizShell({ n: day.n, title: 'Check yourself', sub, items, count: n });
}

// The quiz screen. A boss quiz has no questions of its own: it fills up with earlier days' questions when it starts
function quizShell({ n, title, sub, items, count, boss = false }) {
  return `
<section class="panel quiz" data-quiz="${n}"${boss ? ' data-quiz-boss' : ''} aria-labelledby="d${n}-drill">
  <h2 id="d${n}-drill">${title}</h2>
  <div class="quiz__start" data-quiz-start-screen>
    <button type="button" class="quiz__coin" data-quiz-coin aria-label="Coin">${coinSvg()}</button>
    <p class="quiz__title pixel">Insert coin</p>
    <p class="quiz__sub">${sub} <span class="quiz__best" data-quiz-best></span></p>
    <div class="quiz__start-actions">
      <button type="button" class="quiz__press pixel" data-quiz-start>▶ Press start</button>
      <button type="button" class="button quiz__sound" data-quiz-sound aria-pressed="false">♪ Sound off</button>
    </div>
  </div>
  <div class="quiz__game" data-quiz-game hidden>
    <div class="quiz__hud pixel" aria-hidden="true">
      <span class="quiz__coins">${coinSvg()}×<span data-quiz-score>0</span></span>
      <span class="quiz__combo" data-quiz-combo></span>
      <ol class="quiz__pips">${'<li></li>'.repeat(count)}</ol>
    </div>
    <ol class="quiz__qs">${items}</ol>
    <div class="quiz__nav"><button type="button" class="button button--primary" data-quiz-next hidden>Next ▶</button></div>
    <div class="quiz__end" data-quiz-end hidden>
      ${pixelSvg(TROPHY, COIN_PAL, 'quiz__trophy')}
      <p class="quiz__rank pixel" data-quiz-rank></p>
      <h3 class="quiz__result" data-quiz-result tabindex="-1"></h3>
      <p class="quiz__msg" data-quiz-msg></p>
      <div class="quiz__end-actions">
        <button type="button" class="button button--primary" data-quiz-retake>↻ Play again</button>
        <button type="button" class="button quiz__sound" data-quiz-sound aria-pressed="false">♪ Sound off</button>
      </div>
    </div>
  </div>
</section>`;
}

function day15Extra() {
  const review = FINAL_REVIEW.map(([concern, q, a], i) => qa(i + 1, q, a, concern)).join('');
  const rows = CHEATSHEET
    .map(([ember, react, flag]) => `<tr><td>${inline(ember)}</td><td>${inline(react)}</td><td class="nowrap">${[...flag].map((c) => FLAGS[c][0]).join(' / ')}</td></tr>`)
    .join('');
  const boss = quizShell({ n: 15, title: 'Boss rush', items: '', count: 15, boss: true,
    sub: "15 questions from across the course, leaning on the ones you've missed. Pick an answer and see why it's right." });
  return `${boss}
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
    ? `<section class="day__concepts" aria-labelledby="d${day.n}-concepts"><h2 id="d${day.n}-concepts">Concepts</h2>${concepts}</section>`
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
        `<span class="nav__t">${inline(d.title)}</span><span class="nav__done" aria-hidden="true">✓</span><span class="nav__lock">${padlockSvg('')}</span></a></li>`)
      .join('');
    return `<li class="nav__week"><h2 class="nav__heading">Week ${week} · ${e(name)}</h2><ol>${links}</ol></li>`;
  }).join('');
}

// Dark palette, shared by the system-preference rule and the explicit [data-theme="dark"] rule
const DARK_TOKENS = String.raw`
  --bg: #10122a; --surface: #161936; --surface-2: #1f2347; --text: #eceef8; --muted: #a4abc8;
  --border: #2a2f58; --accent: #fb923c; --accent-soft: #2e1f2a; --link: #fdba74; --focus: #60a5fa;
  --green: #4ade80; --green-bg: #12261a; --yellow: #facc15; --yellow-bg: #29240f; --red: #f87171; --red-bg: #2c1515;
  --code-bg: #0c0e22; --tok-comment: #8a90ad; --tok-keyword: #d19af7; --tok-string: #8bd49c; --tok-fn: #82aaff;
  --tok-number: #f5b36b; --tok-tag: #fb923c; --tok-attr: #f0c674; --tok-punct: #a8adb7;
  --code-inline: #f9a8d4; --code-inline-bg: #2a1823;
  --sky-1: #0a0b20; --sky-2: #10133a; --sky-3: #18205a; --sky-4: #222d70; --star-opacity: 1; --fly-opacity: 1; --day-opacity: 0;
  --orb: #f4f4e0; --cloud: #262c55; --hill-1: #252c60; --hill-2: #1a2149; --hill-3: #151a3c; --tree: #0d1230;
  --tuft: #1f2a52; --flower: #3a4478; --bird: #070816; --cast-filter: brightness(0.72) saturate(0.85);
  --wm-ink: #f4f4f4; --wm-ink-side: #7c84b8; --wm-for: #fb923c; --wm-for-side: #c2410c; --wm-outline: #05060f;
  color-scheme: dark;`;

const CSS = String.raw`
:root {
  --bg: #f2f6ee; --surface: #ffffff; --surface-2: #e8eee2; --text: #17181c; --muted: #565f6b;
  --border: #d8e2cf; --accent: #c2410c; --accent-soft: #fff1e8; --link: #9a3412; --focus: #2563eb;
  --green: #15803d; --green-bg: #e9f7ee; --yellow: #a16207; --yellow-bg: #fdf6dd; --red: #b91c1c; --red-bg: #fdecec;
  --code-bg: #fafcf8; --tok-comment: #7c7f88; --tok-keyword: #a626a4; --tok-string: #2f7d32; --tok-fn: #2759c4;
  --tok-number: #b45309; --tok-tag: #c2410c; --tok-attr: #8a5a00; --tok-punct: #4b4f58;
  --code-inline: #a3195b; --code-inline-bg: #fbeef4;
  --sky-1: #4aa3f2; --sky-2: #66b4f5; --sky-3: #86c6f8; --sky-4: #abd9fa; --star: #ffffff; --star-opacity: 0; --fly-opacity: 0; --day-opacity: 1;
  --orb: #ffcd75; --cloud: #ffffff; --hill-1: #a3bccd; --hill-2: #63aa80; --hill-3: #48b86a; --tree: #2a7458;
  --tuft: #2f9a55; --flower: #f8e070; --bird: #2b3a67; --cast-filter: none;
  --wm-ink: #17181c; --wm-ink-side: #b4bccc; --wm-for: #c2410c; --wm-for-side: #f5b78a; --wm-outline: transparent;
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
.brand { display: block; width: fit-content; color: var(--text); line-height: 0; }
.brand svg { display: block; height: 12.5px; width: auto; }
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

main { min-width: 0; }
.content { padding: 1.25rem clamp(16px, 4vw, 3.5rem) 4rem; max-width: 1080px; }

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
  .topbar .brand svg { height: 10px; }
  .topbar__right { display: flex; align-items: center; gap: 0.6rem; font-size: 0.8rem; color: var(--muted); white-space: nowrap; font-variant-numeric: tabular-nums; }
  .sidebar { display: none; position: fixed; inset: 3.1rem 0 0 0; height: auto; z-index: 19; border-right: 0; }
  body.nav-open .sidebar { display: block; }
  body.nav-open { overflow: hidden; }
  .sidebar .brand, .sidebar .sub { display: none; }
  .content { padding: 1rem 16px 3rem; }
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
.live-tests__fails li.is-passed { color: var(--muted); }
.live-tests__fails li.is-passed::before { content: '✓'; color: var(--green); }
.live-tests__fails small { display: block; color: var(--muted); font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 0.75rem; overflow-wrap: anywhere; }
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
/* Check yourself: an 8-bit mini game. The HUD is an arcade screen, dark in both themes */
.pixel { font-family: 'Press Start 2P', ui-monospace, monospace; font-weight: 400; text-transform: uppercase; letter-spacing: 0.02em; line-height: 1.7; }
.pixel-coin { width: 1.25em; height: 1.25em; vertical-align: -0.2em; }
.quiz { scroll-margin-top: 4rem; }
.quiz__start { display: grid; justify-items: center; gap: 0.6rem; text-align: center; padding: 1.75rem 1rem 1.5rem; border: 2px dashed var(--border); border-radius: 12px; background: repeating-linear-gradient(0deg, transparent 0 3px, color-mix(in srgb, var(--text) 4%, transparent) 3px 4px), var(--bg); }
.quiz__coin { border: 0; background: none; padding: 0; cursor: pointer; animation: bob 1.2s steps(2) infinite; }
.quiz__coin .pixel-coin { width: 40px; height: 40px; display: block; }
.quiz__coin.is-spin { animation: coin-spin 0.4s steps(4); }
@keyframes bob { 50% { transform: translateY(-4px); } }
@keyframes coin-spin { 50% { transform: scaleX(0.15); } }
.quiz__title { margin: 0; font-size: 1rem; color: var(--accent); animation: blink 1.1s steps(1) infinite; }
@keyframes blink { 50% { opacity: 0.25; } }
.quiz__sub { margin: 0; max-width: 44ch; color: var(--muted); }
.quiz__best { display: block; margin-top: 0.3rem; font-weight: 700; color: var(--text); }
.quiz__best:empty { display: none; }
.quiz__start-actions, .quiz__end-actions { display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 0.6rem; margin-top: 0.5rem; }
.quiz__press { font-size: 0.8rem; cursor: pointer; color: var(--bg); background: var(--accent); border: 0; border-radius: 0; padding: 0.95rem 1.2rem 0.85rem; box-shadow: 0 4px 0 color-mix(in srgb, var(--accent) 55%, #000), inset -4px -4px 0 rgb(0 0 0 / 0.2); }
.quiz__press:hover { filter: brightness(1.08); }
.quiz__press:active { transform: translateY(4px); box-shadow: inset -4px -4px 0 rgb(0 0 0 / 0.2); }
.quiz__hud { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem 1rem; padding: 0.65rem 0.8rem; margin-bottom: 1.1rem; border-radius: 8px; background: #10122a; color: #f4f4f4; font-size: 0.7rem; }
.quiz__coins { display: inline-flex; align-items: center; gap: 0.4rem; color: #f8b800; }
.quiz__combo { color: #fb923c; }
.quiz__combo:empty { display: none; }
.quiz__combo.is-flash { animation: zoom 0.45s steps(3); }
.quiz__combo.is-hot { color: #f87171; }
@keyframes zoom { from { transform: scale(1.7); } }
.quiz__pips { display: flex; flex-wrap: wrap; gap: 4px; list-style: none; margin: 0 0 0 auto; padding: 0; }
.quiz__pips li { width: 12px; height: 12px; background: #2a2f58; }
.quiz__pips li.is-current { background: #f4f4f4; animation: blink 0.8s steps(1) infinite; }
.quiz__pips li.is-right { background: #4ade80; animation: none; }
.quiz__pips li.is-wrong { background: #f87171; animation: none; }
.quiz__qs { list-style: none; margin: 0; padding: 0; }
.quiz__start[hidden], .quiz__game[hidden], .quiz__q[hidden], .quiz__why[hidden] { display: none; }
.quiz__count { margin: 0 0 0.25rem; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); }
.quiz__from { display: inline-block; margin-left: 0.6rem; padding: 0.2rem 0.4rem; box-shadow: 0 -2px 0 currentColor, 0 2px 0 currentColor, -2px 0 0 currentColor, 2px 0 0 currentColor; font-family: 'Press Start 2P', ui-monospace, monospace; font-size: 0.5rem; letter-spacing: 0; color: var(--accent); vertical-align: 1px; }
.quiz__legend { margin: 0 0 0.9rem; font-size: 1.1rem; }
.quiz__legend:focus, .quiz__result:focus { outline: none; }
.quiz__opts { display: grid; gap: 0.5rem; }
.quiz__opt { position: relative; display: grid; grid-template-columns: 1.6rem 1fr; gap: 0.6rem; align-items: baseline; text-align: left; font: inherit; color: var(--text); background: var(--bg); border: 2px solid var(--border); border-radius: 10px; padding: 0.7rem 0.9rem; cursor: pointer; transition: transform 90ms steps(2), border-color 90ms; }
.quiz__opt:hover:not([aria-disabled='true']) { border-color: var(--accent); transform: translateX(3px); }
.quiz__opt[aria-disabled='true'] { cursor: default; }
.quiz__key { font-family: 'Press Start 2P', ui-monospace, monospace; font-size: 0.65rem; color: var(--muted); }
.quiz__q.is-answered .quiz__opt:not(.is-correct):not(.is-wrong) { opacity: 0.55; }
.quiz__opt.is-correct { border-color: var(--green); background: var(--green-bg); }
.quiz__opt.is-wrong { border-color: var(--red); background: var(--red-bg); }
.quiz__opt.is-correct .quiz__key, .quiz__opt.is-wrong .quiz__key { font-size: 0; }
.quiz__opt.is-correct .quiz__key::after { content: '✓'; font-size: 0.95rem; color: var(--green); }
.quiz__opt.is-wrong .quiz__key::after { content: '✗'; font-size: 0.95rem; color: var(--red); }
.quiz__q.shake { animation: shake 0.36s steps(6); }
@keyframes shake { 0%, 100% { transform: none; } 20%, 60% { transform: translateX(-6px); } 40%, 80% { transform: translateX(6px); } }
.quiz__verdict { margin: 1rem 0 0; font-weight: 700; }
.quiz__verdict:empty { display: none; }
.quiz__q.is-right .quiz__verdict { color: var(--green); }
.quiz__q.is-wrong .quiz__verdict { color: var(--red); }
.quiz__why { margin-top: 0.5rem; padding: 0.8rem 0.95rem; border-left: 4px solid var(--border); border-radius: 0 8px 8px 0; background: var(--bg); }
.quiz__q.is-right .quiz__why { border-left-color: var(--green); }
.quiz__q.is-wrong .quiz__why { border-left-color: var(--red); }
.quiz__nav { display: flex; justify-content: flex-end; margin-top: 1rem; }
.quiz__nav [hidden] { display: none; }
.coin-pop { position: absolute; right: 0.9rem; top: 50%; display: inline-flex; align-items: center; gap: 0.3rem; font-family: 'Press Start 2P', ui-monospace, monospace; font-size: 0.65rem; color: #c87800; pointer-events: none; animation: coin-pop 0.9s steps(9) forwards; }
@keyframes coin-pop { from { transform: translateY(-50%); } to { transform: translateY(-260%); opacity: 0; } }
.quiz__end { display: grid; justify-items: center; gap: 0.5rem; text-align: center; padding: 0.75rem 0 0.25rem; }
.quiz__end[hidden] { display: none; }
.quiz__trophy { width: 54px; height: 60px; filter: grayscale(1) opacity(0.55); }
.quiz__end.is-flawless .quiz__trophy { filter: none; animation: bob 1.2s steps(2) infinite; }
.quiz__rank { margin: 0; font-size: 1.4rem; color: var(--accent); }
.quiz__rank[data-rank='S'] { color: #f8b800; text-shadow: 3px 3px 0 #c2410c; animation: zoom 0.6s steps(4); }
.quiz__result { margin: 0; font-size: 1.15rem; }
.quiz__msg { margin: 0; max-width: 46ch; color: var(--muted); }
.toasts { position: fixed; left: 50%; bottom: 1.25rem; transform: translateX(-50%); display: grid; gap: 0.5rem; width: min(440px, calc(100vw - 32px)); z-index: 1001; pointer-events: none; }
.toast { padding: 0.85rem 1rem; background: #10122a; color: #f4f4f4; border: 2px solid #fb923c; box-shadow: 4px 4px 0 rgb(0 0 0 / 0.35); font-size: 0.62rem; text-align: center; animation: toast-in 0.3s steps(3); }
.toast.is-out { opacity: 0; transition: opacity 0.4s steps(4); }
@keyframes toast-in { from { transform: translateY(16px); opacity: 0; } }
.parade { position: fixed; left: 0; bottom: 0; width: 100vw; height: 52px; overflow: hidden; pointer-events: none; z-index: 1000; }
.parade__run { position: absolute; left: 0; bottom: 4px; display: flex; align-items: flex-end; gap: 28px; animation: parade 4.5s steps(90) forwards; }
.parade__hero { height: 44px; width: 36px; }
.parade__fox { height: 20px; width: 40px; transform: scaleX(-1); }
.parade__run .f1 { animation: frame 0.3s steps(1) infinite reverse; }
.parade__run .f2 { animation: frame 0.3s steps(1) infinite; }
@keyframes parade { from { transform: translateX(-160px); } to { transform: translateX(calc(100vw + 40px)); } }

/* Locked days */
.nav__lock { display: none; }
.nav__lock svg { width: 10px; height: 12px; vertical-align: -1px; }
.nav a.is-locked { color: var(--muted); }
.nav a.is-locked .nav__done { display: none; }
.nav a.is-locked .nav__lock { display: inline; }
.locked { display: grid; justify-items: center; gap: 0.7rem; text-align: center; padding: 3rem 1.25rem; margin-top: 1rem; }
.locked[hidden] { display: none; }
.locked__padlock { width: 48px; height: 54px; animation: rattle 2.4s steps(1) infinite; }
@keyframes rattle { 0%, 88% { transform: none; } 91% { transform: rotate(-8deg); } 94% { transform: rotate(8deg); } 97% { transform: rotate(-4deg); } }
.locked h1 { margin: 0; font-size: 1.6rem; }
.locked h1:focus { outline: none; }
.locked p { margin: 0; max-width: 46ch; color: var(--muted); }
.locked .button { margin-top: 0.75rem; text-decoration: none; }
.locked__hint { margin-top: 1.75rem !important; font-size: 0.58rem; opacity: 0.75; }

/* Reading bar */
.readbar { position: sticky; top: 0; z-index: 15; display: flex; align-items: center; gap: 0.7rem; margin: 0 0 1.25rem; padding: 0.55rem 2px; background: var(--bg); }
.readbar[hidden] { display: none; }
/* Box-shadow edges with no corners: the stepped outline of an old game's health bar */
.readbar__bar { flex: 1; height: 6px; padding: 1px; background: var(--surface-2); box-shadow: 0 -2px 0 var(--border), 0 2px 0 var(--border), -2px 0 0 var(--border), 2px 0 0 var(--border); opacity: 0.8; transition: opacity 300ms ease; }
.readbar:hover .readbar__bar, .readbar.is-clear .readbar__bar { opacity: 1; }
.readbar__fill { display: block; height: 100%; width: 0; background: repeating-linear-gradient(90deg, var(--accent) 0 6px, transparent 6px 8px); transition: width 700ms cubic-bezier(0.22, 1, 0.36, 1); }
.readbar.is-settling .readbar__fill { transition: none; }
.readbar__coin { flex: none; width: 14px; height: 14px; filter: grayscale(1); opacity: 0.25; }
.readbar.is-clear .readbar__coin { filter: none; opacity: 1; }
.readbar.is-popping .readbar__coin { animation: readbar-coin 650ms cubic-bezier(0.34, 1.56, 0.64, 1) 450ms both; }
@keyframes readbar-coin { 0% { transform: translateY(4px) scale(0.2); filter: grayscale(1); opacity: 0.25; } 55% { transform: translateY(-7px) scale(1.25); filter: none; opacity: 1; } 100% { transform: none; } }
@media (max-width: 900px) { .readbar { top: var(--topbar-h, 3.75rem); } }
.confetti { position: fixed; inset: 0; width: 100vw; height: 100vh; max-width: none; max-height: none; margin: 0; padding: 0; border: 0; background: transparent; pointer-events: none; z-index: 1000; overflow: visible; }

/* How it works */
.icon-button { display: inline-grid; place-items: center; width: 34px; height: 34px; padding: 0; border: 1px solid var(--border); border-radius: 50%; background: var(--surface); color: var(--muted); cursor: pointer; flex: none; }
.icon-button:hover { color: var(--text); border-color: var(--accent); }
.sidebar__head { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; }
.intro { width: min(520px, calc(100vw - 32px)); max-height: calc(100vh - 32px); border: 1px solid var(--border); border-radius: 18px; background: var(--surface); padding: 1.75rem 1.5rem 1.5rem; }
.intro[open] { animation: pop 380ms cubic-bezier(0.2, 1.4, 0.4, 1); }
.intro__head { display: flex; align-items: center; gap: 0.85rem; margin-bottom: 0.4rem; }
.intro h2 { font-size: 1.35rem; letter-spacing: -0.02em; }
.intro__lead { color: var(--muted); margin: 0 0 1.1rem; }
.intro__steps { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.85rem; }
.intro__steps li { display: grid; grid-template-columns: 2rem 1fr; gap: 0.75rem; align-items: start; }
.intro__n { display: grid; place-items: center; width: 2rem; height: 2rem; border-radius: 50%; background: var(--accent-soft); color: var(--accent); font-weight: 800; font-size: 0.9rem; }
.intro__steps h3 { font-size: 1rem; margin: 0.15rem 0 0.1rem; }
.intro__steps h3 small { font-weight: 400; color: var(--muted); font-size: 0.85rem; margin-left: 0.35rem; }
.intro__steps p { margin: 0; color: var(--muted); font-size: 0.92rem; }
.intro__stack { margin: 1.25rem 0 0; font-size: 0.88rem; color: var(--muted); }
.intro__stack strong { color: var(--text); }
.intro__foot { margin: 1.25rem 0 0; padding-top: 1rem; border-top: 1px solid var(--border); font-size: 0.88rem; color: var(--muted); }
.intro__actions { display: flex; justify-content: flex-end; margin-top: 1.25rem; }

/* Scenery banner: a still pixel landscape with a moving cast */
.scene { aspect-ratio: 4 / 1; min-height: 150px; max-height: 360px; width: 100%; overflow: hidden; background: var(--sky-1); }
.scene svg { display: block; width: 100%; height: 100%; }
.scene__cast { filter: var(--cast-filter); }
.scene__day { opacity: var(--day-opacity); }
.scene__clouds { animation: drift 240s steps(480) infinite; }
@keyframes drift { to { transform: translateX(-480px); } }
.scene__f2 { animation: frame 0.5s steps(1) infinite; }
.scene__f1 { animation: frame 0.5s steps(1) infinite reverse; }
@keyframes frame { 50% { opacity: 0; } }
.scene__walk--hero { animation: walk-right 48s steps(500) infinite; }
.scene__walk--fox { animation: walk-left 31s steps(500) -12s infinite; }
.scene__walk--rabbit { animation: walk-left 64s steps(250) -40s infinite; }
.scene__walk--fox .scene__f1, .scene__walk--fox .scene__f2 { animation-duration: 0.3s; }
@keyframes walk-right { from { transform: translateX(-12px); } to { transform: translateX(492px); } }
@keyframes walk-left { from { transform: translateX(492px); } to { transform: translateX(-12px); } }
.scene__hop { animation: hop 0.7s steps(1) infinite; }
@keyframes hop { 50% { transform: translateY(-3px); } }
.scene__bird { animation: fly-across 26s steps(260) infinite; }
.scene__bird .scene__f1, .scene__bird .scene__f2 { animation-duration: 0.36s; }
@keyframes fly-across { 0% { transform: translate(-30px, 6px); } 50% { transform: translate(240px, 0); } 100% { transform: translate(510px, 8px); } }
.scene__butterfly { animation: flutter 7s steps(28) infinite; }
.scene__butterfly .scene__f1, .scene__butterfly .scene__f2 { animation-duration: 0.24s; }
@keyframes flutter { 0%, 100% { transform: translate(0, 0); } 25% { transform: translate(6px, -5px); } 50% { transform: translate(12px, -1px); } 75% { transform: translate(5px, -7px); } }
.scene__stars { opacity: var(--star-opacity); }
.scene__star { animation: twinkle 3.2s steps(2) infinite; }
@keyframes twinkle { 50% { opacity: 0.2; } }
.scene__flies { opacity: var(--fly-opacity); }
.scene__fly { animation: firefly 6s steps(12) infinite; }
@keyframes firefly { 0%, 100% { transform: translate(0, 0); opacity: 0; } 25% { transform: translate(3px, -2px); opacity: 1; } 50% { transform: translate(6px, 0); opacity: 0.3; } 75% { transform: translate(3px, 2px); opacity: 1; } }
.scene__ember { animation: ember 1.6s steps(6) infinite; }
@keyframes ember { 0% { transform: translate(0, 0); opacity: 1; } 100% { transform: translate(2px, -8px); opacity: 0; } }
@media (prefers-reduced-motion: reduce) {
  .scene * { animation: none !important; }
  .scene__f2 { opacity: 0; }
  .quiz, .quiz *, .locked__padlock, .toast, .readbar * { animation: none !important; transition: none !important; }
  .coin-pop { display: none; }
}

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
.certificate__logo { --wm-ink: #1c1917; --wm-ink-side: #d6c9b8; --wm-for: #c2410c; --wm-for-side: #f5b78a; --wm-outline: transparent; }
.certificate__logo svg { display: block; width: 40cqi; height: auto; margin: 0 auto 2.4cqi; }
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
  .sidebar, .topbar, .day__foot, .skip, .readbar, [data-print-cheatsheet] { display: none !important; }
  .shell { display: block; }
  .content { padding: 0; max-width: none; }
  .scene { display: none !important; }
  .qa .qa__a { display: block; }
  .quiz__start, .quiz__hud, .quiz__nav, .quiz__end, .quiz__verdict, .locked, .toasts { display: none !important; }
  .quiz__game, .quiz__q, .quiz__why { display: block !important; }
  .quiz__q { margin-bottom: 1.25rem; break-inside: avoid; }
  .quiz__opt[data-correct] { border-color: currentColor; font-weight: 700; }
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
  var current = null;

  // Days unlock one at a time: the day after the furthest one you've finished is open
  var UNLOCK_ALL = 'react-for-ember:unlock-all';
  var unlockAll = store.get(UNLOCK_ALL) === '1';
  var lockedPanel = document.querySelector('[data-locked]');
  function frontier() {
    var max = 0;
    completed.forEach(function (n) { if (n > max) max = n; });
    return Math.min(max + 1, TOTAL);
  }
  function isUnlocked(n) { return unlockAll || n <= frontier(); }
  function renderLock() {
    if (current === null) return;
    var locked = !isUnlocked(current);
    days.forEach(function (d) { d.hidden = locked || Number(d.dataset.day) !== current; });
    lockedPanel.hidden = !locked;
    if (!locked) return;
    var f = frontier();
    lockedPanel.querySelector('[data-locked-title]').textContent = 'Day ' + current + ' is locked';
    lockedPanel.querySelector('[data-locked-text]').textContent = live
      ? 'Get Day ' + f + '’s tests passing and the next day opens by itself.'
      : 'Finish Day ' + f + ' and mark it complete to open the next one.';
    var go = lockedPanel.querySelector('[data-locked-go]');
    go.href = '#day-' + f;
    go.textContent = 'Go to Day ' + f;
  }

  function renderProgress() {
    var count = completed.size;
    document.querySelectorAll('[data-progress-text]').forEach(function (el) { el.textContent = count + ' / ' + TOTAL + ' complete'; });
    document.querySelectorAll('[data-progress-short]').forEach(function (el) { el.textContent = count + '/' + TOTAL + ' ✓'; el.setAttribute('aria-label', count + ' of ' + TOTAL + ' days complete'); });
    document.querySelectorAll('.progress__fill').forEach(function (el) { el.style.width = (count / TOTAL * 100) + '%'; });
    document.querySelectorAll('.progress__bar').forEach(function (el) { el.setAttribute('aria-valuenow', String(count)); });
    navLinks.forEach(function (a) {
      var n = Number(a.dataset.nav);
      var done = completed.has(n);
      var locked = !isUnlocked(n);
      a.classList.toggle('is-done', done);
      a.classList.toggle('is-locked', locked);
      var label = a.querySelector('.nav__t').textContent;
      a.setAttribute('aria-label', 'Day ' + n + ': ' + label + (done ? ' (complete)' : locked ? ' (locked)' : ''));
    });
    renderLock();
    renderReading();
    document.querySelectorAll('[data-complete]').forEach(function (btn) {
      var done = completed.has(Number(btn.dataset.complete));
      btn.setAttribute('aria-pressed', String(done));
      btn.textContent = done ? 'Day complete' : 'Mark day complete';
    });
  }

  function show(n, focus) {
    if (!(n >= 1 && n <= TOTAL)) n = 1;
    current = n;
    renderLock();
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
    if (focus) { window.scrollTo(0, 0); (isUnlocked(n) ? day : lockedPanel).querySelector('h1').focus({ preventScroll: true }); }
    renderReading();
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

  // style: undefined for paper confetti, 'pixel' for 8-bit squares, 'coins' for a gold shower
  function confetti(big, style) {
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
    var colors = style === 'coins' ? ['#f8b800', '#fff6c0', '#c87800']
      : style === 'pixel' ? ['#f8b800', '#e45c10', '#3cbcfc', '#80d010', '#f878f8', '#fcfcfc']
      : ['#fb923c', '#fbbf24', '#f97316', '#60a5fa', '#4ade80', '#f472b6', '#c084fc'];
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
        ctx.fillStyle = p.c;
        if (style) { var px = Math.round(p.s / 4) * 4 || 4; ctx.fillRect(Math.round(p.x / 4) * 4, Math.round(p.y / 4) * 4, px, px); ctx.restore(); return; }
        ctx.translate(p.x, p.y); ctx.rotate(p.r);
        if (p.round) { ctx.beginPath(); ctx.arc(0, 0, p.s / 2.6, 0, 6.283); ctx.fill(); }
        else ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2 * (0.6 + 0.4 * Math.abs(Math.cos(p.r * 2))));
        ctx.restore();
      });
      if (el < life) window.requestAnimationFrame(frame);
      else canvas.remove();
    }
    window.requestAnimationFrame(frame);
  }

  // ---------------------------------------------------------------- check yourself: the 8-bit quiz
  var QUIZ_BEST = 'react-for-ember:quiz-best';
  var SOUND = 'react-for-ember:sound';
  var best = {};
  try { best = JSON.parse(store.get(QUIZ_BEST) || '{}') || {}; } catch (e) { best = {}; }
  var soundOn = store.get(SOUND) === '1';
  var audio = null;
  var RIGHT = ['Correct!', 'Nice!', 'Spot on.', 'Nailed it.', 'Yes!'];
  var WRONG = ['Not quite.', 'Close, but no.', 'Oof.', 'Nope.'];
  var SFX = { coin: [988, 1319], wrong: [196, 147], start: [523, 659, 784, 1047], combo: [784, 988, 1175], win: [523, 659, 784, 1047, 784, 1047] };
  var toasts = document.querySelector('[data-toasts]');

  function reducedMotion() { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } }
  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }
  function each(root, sel, fn) { Array.prototype.forEach.call(root.querySelectorAll(sel), fn); }
  function questions(root) { return Array.prototype.slice.call(root.querySelectorAll('[data-quiz-q]')); }
  function own(root) { return questions(root).filter(function (li) { return !li.hasAttribute('data-review'); }); }

  // Spaced review, Leitner style. Every question sits in a box: a right answer moves it up a box and a
  // wrong one sends it back to the first, and each box waits longer before the question comes back.
  // Time is counted in course days, so doing three days in one sitting still spaces them out
  var REVIEW = 'react-for-ember:review';
  var INTERVALS = [1, 2, 4, 8];
  var REVIEW_COUNT = 3;
  var BOSS_COUNT = 15;
  var reviewLog = {};
  try { reviewLog = JSON.parse(store.get(REVIEW) || '{}') || {}; } catch (e) { reviewLog = {}; }
  function isBoss(root) { return root.hasAttribute('data-quiz-boss'); }
  function totalFor(root) { return isBoss(root) ? BOSS_COUNT : own(root).length; }

  function remember(qid, now, right) {
    var r = reviewLog[qid];
    // Replaying a quiz the same day can't race a question up the boxes
    if (right && r && r.last === now) return;
    reviewLog[qid] = { box: right ? Math.min(INTERVALS.length - 1, r ? r.box + 1 : 1) : 0, last: now };
    store.set(REVIEW, JSON.stringify(reviewLog));
  }

  // Questions from days before now: due ones first, then ones you've missed, then the weakest.
  // The boss rush ignores due dates
  function pickReviews(now, count, boss) {
    var pool = [];
    each(document, '[data-quiz]:not([data-quiz-boss])', function (quiz) {
      var day = Number(quiz.dataset.quiz);
      if (day >= now || !isUnlocked(day)) return;
      own(quiz).forEach(function (li) {
        var r = reviewLog[li.dataset.qid];
        var box = r ? r.box : 0;
        var late = now - (r ? r.last : day) - INTERVALS[box];
        pool.push({ li: li, due: boss || late >= 0 ? 1 : 0, missed: r && r.box === 0 ? 1 : 0, box: box, late: boss ? 0 : late, rand: Math.random() });
      });
    });
    pool.sort(function (a, b) { return (b.due - a.due) || (b.missed - a.missed) || (a.box - b.box) || (b.late - a.late) || (a.rand - b.rand); });
    return pool.slice(0, count).map(function (p) { return p.li; });
  }

  // Copy the picked questions in, each slotted somewhere after today's first one
  function dealReviews(root) {
    var now = Number(root.dataset.quiz);
    each(root, '[data-review]', function (li) { li.remove(); });
    var order = own(root);
    pickReviews(now, isBoss(root) ? BOSS_COUNT : REVIEW_COUNT, isBoss(root)).forEach(function (src) {
      var li = src.cloneNode(true);
      li.setAttribute('data-review', src.closest('[data-quiz]').dataset.quiz);
      var legend = li.querySelector('.quiz__legend');
      legend.id += '-r' + now;
      li.querySelector('.quiz__opts').setAttribute('aria-labelledby', legend.id);
      order.splice(1 + Math.floor(Math.random() * order.length), 0, li);
    });
    var list = root.querySelector('.quiz__qs');
    order.forEach(function (li, k) {
      list.appendChild(li);
      var count = li.querySelector('[data-quiz-count]');
      count.textContent = 'Question ' + (k + 1) + ' of ' + order.length;
      if (li.dataset.review) {
        var from = document.createElement('span');
        from.className = 'quiz__from';
        from.textContent = 'Day ' + li.dataset.review;
        count.appendChild(from);
      }
    });
    root.querySelector('.quiz__pips').innerHTML = new Array(order.length + 1).join('<li></li>');
    return order.length - own(root).length;
  }

  // Browsers only let a page start audio from a click or key press, and a context made any other way
  // (say, the reading coin popping in while scrolling) stays paused. So wake it again on every one
  function audioContext() {
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      if (audio.state === 'suspended') audio.resume();
    } catch (e) { audio = null; }
    return audio;
  }
  ['pointerdown', 'keydown'].forEach(function (type) {
    document.addEventListener(type, function () { if (soundOn) audioContext(); }, true);
  });

  // Square-wave blips, like an old console. Off until the learner turns sound on
  function blip(notes) {
    if (!soundOn || !audioContext()) return;
    try {
      var t = audio.currentTime;
      notes.forEach(function (f, i) {
        var osc = audio.createOscillator();
        var gain = audio.createGain();
        var at = t + i * 0.08;
        osc.type = 'square';
        osc.frequency.value = f;
        gain.gain.setValueAtTime(0.08, at);
        gain.gain.exponentialRampToValueAtTime(0.001, at + 0.12);
        osc.connect(gain); gain.connect(audio.destination);
        osc.start(at); osc.stop(at + 0.13);
      });
    } catch (e) { /* no Web Audio: stay silent */ }
  }
  function renderSound() {
    each(document, '[data-quiz-sound]', function (b) {
      b.setAttribute('aria-pressed', String(soundOn));
      b.textContent = soundOn ? '♪ Sound on' : '♪ Sound off';
    });
  }

  function toast(text) {
    var t = document.createElement('p');
    t.className = 'toast pixel';
    t.textContent = text;
    toasts.appendChild(t);
    window.setTimeout(function () { t.classList.add('is-out'); }, 3600);
    window.setTimeout(function () { t.remove(); }, 4100);
  }

  function renderBest(root) {
    var score = best[root.dataset.quiz];
    var total = totalFor(root);
    root.querySelector('[data-quiz-best]').textContent = score == null ? '' : 'Hi-score: ' + score + ' / ' + total + (score === total ? ' ★' : '');
  }

  function resetQuestion(li, reshuffle) {
    li.classList.remove('is-answered', 'is-right', 'is-wrong', 'shake');
    li.querySelector('[data-quiz-verdict]').textContent = '';
    li.querySelector('[data-quiz-why]').hidden = true;
    var opts = li.querySelector('.quiz__opts');
    var buttons = Array.prototype.slice.call(opts.children);
    // On a replay, shuffle again so you can't win from memory of positions
    if (reshuffle) for (var i = buttons.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var tmp = buttons[i]; buttons[i] = buttons[j]; buttons[j] = tmp; }
    buttons.forEach(function (b, k) {
      b.removeAttribute('aria-disabled');
      b.classList.remove('is-correct', 'is-wrong');
      b.querySelector('.quiz__key').textContent = String(k + 1);
      opts.appendChild(b);
    });
  }

  function startQuiz(root) {
    var replay = !!root._quiz;
    var reviews = dealReviews(root);
    root._quiz = { i: 0, score: 0, recall: 0, reviews: reviews, coins: 0, combo: 0 };
    // Copied questions always reshuffle, so their answer isn't where it was on their own day
    questions(root).forEach(function (li) { resetQuestion(li, replay || li.hasAttribute('data-review')); });
    each(root, '.quiz__pips li', function (p) { p.className = ''; });
    root.querySelector('[data-quiz-start-screen]').hidden = true;
    root.querySelector('[data-quiz-game]').hidden = false;
    root.querySelector('[data-quiz-end]').hidden = true;
    root.querySelector('[data-quiz-score]').textContent = '0';
    renderCombo(root, false);
    blip(SFX.start);
    goTo(root, 0);
  }

  function goTo(root, i) {
    root._quiz.i = i;
    questions(root).forEach(function (li, k) { li.hidden = k !== i; });
    root.querySelector('[data-quiz-next]').hidden = true;
    each(root, '.quiz__pips li', function (p, k) { p.classList.toggle('is-current', k === i); });
    if (root.getBoundingClientRect().top < 0) root.scrollIntoView({ block: 'start', behavior: reducedMotion() ? 'auto' : 'smooth' });
    questions(root)[i].querySelector('.quiz__legend').focus({ preventScroll: true });
  }

  function renderCombo(root, flash) {
    var combo = root._quiz.combo;
    var el = root.querySelector('[data-quiz-combo]');
    el.textContent = combo >= 5 ? '🔥 On fire ×' + combo : combo >= 2 ? 'Combo ×' + combo : '';
    el.classList.toggle('is-hot', combo >= 5);
    el.classList.remove('is-flash');
    if (flash && combo >= 2) { void el.offsetWidth; el.classList.add('is-flash'); }
  }

  function popCoin(btn) {
    var pop = document.createElement('span');
    pop.className = 'coin-pop';
    pop.setAttribute('aria-hidden', 'true');
    pop.innerHTML = document.querySelector('.quiz__coins .pixel-coin').outerHTML + '+1';
    btn.appendChild(pop);
    window.setTimeout(function () { pop.remove(); }, 950);
  }

  function answer(root, btn) {
    var li = btn.closest('[data-quiz-q]');
    if (li.classList.contains('is-answered')) return;
    var st = root._quiz;
    var right = btn.hasAttribute('data-correct');
    li.classList.add('is-answered', right ? 'is-right' : 'is-wrong');
    each(li, '[data-quiz-opt]', function (b) {
      b.setAttribute('aria-disabled', 'true');
      if (b.hasAttribute('data-correct')) b.classList.add('is-correct');
    });
    if (!right) btn.classList.add('is-wrong');
    root.querySelectorAll('.quiz__pips li')[st.i].classList.add(right ? 'is-right' : 'is-wrong');
    remember(li.dataset.qid, Number(root.dataset.quiz), right);
    if (right) {
      if (li.hasAttribute('data-review')) st.recall++; else st.score++;
      st.coins++;
      st.combo++;
      root.querySelector('[data-quiz-score]').textContent = String(st.coins);
      popCoin(btn);
      blip(st.combo >= 3 ? SFX.combo : SFX.coin);
    } else {
      st.combo = 0;
      blip(SFX.wrong);
      li.classList.remove('shake'); void li.offsetWidth; li.classList.add('shake');
    }
    renderCombo(root, right);
    li.querySelector('[data-quiz-verdict]').textContent = right
      ? '✓ ' + pick(RIGHT) + (st.combo >= 3 ? ' Combo ×' + st.combo + '!' : '')
      : '✗ ' + pick(WRONG) + ' The right answer is marked ✓.';
    li.querySelector('[data-quiz-why]').hidden = false;
    var next = root.querySelector('[data-quiz-next]');
    next.textContent = st.i === questions(root).length - 1 ? 'See your score ▶' : 'Next ▶';
    next.hidden = false;
    next.focus({ preventScroll: true });
  }

  function finish(root) {
    var st = root._quiz;
    var n = root.dataset.quiz;
    var boss = isBoss(root);
    // The hi-score only counts the day's own questions, so the earlier ones can't make a replay harder.
    // In the boss rush every question is an earlier one
    var score = boss ? st.recall : st.score;
    var total = boss ? st.reviews : own(root).length;
    questions(root).forEach(function (li) { li.hidden = true; });
    root.querySelector('[data-quiz-next]').hidden = true;
    var ratio = score / total;
    var rank = ratio === 1 ? 'S' : ratio >= 0.8 ? 'A' : ratio >= 0.6 ? 'B' : ratio >= 0.4 ? 'C' : 'D';
    var msg = {
      S: 'Flawless. Not a single miss.',
      A: 'Great run. Revisit the one you missed, then go for the S.',
      B: 'Solid. Skim the concepts you missed and play again.',
      C: 'Continue? Re-read today’s concepts and insert another coin.',
      D: 'Game over… or is it? Re-read today’s concepts and try again.',
    }[rank];
    if (boss) msg = msg.replace('today’s concepts', 'the days you missed');
    else if (rank === 'S') msg = 'Not a single miss on today’s ideas.';
    var prev = best[n];
    var record = prev == null || score > prev;
    if (record) { best[n] = score; store.set(QUIZ_BEST, JSON.stringify(best)); }
    var end = root.querySelector('[data-quiz-end]');
    end.hidden = false;
    end.classList.toggle('is-flawless', rank === 'S');
    var rankEl = root.querySelector('[data-quiz-rank]');
    rankEl.textContent = 'Rank ' + rank;
    rankEl.dataset.rank = rank;
    root.querySelector('[data-quiz-result]').textContent = 'You got ' + score + ' of ' + total + (record && prev != null ? '. New hi-score!' : '');
    var recall = !boss && st.reviews ? ' From earlier days: ' + st.recall + ' of ' + st.reviews + ' remembered.' : '';
    root.querySelector('[data-quiz-msg]').textContent = msg + recall;
    root.querySelector('[data-quiz-result]').focus({ preventScroll: true });
    renderBest(root);
    if (rank === 'S') {
      blip(SFX.win);
      confetti(false, 'pixel');
      var all = Array.prototype.every.call(document.querySelectorAll('[data-quiz]'), function (r) { return best[r.dataset.quiz] === totalFor(r); });
      if (all) toast('★ Every quiz flawless. You are the final boss now.');
    } else blip(rank === 'A' ? SFX.coin : SFX.wrong);
  }

  // Easter egg: poke the coin enough times and it pays out
  function pokeCoin(btn) {
    btn.classList.remove('is-spin'); void btn.offsetWidth; btn.classList.add('is-spin');
    blip(SFX.coin);
    btn._pokes = (btn._pokes || 0) + 1;
    if (btn._pokes === 5) {
      btn._pokes = 0;
      confetti(false, 'coins');
      toast('🪙 Coin stash found! Sadly, coins have no cash value.');
    }
  }

  // Easter egg: the Konami code unlocks every day, with a little parade
  var KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  var konami = 0;
  function cheat() {
    unlockAll = !unlockAll;
    store.set(UNLOCK_ALL, unlockAll ? '1' : '0');
    renderProgress();
    blip(SFX.win);
    toast(unlockAll ? '↑↑↓↓←→←→BA: cheat accepted. Every day is unlocked.' : 'Cheat off: days unlock as you finish them again.');
    if (!unlockAll || reducedMotion()) return;
    var parade = document.createElement('div');
    parade.className = 'parade';
    parade.setAttribute('aria-hidden', 'true');
    parade.innerHTML = document.querySelector('[data-parade]').innerHTML;
    document.body.appendChild(parade);
    window.setTimeout(function () { parade.remove(); }, 4700);
  }

  document.addEventListener('click', function (event) {
    var root = event.target.closest('[data-quiz]');
    if (!root) return;
    var opt = event.target.closest('[data-quiz-opt]');
    var coin = event.target.closest('[data-quiz-coin]');
    if (event.target.closest('[data-quiz-start], [data-quiz-retake]')) startQuiz(root);
    else if (opt) answer(root, opt);
    else if (event.target.closest('[data-quiz-next]')) {
      if (root._quiz.i < questions(root).length - 1) goTo(root, root._quiz.i + 1); else finish(root);
    } else if (event.target.closest('[data-quiz-sound]')) {
      soundOn = !soundOn;
      store.set(SOUND, soundOn ? '1' : '0');
      renderSound();
      blip(SFX.coin);
    } else if (coin) pokeCoin(coin);
  });

  document.addEventListener('keydown', function (event) {
    var key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    if (key === KONAMI[konami]) konami++;
    else if (!(key === 'ArrowUp' && konami === 2)) konami = key === KONAMI[0] ? 1 : 0;
    if (konami === KONAMI.length) { konami = 0; cheat(); return; }
    // 1–4 pick an answer in the open quiz
    if (!/^[1-4]$/.test(key) || event.metaKey || event.ctrlKey || event.altKey) return;
    if (event.target.closest && event.target.closest('input, textarea, select, [contenteditable]')) return;
    var q = document.querySelector('.day:not([hidden]) [data-quiz-game]:not([hidden]) [data-quiz-q]:not([hidden]):not(.is-answered)');
    if (q) q.querySelectorAll('[data-quiz-opt]')[Number(key) - 1].click();
  });

  each(document, '[data-quiz]', renderBest);
  renderSound();

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
      } else {
        // Every test in file order, so a passing one stays put (ticked, greyed) instead of vanishing
        var list = el('ul', 'live-tests__fails');
        d.tests.forEach(function (t) {
          var item = el('li', t.passed ? 'is-passed' : null, shortName(t.name));
          if (!t.passed && t.message) item.appendChild(el('small', null, t.message));
          list.appendChild(item);
        });
        box.appendChild(list);
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

  // ---------------------------------------------------------------- reading bar
  // Fills as the day's concepts scroll up into the top third of the screen, and never drains:
  // the furthest point you've read is kept per day. A coin pops in when you reach the end
  var READ = 'react-for-ember:read-progress';
  var readMax = {};
  try { readMax = JSON.parse(store.get(READ) || '{}') || {}; } catch (e) { readMax = {}; }
  var readbar = document.querySelector('[data-readbar]');
  var readFill = readbar.querySelector('[data-readbar-fill]');
  var readDay = null;
  var readRaf = 0;

  function readFraction(region) {
    var r = region.getBoundingClientRect();
    var line = window.innerHeight * 0.3;
    return Math.max(0, Math.min(1, (line - r.top) / Math.max(1, r.height)));
  }
  function renderReading() {
    if (!readbar || current === null) return;
    var day = document.getElementById('day-' + current);
    var region = isUnlocked(current) && day ? day.querySelector('.day__concepts') : null;
    readbar.hidden = !region;
    if (!region) return;
    // Switching days jumps straight to that day's saved fill instead of animating to it
    var fresh = readDay !== current;
    readDay = current;
    var before = Number(readMax[current]) || 0;
    var max = Math.max(before, readFraction(region));
    if (max >= 0.995) max = 1;
    if (max - before >= 0.01 || (max === 1 && before < 1)) {
      readMax[current] = Math.round(max * 100) / 100;
      store.set(READ, JSON.stringify(readMax));
    }
    if (fresh) {
      readbar.classList.add('is-settling');
      readbar.classList.remove('is-popping');
      window.requestAnimationFrame(function () { window.requestAnimationFrame(function () { readbar.classList.remove('is-settling'); }); });
    }
    readFill.style.width = (max * 100) + '%';
    var clear = max === 1;
    if (clear && before < 1 && !fresh) {
      readbar.classList.add('is-popping');
      window.setTimeout(function () { blip(SFX.coin); }, 450);
    }
    readbar.classList.toggle('is-clear', clear);
    readbar.setAttribute('aria-label', 'Day ' + current + ' reading progress');
    readbar.setAttribute('aria-valuenow', String(Math.round(max * 100)));
    readbar.setAttribute('aria-valuetext', clear ? 'Concepts read' : Math.round(max * 100) + '% read');
  }
  function onReadScroll() {
    if (readRaf) return;
    readRaf = window.requestAnimationFrame(function () { readRaf = 0; renderReading(); });
  }
  window.addEventListener('scroll', onReadScroll, { passive: true });
  // On phones the bar sticks just under the top bar, whatever height that ends up
  var topbar = document.querySelector('.topbar');
  function measureTopbar() { if (topbar && topbar.offsetHeight) document.documentElement.style.setProperty('--topbar-h', topbar.offsetHeight + 'px'); }
  measureTopbar();
  window.addEventListener('resize', function () { measureTopbar(); onReadScroll(); });

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
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=JetBrains+Mono:wght@400;600&family=Fraunces:ital,opsz,wght@1,9..144,500&family=Press+Start+2P&display=swap" rel="stylesheet">
<script>try { var t = localStorage.getItem('react-for-ember:theme'); if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t; } catch (e) {}</script>
<style>${CSS}</style>
<script>window.Prism = window.Prism || {}; window.Prism.manual = true;</script>
${prism}
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="topbar">
  <a class="brand" href="#day-1" aria-label="React for Ember Engineers">${wordmarkSvg()}</a>
  <div class="topbar__right">
    <button type="button" class="icon-button" data-open-intro aria-label="How this course works" title="How this course works"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 2.5-3 4.5"/><path d="M12 17.5h.01"/></svg></button>
    <span data-progress-short aria-label="Days complete">0/15</span>
    <button type="button" class="button" data-nav-toggle aria-expanded="false" aria-controls="sidebar">Days</button>
  </div>
</header>
<div class="shell">
  <aside class="sidebar" id="sidebar">
    <div class="sidebar__head"><a class="brand" href="#day-1" aria-label="React for Ember Engineers">${wordmarkSvg()}</a><button type="button" class="icon-button" data-open-intro aria-label="How this course works" title="How this course works"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 2.5-3 4.5"/><path d="M12 17.5h.01"/></svg></button></div>
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
    ${scenery()}
    <div class="content">
    ${READBAR}
    <noscript><p>JavaScript is off: every day is shown below in order, and progress tracking is disabled.</p><style>.day[hidden]{display:block}.quiz__start,.quiz__hud,.quiz__nav,.quiz__end{display:none}.quiz__game[hidden],.quiz__q[hidden],.quiz__why[hidden]{display:block}.quiz__q{margin-bottom:1.25rem}.quiz__opt[data-correct]{border-color:var(--green)}</style></noscript>
    ${daysHtml}
    <section class="panel locked" data-locked hidden aria-labelledby="locked-title">
      ${padlockSvg('locked__padlock')}
      <h1 id="locked-title" tabindex="-1" data-locked-title>This day is locked</h1>
      <p>Days unlock one at a time. <span data-locked-text></span></p>
      <a class="button button--primary" data-locked-go href="#day-1">Go to Day 1</a>
      <p class="locked__hint pixel">Old-school players know a way past locked doors.</p>
    </section>
    </div>
  </main>
</div>
<dialog class="intro" data-intro aria-labelledby="intro-title">
  <div class="intro__head"><h2 id="intro-title">How this course works</h2></div>
  <p class="intro__lead">15 days, about an hour each. Every day follows the same four steps.</p>
  <ol class="intro__steps">
    <li><span class="intro__n">1</span><div><h3>Read <small>15 min</small></h3><p>Today's ideas, with the Ember way and the React way side by side. As you scroll, the bar at the top fills up, and a coin pops in when you reach the end.</p></div></li>
    <li><span class="intro__n">2</span><div><h3>Build <small>35 min</small></h3>
      <p class="live-only">Open today's folder in <code>exercises/</code> and follow the TODO comments. Each time you save, the tests run and this page shows what's left.</p>
      <p class="file-only">Open today's folder in <code>exercises/</code> and follow the TODO comments. Run <code>pnpm start</code> in the repo and this page shows your tests passing as you go.</p></div></li>
    <li><span class="intro__n">3</span><div><h3>Check yourself <small>10 min</small></h3><p>Press start for a quick multiple-choice quiz. Every answer comes with the reasoning. A few questions from earlier days come back too, more often the ones you missed, so they stick.</p></div></li>
    <li><span class="intro__n">4</span><div><h3>Done</h3>
      <p class="live-only">When all of today's tests pass, the day ticks off by itself and the next one unlocks.</p>
      <p class="file-only">When today's tests pass, press "Mark day complete" to unlock the next day.</p></div></li>
  </ol>
  <p class="intro__stack"><strong>The stack:</strong> React 19.3 and TypeScript, built with Vite. TanStack Query for server data, React Router 8 for routing, Server Components with Next.js App Router conventions, and Vitest with Testing Library for tests.</p>
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
      <div class="certificate__logo">${wordmarkSvg()}</div>
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
<div class="toasts" data-toasts aria-live="polite"></div>
<template data-parade>${PARADE}</template>
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
