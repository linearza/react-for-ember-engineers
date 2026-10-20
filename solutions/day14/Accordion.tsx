import { createContext, useContext, useId, useState, type ReactNode } from 'react';

// Compound components: the parent owns the state; the children reach it through context.
// Ember: {{yield (hash Item=(component "accordion/item" openId=this.openId toggle=this.toggle))}}

interface AccordionContextValue {
  openValue: string | null;
  toggle: (value: string) => void;
}

interface ItemContextValue {
  value: string;
  isOpen: boolean;
  triggerId: string;
  panelId: string;
}

const AccordionContext = createContext<AccordionContextValue | null>(null);
const ItemContext = createContext<ItemContextValue | null>(null);

function useAccordion(component: string) {
  const ctx = useContext(AccordionContext);
  if (!ctx) throw new Error(`${component} must be used inside <Accordion>`);
  return ctx;
}

function useItem(component: string) {
  useAccordion(component);
  const ctx = useContext(ItemContext);
  if (!ctx) throw new Error(`${component} must be used inside <Accordion.Item>`);
  return ctx;
}

interface AccordionProps {
  defaultValue?: string | null;
  children: ReactNode;
}

function AccordionRoot({ defaultValue = null, children }: AccordionProps) {
  const [openValue, setOpenValue] = useState<string | null>(defaultValue);
  const toggle = (value: string) => setOpenValue((prev) => (prev === value ? null : value));
  return (
    <AccordionContext value={{ openValue, toggle }}>
      <div className="accordion">{children}</div>
    </AccordionContext>
  );
}

function Item({ value, children }: { value: string; children: ReactNode }) {
  const { openValue } = useAccordion('Accordion.Item');
  const id = useId();
  const item = { value, isOpen: openValue === value, triggerId: `${id}-trigger`, panelId: `${id}-panel` };
  return (
    <ItemContext value={item}>
      <div className="accordion__item">{children}</div>
    </ItemContext>
  );
}

function Trigger({ children }: { children: ReactNode }) {
  const { toggle } = useAccordion('Accordion.Trigger');
  const { value, isOpen, triggerId, panelId } = useItem('Accordion.Trigger');
  return (
    <h3>
      <button type="button" id={triggerId} aria-expanded={isOpen} aria-controls={panelId} onClick={() => toggle(value)}>
        {children}
      </button>
    </h3>
  );
}

function Panel({ children }: { children: ReactNode }) {
  const { isOpen, triggerId, panelId } = useItem('Accordion.Panel');
  return (
    <div role="region" id={panelId} aria-labelledby={triggerId} hidden={!isOpen}>
      {children}
    </div>
  );
}

// Attach the parts as static properties: <Accordion.Item>, <Accordion.Trigger>, <Accordion.Panel>.
export const Accordion = Object.assign(AccordionRoot, { Item, Trigger, Panel });
