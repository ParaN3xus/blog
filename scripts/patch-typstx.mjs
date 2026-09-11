/**
 * postinstall patch: typstx crashes on <script> elements without `data-jsx`.
 *
 * Background
 * ----------
 * Since astro-typst 0.12 the HTML target renders through the hAST pipeline by
 * default (`htmlMode: "hast"`), i.e.
 *   typst.ts `tryHtml().hast()` -> typstx MDX/JSX pipeline -> back to Astro.
 * typstx's `rehypeTransformJsxInTypst` (`compileJsx` in `lib/core.js`) assumes
 * every <script> element carries JSX and reads `node.properties['data-jsx']`
 * before taking `hast.children[0]`. With no `data-jsx` that index is undefined,
 * so it throws:
 *   TypeError: Cannot read properties of undefined (reading 'type')
 *
 * This blog renders code blocks with zebraw, which injects its copy-button
 * script via `html.elem("script", read("html/clipboard-copy.js"))`, so every
 * article containing a code block returns 500. astro-typst 0.11.x used the
 * HTML-string path (`html.result.body()`) and never went through typstx, which
 * is why the 0.12 upgrade broke the site. The bug is upstream, not in our
 * templates.
 *
 * Upstream status
 * ---------------
 * - Fix PR (still unmerged): https://github.com/OverflowCat/hastx/pull/1
 *   "fix: Prevent compileJsx crash on script tags without data-jsx".
 *   All it does is add `&& node.properties['data-jsx'] != undefined` below.
 * - The documented escape hatch `htmlMode: "text"` does not work in 0.12.4:
 *   astro-typst only forwards `options` / `target` when it builds its config
 *   (see `src/lib/integration.ts`), so the flag never reaches the vite plugin.
 *
 * When this file can be deleted
 * -----------------------------
 * Once all three of these are true, delete this script and the `postinstall`
 * hook in package.json; nothing else needs to change:
 *   1. hastx PR #1 (or an equivalent fix) is merged;
 *   2. that fix is published in a new typstx release (npm no longer has only
 *      0.0.1);
 *   3. astro-typst raised its exact pin on typstx (currently
 *      `"typstx": "0.0.1"`), or you override it with a yarn `resolutions` entry.
 * hAST mode then works on its own. If the expected code is gone this script
 * only warns instead of failing, so upgrading first and deleting it later is safe.
 */

import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

const root = join(import.meta.dirname, "../");
const target = join(root, "node_modules/typstx/lib/core.js");

const BROKEN = "if (node.type === 'element' && node.tagName === 'script') {";
const PATCHED =
  "if (node.type === 'element' && node.tagName === 'script' && node.properties['data-jsx'] != undefined) {";

if (!existsSync(target)) {
  console.warn(
    `[patch-typstx] ${target} not found, skipping. If typstx is no longer in the dependency tree, this script and the postinstall hook can be removed.`
  );
  process.exit(0);
}

const source = readFileSync(target, "utf8");

if (source.includes(PATCHED)) {
  // Already patched, nothing to do.
  process.exit(0);
}

if (!source.includes(BROKEN)) {
  console.warn(
    "[patch-typstx] Expected code not found; typstx may have changed or upstream may have fixed it.\n" +
      "              Check https://github.com/OverflowCat/hastx/pull/1 and astro-typst's dependency on typstx,\n" +
      "              then this script and the postinstall hook in package.json can be removed."
  );
  process.exit(0);
}

writeFileSync(target, source.replace(BROKEN, PATCHED));
console.log(
  "[patch-typstx] Patched typstx to skip non-JSX <script> elements (removable once upstream merges)."
);
