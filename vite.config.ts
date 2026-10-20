/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

// `@ex/dayNN/...` points at YOUR work in exercises/ by default.
// Run with SOLUTIONS=1 (pnpm test:solutions / dev:solutions) to point it at solutions/ instead.
const useSolutions = process.env.SOLUTIONS === '1';
const exDir = useSolutions ? 'solutions' : 'exercises';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@ex': fileURLToPath(new URL(`./${exDir}`, import.meta.url)),
      '@domain': fileURLToPath(new URL('./src/domain', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
    css: false,
    restoreMocks: true,
  },
});
