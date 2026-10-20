import { useRef, type FormEvent, type KeyboardEvent } from 'react';

interface QuickSearchProps {
  onSearch: (query: string) => void;
}

// Uncontrolled: the DOM owns the value. Read it on submit (FormData) or via a ref when needed.
export function QuickSearch({ onSearch }: QuickSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    onSearch(String(data.get('q') ?? '').trim());
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape' && inputRef.current) {
      inputRef.current.value = '';
    }
  }

  return (
    <form role="search" onSubmit={handleSubmit}>
      <label>
        Search issues
        <input ref={inputRef} name="q" defaultValue="" onKeyDown={handleKeyDown} />
      </label>
      <button type="submit">Go</button>
    </form>
  );
}
