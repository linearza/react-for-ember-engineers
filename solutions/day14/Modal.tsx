import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    return () => previouslyFocused?.focus(); // give focus back on close
  }, [open]);

  if (!open) return null;

  // The DOM node lives in <body>, but in the REACT tree it's still a child of whoever rendered it:
  // context flows through, and synthetic events bubble to React ancestors, not DOM ancestors.
  // Ember: {{#in-element}}.
  return createPortal(
    <div
      className="modal-backdrop"
      onClick={(e) => {
        // Only a click on the backdrop itself. Don't stopPropagation inside the dialog: that would
        // also hide its clicks from React ancestors.
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onClose();
        }}
      >
        <h2 id={titleId}>{title}</h2>
        {children}
      </div>
    </div>,
    document.body,
  );
}
