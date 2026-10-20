// The dev app is the Day 15 capstone. `pnpm dev` runs YOUR exercises/day15/App.tsx;
// `pnpm dev:solutions` runs the reference build. The fake API answers in 300 ms, so you can
// see loading states, transitions and optimistic updates for real.
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AppRoot } from '@ex/day15/App';
import { setLatency } from '@domain/api';
import './styles.css';

setLatency(300);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppRoot />
  </StrictMode>,
);
