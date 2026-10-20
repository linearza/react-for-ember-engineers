import type { ReactNode } from 'react';

// Ember: {{yield}} → `children`; named blocks (<:actions>, <:footer>) → props that take ReactNode.
interface CardProps {
  title: string;
  actions?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}

export function Card({ title, actions, footer, children }: CardProps) {
  return (
    <section className="card" aria-label={title}>
      <header className="card__header">
        <h2>{title}</h2>
        {actions && <div className="card__actions">{actions}</div>}
      </header>
      <div className="card__body">{children}</div>
      {footer && <footer className="card__footer">{footer}</footer>}
    </section>
  );
}
