// The 8-bit wordmark, drawn from a pixel font so it stays crisp at any size.
// Run `pnpm build:logo` to regenerate course/icons/logo.svg, banner.svg and favicon.svg.
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { scenery } from './scenery.mjs';

const INK = '#f4f4f4';
const ACCENT = '#fb923c';
const NIGHT = '#10122a';

// Pixels as {x, y, fill}; merge horizontal runs of one colour into rects
function toPaths(pixels, ox = 0, oy = 0) {
  const rows = new Map();
  const seen = new Set();
  for (const p of pixels) {
    if (seen.has(`${p.x},${p.y}`)) continue;
    seen.add(`${p.x},${p.y}`);
    const key = `${p.y}|${p.fill}`;
    if (!rows.has(key)) rows.set(key, []);
    rows.get(key).push(p.x);
  }
  const byFill = {};
  for (const [key, xs] of rows) {
    const [y, fill] = key.split('|');
    xs.sort((a, b) => a - b);
    for (let i = 0; i < xs.length; ) {
      let run = 1;
      while (xs[i + run] === xs[i] + run) run++;
      (byFill[fill] ??= []).push(`M${xs[i] + ox} ${+y + oy}h${run}v1h${-run}z`);
      i += run;
    }
  }
  return Object.entries(byFill).map(([fill, d]) => `<path fill="${fill}" d="${d.join('')}"/>`).join('');
}

// A 5×7 bitmap font
const FONT = {
  A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  B: ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'],
  C: ['.###.', '#...#', '#....', '#....', '#....', '#...#', '.###.'],
  E: ['#####', '#....', '#....', '####.', '#....', '#....', '#####'],
  F: ['#####', '#....', '#....', '####.', '#....', '#....', '#....'],
  G: ['.###.', '#...#', '#....', '#.###', '#...#', '#...#', '.####'],
  I: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '#####'],
  M: ['#...#', '##.##', '#.#.#', '#.#.#', '#...#', '#...#', '#...#'],
  N: ['#...#', '##..#', '#.#.#', '#..##', '#...#', '#...#', '#...#'],
  O: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  R: ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
  S: ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'],
  T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
};
const ADVANCE = 6;
const SPACE = 4;

// One line of text runs as [[text, fill], …]; bold doubles each pixel to the right
function textPixels(runs, { bold = false } = {}) {
  const pixels = [];
  let cx = 0;
  for (const [text, fill] of runs) {
    for (const ch of text) {
      const glyph = FONT[ch];
      if (glyph) glyph.forEach((row, y) => [...row].forEach((c, x) => {
        if (c !== '#') return;
        pixels.push({ x: cx + x, y, fill });
        if (bold) pixels.push({ x: cx + x + 1, y, fill });
      }));
      cx += glyph ? ADVANCE + (bold ? 1 : 0) : SPACE;
    }
  }
  return pixels;
}
const WORDMARK = (ink, accent) => [['REACT ', ink], ['FOR', accent], [' EMBER ENGINEERS', ink]];

// The 3D wordmark: fat faces, a one-pixel extrusion and a dark outline, so it reads on any background
const SIDES = { [INK]: '#7c84b8', [ACCENT]: '#c2410c' };
const OUTLINE = '#05060f';
const wordmark3d = () => extruded(WORDMARK(INK, ACCENT), 1, SIDES, OUTLINE);
const bounds = (pixels) => {
  const xs = pixels.map((p) => p.x);
  const ys = pixels.map((p) => p.y);
  return { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs) + 1, h: Math.max(...ys) - Math.min(...ys) + 1 };
};

// For inlining in the page (brand links and certificate): colours come from --wm-* so they follow the theme
export function wordmarkSvg() {
  const text = extruded(WORDMARK('var(--wm-ink)', 'var(--wm-for)'), 1,
    { 'var(--wm-ink)': 'var(--wm-ink-side)', 'var(--wm-for)': 'var(--wm-for-side)' }, 'var(--wm-outline)');
  const { x, y, w, h } = bounds(text);
  return `<svg viewBox="${x} ${y} ${w} ${h}" width="${w}" height="${h}" shape-rendering="crispEdges" aria-hidden="true" focusable="false">` + toPaths(text) + '</svg>';
}

