// A pixel-art landscape banner: an inline SVG on a 480×120 grid, drawn with
// crisp rects. The landscape stays still; a small cast of sprites walks, hops
// and flies through it. Colours come from CSS custom properties (--sky-*,
// --hill-* …) so the scene switches between day and night with the theme, and
// the bottom ridge is painted in --bg so the page seems to sit on the ground.

const W = 480;
const H = 120;

// Seeded random so the build output is stable
function rng(seed) {
  let s = seed;
  return () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648);
}

const wave = (base, waves, x) =>
  Math.round(waves.reduce((sum, [amp, k, phase]) => sum + amp * Math.sin((2 * Math.PI * k * x) / W + phase), base));

// A ridge as a stair-stepped polygon
function ridge(base, waves, step = 2) {
  let d = `M0 ${H}`;
  for (let x = 0; x < W; x += step) d += `V${wave(base, waves, x)}H${x + step}`;
  return d + `V${H}Z`;
}

// A pine tree from rects: trunk plus three stacked tiers
function pine(x, ground, size) {
  let d = `M${x - 1} ${ground - 3}h2v3h-2z`;
  for (let row = 0; row < size * 3; row++) {
    const tier = Math.floor(row / size);
    const half = 1 + (row % size) + tier;
    d += `M${x - half} ${ground - 3 - size * 3 + row}h${half * 2}v1h${-half * 2}z`;
  }
  return d;
}

function cloud(x, y, w) {
  return `M${x} ${y + 2}h${w}v3h${-w}z M${x + 2} ${y}h${w - 6}v2h${-(w - 6)}z M${x + w - 9} ${y + 1}h6v1h-6z`;
}

// A filled pixel circle, row by row
function disc(cx, cy, r) {
  let d = '';
  for (let dy = -r; dy < r; dy++) {
    const half = Math.round(Math.sqrt(r * r - (dy + 0.5) ** 2));
    d += `M${cx - half} ${cy + dy}h${half * 2}v1h${-half * 2}z`;
  }
  return d;
}

// A sprite from text rows: each character is one pixel, '.' is transparent.
// Runs of the same colour on a row merge into a single rect.
export function sprite(rows, palette) {
  const byColour = {};
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; ) {
      const c = row[x];
      let run = 1;
      while (row[x + run] === c) run++;
      if (c !== '.') (byColour[palette[c]] ??= []).push(`M${x} ${y}h${run}v1h${-run}z`);
      x += run;
    }
  });
  return Object.entries(byColour).map(([fill, d]) => `<path fill="${fill}" d="${d.join('')}"/>`).join('');
}

// Two frames that alternate (walk cycle, wing flap)
const frames = (a, b) => `<g class="scene__f1">${a}</g><g class="scene__f2">${b}</g>`;

export const HERO_PAL = { h: '#5a3a22', s: '#f2c79a', t: '#e45c10', d: '#a8380a', b: '#2b3a67', k: '#1a1c2c', w: '#7a4a2a', f: '#ffcd75', o: '#ef7d57' };
const HERO_TOP = [
  '.......f.',
  '..hhh.of.',
  '.hhhh..w.',
  '.hss...w.',
  '..sss..w.',
  '.tttttsw.',
  '.dtttd...',
  '..ttt....',
];
export const HERO_A = [...HERO_TOP, '..b.b....', '.b...b...', '.k...k...'];
export const HERO_B = [...HERO_TOP, '..bb.....', '..bb.....', '..kk.....'];

export const FOX_PAL = { o: '#e45c10', d: '#a8380a', w: '#f4f4f4', k: '#1a1c2c' };
export const FOX_A = ['.o.o......', 'ooo....ooo', 'kooooooodw', '.ooooooo..', '.d.d..d.d.'];
export const FOX_B = ['.o.o......', 'ooo....ooo', 'kooooooodw', '.ooooooo..', '..d.dd.d..'];

const RABBIT_PAL = { w: '#ece8e0', g: '#b8b0a4', k: '#1a1c2c', p: '#f2a6b0' };
const RABBIT = ['.w.w..', '.wpw..', 'wkww..', 'wwwwwg', '.wwww.', '.g..g.'];

const BIRD_PAL = { b: 'var(--bird)' };
const BIRD_A = ['b...b', '.b.b.', '..b..'];
const BIRD_B = ['.....', 'bbbbb', '..b..'];

const FLY_PAL = { y: '#f8b800', p: '#f878f8' };
const BUTTERFLY_A = ['p.p', '.y.', 'p.p'];
const BUTTERFLY_B = ['...', 'pyp', '...'];

