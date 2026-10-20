import { useEffect, useReducer } from 'react';

// DAY 7 — an external store (how Zustand / Redux work under the hood).
//
// TODO 1 — createStore: setState updates the state but never tells anyone. Notify every
//   subscriber after a change (skip when the new state is Object.is-equal to the old one).
//
// TODO 2 — useStore(store, selector): this version re-renders on EVERY store change, even if the
//   selected slice didn't change, and can "tear" under concurrent rendering. Replace it with
//   useSyncExternalStore(store.subscribe, () => selector(store.getState())).
//
// Ember: a service with @tracked fields gives you fine-grained updates for free. In React you
// get them by subscribing with a selector.

export interface Store<T> {
  getState(): T;
  setState(next: T | ((prev: T) => T)): void;
  subscribe(listener: () => void): () => void;
}

export function createStore<T>(initial: T): Store<T> {
  let state = initial;
  const listeners = new Set<() => void>();
  return {
    getState: () => state,
    setState(next) {
      state = typeof next === 'function' ? (next as (prev: T) => T)(state) : next;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export function useStore<T, S>(store: Store<T>, selector: (state: T) => S): S {
  const [, forceRender] = useReducer((n: number) => n + 1, 0);
  useEffect(() => store.subscribe(forceRender), [store]);
  return selector(store.getState());
}
