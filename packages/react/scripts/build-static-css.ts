/**
 * `dist-static/templates.css`: the library's CSS pruned to the rules some
 * fixture page can match, in every template, language and mode, then minified.
 * Fonts are dropped; a static page uses each template's fallback stack.
 */
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import postcss, { type AtRule, type Rule } from 'postcss';
import { transform } from 'esbuild';
import { TEMPLATES } from '@cvgs/core';
import { FIXTURES } from '../src/static/fixtures.js';
import type { RenderStatic } from '../src/static/api.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'src');
const OUT = join(ROOT, 'dist-static');

const { renderStatic } = (await import(join(OUT, 'static.mjs'))) as {
  renderStatic: RenderStatic;
};

const used = new Set<string>();
const attributes = new Set<string>();
for (const id of Object.keys(TEMPLATES)) {
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
const root = postcss.root();
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
  root.append(sheet.nodes);
}

const { code } = await transform(root.toString(), {
  loader: 'css',
  minify: true,
});
writeFileSync(join(OUT, 'templates.css'), code);
console.log(
  `wrote ${relative(process.cwd(), join(OUT, 'templates.css'))} — ` +
    `${code.length} bytes from ${files.length} files`,
);
