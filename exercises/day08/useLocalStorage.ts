import { useState } from 'react';

/*
DAY 8 — state that persists.
TODO: like useState, but backed by localStorage under `key`, stored as JSON.
  - LAZY initial read: useState(() => …) so storage is read once, not on every render
  - missing key or invalid JSON → `initial`
  - the setter accepts a value or an updater function, and writes JSON to storage
  - wrap every storage access in try/catch (storage can be blocked)
*/

export function useLocalStorage<T>(key: string, initial: T): [T, (next: T | ((prev: T) => T)) => void] {
  void key;
  const [value, setValue] = useState(initial);
  return [value, setValue];
}
