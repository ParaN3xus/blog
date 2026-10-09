import { NodeCompiler } from "@myriaddreamin/typst-ts-node-compiler";
import { existsSync, readdirSync, statSync } from "fs";
import { extname, join, resolve } from "path";
import sharp from "sharp";

const projectRoot = resolve(
  import.meta.dirname,
  import.meta.env.DEV ? "../../" : "../../../"
);

const compiler = NodeCompiler.create({
  workspace: resolve(projectRoot, "typ/templates"),
});

const pdfCompiler = NodeCompiler.create({
  workspace: projectRoot,
  fontArgs: [{ fontPaths: [resolve(projectRoot, "assets/fonts/")] }],
});

/**
 * Cloudflare Pages rejects files above 25 MiB, and the yearly archive PDFs embed
 * every article image at full resolution: the 2025 archive pulls ~29 MiB of
 * photos out of `content/article/assets`, which produced a 31 MiB PDF and failed
 * the deploy. Give the PDF compiler downscaled copies through typst.ts's shadow
 * filesystem instead — the web pages keep the originals. `mapShadow` matches on
 * the absolute path, which is how typst addresses the files.
 */
const PDF_IMAGE_MAX_EDGE = 1400;
const PDF_IMAGE_QUALITY = 72;
const PDF_IMAGE_MIN_BYTES = 128 * 1024;
const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

function* walkImages(dir: string): Generator<string> {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walkImages(path);
    } else if (IMAGE_EXTENSIONS.has(extname(entry.name).toLowerCase())) {
      yield path;
    }
  }
}

/** Downscale one image; returns its bytes, or null when sharp cannot read it. */
async function downscale(file: string): Promise<Buffer | null> {
  try {
    // `.rotate()` bakes in any EXIF orientation, so the PDF cannot come out sideways.
    const resized = sharp(file).rotate().resize({
      width: PDF_IMAGE_MAX_EDGE,
      height: PDF_IMAGE_MAX_EDGE,
      fit: "inside",
      withoutEnlargement: true,
    });
    const ext = extname(file).toLowerCase();
    const buffer =
      ext === ".png"
        ? await resized.png({ compressionLevel: 9 }).toBuffer()
        : ext === ".webp"
          ? await resized.webp({ quality: PDF_IMAGE_QUALITY }).toBuffer()
          : await resized.jpeg({ quality: PDF_IMAGE_QUALITY }).toBuffer();
    return buffer.length < statSync(file).size ? buffer : null;
  } catch (error) {
    console.warn(`[typst] could not downscale ${file} for the PDF:`, error);
    return null;
  }
}

let imagesMapped: Promise<void> | null = null;

/** Map every oversized article image onto the PDF compiler, once per build. */
function mapDownscaledImages(): Promise<void> {
  imagesMapped ??= (async () => {
    const assetsDir = join(projectRoot, "content/article/assets");
    if (!existsSync(assetsDir)) return;

    for (const file of walkImages(assetsDir)) {
      if (statSync(file).size < PDF_IMAGE_MIN_BYTES) continue;
      const buffer = await downscale(file);
      if (buffer) pdfCompiler.mapShadow(file, buffer);
    }
  })();

  return imagesMapped;
}

export async function renderPdf(mainFileContent: string): Promise<Buffer> {
  await mapDownscaledImages();

  return pdfCompiler.pdf({
    mainFileContent: mainFileContent,
    inputs: {
      "build-kind": "monthly",
    },
  });
}