// The standalone 3D wordmark; its dark outline lets it read on light and dark backgrounds
export function logoSvg() {
  const text = wordmark3d();
  const { x, y, w, h } = bounds(text);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x} ${y} ${w} ${h}" width="${w * 4}" height="${h * 4}" shape-rendering="crispEdges" role="img" aria-labelledby="t">` +
    '<title id="t">React for Ember Engineers</title>' + toPaths(text) + '</svg>';
}

// Browser tab: the R of the wordmark, in accent on the night plate
export function faviconSvg() {
  const pixels = textPixels([['R', ACCENT]]);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-2 -1 9 9" shape-rendering="crispEdges">` +
    `<rect x="-2" y="-1" width="9" height="9" fill="${NIGHT}"/>` + toPaths(pixels) + '</svg>';
}

// The course page's night scene, frozen into a still, so the banner needs no CSS
const NIGHT_SCENE = {
  bg: NIGHT, 'sky-1': '#0a0b20', 'sky-2': '#10133a', 'sky-3': '#18205a', 'sky-4': '#222d70', star: '#ffffff',
  orb: '#f4f4e0', cloud: '#262c55', 'hill-1': '#252c60', 'hill-2': '#1a2149', 'hill-3': '#151a3c', tree: '#0d1230',
  tuft: '#1f2a52', flower: '#3a4478', bird: '#070816',
};
const POSES = { hero: 196, fox: 352, rabbit: 88 };

function sceneStill() {
  return scenery()
    .replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>[\s\S]*$/, '')
    .replace(/var\(--([\w-]+)\)/g, (_, name) => NIGHT_SCENE[name])
    .replace(/<g class="scene__f2">.*?<\/g>/g, '')
    .replace(/<g class="scene__day">[\s\S]*?<\/g>\s*<\/g>\s*<\/g>\s*<\/g>/, '')
    .replace(/<g class="scene__walk scene__walk--(\w+)">/g, (_, who) => `<g transform="translate(${POSES[who]} 0)">`)
    .replace(/<g class="scene__bird" style="[^"]*">/g, '<g transform="translate(150 0)">')
    .replace(/<g class="scene__cast">/g, '<g style="filter:brightness(0.72) saturate(0.85)">')
    .replace(/ class="[^"]*"| style="animation-delay:[^"]*"/g, '');
}

// Fat letters extruded downwards with a dark outline, so they stand off the scene
function extruded(runs, depth, sides, outline) {
  const face = textPixels(runs, { bold: true });
  const at = new Map(face.map((p) => [`${p.x},${p.y}`, p]));
  const out = [];
  const put = (x, y, fill) => { if (!at.has(`${x},${y}`)) { at.set(`${x},${y}`, { x, y, fill }); out.push({ x, y, fill }); } };
  for (let d = 1; d <= depth; d++) for (const p of face) put(p.x, p.y + d, sides[p.fill]);
  for (const p of [...face, ...out]) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) put(p.x + dx, p.y + dy, outline);
  return [...at.values()];
}

// GitHub banner: the scene still, with the wordmark breaking out past its bottom edge
export function bannerSvg() {
  const W = 480;
  const SCENE_H = 120;
  const scale = 8 / 3;
  const text = wordmark3d();
  const { w: tw, h: th } = bounds(text);
  const tx = (W - tw * scale) / 2 + scale;
  const ty = SCENE_H - 12;
  const H = Math.ceil(ty + th * scale);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W * 3}" height="${H * 3}" shape-rendering="crispEdges" role="img" aria-labelledby="t">` +
    '<title id="t">React for Ember Engineers</title>' +
    `<svg width="${W}" height="${SCENE_H}" viewBox="0 0 ${W} ${SCENE_H}">${sceneStill()}</svg>` +
    `<g transform="translate(${tx} ${ty}) scale(${scale})">${toPaths(text)}</g>` +
    '</svg>';
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  writeFileSync(new URL('../icons/logo.svg', import.meta.url), logoSvg() + '\n');
  writeFileSync(new URL('../icons/banner.svg', import.meta.url), bannerSvg() + '\n');
  writeFileSync(new URL('../icons/favicon.svg', import.meta.url), faviconSvg() + '\n');
  console.log('wrote course/icons/logo.svg, banner.svg and favicon.svg');
}
