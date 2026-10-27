import type { ReactNode } from 'react';

/*
DAY 2 — children & "named blocks".
Ember:  <Card @title="Bugs"> <:actions>…</:actions> <:default>…</:default> <:footer>…</:footer> </Card>
React:  <Card title="Bugs" actions={…} footer={…}> …children… </Card>

TODO: render
  <section className="card" aria-label={title}>
    <header className="card__header">
      <h2>{title}</h2>
      {actions, wrapped in <div className="card__actions"> — only if provided}
    </header>
    <div className="card__body">{children}</div>
    {footer, wrapped in <footer className="card__footer"> — only if provided}
  </section>
*/

interface CardProps {
  title: string;
  actions?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}

export function Card({ title, children }: CardProps) {
  return (
    <section className="card">
      <h2>{title}</h2>
      {children}
    </section>
  );
}