export function scenery() {
  const rand = rng(7);

  const sky = [0, 34, 60, 80]
    .map((y, i) => `<rect y="${y}" width="${W}" height="${H - y}" fill="var(--sky-${i + 1})"/>`)
    .join('');

  let stars = '';
  for (let i = 0; i < 60; i++) {
    const x = Math.floor(rand() * W);
    const y = Math.floor(rand() * 62);
    stars += `<rect class="scene__star" x="${x}" y="${y}" width="1" height="1" style="animation-delay:-${(rand() * 4).toFixed(2)}s"/>`;
  }

  const far = [[6, 2, 0.4], [4, 5, 1.3], [2, 11, 2.1]];
  const mid = [[5, 3, 2.2], [3, 7, 0.5]];
  const near = [[3, 2, 1.1], [1, 6, 0.2]];
  const edge = [[2, 3, 0.7], [1, 9, 1.9]];

  let trees = '';
  for (let x = 6; x < W; x += 12 + Math.floor(rand() * 20)) trees += pine(x, wave(90, mid, x) + 2, 2 + Math.floor(rand() * 2));

  let clouds = '';
  [[18, 12, 26], [104, 22, 18], [178, 8, 32], [262, 18, 22], [340, 10, 28], [418, 24, 20]].forEach(([x, y, w]) => { clouds += cloud(x, y, w); });

  let tufts = '';
  let flowers = '';
  for (let x = 3; x < W; x += 7 + Math.floor(rand() * 10)) {
    const y = wave(102, near, x) + 3 + Math.floor(rand() * 6);
    if (rand() < 0.3) flowers += `M${x} ${y}h1v1h-1z`;
    else tufts += `M${x} ${y}h1v-1h1v1h1v1h-3z`;
  }

  let flies = '';
  for (let i = 0; i < 12; i++) {
    const x = 20 + Math.floor(rand() * 440);
    const y = 78 + Math.floor(rand() * 30);
    flies += `<rect class="scene__fly" x="${x}" y="${y}" width="1" height="1" style="animation-delay:-${(rand() * 6).toFixed(2)}s"/>`;
  }

  // Walkers cross the meadow with feet on y≈110; their outer <g> is what the CSS animates
  const walker = (cls, y, body) => `<g class="scene__walk ${cls}"><g transform="translate(0 ${y})">${body}</g></g>`;
  const birds = [[0, 22], [8, 18], [14, 25]]
    .map(([dx, y], i) => `<g class="scene__bird" style="animation-delay:-${i * 0.12}s"><g transform="translate(${dx} ${y})">${frames(sprite(BIRD_A, BIRD_PAL), sprite(BIRD_B, BIRD_PAL))}</g></g>`)
    .join('');
  const butterflies = [[120, 100], [262, 104], [400, 98]]
    .map(([x, y], i) => `<g transform="translate(${x} ${y})"><g class="scene__butterfly" style="animation-delay:-${i * 2.1}s">${frames(sprite(BUTTERFLY_A, FLY_PAL), sprite(BUTTERFLY_B, FLY_PAL))}</g></g>`)
    .join('');

  const fire = `
    <g class="scene__fire" transform="translate(300 108)">
      <path fill="#7a4a2a" d="M-4 4h8v1h-8z M-3 3h2v1h-2z M1 3h2v1h-2z"/>
      <g class="scene__f1"><path fill="#ef7d57" d="M-2 0h4v3h-4z M-1 -2h2v2h-2z"/><path fill="#ffcd75" d="M-1 1h2v2h-2z"/></g>
      <g class="scene__f2"><path fill="#ef7d57" d="M-2 1h4v2h-4z M-1 -1h3v2h-3z M0 -3h1v2h-1z"/><path fill="#ffcd75" d="M0 1h1v2h-1z"/></g>
      <rect class="scene__ember" x="1" y="-4" width="1" height="1" fill="#ffcd75"/>
    </g>`;

  return `
<div class="scene" aria-hidden="true">
  <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMax slice" shape-rendering="crispEdges">
    ${sky}
    <g class="scene__stars" fill="var(--star)">${stars}</g>
    <path fill="var(--orb)" d="${disc(392, 26, 9)}"/>
    <g class="scene__clouds" fill="var(--cloud)"><path d="${clouds}"/><path d="${clouds}" transform="translate(${W} 0)"/></g>
    <g class="scene__cast">${birds}</g>
    <path fill="var(--hill-1)" d="${ridge(74, far)}"/>
    <path fill="var(--hill-2)" d="${ridge(90, mid)}"/>
    <path fill="var(--tree)" d="${trees}"/>
    <path fill="var(--hill-3)" d="${ridge(102, near)}"/>
    <path fill="var(--tuft)" d="${tufts}"/>
    <path fill="var(--flower)" d="${flowers}"/>
    ${fire}
    <g class="scene__cast">
      ${walker('scene__walk--hero', 99, frames(sprite(HERO_A, HERO_PAL), sprite(HERO_B, HERO_PAL)))}
      ${walker('scene__walk--fox', 105, frames(sprite(FOX_A, FOX_PAL), sprite(FOX_B, FOX_PAL)))}
      ${walker('scene__walk--rabbit', 104, `<g class="scene__hop">${sprite(RABBIT, RABBIT_PAL)}</g>`)}
      <g class="scene__day">${butterflies}</g>
    </g>
    <g class="scene__flies" fill="#ffe680">${flies}</g>
    <path fill="var(--bg)" d="${ridge(114, edge)}"/>
  </svg>
</div>`;
}
