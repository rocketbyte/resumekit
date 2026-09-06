import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { TEMPLATES, type TemplateId } from '@cvgs/core';
import { TEMPLATE_RENDERERS } from '../registry.js';
import { BOUNDED_NODE_PROPS, FORBIDDEN_NODE_PROPS } from './locked.js';

/**
 * The lock.
 *
 * The guarantee that a candidate cannot alter the DESIGN has to be asserted
 * rather than assumed, and these walk the registry rather than naming
 * components so a field added later cannot quietly skip them.
 *
 * It used to be asserted against Craft.js — a page-builder library used here to
 * forbid page building, whose movement predicates every node answered `false`.
 * `retire-craftjs` removed the library, so the assertions moved from "each node
 * refuses" to "there is no capability to refuse", which is what they were
 * reaching for: a refusal is configuration, and configuration is one upgrade
 * away from meaning something else.
 */

// Vitest serves modules from the project root, so `import.meta.url` is not a
// filesystem path here — resolve from the project's own root instead. That root
// is this library now, so the document lives at `src/` rather than inside an
// app's feature folder.
const FEATURE_DIR = join(process.cwd(), 'src');
const NODE_DIR = join(FEATURE_DIR, 'nodes');
const TEMPLATE_DIR = join(FEATURE_DIR, 'templates');

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return entry.name.endsWith('.tsx') && !entry.name.includes('.spec.')
      ? [path]
      : [];
  });
}

const templateSources = [
  ...sourceFiles(NODE_DIR),
  ...sourceFiles(TEMPLATE_DIR),
];

describe('the registry and the catalog agree', () => {
  it('renders exactly the templates the catalog offers', () => {
    expect(Object.keys(TEMPLATE_RENDERERS).sort()).toEqual(
      (Object.keys(TEMPLATES) as TemplateId[]).sort(),
    );
  });

  it('gives every template a document to render', () => {
    // A resolver used to sit beside this, mapping component NAMES to components
    // so a library could rebuild a tree from a serialized one. Nothing
    // serializes a tree any more — the overlay is résumé paths — so a template
    // is its document and nothing else.
    for (const [id, renderer] of Object.entries(TEMPLATE_RENDERERS)) {
      expect(renderer.Document, id).toBeTypeOf('function');
    }
  });
});

describe('there is nothing that could move a part of the document', () => {
  /**
   * Every source file the editing surface is built from.
   *
   * This used to assert that each node declared four movement predicates
   * answering `false`. That was configuration, and `locked.ts` said so itself:
   * "rules are configuration, and configuration is one API change away from
   * meaning something else". `retire-craftjs` removed the library that offered
   * the capability, so the assertion becomes the stronger one it was reaching
   * for — there is nothing to refuse.
   */
  const SURFACE = FEATURE_DIR;

  function sources(dir: string, hit: (path: string) => void): void {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) sources(path, hit);
      else if (/\.tsx?$/.test(path) && !/\.spec\./.test(path)) hit(path);
    }
  }

  it('depends on no page-builder library', () => {
    const offenders: string[] = [];
    sources(SURFACE, (path) => {
      if (/@craftjs/.test(readFileSync(path, 'utf8'))) {
        offenders.push(relative(SURFACE, path));
      }
    });
    expect(
      offenders,
      'a page builder brings drag, drop and layout manipulation with it, and ' +
        'holding those back is configuration:\n  ' +
        offenders.join('\n  '),
    ).toEqual([]);
  });

  it('offers no drag, drop or re-nesting of its own', () => {
    /*
     * The other half: not importing one is no use if the surface grows its own.
     * A `draggable` attribute or a drop handler in the DOCUMENT is a way to
     * move a part of it, whatever library is or is not present.
     *
     * `@dnd-kit` is deliberately not searched for here. It reorders ENTRIES
     * within a collection — a domain operation the overlay records — and lives
     * in `collections/`, which is not this surface.
     */
    const offenders: string[] = [];
    sources(SURFACE, (path) => {
      const src = readFileSync(path, 'utf8');
      for (const bad of ['onDrop', 'onDragOver', 'draggable=']) {
        if (src.includes(bad))
          offenders.push(`${relative(SURFACE, path)}: ${bad}`);
      }
    });
    expect(offenders).toEqual([]);
  });
});

