import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach } from 'vitest';
import { resetDb, setLatency } from '@domain/api';
import { issueEvents } from '@domain/events';

beforeEach(() => {
  resetDb();
  setLatency(0);
  issueEvents.reset();
});

afterEach(() => {
  cleanup();
});
