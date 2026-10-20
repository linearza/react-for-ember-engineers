import { createContext, useContext, useId, useState, type ReactNode } from 'react';

// DAY 14 — compound components.
// Ember: {{yield (hash Item=(component "accordion/item" …))}} and <acc.Item as |item|> <item.Trigger/>.
// React: the parts are separate components that find their parent through CONTEXT.
//
// Usage:
//   <Accordion>
//     <Accordion.Item value="a">
//       <Accordion.Trigger>Question</Accordion.Trigger>
//       <Accordion.Panel>Answer</Accordion.Panel>
//     </Accordion.Item>
//   </Accordion>
//
// TODO:
//   - Accordion holds `openValue` (only ONE item open at a time; clicking the open one closes it)
//     and provides { openValue, toggle } via AccordionContext
//   - Item provides { value, isOpen, triggerId, panelId } via ItemContext (useId for the ids)
//   - Trigger: <h3><button aria-expanded={isOpen} aria-controls={panelId} id={triggerId}>
//   - Panel: <div role="region" id={panelId} aria-labelledby={triggerId} hidden={!isOpen}>
//   - Item/Trigger/Panel throw `Accordion.X must be used inside <Accordion>` when there's no Accordion
//   - export const Accordion = Object.assign(AccordionRoot, { Item, Trigger, Panel })

interface AccordionProps {
  defaultValue?: string | null;
  children: ReactNode;
}

function AccordionRoot({ children }: AccordionProps) {
  void [createContext, useContext, useId, useState];
  return <div className="accordion">{children}</div>;
}

function Item({ value, children }: { value: string; children: ReactNode }) {
  void value;
  return <div className="accordion__item">{children}</div>;
}

function Trigger({ children }: { children: ReactNode }) {
  return (
    <h3>
      <button type="button">{children}</button>
    </h3>
  );
}

function Panel({ children }: { children: ReactNode }) {
  return <div role="region">{children}</div>;
}

export const Accordion = Object.assign(AccordionRoot, { Item, Trigger, Panel });
