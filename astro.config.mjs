// @ts-check
import { defineConfig, envField } from "astro/config";
import sitemap from "@astrojs/sitemap";
import { typst } from "astro-typst";
import { loadEnv } from "vite";
import icon from "astro-icon";
import copyAssetsIntegration from './integrations/copy-assets.js';
import typstClassesIntegration from './integrations/typst-classes.js';
import { resolve } from "path";

// Please check `defineConfig/env` in astro.config.mjs for schema
const e = loadEnv(process.env.NODE_ENV || "", process.cwd(), "");
const { SITE, URL_BASE } = e;

const EnvStr = (optional = false) =>
  envField.string({ context: "client", access: "public", optional });

export default defineConfig({
  // Whether to prefetch links while hovering.
  // See: https://docs.astro.build/en/guides/prefetch/
  prefetch: {
    prefetchAll: true,
  },

  site: SITE,
  base: URL_BASE,

  env: {
    schema: {
      SITE_OWNER: EnvStr(),
      SITE_TITLE: EnvStr(),
      SITE_INDEX_TITLE: EnvStr(),
      SITE_DESCRIPTION: EnvStr(),

      SITE: EnvStr(),
      URL_BASE: EnvStr(true),

      GOOGLE_SITE_VERIFICATION: EnvStr(),
      BING_SITE_VERIFICATION: EnvStr(),
    },
  },

  integrations: [
    sitemap(),
    icon(),
    typst({
      options: {
        remPx: 14,
      },
      // Always builds HTML files
      target: () => "html",
      fontArgs: [{ fontPaths: [resolve(import.meta.dirname, "assets/fonts/")] }]
    }),
    copyAssetsIntegration(),
    // Renders the articles to HTML so Tailwind can see the classes Typst emits.
    typstClassesIntegration(),
  ],

  vite: {
    build: {
      assetsInlineLimit(filePath, content) {
        const KB = 1024;
        return content.length < (filePath.endsWith(".css") ? 100 * KB : 4 * KB);
      },
    },
    ssr: {
      external: ["@myriaddreamin/typst-ts-node-compiler"],
      noExternal: ["@fontsource-variable/inter"],
    },
  },
});
