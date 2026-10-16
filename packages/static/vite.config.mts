import { defaultServerConditions, defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * `@resumekit/static`: the templates' read-only pages as a self-contained Node
 * module — React and every template inside it. CSS is built separately
 * (`scripts/build-static-css.ts`), pruned against what this module renders.
 */
export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/static',
  resolve: { conditions: ['@resumekit/source', ...defaultServerConditions] },
  plugins: [react()],
  define: { 'process.env.NODE_ENV': JSON.stringify('production') },
  ssr: {
    noExternal: true as const,
    resolve: { conditions: ['@resumekit/source', ...defaultServerConditions] },
  },
  build: {
    ssr: 'src/render.tsx',
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        format: 'es' as const,
        entryFileNames: 'static.mjs',
        codeSplitting: false,
      },
    },
  },
}));
