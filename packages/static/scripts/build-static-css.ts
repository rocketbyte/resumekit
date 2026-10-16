/**
 * `dist/templates.css` and `dist/templates/<id>.css`: the
 * library's CSS pruned to the rules some fixture page can match, in every
 * template, language and mode, then minified. Fonts are dropped; a static page
 * uses each template's fallback stack.
 *
 * The shared sheet (kit, nodes, paged canvas) is one file and each template's
 * own stylesheet is another, so a site that shows some templates links only
 * theirs rather than paying for the whole catalog.
 */
import {
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import postcss, { type AtRule, type Rule } from 'postcss';
import { transform } from 'esbuild';
import { TEMPLATES, type TemplateId } from '@resumekit/schema';
import { FIXTURES } from '../src/fixtures.js';
import type { RenderStatic } from '../src/api.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
/* The stylesheets are the library's own: pruned here, never copied by hand. */
const SRC = join(ROOT, '../react/src');
const OUT = join(ROOT, 'dist');

const { renderStatic } = (await import(join(OUT, 'static.mjs'))) as {
  renderStatic: RenderStatic;
};

const used = new Set<string>();
const attributes = new Set<string>();
for (const id of Object.keys(TEMPLATES) as TemplateId[]) {
  for (const resume of Object.values(FIXTURES)) {
    for (const language of ['en', 'es']) {
      for (const picture of [false, true]) {
        const html = renderStatic(id, resume, { language, picture });
        for (const [, list] of html.matchAll(/class="([^"]*)"/g)) {
          for (const c of (list ?? '').split(/\s+/)) if (c) used.add(c);
        }
        for (const [, name] of html.matchAll(/\s([a-z][\w-]*)=/g)) {
          if (name) attributes.add(name);
        }
      }
    }
  }
}

function cssFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory())
      return name === 'fonts' ? [] : cssFiles(path);
    return name.endsWith('.css') ? [path] : [];
  });
}

/** Every class and attribute the selector requires occurs in some page (`:not()` aside). */
function canMatch(selector: string): boolean {
  const positive = selector.replace(/:not\((?:[^()]|\([^()]*\))*\)/g, '');
  const classes = positive.match(/\.(-?[_a-zA-Z][\w-]*)/g) ?? [];
  const attrs = positive.match(/\[([a-z][\w-]*)/g) ?? [];
  return (
    classes.every((c) => used.has(c.slice(1))) &&
    attrs.every((a) => attributes.has(a.slice(1)))
  );
}

const files = cssFiles(SRC).sort();
const TEMPLATE_DIR = join(SRC, 'templates');
const roots = new Map<string, postcss.Root>([['', postcss.root()]]);
/** The template a stylesheet belongs to, or '' for the shared sheet. */
const ownerOf = (file: string): string => {
  const rel = relative(TEMPLATE_DIR, file);
  return rel.startsWith('..') ? '' : (rel.split(/[\\/]/)[0] ?? '');
};
for (const file of files) {
  const sheet = postcss.parse(readFileSync(file, 'utf8'), { from: file });
  sheet.walkAtRules((at: AtRule) => {
    if (at.name === 'font-face' || at.name === 'page' || at.name === 'import') {
      at.remove();
    }
  });
  sheet.walkRules((rule: Rule) => {
    if (
      rule.parent?.type === 'atrule' &&
      /keyframes$/.test((rule.parent as AtRule).name)
    ) {
      return;
    }
    const kept = rule.selectors.filter(canMatch);
    if (kept.length === 0) rule.remove();
    else rule.selectors = kept;
  });
  sheet.walkAtRules((at: AtRule) => {
    if (at.nodes && at.nodes.length === 0) at.remove();
  });
  const owner = ownerOf(file);
  if (!roots.has(owner)) roots.set(owner, postcss.root());
  roots.get(owner)?.append(sheet.nodes);
}

mkdirSync(join(OUT, 'templates'), { recursive: true });
for (const [owner, root] of roots) {
  const { code } = await transform(root.toString(), {
    loader: 'css',
    minify: true,
  });
  const out = owner
    ? join(OUT, 'templates', `${owner}.css`)
    : join(OUT, 'templates.css');
  writeFileSync(out, code);
  console.log(`wrote ${relative(process.cwd(), out)} — ${code.length} bytes`);
}
