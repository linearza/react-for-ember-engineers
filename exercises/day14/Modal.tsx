import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

// DAY 14 — portals.
// This modal renders INLINE, so it's clipped by any parent with overflow:hidden or a transform,
// and fights z-index with everything.
//
// TODO:
//   - createPortal(…, document.body). Ember: {{#in-element}}.
//   - role="dialog", aria-modal="true", aria-labelledby → the <h2> title (useId)
//   - Escape calls onClose
//   - on open, move focus into the dialog (a ref + an effect; tabIndex={-1} on the dialog), and
//     hand focus back to the previously focused element on close
//   - when !open, render nothing
// Think about it: a click inside the portal bubbles to... which ancestors?

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  void [useEffect, useId, useRef, createPortal, onClose];
  if (!open) return null;
  return (
    <div className="modal" role="dialog">
      <h2>{title}</h2>
      {children}
    </div>
  );
}
