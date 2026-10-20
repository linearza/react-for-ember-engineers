import { useSyncExternalStore } from 'react';

export interface Store<T> {
  getState(): T;
  setState(next: T | ((prev: T) => T)): void;
  subscribe(listener: () => void): () => void;
}

// A ~15-line Zustand. The state lives OUTSIDE React; React subscribes to it.
export function createStore<T>(initial: T): Store<T> {
  let state = initial;
  const listeners = new Set<() => void>();
  return {
    getState: () => state,
    setState(next) {
      const value = typeof next === 'function' ? (next as (prev: T) => T)(state) : next;
      if (Object.is(value, state)) return;
      state = value;
      listeners.forEach((listener) => listener());
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

// useSyncExternalStore re-renders only when the *selected* snapshot changes (Object.is),
// and guarantees every component sees the same state in one render (no tearing).
// The selector must return a stable value for unchanged state: a slice, not a fresh object.
export function useStore<T, S>(store: Store<T>, selector: (state: T) => S): S {
  return useSyncExternalStore(store.subscribe, () => selector(store.getState()));
}
