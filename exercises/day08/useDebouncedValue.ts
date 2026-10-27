/*
DAY 8 — a hook built on an effect.
TODO: return `value`, but only after it has stopped changing for `ms` milliseconds.
  - keep the debounced copy in state
  - in an effect on [value, ms], start a setTimeout that copies value → state
  - clear the timeout in the cleanup, so each new value restarts the clock
Ember: you'd reach for ember-concurrency `timeout()` in a restartable task.
*/

export function useDebouncedValue<T>(value: T, ms: number): T {
  void ms;
  return value;
}
