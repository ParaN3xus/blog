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
