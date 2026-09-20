import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/** The gallery is a dev harness for looking at the templates. See main.tsx. */
export default defineConfig({
  root: __dirname,
  plugins: [react()],
  publicDir: `${__dirname}/public`,
  server: {
    port: 4400,
    fs: { allow: ['../../..'] },
  },
});
