import { defaultClientConditions } from 'vite';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/test-static',
  plugins: [react()],
  resolve: { conditions: ['@resumekit/source', ...defaultClientConditions] },
  test: {
    name: 'static',
    environment: 'jsdom',
    include: ['src/**/*.spec.{ts,tsx}'],
    testTimeout: 20_000,
  },
});
