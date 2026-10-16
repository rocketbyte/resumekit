import { defaultClientConditions, defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * The export bundle: the document, built to run standalone in the renderer's
 * browser.
 *
 * Separate from `vite.config.mts` because it builds something with different
 * rules. The library is consumed by an application's bundler, which brings its
 * own React and its own CSS pipeline. This artifact is loaded by a browser that has
 * nothing — no module resolution, no network, no fonts — so everything it needs
 * has to already be inside it.
 *
 * Three properties make the output self-contained, and each is load-bearing:
 *
 *  - **IIFE, with React bundled in.** No import map, no module resolution, no
 *    second request. The renderer is handed one script that runs.
 *  - **Fonts inlined as data URIs.** `assetsInlineLimit` is set above the
 *    largest shipped face, so every `@font-face` in the emitted CSS carries its
 *    own bytes. This is what makes the file's typography independent of the host
 *    the renderer runs on — the whole point of shipping the typefaces.
 *  - **No source maps and no code splitting.** There is nothing to fetch them
 *    from, and a missing chunk would be a silently blank page.
 *
 * The result is two files the API inlines into one HTML document. Nothing it
 * produces ever resolves a URL.
 */
export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/react-export',
  resolve: { conditions: ['@resumekit/source', ...defaultClientConditions] },
  plugins: [react()],
  /*
   * The bundle runs in a bare browser tab with no bundler shims and no Node.
   *
   * React and Craft.js both branch on `process.env.NODE_ENV`, and an unreplaced
   * reference is a `ReferenceError: process is not defined` on the first line
   * that runs — which presents as a blank page, not as an error, because the
   * renderer simply prints whatever the DOM contains. Under vitest this is
   * invisible: jsdom inherits Node's globals, so the bundle works in the test
   * and fails in Chromium.
   */
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
    'process.env': '{}',
  },
  build: {
    outDir: 'dist/export-bundle',
    emptyOutDir: true,
    sourcemap: false,
    cssCodeSplit: false,
    /*
     * Above the largest shipped face (Cochineal italic, ~31KB) with room to
     * spare, so no font is ever emitted as a separate file the renderer
     * cannot fetch. A face that exceeded this would fail as a missing glyph run
     * rather than as a build error, so the margin is deliberate.
     */
    assetsInlineLimit: 512 * 1024,
    lib: {
      entry: 'src/export/entry.tsx',
      name: 'ResumekitExport',
      formats: ['iife' as const],
      fileName: () => 'bundle.js',
      cssFileName: 'bundle',
    },
    rollupOptions: {
      /*
       * Nothing is external. The bundle runs where no package manager has ever
       * been — React, Craft.js and the templates all travel inside it.
       */
      external: [],
      output: {
        inlineDynamicImports: true,
        /*
         * The safety net for anything `define` did not reach — a dependency
         * that touches `process` some other way still finds an object rather
         * than throwing on the first statement.
         */
        banner:
          'globalThis.process=globalThis.process||{env:{NODE_ENV:"production"}};',
      },
    },
  },
}));
