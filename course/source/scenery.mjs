// A pixel-art landscape banner: an inline SVG on a 480×72 grid, drawn with
// crisp rects. Each scrolling layer is periodic over 480px and drawn twice,
// so translating it by -480 loops seamlessly. Colours come from CSS custom
// properties (--sky-*, --hill-* …) so the scene switches between day and night with the theme.

const W = 480;
const H = 72;

// Seeded random so the build output is stable
function rng(seed) {
  let s = seed;
  return () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648);
}

// A ridge as a stair-stepped polygon. Whole sine periods per tile, so it tiles.
function ridge(base, waves, step) {
  const ys = [];
  for (let x = 0; x <= W; x += step) {
    const y = waves.reduce((sum, [amp, k, phase]) => sum + amp * Math.sin((2 * Math.PI * k * x) / W + phase), base);
    ys.push(Math.round(y));
  }
  let d = `M0 ${H}`;
  ys.forEach((y, i) => { d += `V${y}H${Math.min(W, (i + 1) * step)}`; });
  return d + `V${H}Z`;
}
const ridgeY = (base, waves, x) => Math.round(waves.reduce((sum, [amp, k, phase]) => sum + amp * Math.sin((2 * Math.PI * k * x) / W + phase), base));

// A pine tree from rects: trunk plus three stacked tiers
function pine(x, ground, size) {
  let d = `M${x - 1} ${ground - 3}h2v3h-2z`;
  for (let row = 0; row < size * 3; row++) {
    const tier = Math.floor(row / size);
    const half = 1 + (row % size) + tier;
    const y = ground - 3 - size * 3 + row;
    d += `M${x - half} ${y}h${half * 2}v1h${-half * 2}z`;
  }
  return d;
}

// A pixel blob (cloud) as a few overlapping rects
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

const twice = (d) => `<path d="${d}"/><path d="${d}" transform="translate(${W} 0)"/>`;

export function scenery() {
  const rand = rng(7);

  // Sky: four flat bands, the 16-bit way to do a gradient
  const sky = [0, 14, 26, 36]
    .map((y, i) => `<rect y="${y}" width="${W}" height="${H - y}" fill="var(--sky-${i + 1})"/>`)
    .join('');

  // Stars (night only, via --star-opacity), each twinkling on its own beat
  let stars = '';
  for (let i = 0; i < 50; i++) {
    const x = Math.floor(rand() * W);
    const y = Math.floor(rand() * 30);
    const delay = (rand() * 4).toFixed(2);
    stars += `<rect class="scene__star" x="${x}" y="${y}" width="1" height="1" style="animation-delay:-${delay}s"/>`;
  }

  const far = [[3, 2, 0.4], [2, 5, 1.3], [1, 11, 2.1]];
  const mid = [[4, 3, 2.2], [2, 7, 0.5]];
  const near = [[2, 2, 1.1], [1, 6, 0.2]];

  let trees = '';
  for (let x = 6; x < W; x += 14 + Math.floor(rand() * 18)) {
    trees += pine(x, ridgeY(58, near, x) + 1, 2 + Math.floor(rand() * 2));
  }

  let clouds = '';
  [[18, 8, 26], [104, 15, 18], [178, 5, 32], [262, 12, 22], [340, 7, 28], [418, 14, 20]].forEach(([x, y, w]) => { clouds += cloud(x, y, w); });

  let tufts = '';
  for (let x = 3; x < W; x += 9 + Math.floor(rand() * 9)) tufts += `M${x} 67h1v-1h1v1h1v1h-3z`;

  let flies = '';
  for (let i = 0; i < 9; i++) {
    const x = 20 + Math.floor(rand() * 440);
    const y = 44 + Math.floor(rand() * 16);
    flies += `<rect class="scene__fly" x="${x}" y="${y}" width="1" height="1" style="animation-delay:-${(rand() * 6).toFixed(2)}s"/>`;
  }

  // The campfire sits still in the foreground while the world scrolls past
  const fire = `
    <g class="scene__fire" transform="translate(300 61)">
      <path fill="var(--hill-3)" d="M-5 5h10v1h-10z"/>
      <path fill="#7a4a2a" d="M-4 4h8v1h-8z M-3 3h2v1h-2z M1 3h2v1h-2z"/>
      <g class="scene__flame scene__flame--a"><path fill="#ef7d57" d="M-2 0h4v3h-4z M-1 -2h2v2h-2z"/><path fill="#ffcd75" d="M-1 1h2v2h-2z"/></g>
      <g class="scene__flame scene__flame--b"><path fill="#ef7d57" d="M-2 1h4v2h-4z M-1 -1h3v2h-3z M0 -3h1v2h-1z"/><path fill="#ffcd75" d="M0 1h1v2h-1z"/></g>
      <rect class="scene__ember" x="1" y="-4" width="1" height="1" fill="#ffcd75"/>
    </g>`;

  return `
<div class="scene" aria-hidden="true">
  <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMax slice" shape-rendering="crispEdges">
    ${sky}
    <g class="scene__stars" fill="var(--star)">${stars}</g>
    <path class="scene__orb" fill="var(--orb)" d="${disc(372, 16, 7)}"/>
    <g class="scene__layer scene__layer--clouds" fill="var(--cloud)">${twice(clouds)}</g>
    <g class="scene__layer scene__layer--far" fill="var(--hill-1)">${twice(ridge(40, far, 2))}</g>
    <g class="scene__layer scene__layer--mid" fill="var(--hill-2)">${twice(ridge(50, mid, 2))}</g>
    <g class="scene__layer scene__layer--near">
      <g fill="var(--hill-3)">${twice(ridge(58, near, 2))}</g>
      <g fill="var(--tree)">${twice(trees)}</g>
      <g fill="var(--ground)"><path d="M0 66h${W * 2}v6h-${W * 2}z"/></g>
      <g fill="var(--tuft)">${twice(tufts)}</g>
    </g>
    ${fire}
    <g class="scene__flies" fill="#ffe680">${flies}</g>
  </svg>
</div>`;
}
