/**
 * Compile every `src/templates/<id>/<id>.template.yaml` into that template's
 * `<Component>Document.tsx` and `entries.tsx`.
 *
 *   pnpm run generate-templates   # write, once      (or: nx run resume-templates:…)
 *   pnpm run watch-templates      # write on every save
 *   pnpm run check-templates      # CI: fail on drift
 *
 * The output is formatted with the repository's Prettier config, so the check
 * compares exactly what is committed. See `src/compiler/` and
 * `openspec/changes/declarative-templates`.
 */
import {
  readFileSync,
  readdirSync,
  existsSync,
  writeFileSync,
  watch,
} from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import { format, resolveConfig } from 'prettier';
import { TemplateDescriptionSchema } from '../src/compiler/schema.js';
import { emit } from '../src/compiler/emit.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const TEMPLATES = join(ROOT, 'src', 'templates');
const check = process.argv.includes('--check');
const watching = process.argv.includes('--watch');

async function pretty(source: string, file: string): Promise<string> {
  const config = (await resolveConfig(file)) ?? {};
  return format(source, { ...config, filepath: file });
}

/** One pass over every description. Returns the problems found. */
async function run(): Promise<string[]> {
  const problems: string[] = [];
  for (const id of readdirSync(TEMPLATES)) {
    const yamlFile = join(TEMPLATES, id, `${id}.template.yaml`);
    if (!existsSync(yamlFile)) continue;
    const where = relative(process.cwd(), yamlFile);

    let raw: unknown;
    try {
      raw = parse(readFileSync(yamlFile, 'utf8'));
    } catch (e) {
      problems.push(`${where}: not valid YAML — ${(e as Error).message}`);
      continue;
    }
    const parsed = TemplateDescriptionSchema.safeParse(raw);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        problems.push(
          `${where}: ${issue.path.join('.') || '(root)'}: ${issue.message}`,
        );
      }
      continue;
    }
    const d = parsed.data;
    const out = emit(d);
    const files: [string, string][] = [
      [join(TEMPLATES, id, `${d.component}Document.tsx`), out.document],
      [join(TEMPLATES, id, 'entries.tsx'), out.entries],
    ];
    for (const [file, source] of files) {
      const text = await pretty(source, file);
      const current = existsSync(file) ? readFileSync(file, 'utf8') : '';
      if (current === text) continue;
      if (check) {
        problems.push(
          `${relative(process.cwd(), file)} differs from what ${where} generates — ` +
            'run the `generate-templates` script and do not edit generated files.',
        );
      } else {
        writeFileSync(file, text);
        console.log(`wrote ${relative(process.cwd(), file)}`);
      }
    }
  }
  return problems;
}

const first = await run();
for (const p of first) console.error(p);

if (watching) {
  /*
   * Regenerate on every save of a description. The gallery and the app pick
   * the rewritten .tsx up through Vite's hot reload, so an edit to the YAML is
   * on screen a moment later. A description that does not validate prints its
   * problems and leaves the last good output in place.
   */
  console.log('watching src/templates/**/*.template.yaml — Ctrl+C to stop');
  let timer: ReturnType<typeof setTimeout> | undefined;
  watch(TEMPLATES, { recursive: true }, (_, file) => {
    if (!file?.endsWith('.template.yaml')) return;
    clearTimeout(timer);
    timer = setTimeout(async () => {
      const problems = await run();
      for (const p of problems) console.error(p);
      if (problems.length === 0) console.log('templates up to date');
    }, 100);
  });
} else {
  if (first.length > 0) process.exit(1);
  if (check) console.log('templates are up to date with their descriptions');
}
