/**
 * `pnpm dev`: everything that is built rather than read from source, rebuilt
 * on save.
 *
 * An application linked to this checkout reads the components from `src`
 * directly, so they need nothing. Three things are artifacts, though, and each
 * gets a watcher:
 *
 *  - the generated templates, from their `.template.yaml` descriptions;
 *  - `/static` (`dist/static/static.mjs`), with its pruned CSS rebuilt after
 *    every bundle, since the CSS is pruned against what the bundle renders;
 *  - the PDF export bundle (`dist/export-bundle`).
 */
import { spawn, spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build, type Plugin } from 'vite';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const generator = spawn('tsx', ['scripts/generate-templates.ts', '--watch'], {
  cwd: ROOT,
  stdio: 'inherit',
});

const staticCss: Plugin = {
  name: 'resumekit:static-css',
  closeBundle() {
    spawnSync(
      'tsx',
      ['--conditions=@resumekit/source', 'scripts/build-static-css.ts'],
      { cwd: ROOT, stdio: 'inherit' },
    );
  },
};

await build({
  configFile: join(ROOT, 'vite.static.config.mts'),
  plugins: [staticCss],
  build: { watch: {} },
});
await build({
  configFile: join(ROOT, 'vite.export.config.mts'),
  build: { watch: {} },
});

process.on('SIGINT', () => {
  generator.kill();
  process.exit(0);
});
