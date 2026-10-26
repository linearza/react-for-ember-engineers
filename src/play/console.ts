// Captures console output and uncaught errors so the playground can show them under the preview.
// Imported first by main.tsx, so it sees everything your components log. The browser's own
// devtools console still gets every message too.

export type Level = 'log' | 'info' | 'warn' | 'error' | 'saved';

export interface Entry {
  id: number;
  level: Level;
  text: string;
  count: number;
}

const MAX = 200;
let entries: Entry[] = [];
let nextId = 1;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const getEntries = () => entries;

export function clear() {
  entries = [];
  emit();
}

export function push(level: Level, text: string) {
  const last = entries[entries.length - 1];
  // Collapse repeats, like the browser does, so a log in a render loop doesn't flood the panel
  if (last && last.level === level && last.text === text) {
    entries = [...entries.slice(0, -1), { ...last, count: last.count + 1 }];
  } else {
    entries = [...entries, { id: nextId++, level, text, count: 1 }].slice(-MAX);
  }
  // Defer, because React logs warnings during render and the panel can't update mid-render
  queueMicrotask(emit);
}

function show(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value instanceof Error) return value.stack ?? `${value.name}: ${value.message}`;
  if (value instanceof Element) return value.outerHTML.length > 400 ? value.outerHTML.slice(0, 400) + '…' : value.outerHTML;
  if (typeof value === 'function') return `ƒ ${value.name || 'anonymous'}()`;
  if (typeof value === 'symbol' || typeof value === 'bigint') return String(value);
  try {
    const seen = new WeakSet();
    return JSON.stringify(
      value,
      (_key, v) => {
        if (typeof v === 'object' && v !== null) {
          if (seen.has(v)) return '[Circular]';
          seen.add(v);
        }
        return typeof v === 'function' ? `ƒ ${v.name || 'anonymous'}()` : v;
      },
      2,
    ) ?? String(value);
  } catch {
    return String(value);
  }
}

// Handles the %s/%d/%o substitutions React uses in its warnings
function format(args: unknown[]): string {
  if (typeof args[0] !== 'string' || !args[0].includes('%')) return args.map(show).join(' ');
  const rest = args.slice(1);
  const head = args[0].replace(/%[sdifoOc]/g, (token) => {
    if (!rest.length) return token;
    const value = rest.shift();
    return token === '%c' ? '' : show(value);
  });
  return [head, ...rest.map(show)].join(' ');
}

for (const level of ['log', 'info', 'warn', 'error'] as const) {
  const original = console[level].bind(console);
  console[level] = (...args: unknown[]) => {
    original(...args);
    const text = format(args);
    if (!text.startsWith('Download the React DevTools')) push(level, text);
  };
}
console.debug = console.log;

window.addEventListener('error', (event) => push('error', show(event.error ?? event.message)));
window.addEventListener('unhandledrejection', (event) => push('error', 'Unhandled promise rejection: ' + show(event.reason)));
