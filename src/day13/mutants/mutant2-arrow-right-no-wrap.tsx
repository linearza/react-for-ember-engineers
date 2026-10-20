// MUTANT 2: ArrowRight doesn't wrap from the last tab.
// Spoiler! Don't read this until your checks are written.
import { useId, useRef, useState, type KeyboardEvent } from 'react';
import type { TabsProps } from '../Tabs';

export function Mutant({ label, tabs, defaultSelectedId, onChange }: TabsProps) {
  const baseId = useId();
  const [selectedId, setSelectedId] = useState(defaultSelectedId ?? tabs[0]?.id);
  const tabRefs = useRef(new Map<string, HTMLButtonElement>());

  const selected = tabs.find((tab) => tab.id === selectedId) ?? tabs[0];

  function select(id: string, focus: boolean) {
    if (id !== selected.id) {
      setSelectedId(id);
      onChange?.(id);
    }
    if (focus) tabRefs.current.get(id)?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const last = tabs.length - 1;
    let next: number;
    switch (event.key) {
      case 'ArrowRight':
        next = Math.min(index + 1, last);
        break;
      case 'ArrowLeft':
        next = index === 0 ? last : index - 1;
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = last;
        break;
      default:
        return;
    }
    event.preventDefault();
    select(tabs[next].id, true);
  }

  const tabId = (id: string) => `${baseId}-tab-${id}`;
  const panelId = (id: string) => `${baseId}-panel-${id}`;

  return (
    <div className="tabs">
      <div role="tablist" aria-label={label}>
        {tabs.map((tab, index) => {
          const isSelected = tab.id === selected.id;
          return (
            <button
              key={tab.id}
              ref={(el) => {
                if (el) tabRefs.current.set(tab.id, el);
                return () => {
                  tabRefs.current.delete(tab.id);
                };
              }}
              type="button"
              role="tab"
              id={tabId(tab.id)}
              aria-selected={isSelected}
              aria-controls={panelId(tab.id)}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => select(tab.id, false)}
              onKeyDown={(event) => handleKeyDown(event, index)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      <div role="tabpanel" id={panelId(selected.id)} aria-labelledby={tabId(selected.id)} tabIndex={0}>
        {selected.content}
      </div>
    </div>
  );
}
