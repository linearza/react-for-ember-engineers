// `pnpm start`: the one thing you leave running for the 15 days.
//
//   http://localhost:1515/      the course, with live progress
//   http://localhost:1515/app/  your Day 15 app (exercises/day15/App.tsx)
//
// Your exercise tests run in watch mode in the same process. When every test for a day
// passes, the day is marked complete in .progress.json (gitignored) and the course page
// celebrates. Set PORT to use a different port.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { startVitest } from 'vitest/node';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const COURSE_PAGE = new URL('../course/index.html', import.meta.url);
const PROGRESS_FILE = new URL('../.progress.json', import.meta.url);
const PORT = Number(process.env.PORT) || 1515;
const DAYS = 15;

const [major, minor] = process.versions.node.split('.').map(Number);
if (major < 22 || (major === 22 && minor < 22)) {
  console.error(`\n  This course needs Node 22.22 or newer (you have ${process.versions.node}).\n`);
  process.exit(1);
}

// ---------------------------------------------------------------- progress state

function loadCompleted() {
  try {
    const saved = JSON.parse(readFileSync(PROGRESS_FILE, 'utf8'));
    return saved && typeof saved.completed === 'object' ? saved.completed : {};
  } catch {
    return {};
  }
}

const state = {
  running: true,
  completed: loadCompleted(), // { [day]: ISO date of the first all-green run }
  days: {}, // { [day]: { total, passed, failures: [{ name, message }], loadError } }
};

const clients = new Set();

function broadcast() {
  const data = `data: ${JSON.stringify(state)}\n\n`;
  for (const res of clients) res.write(data);
}

const stripAnsi = (s) => s.replace(/\u001b\[[0-9;]*m/g, '');
// Testing Library appends a long "This could be because..." hint and a DOM dump; keep the gist
const firstLine = (s = '') =>
  stripAnsi(s).trim().split('\n')[0].replace(/\. This could be because.*/, '.').slice(0, 240);

function dayOf(moduleId) {
  const m = /tests\/day(\d\d)\.test\.tsx?$/.exec(moduleId);
  return m ? Number(m[1]) : null;
}

function summarise(testModule) {
  const tests = [...testModule.children.allTests()];
  const failures = [];
  let passed = 0;
  for (const test of tests) {
    const result = test.result();
    if (result.state === 'passed') passed++;
    else if (result.state === 'failed') failures.push({ name: test.fullName, message: firstLine(result.errors?.[0]?.message) });
    else failures.push({ name: test.fullName, message: 'skipped' });
  }
  const errors = testModule.errors();
  return {
    total: tests.length,
    passed,
    failures,
    loadError: errors.length ? firstLine(errors[0].message) : null,
  };
}

const progressReporter = {
  onWatcherRerun() {
    state.running = true;
    broadcast();
  },
  onTestRunEnd(testModules) {
    const newlyDone = [];
    const changed = [];
    for (const testModule of testModules) {
      const day = dayOf(testModule.moduleId);
      if (!day) continue;
      const summary = summarise(testModule);
      state.days[day] = summary;
      changed.push(day);
      const green = summary.total > 0 && summary.passed === summary.total && !summary.loadError;
      if (green && !state.completed[day]) {
        state.completed[day] = new Date().toISOString();
        newlyDone.push(day);
      }
    }
    state.running = false;
    if (newlyDone.length) writeFileSync(PROGRESS_FILE, JSON.stringify({ completed: state.completed }, null, 2) + '\n');
    broadcast();
    report(changed.sort((a, b) => a - b), newlyDone);
  },
};

// ---------------------------------------------------------------- terminal output

const c = {
  bold: (s) => `\u001b[1m${s}\u001b[22m`,
  dim: (s) => `\u001b[2m${s}\u001b[22m`,
  green: (s) => `\u001b[32m${s}\u001b[39m`,
  orange: (s) => `\u001b[38;5;208m${s}\u001b[39m`,
};

let firstRun = true;

function report(changed, newlyDone) {
  const done = Object.keys(state.completed).length;
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (firstRun) {
    firstRun = false;
    console.log(`  ${c.dim(time)}  Tests checked: ${c.bold(`${done} / ${DAYS}`)} days complete.\n`);
    return;
  }
  for (const day of changed) {
    const d = state.days[day];
    const status = newlyDone.includes(day)
      ? c.green(`✓ Day ${day} complete!`) + ' 🎉'
      : d.loadError
        ? `Day ${day}: ${c.orange("couldn't load")} ${c.dim(d.loadError)}`
        : `Day ${day}: ${d.passed === d.total ? c.green(`${d.passed}/${d.total} passing`) : `${d.passed}/${d.total} passing`}`;
    console.log(`  ${c.dim(time)}  ${status}`);
  }
  if (newlyDone.length && done === DAYS) {
    console.log(`\n  ${c.orange('🎓 Course finished!')} Open the course page for your certificate.\n`);
  }
}

// ---------------------------------------------------------------- the server

function coursePlugin() {
  return {
    name: 'course',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url.split('?')[0];
        if (url === '/' || url === '/index.html') {
          // Read on every request, so a rebuilt course page shows up on refresh
          res.setHeader('content-type', 'text/html; charset=utf-8');
          res.end(readFileSync(COURSE_PAGE));
          return;
        }
        if (url === '/__course/events') {
          res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache', connection: 'keep-alive' });
          res.write(`data: ${JSON.stringify(state)}\n\n`);
          clients.add(res);
          req.on('close', () => clients.delete(res));
          return;
        }
        if (url === '/app') {
          res.writeHead(302, { location: '/app/' });
          res.end();
          return;
        }
        next();
      });
    },
  };
}

const server = await createServer({
  root: ROOT,
  base: '/app/',
  logLevel: 'warn',
  plugins: [coursePlugin()],
  server: { port: PORT, strictPort: true, open: process.env.CI ? false : '/' },
}).catch((error) => {
  console.error(`\n  Couldn't start the course server: ${error.message}\n`);
  process.exit(1);
});

try {
  await server.listen();
} catch (error) {
  console.error(
    error.code === 'EADDRINUSE' || /in use/i.test(error.message)
      ? `\n  Port ${PORT} is busy. Is the course already running in another terminal?\n  To use another port: PORT=1516 pnpm start\n`
      : `\n  Couldn't start the course server: ${error.message}\n`,
  );
  process.exit(1);
}

console.log(`
  ${c.orange('◆')} ${c.bold('React for Ember Engineers')}

  Course     ${c.bold(`http://localhost:${PORT}/`)}
  Your app   http://localhost:${PORT}/app/

  ${c.dim('Leave this running for the 15 days. Save a file in exercises/ and your')}
  ${c.dim('progress updates by itself. Ctrl+C to stop.')}
`);

await startVitest([], { watch: true, reporters: [progressReporter] }, {}, {});
