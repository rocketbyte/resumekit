/**
 * `pnpm dev` for `@resumekit/static`: the renderer rebuilt on every save, and
 * its pruned stylesheets after every rebuild, since they are pruned against
 * what the renderer draws.
 */
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build, type Plugin } from 'vite';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const prunedCss: Plugin = {
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
  configFile: join(ROOT, 'vite.config.mts'),
  plugins: [prunedCss],
  build: { watch: {} },
});
