/** @type {import('tailwindcss').Config} */

import daisyui from "daisyui"
import typography from "@tailwindcss/typography"

export default {
  content: ["./src/**/*.{html,astro,vue,js,ts}", "./content/**/*.typ"],
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

