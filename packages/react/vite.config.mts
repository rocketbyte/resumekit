import { defaultClientConditions, defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/react',
  resolve: { conditions: ['@resumekit/source', ...defaultClientConditions] },
  plugins: [react()],
  // Uncomment this if you are using workers.
  // worker: {
  //  plugins: [],
  // },
  test: {
    name: 'react',
    watch: false,
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    /*
     * This suite mounts real templates, and the wall-clock cost of that is a property of the suite
     * rather than of one exceptional test. See `test-setup.ts` for the timeout
     * that was actually firing.
     */
    testTimeout: 20_000,
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: './test-output/vitest/coverage',
      provider: 'v8' as const,
    },
  },
}));