describe('the design is not addressable', () => {
  it('exposes no ARBITRARY presentational prop on any node', () => {
    /*
     * A node's prop surface is easy to widen and hard to notice widening, so
     * this reads the declared prop interfaces rather than trusting types.
     *
     * Bounded formatting (`bold`, `align`, `ink`) is allowed — see `locked.ts`.
     * What is forbidden is anything through which a caller could express
     * arbitrary presentation.
     */
    for (const path of templateSources) {
      const source = readFileSync(path, 'utf8');
      const interfaces =
        source.match(/interface \w+Props \{[\s\S]*?\n\}/g) ?? [];
      for (const block of interfaces) {
        for (const forbidden of FORBIDDEN_NODE_PROPS) {
          const match = block.match(
            new RegExp(`^\\s*${forbidden}\\??:\\s*(.+?);`, 'm'),
          );
          if (!match) continue;

          /*
           * `style?: DocumentStyle` is the document's own catalog-bounded style
           * — a typeface id, an ink id and a scale — not a CSS style object. It
           * is the one way presentation legitimately enters: once, at the
           * template root, with every value vetted by the domain. A `style`
           * typed as anything else would be arbitrary, and still fails here.
           */
          expect(
            match[1].trim(),
            `${path} declares "${forbidden}" as something unbounded`,
          ).toBe('DocumentStyle');
        }
      }
    }
  });

  it('types every formatting prop to the catalog, never to a raw string', () => {
    // `FieldFormatting` is the single declaration the three nodes extend, so
    // this is where a free-string `align` or `ink` would have to appear.
    const source = readFileSync(join(NODE_DIR, 'formatting.ts'), 'utf8');
    for (const [prop, type] of Object.entries(BOUNDED_NODE_PROPS)) {
      expect(source, `${prop} is not bounded`).toMatch(
        new RegExp(`${prop}\\?:\\s*${type}\\b`),
      );
    }
    expect(source).not.toMatch(/(align|ink)\?:\s*string/);
  });

  it('declares no canvas, so there is no drop target anywhere', () => {
    for (const path of templateSources) {
      const source = readFileSync(path, 'utf8');
      expect(source, `${path} declares a canvas`).not.toMatch(
        /<Element[^>]*\scanvas\b/,
      );
      expect(source, `${path} declares canvas in craft config`).not.toMatch(
        /isCanvas\s*:\s*true/,
      );
    }
  });

  it('never connects a drag handle', () => {
    for (const path of templateSources) {
      const source = readFileSync(path, 'utf8');
      expect(source, `${path} connects a drag handle`).not.toMatch(
        /connectors[\s\S]{0,40}\bdrag\b/,
      );
    }
  });

  it('offers no control that adds or removes a section', () => {
    // Structural edits are claims about the candidate's history, which this
    // product grounds through the interview rather than through free typing.
    for (const path of templateSources) {
      const source = readFileSync(path, 'utf8');
      expect(source).not.toMatch(
        /experience\.push|education\.push|skills\.push/,
      );
      expect(source).not.toMatch(
        /Add (a )?(job|role|school|section|skill group)/i,
      );
    }
  });
});

/**
 * Structural authoring did not reopen the design surface.
 *
 * `editor-structural-authoring` adds three ways to put content in the document
 * and no way to lay it out. These assert the second half — the part that would
 * be easy to lose while adding the first.
 */
describe("Harvard's skills read as lines, not as a table", () => {
  /*
   * This section was rebuilt twice and the tests are what stop it going back.
   *
   * A per-row grid of `auto 1fr` gave every row a hanging indent measured from
   * its own category, so eight rows had eight different left edges. Replacing
   * it with ONE grid over the list aligned them — by making the section a
   * two-column table, which put a column of dead space beside every short
   * category and, worse, put the skills in cells. A résumé is read by a parser
   * before it is read by a person, and cells are what stop it being read
   * linearly.
   *
   * What it is now is ordinary text flow: category and skills on one line, a
   * wrap returning to the left margin.
   */
  const css = readFileSync(
    join(TEMPLATE_DIR, 'harvard', 'harvard.css'),
    'utf8',
  );
  const rule = (selector: string) => {
    const from = css.slice(css.indexOf(selector));
    return from.slice(0, from.indexOf('}'));
  };

  it('lays out no columns, so a wrap returns to the margin', () => {
    for (const selector of [
      '.tpl-harvard__skills {',
      '.tpl-harvard__skill-group {',
    ]) {
      const body = rule(selector);
      expect(body, `${selector} lays out columns`).not.toMatch(
        /grid-template-columns|columns:|display:\s*(grid|flex)/,
      );
      // Nor by the other route to the same thing: a hanging indent.
      expect(body, `${selector} indents its wrapped lines`).not.toMatch(
        /text-indent|padding-left|margin-left/,
      );
    }
  });

  it('keeps a category on one line', () => {
    // A name is a name; half of one at the end of a line reads as an accident.
    expect(rule('.tpl-harvard__skill-label {')).toMatch(
      /white-space:\s*nowrap/,
    );
  });

  it('separates a category from its skills with a real character', () => {
    /*
     * The gap used to be `column-gap`, which a parser reading the exported PDF
     * cannot see — it takes the words in order and gets "Backend:Node.js". The
     * separator has to survive being extracted, so it is a space in the markup.
     */
    const entries = readFileSync(
      join(TEMPLATE_DIR, 'harvard', 'entries.tsx'),
      'utf8',
    );
    expect(entries).toMatch(/<\/span>\{' '\}/);
  });
});

