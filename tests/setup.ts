import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach } from 'vitest';
import { resetDb, setLatency } from '@domain/api';

beforeEach(() => {
  resetDb();
  setLatency(0);
});

afterEach(() => {
  cleanup();
});
