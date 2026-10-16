/**
 * Copies what `tsc` does not emit into `dist`, at the same relative paths, so
 * the compiled modules' `import './x.css'` and the stylesheets' `url(./x.woff2)`
 * resolve exactly as they do in `src`.
 *
 * Then drops those stylesheet imports from the declarations: they are runtime
 * side effects, and a consumer's compiler has no type for a `.css` module.
 */
import {
  cpSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'src');
const DIST = join(ROOT, 'dist');
const ASSETS = new Set(['.css', '.woff2', '.txt', '.md']);

function copy(dir: string): void {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      if (name !== 'compiler') copy(path);
    } else if (ASSETS.has(extname(name))) {
      cpSync(path, join(DIST, relative(SRC, path)));
    }
  }
}

function stripStylesheetImports(dir: string): void {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      stripStylesheetImports(path);
    } else if (name.endsWith('.d.ts')) {
      const source = readFileSync(path, 'utf8');
      const stripped = source.replace(/^import '[^']+\.css';\n/gm, '');
      if (stripped !== source) writeFileSync(path, stripped);
    }
  }
}

copy(SRC);
stripStylesheetImports(DIST);
