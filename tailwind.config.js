/** @type {import('tailwindcss').Config} */

import daisyui from "daisyui"
import typography from "@tailwindcss/typography"

// A `.typ` file is prose and code, so Tailwind's default word-level extractor
// would read Typst function names (`outline(depth: 2)`) and code samples
// (`class StemLayer(nn.Module):`) as class candidates. Only the class
// attributes — `class: "…"` or `"class": "…"` — hold real class names.
const typstClassExtractor = (content) =>
  [...content.matchAll(/\bclass["']?\s*[:=]\s*["']([^"']*)["']/g)]
    .flatMap((match) => match[1].split(/\s+/))
    .filter(Boolean)

// The HTML rendered by `integrations/typst-classes.ts` is the ground truth for
// what classes a page carries, but Tailwind does not parse HTML either: its
// default extractor reads every word of the file as a candidate, so prose and
// code samples leak in (`.table`, `.container`, `.visible`, …). Read the
// `class` attributes only.
const htmlClassExtractor = (content) =>
  [...content.matchAll(/class="([^"]*)"/g)]
    .flatMap((match) => match[1].split(/\s+/))
    .filter(Boolean)

export default {
  content: {
    files: [
      "./src/**/*.{html,astro,vue,js,ts}",
      "./content/**/*.typ",
      "./typ/templates/**/*.typ",
      "./node_modules/.cache/typst-html/**/*.html",
    ],
    extract: { typ: typstClassExtractor, html: htmlClassExtractor },
  },
  theme: {
    extend: {
    },
  },
  plugins: [
    daisyui, typography
  ],
  daisyui: {
    themes: ["dark", "light"],
  },
}