describe('an editable field breaks across lines like the text it replaces', () => {
  /*
   * The rule this whole layer exists for is that a field occupies the SAME BOX
   * whether it is being edited or not, and it took three attempts to keep it.
   *
   * A single-line field was an `<input>` carrying `width: 100%` inside an
   * inline span, and a percentage on an inline box resolves against the nearest
   * BLOCK ancestor — so clicking a date or an email handed it the whole row and
   * pushed the line apart. Sizing it to a mirror fixed that for text that fits
   * on one line, and could not fix it for text that does not: a form control is
   * an ATOMIC inline box, so a field holding "Architecture & Quality:
   * Distributed Systems, …" had to move somewhere it fitted whole, and the
   * skills dropped below their own category.
   *
   * An editable span is not atomic. It flows, wraps, and breaks exactly where
   * the static text broke. Everything asserted here is a piece of that, and
   * each is one edit away from being undone.
   */
  const NODE = (name: string) =>
    readFileSync(join(NODE_DIR, name), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  const css = readFileSync(join(NODE_DIR, 'template-node.css'), 'utf8');
  const field = NODE('PlainTextField.tsx');

  it('is an editable span, never a form control', () => {
    // The two components that hold a LINE of the document. A control here is
    // the defect, whichever control it is.
    for (const name of ['EditableText.tsx', 'EditableInlineList.tsx']) {
      const source = NODE(name);
      expect(source, `${name} renders a form control`).not.toMatch(
        /<input|<textarea/,
      );
      expect(source).toMatch(/PlainTextField/);
    }
    expect(field).toMatch(/contentEditable=/);
  });

  it('flows inline, so a wrap returns to the margin', () => {
    const rule = css.slice(css.indexOf('span.tpl-input {'));
    expect(rule.slice(0, rule.indexOf('}'))).toMatch(/display:\s*inline/);
  });

  it('wraps where the static text wrapped, not where the browser prefers', () => {
    /*
     * The defect this guards is the FORM CONTROL one arriving from a different
     * direction. Every UA stylesheet hangs `overflow-wrap: break-word` and
     * `-webkit-line-break: after-white-space` on `contenteditable` and on
     * nothing else, and both decide where a line breaks — so the same sentence
     * broke in a different place the instant it was clicked into, and the
     * document moved under the candidate's cursor.
     *
     * Asserted in the source because the wrap is a real layout, and jsdom has
     * none: it applies no UA stylesheet, so a test that rendered the field
     * would pass with these rules deleted.
     */
    const rule = css.slice(css.indexOf('span.tpl-input {'));
    const body = rule.slice(0, rule.indexOf('\n}'));
    // `inherit`, not a value of its own: the field wraps however its
    // surroundings wrap, which is what "the same box" means for text.
    expect(body).toMatch(/overflow-wrap:\s*inherit/);
    expect(body).toMatch(/word-break:\s*inherit/);
    expect(body).toMatch(/-webkit-line-break:\s*auto/);
    expect(body).toMatch(/[^-]line-break:\s*auto/);
  });

  it('does not scroll the page to a field the pointer is already on', () => {
    /*
     * Both fields, because a bullet is a textarea and reaches focus by its own
     * route — and it was the one left behind when this was first fixed.
     */
    expect(NODE('AuthoredBullets.tsx')).toMatch(
      /focus\(\{ preventScroll: true \}\)/,
    );
    /*
     * Selection is revealed by a click, so focusing the field has nothing to
     * reveal — but the browser scrolls every ancestor to show a newly focused
     * element, and inside a zoomed sheet its idea of "shown" is not the
     * reader's. The canvas jumped as the caret appeared.
     */
    expect(field).toMatch(/focus\(\{ preventScroll: true \}\)/);
  });

  it('takes plain text only, so a paste cannot style the résumé', () => {
    expect(field).toMatch(/plaintext-only/);
  });

  it('writes its text into the DOM once, so the caret stays put', () => {
    /*
     * A controlled `contenteditable` replaces the text node the caret stands
     * in on every keystroke, and the caret jumps to the start of the field. The
     * child React holds has to be frozen at mount.
     */
    expect(field).toMatch(/const \[initial\]\s*=\s*useState\(value\)/);
    expect(field).toMatch(/\{initial\}/);
  });

  it('keeps a line a line', () => {
    expect(field).toMatch(/!multiline && e\.key === 'Enter'/);
    // And for the newline that arrives by paste rather than by keystroke.
    expect(field).toMatch(/flatten/);
  });

  it('needs no mirror, because an inline box is its own size', () => {
    /*
     * The measuring apparatus the atomic box needed is gone with it: no inline
     * grid, no invisible copy of the text sizing a track. What remains of
     * `tpl-grow` is the BLOCK one, which gives a bullet's textarea its height.
     */
    expect(css).not.toMatch(/tpl-grow--inline/);
    expect(NODE('EditableText.tsx')).not.toMatch(/tpl-grow|data-value/);
    expect(NODE('EditableInlineList.tsx')).not.toMatch(/tpl-grow|data-value/);
  });
});

describe('authored content is as locked as written content', () => {
  it('adds no canvas and no drag handle anywhere', () => {
    const source = readFileSync(join(NODE_DIR, 'CustomSections.tsx'), 'utf8');
    expect(source).not.toMatch(/<Element[^>]*\scanvas\b/);
    expect(source).not.toMatch(/isCanvas\s*:\s*true/);
    expect(source).not.toMatch(/connectors\s*:\s*\{[^}]*\bdrag\b/);
    expect(source).not.toMatch(/\bdrag\s*\(/);
  });

  it('gives an authored NODE no presentational property', () => {
    const source = readFileSync(join(NODE_DIR, 'CustomSections.tsx'), 'utf8');
    /*
     * Scoped to the FIELD tags, not to the whole file. The plain host elements
     * around them carry `className` like every template document does; that is
     * the template's own markup, and not a surface a candidate can express
     * anything through.
     *
     * These were `<Element is={EditableText} …>` before `retire-craftjs`; a
     * field is now written as itself, so the tag name IS the component.
     */
    const elements =
      source.match(
        /<(?:EditableText|EditableBulletList|EditableInlineList)[\s\S]*?\/>/g,
      ) ?? [];
    expect(elements.length).toBeGreaterThan(0);
    for (const element of elements) {
      for (const banned of FORBIDDEN_NODE_PROPS) {
        expect(element, `${banned} reached an authored node`).not.toMatch(
          new RegExp(`\\s${banned}=`),
        );
      }
    }
  });

  it('renders authored fields through the same locked nodes', () => {
    /*
     * The heading is still drawn by `CustomSections`; the ENTRIES moved into
     * each template's own entry component when `document-collections` (#57)
     * ended the shared neutral layout. So the assertion follows them: whichever
     * template draws a candidate's section, it draws it through the same
     * editable nodes the writer's fields use, which is what puts it under the
     * lock assertions above without naming it again.
     */
    expect(readFileSync(join(NODE_DIR, 'CustomSections.tsx'), 'utf8')).toMatch(
      /<EditableText\b/,
    );

    const TEMPLATES = join(NODE_DIR, '..', 'templates');
    for (const template of readdirSync(TEMPLATES, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)) {
      const source = readFileSync(
        join(TEMPLATES, template, 'entries.tsx'),
        'utf8',
      );
      expect(source, `${template} draws a custom entry`).toMatch(
        /CustomEntry\(/,
      );
      expect(source, `${template} uses the shared nodes`).toMatch(
        /<EditableText\b/,
      );
      expect(source, `${template} uses the shared bullet list`).toMatch(
        /<EditableBulletList\b/,
      );
    }
  });

  it('gives a template no way to change a collection', () => {
    /*
     * The boundary the whole layer rests on. A template supplies markup; the
     * verbs live in `collections/` and are handed to nobody. Asserted rather
     * than left to discipline, because it erodes the first time somebody needs
     * a button "just here".
     */
    const TEMPLATES = join(NODE_DIR, '..', 'templates');
    for (const template of readdirSync(TEMPLATES, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)) {
      const dir = join(TEMPLATES, template);
      for (const file of readdirSync(dir).filter((f) => f.endsWith('.tsx'))) {
        if (file.endsWith('.spec.tsx')) continue;
        const source = readFileSync(join(dir, file), 'utf8');
        for (const verb of [
          'useCollection',
          'useSectionCollection',
          'useCustomEntries',
        ]) {
          expect(source, `${template}/${file} reached a mutator`).not.toContain(
            verb,
          );
        }
      }
    }
  });
});
