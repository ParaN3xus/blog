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
 * Any document that emits a plain <script> hits this. Right now that is
 * `content/article/mathematica-141-crack.typ`, which injects its keygen via
 *   html.elem("script", attrs: (src: "/post_assets/.../mma_keygen.js"))
 * so that article (and previously every article, while zebraw injected its
 * copy-button script) returned 500. The bug is upstream, not in our templates.
 *
 * Upstream status (checked 2026-09)
 * --------------------------------
 * - Fix PR: https://github.com/OverflowCat/hastx/pull/1
 *   "fix: Prevent compileJsx crash on script tags without data-jsx"
 *   MERGED on 2026-09-14 (merge commit 5fa0bee9); the guard is on `main`.
 *   All it does is add `&& node.properties['data-jsx'] != undefined` below.
 * - Still UNRELEASED: npm has only typstx 0.0.1 (2026-07-31), the repo has no
 *   tags and `packages/mdx` is still version 0.0.1.
 * - astro-typst still pins `"typstx": "0.0.1"` exactly (both 0.12.4 and master),
 *   and its documented escape hatch `htmlMode: "text"` does not work in 0.12.4:
 *   it only forwards `options` / `target` when building its config
 *   (see `src/lib/integration.ts`), so the flag never reaches the vite plugin.
 *
 * When this file can be deleted
 * -----------------------------
 * As soon as the installed typstx carries the guard (a new release, or the
 * `pnpm.overrides` entry pinning the upstream commit), delete this script and
 * the `postinstall` hook in package.json — nothing else needs to change.
 * The script never fails an install: it warns if the expected code is missing,
 * and it reminds you to clean up once typstx is at a version newer than the one
 * this patch was written for.
 */

import { existsSync, readFileSync, realpathSync, unlinkSync, writeFileSync } from "fs";
import { createRequire } from "module";
import { dirname, join } from "path";

const root = join(import.meta.dirname, "../");
/** The typstx release this patch was written for. */
const PATCHED_VERSION = "0.0.1";

const BROKEN = "if (node.type === 'element' && node.tagName === 'script') {";
const PATCHED =
  "if (node.type === 'element' && node.tagName === 'script' && node.properties['data-jsx'] != undefined) {";

// Resolve typstx through astro-typst, so this works both with yarn's flat
// node_modules and with pnpm, where typstx is transitive and only reachable
// from inside astro-typst's own (symlinked) package directory. realpathSync
// is what makes the pnpm layout work: the sibling `typstx` directory lives
// next to the link target, not inside the symlink.
function resolveTypstx() {
  const link = join(root, "node_modules/astro-typst");
  if (!existsSync(link)) return null;
  try {
    // typstx's `exports` map only exposes ".", so resolve the package entry and
    // derive `lib/core.js` from it instead of deep-importing the file.
    const entry = createRequire(join(realpathSync(link), "package.json")).resolve(
      "typstx"
    );
    return join(dirname(entry), "lib/core.js");
  } catch {
    return null;
  }
}

const target = resolveTypstx();

if (!target || !existsSync(target)) {
  console.warn(
    "[patch-typstx] Could not resolve typstx/lib/core.js, skipping. If typstx is no longer in the dependency tree, this script and the postinstall hook can be removed."
  );
  process.exit(0);
}

const source = readFileSync(target, "utf8");

if (source.includes(PATCHED)) {
  // Either we patched it on an earlier install, or typstx now ships the fix.
  const manifest = join(dirname(dirname(target)), "package.json");
  if (existsSync(manifest)) {
    const { version } = JSON.parse(readFileSync(manifest, "utf8"));
    if (version !== PATCHED_VERSION) {
      console.warn(
        `[patch-typstx] typstx is at ${version} (this patch targets ${PATCHED_VERSION}) and already carries the guard.\n` +
          "              Upstream most likely fixed it: check https://github.com/OverflowCat/hastx/pull/1\n" +
          "              and then delete this script plus the postinstall hook in package.json."
      );
    }
  }
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

// Unlink before writing: under pnpm this file is likely a hard link into the
// shared store, and editing it in place would corrupt the store for every
// other project on this machine.
unlinkSync(target);
writeFileSync(target, source.replace(BROKEN, PATCHED));
console.log(
  "[patch-typstx] Patched typstx to skip non-JSX <script> elements (removable once upstream releases the fix)."
);
