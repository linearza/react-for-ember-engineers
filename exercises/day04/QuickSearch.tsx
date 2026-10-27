import { useRef, type FormEvent, type KeyboardEvent } from 'react';

/*
DAY 4 — uncontrolled inputs & refs.
Not every input needs React state. Here the DOM owns the value (`defaultValue`, not `value`).

TODO:
  - <form role="search"> containing a "Search issues" input named "q" and a "Go" submit button
  - On submit: prevent default, read the value with `new FormData(event.currentTarget)`,
    call onSearch(trimmedValue)
  - Pressing Escape inside the input clears it — use a ref (useRef) to reach the DOM node.
    (Ember: a modifier receiving the element.)
*/

interface QuickSearchProps {
  onSearch: (query: string) => void;
}

export function QuickSearch({ onSearch }: QuickSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  void [inputRef, onSearch];
  void (null as FormEvent | KeyboardEvent | null);

  return <form role="search" />;
}
