import { useCallback, useState } from 'react';

export function useToggle(initial = false): [boolean, () => void, (value: boolean) => void] {
  const [on, setOn] = useState(initial);
  // Stable identity, so consumers can pass it to memo'd children or effect deps.
  const toggle = useCallback(() => setOn((prev) => !prev), []);
  return [on, toggle, setOn];
}
