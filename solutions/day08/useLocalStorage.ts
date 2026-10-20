import { useCallback, useState } from 'react';

function read<T>(key: string, initial: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw === null ? initial : (JSON.parse(raw) as T);
  } catch {
    // Bad JSON, or storage blocked (private mode, sandboxed iframe): fall back.
    return initial;
  }
}

export function useLocalStorage<T>(key: string, initial: T): [T, (next: T | ((prev: T) => T)) => void] {
  // Lazy initial state: read storage once on mount, not on every render.
  const [value, setValue] = useState(() => read(key, initial));

  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved = typeof next === 'function' ? (next as (prev: T) => T)(prev) : next;
        try {
          window.localStorage.setItem(key, JSON.stringify(resolved));
        } catch {
          // Storage unavailable: keep working in memory.
        }
        return resolved;
      });
    },
    [key],
  );

  return [value, set];
}
