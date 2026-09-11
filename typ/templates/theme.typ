#import "@preview/shiroa:0.4.0": templates
#import templates: *
#import "target.typ": sys-is-html-target

// Theme (Colors)
#let dark-theme = book-theme-from(toml("theme-style.toml"), xml: it => xml(it), target: "web-ayu")
#let light-theme = book-theme-from(
  toml("theme-style.toml"),
  xml: it => xml(it),
  target: if sys-is-html-target {
    "web-light"
  } else {
    "pdf"
  },
)
#let default-theme = if sys-is-html-target {
  dark-theme
} else {
  light-theme
}


/// Rebuilds a raw block with a code theme.
///
/// A code theme cannot be applied with `set raw(theme: ...)`: the block is built
/// out in the article and only passed into the show rule, and `set` rules never
/// reach a value that is passed in. The theme has to be given while the element
/// is rebuilt instead.
#let themed-raw(it, theme) = if theme == none or theme.len() == 0 {
  it
} else {
  raw(block: it.block, lang: it.lang, theme: theme, it.text)
}

/// CSS custom properties for an HTML code block.
///
/// Only the colors depend on the theme, so only they are filled in here; the
/// block layout that consumes them lives in `src/styles/global.css`. The gutter
/// is a dimmed code foreground: the syntax theme's foreground when the theme has
/// one, the theme's main color otherwise.
///
/// The properties are scoped to the theme box, so that the dark and the light
/// variant of a code block can each carry their own colors.
#let code-block-vars(theme) = {
  let fg = if theme.code-extra-colors.fg != none {
    theme.code-extra-colors.fg
  } else {
    theme.main-color
  }
  let fade(opacity) = fg.transparentize(100% - opacity).to-hex()
  let scope = if theme.is-dark { ".theme-dark" } else { ".theme-light" }
  (
    scope + " {",
    "  --hypraw-gutter-fg: " + fade(70%) + ";",
    "  --hypraw-gutter-highlight-fg: " + fade(90%) + ";",
    "  --hypraw-gutter-border-color: " + fade(10%) + ";",
    "  --hypraw-bg-color: " + theme.code-extra-colors.bg.to-hex() + ";",
    "}",
  ).join("\n")
}

#let theme-frame(render, tag: "div", theme-tag: none, attrs: (:)) = if sys-is-html-target {
  if theme-tag == none {
    theme-tag = tag
  }
  html.elem(tag, attrs: ("class": "not-prose code-image themed", ..attrs), {
    html.elem(theme-tag, render(dark-theme), attrs: ("class": "theme-dark"))
    html.elem(theme-tag, render(light-theme), attrs: ("class": "theme-light"))
  })
} else {
  render(default-theme)
}
