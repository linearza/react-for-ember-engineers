// The playground: /app/play.html?day=1 renders that day's exercise components (YOUR code in
// exercises/), with a console panel underneath. The course page embeds it next to the tests;
// open it in its own tab to use the browser devtools and React DevTools on it.
import './console';
import { Component, StrictMode, useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { clear, getEntries, push, subscribe } from './console';
import type { Scenario } from './types';
import '../styles.css';
import './play.css';

const modules = import.meta.glob<{ scenarios: Scenario[] }>('./day*.tsx');
const day = Number(new URLSearchParams(location.search).get('day')) || 1;
const load = modules[`./day${String(day).padStart(2, '0')}.tsx`];
const embedded = window.self !== window.top;

// Bumped after every hot update, so a scenario that crashed gets another go once you save a fix
let version = 0;
const versionListeners = new Set<() => void>();
if (import.meta.hot) {
  import.meta.hot.on('vite:afterUpdate', (payload) => {
    const files = payload.updates.map((u) => u.path.replace(/^\/app\//, '').replace(/\?.*$/, ''));
    push('saved', `Saved ${[...new Set(files)].join(', ')}`);
    version++;
    for (const listener of versionListeners) listener();
  });
}
function useVersion() {
  return useSyncExternalStore(
    (listener) => {
      versionListeners.add(listener);
      return () => versionListeners.delete(listener);
    },
    () => version,
  );
}

class ScenarioBoundary extends Component<{ version: number; children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidUpdate(prev: { version: number }) {
    if (prev.version !== this.props.version && this.state.error) this.setState({ error: null });
  }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="play-crash" role="alert">
        <strong>This threw while rendering</strong>
        <pre>{this.state.error.message}</pre>
        <span>Save a fix and it renders again. The full stack is in the console below.</span>
      </div>
    );
  }
}

function Scenarios({ scenarios }: { scenarios: Scenario[] }) {
  const v = useVersion();
  return (
    <div className="play-scenarios">
      {scenarios.map((scenario) => (
        <section key={scenario.title} className="play-scenario">
          <h2>{scenario.title}</h2>
          {scenario.hint && <p className="play-hint">{scenario.hint}</p>}
          <div className="play-stage">
            <ScenarioBoundary version={v}>
              <scenario.render />
            </ScenarioBoundary>
          </div>
        </section>
      ))}
    </div>
  );
}

function ConsolePanel() {
  const entries = useSyncExternalStore(subscribe, getEntries);
  const [atBottom, setAtBottom] = useState(true);
  const [list, setList] = useState<HTMLOListElement | null>(null);

  useEffect(() => {
    if (list && atBottom) list.scrollTop = list.scrollHeight;
  }, [entries, list, atBottom]);

  return (
    <section className="play-console" aria-label="Console">
      <header>
        <h2>Console</h2>
        <span className="play-console__note">console.log from your components shows up here</span>
        <button type="button" onClick={clear}>
          Clear
        </button>
      </header>
      <ol
        ref={setList}
        onScroll={(e) => {
          const el = e.currentTarget;
          setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 8);
        }}
      >
        {entries.length === 0 && <li className="play-console__empty">Nothing logged yet.</li>}
        {entries.map((entry) => (
          <li key={entry.id} className={`is-${entry.level}`}>
            <pre>{entry.text}</pre>
            {entry.count > 1 && <span className="play-console__count">{entry.count}</span>}
          </li>
        ))}
      </ol>
    </section>
  );
}

function Playground() {
  const [scenarios, setScenarios] = useState<Scenario[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!load) return;
    load().then(
      (mod) => setScenarios(mod.scenarios),
      (error: Error) => setLoadError(error.message),
    );
  }, []);

  return (
    <div className={embedded ? 'play is-embedded' : 'play'}>
      {!embedded && (
        <header className="play-top">
          <h1>Day {day} playground</h1>
          <p className="muted">
            Rendering your code from <code>exercises/day{String(day).padStart(2, '0')}/</code>. Save a file and it
            updates in place.
          </p>
        </header>
      )}
      <main className="play-main">
        {!load && <p className="muted">There's no playground for day {day} yet.</p>}
        {loadError && (
          <div className="play-crash" role="alert">
            <strong>Your code for day {day} couldn't load</strong>
            <pre>{loadError}</pre>
          </div>
        )}
        {scenarios && <Scenarios scenarios={scenarios} />}
      </main>
      <ConsolePanel />
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Playground />
  </StrictMode>,
);
