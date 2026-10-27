import { useState } from 'react';

/*
DAY 8 — your first custom hook.
Ember: the closest thing is a resource (ember-resources) or a tiny class with @tracked state.
In React, a hook is just a function whose name starts with `use` and that calls other hooks.

TODO: return [on, toggle, set]
  - `toggle()` flips the value (use an updater function)
  - `set(value)` sets it explicitly
  - `toggle` must keep the same identity across renders (useCallback)
*/

export function useToggle(initial = false): [boolean, () => void, (value: boolean) => void] {
  const [on] = useState(initial);
  return [on, () => {}, () => {}];
}
