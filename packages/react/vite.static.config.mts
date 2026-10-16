import { defaultServerConditions, defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/** The static renderer as a self-contained Node module; CSS is built separately. */
export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/react-static',
  resolve: { conditions: ['@resumekit/source', ...defaultServerConditions] },
  plugins: [react()],
  define: { 'process.env.NODE_ENV': JSON.stringify('production') },
  ssr: {
    noExternal: true as const,
    resolve: { conditions: ['@resumekit/source', ...defaultServerConditions] },
  },
  build: {
    ssr: 'src/static/render.tsx',
    outDir: 'dist/static',
    emptyOutDir: false,
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
