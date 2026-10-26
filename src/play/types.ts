import type { ReactNode } from 'react';

// One thing to look at on a day's playground: a title, an optional hint, and what to render
export interface Scenario {
  title: string;
  hint?: string;
  render: () => ReactNode;
}
