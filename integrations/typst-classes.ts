import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  utimesSync,
  watch,
  writeFileSync,
  type FSWatcher,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AstroIntegration } from 'astro';
import { NodeCompiler } from '@myriaddreamin/typst-ts-node-compiler';

/**
 * Tailwind only emits CSS for class names it can see, and every class this site
 * puts in an article is written in a `.typ` file — astro-typst renders those to
 * HTML in memory, where Tailwind cannot reach them.
 *
 * So render the same HTML to disk here and let `tailwind.config.js` read the
 * `class` attributes of it. That set is exactly what the pages carry, including
 * classes no source file spells out literally: those a Typst package emits
 * (`hypraw`, `ec-line`, `has-line-numbers`) and those built by concatenation
 * (`"outline-item x-heading-" + str(it.level)`).
 *
 * The output is a cache: `node_modules/.cache/typst-html` is gitignored, and it
 * is rewritten from `content/article` on every run and pruned of stale files.
 */
const sourceDir = 'content/article';
const cacheDir = 'node_modules/.cache/typst-html';
// Tailwind re-scans its content files only when the stylesheet is transformed
// again; in dev that means the stylesheet has to change.
const cssFile = 'src/styles/global.css';

/** Compile one `.typ` file to HTML, the way astro-typst does for `target: "html"`. */
function renderToHtml(compiler: NodeCompiler, sourceFile: string, targetFile: string): boolean {
  let source: string;
  try {
    source = readFileSync(sourceFile, 'utf8');
  } catch {
    return false;
  }
  compiler.addSource(sourceFile, source);

  // Articles render with the default `build-kind` (see `typ/templates/shared.typ`).
  const doc = compiler.compileHtml({ mainFilePath: sourceFile, inputs: { 'build-kind': 'post' } });
  const docError = doc.takeError();
  if (docError || !doc.result) {
    console.error(`[typst-classes] cannot compile ${sourceFile}`);
    return false;
  }

  const html = compiler.tryHtml(doc.result);
  const htmlError = html.takeError();
  if (htmlError || !html.result) {
    console.error(`[typst-classes] cannot convert ${sourceFile} to HTML`);
    return false;
  }

  mkdirSync(dirname(targetFile), { recursive: true });
  writeFileSync(targetFile, html.result.html());
  return true;
}

function listSources(root: string): string[] {
  const source = resolve(root, sourceDir);
  try {
    return readdirSync(source, { recursive: true })
      .map((entry) => String(entry))
      .filter((entry) => entry.endsWith('.typ'))
      .map((entry) => join(source, entry));
  } catch {
    return [];
  }
}

function targetFor(root: string, sourceFile: string): string {
  const relative = sourceFile.slice(resolve(root, sourceDir).length + 1);
  return join(resolve(root, cacheDir), relative.replace(/\.typ$/, '.html'));
}

/** Render every article, and drop cache files whose source is gone. */
function renderAll(root: string): number {
  const compiler = NodeCompiler.create({ workspace: root });
  const sources = listSources(root);
  const expected = new Set<string>();

  let rendered = 0;
  for (const source of sources) {
    const target = targetFor(root, source);
    expected.add(target);
    if (renderToHtml(compiler, source, target)) {
      rendered += 1;
    }
  }

  const cache = resolve(root, cacheDir);
  for (const entry of readdirSync(cache, { recursive: true })) {
    const file = join(cache, String(entry));
    if (file.endsWith('.html') && !expected.has(file)) {
      rmSync(file);
    }
  }

  return rendered;
}

export default function typstClasses(): AstroIntegration {
  let watcher: FSWatcher | null = null;
  let pending: NodeJS.Timeout | null = null;

  return {
    name: 'typst-classes',
    hooks: {
      'astro:config:setup': ({ command, config }) => {
        const root = fileURLToPath(config.root);
        console.log(
          `[typst-classes] rendered ${renderAll(root)} articles to ${cacheDir} (${command} mode)`,
        );

        if (command !== 'dev') {
          return;
        }

        const source = resolve(root, sourceDir);
        watcher = watch(source, { recursive: true }, (event, filename) => {
          const name = filename?.toString();
          if (!name || !name.endsWith('.typ')) {
            return;
          }

          // A save produces several events; render once the burst is over.
          if (pending) {
            clearTimeout(pending);
          }
          pending = setTimeout(() => {
            pending = null;
            const sourceFile = join(source, name);
            const targetFile = targetFor(root, sourceFile);

            if (!existsSync(sourceFile)) {
              // A deleted or renamed article must not leave its classes behind.
              if (!existsSync(targetFile)) {
                return;
              }
              rmSync(targetFile);
              console.log(`[typst-classes] dropped ${name}`);
            } else if (renderToHtml(NodeCompiler.create({ workspace: root }), sourceFile, targetFile)) {
              console.log(`[typst-classes] re-rendered ${name}`);
            } else {
              return;
            }

            // Tailwind only re-scans its content when the stylesheet is
            // transformed again, so nudge the stylesheet to bring the change
            // into the page without a restart.
            const now = new Date();
            utimesSync(resolve(root, cssFile), now, now);
          }, 100);
        });
      },

      'astro:server:done': () => {
        watcher?.close();
        watcher = null;
      },
    },
  };
}
