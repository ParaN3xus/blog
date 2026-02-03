#import "@preview/cetz:0.3.4"
#import "@preview/lovelace:0.3.0": line-label, pseudocode-list
#import "@preview/zebraw:0.6.1": zebraw, zebraw-init
#import "@preview/numbly:0.1.0": numbly
#import "@preview/shiroa:0.2.3": is-html-target, is-pdf-target, is-web-target, plain-text, templates
#import templates: *
#import "mod.typ": *
#import "theme.typ": *

// Metadata
#let is-html-target = is-html-target()
#let is-pdf-target = is-pdf-target()
#let is-md-target = target == "md"
#let sys-is-html-target = ("target" in dictionary(std))
#let is-web-target = is-web-target() or sys-is-html-target


#let typst-label-prefix = "typst-label-"
#let default-kind = "post"
// #let default-kind = "monthly"

#let build-kind = sys.inputs.at("build-kind", default: default-kind)

#let pdf-fonts = (
  "Libertinus Serif",
  "Noto Serif CJK SC",
)

#let code-font = (
  "DejaVu Sans Mono",
)

// Sizes
#let main-size = if sys-is-html-target {
  16pt
} else {
  10.5pt
}
// ,
#let heading-sizes = (22pt, 18pt, 14pt, 12pt, main-size)
#let list-indent = 0.5em

/// Creates an embedded block typst frame.
#let div-frame(content, attrs: (:), tag: "div") = html.elem(tag, html.frame(content), attrs: attrs)
#let span-frame = div-frame.with(tag: "span")
#let p-frame = div-frame.with(tag: "p")


// defaults
#let (
  style: theme-style,
  is-dark: is-dark-theme,
  is-light: is-light-theme,
  main-color: main-color,
  dash-color: dash-color,
  code-extra-colors: code-extra-colors,
) = default-theme

#let markup-rules(body) = {
  set text(lang: "zh")
  set text(font: pdf-fonts) if not sys-is-html-target

  set text(main-size) if sys-is-html-target
  set text(fill: rgb("dfdfd6")) if is-dark-theme and sys-is-html-target
  show link: set text(fill: dash-color)

  show heading: it => {
    set text(size: heading-sizes.at(it.level, default: main-size))

    block(spacing: 0.7em * 1.5 * 1.2, below: 0.7em * 1.2, {
      if is-web-target {
        show link: static-heading-link(it)
        heading-hash(it, hash-color: dash-color)
      }

      it
    })
  }
  body
}

#let figure-rules(body) = {
  show figure: it => if is-web-target {
    html.elem("div", it, attrs: (
      ..if "label" in it.fields() and it.label != none {
        (id: typst-label-prefix + str(it.label))
      },
      class: "jumpable",
    ))
  } else {
    it
  }
  body
}

#let equation-rules(body) = {
  show math.equation: set text(weight: 400)

  show math.equation.where(block: true): it => context if shiroa-sys-target() == "html" {
    theme-frame(
      tag: "div",
      attrs: (
        ..if "label" in it.fields() and it.label != none {
          (id: typst-label-prefix + str(it.label))
        },
        class: "jumpable",
      ),
      theme => {
        set text(fill: theme.main-color)
        let real-body = {
          if it.numbering == none {
            html.frame(it)
          } else {
            html.elem(
              "div",
              {
                html.elem(
                  "div",
                  html.frame(math.equation(
                    it.body,
                    block: true,
                    numbering: none,
                  )),
                  attrs: (class: "equation-body"),
                )
                html.elem(
                  "div",
                  context numbering(it.numbering, ..counter(math.equation).get()),
                  attrs: (class: "equation-numbering"),
                )
              },
              attrs: (
                class: "equation-container",
              ),
            )
          }
        }
        html.elem("div", real-body, attrs: (class: "block-equation", role: "math"))
      },
    )
  } else {
    it
  }
  show math.equation.where(block: false): it => context if shiroa-sys-target() == "html" {
    theme-frame(tag: "span", theme => {
      set text(fill: theme.main-color)
      span-frame(attrs: (class: "inline-equation"), it)
    })
  } else {
    it
  }
  body
}

#let ref-rules(body) = {
  show ref: it => if sys-is-html-target {
    if it.element == none {
      return it
    }

    if it.element.func() == math.equation {
      return html.elem("a", it, attrs: (
        href: "#" + typst-label-prefix + str(it.element.label),
      ))
    }
    if it.element.func() == figure {
      return html.elem("a", it, attrs: (
        href: "#" + typst-label-prefix + str(it.element.label),
      ))
    }
    it
  } else {
    it
  }
  body
}

#let code-block-rules(body) = {
  let init-with-theme((code-extra-colors, is-dark)) = if is-dark {
    zebraw-init.with(
      // should vary by theme
      background-color: if code-extra-colors.bg != none {
        (code-extra-colors.bg, code-extra-colors.bg)
      },
      highlight-color: rgb("#3d59a1"),
      comment-color: rgb("#394b70"),
      lang-color: rgb("#3d59a1"),
      lang: false,
      numbering: false,
    )
  } else {
    zebraw-init.with(
      // should vary by theme
      background-color: if code-extra-colors.bg != none {
        (code-extra-colors.bg, code-extra-colors.bg)
      },
      lang: false,
      numbering: false,
    )
  }

  /// HTML code block supported by zebraw.
  show: init-with-theme(default-theme)

  show raw: set text(font: code-font)
  show raw.where(block: true): it => context if shiroa-sys-target() == "paged" {
    set raw(theme: theme-style.code-theme) if theme-style.code-theme.len() > 0
    block(width: 100%, inset: (x: 4pt, y: 5pt), radius: 4pt, fill: code-extra-colors.bg, [
      #set text(fill: code-extra-colors.fg) if code-extra-colors.fg != none
      #set par(justify: false)
      // #place(right, text(luma(110), it.lang))
      #it
    ])
  } else {
    theme-frame(theme => {
      show: init-with-theme(theme)
      let code-extra-colors = theme.code-extra-colors
      set text(fill: code-extra-colors.fg) if code-extra-colors.fg != none
      set text(fill: if theme.is-dark { rgb("dfdfd6") } else { black }) if code-extra-colors.fg == none
      set raw(theme: theme-style.code-theme) if theme.style.code-theme.len() > 0
      set par(justify: false)
      zebraw(
        block-width: 100%,
        // line-width: 100%,
        wrap: false,
        it,
      )
    })
  }
  body
}

#let default-archive-creator = (indices, body) => {
  indices.map(fname => include "/content/article/" + fname + ".typ").join(pagebreak(weak: true))
}

#let my-rules(body) = {
  show quote: it => {
    if is-web-target {
      html.elem(
        if it.block {
          "blockquote"
        } else {
          "q"
        },
        it.body,
      )
    } else {
      it
    }
  }
  set quote(block: true)

  // html image path fix
  show image: it => if is-web-target {
    if type(it.source) == str {
      html.elem("img", attrs: (
        src: "/post_" + it.source,
      ))
    } else {
      it
    }
  } else {
    it
  }

  // archive outline
  show outline: it => if build-kind == "monthly" and is-pdf-target {
    show outline.entry: entry => {
      if "label" in entry.element.fields().keys() and entry.element.label == label("post-heading") {
        entry.indented(h(-1.5em), strong(entry.body() + h(1fr) + entry.page()))
      } else {
        set outline(indent: 2em)
        entry
      }
    }
    it
  } else {
    it
  }

  body
}

/// sub-chapters is only used in monthly (archive) build.
#let shared-template(
  title: "Untitled",
  desc: [This is a blog post.],
  date: "2024-08-15",
  tags: (),
  license: "",
  kind: "post",
  show-outline: true,
  archive-indices: (),
  archive-creator: default-archive-creator,
  body,
) = {
  let is-same-kind = build-kind == kind

  show: it => if is-same-kind {
    // set basic document metadata
    set document(author: ("ParaN3xus",), ..if not is-web-target { (title: title) })

    // markup setting
    show: markup-rules
    // math setting
    show: equation-rules
    // figure setting
    show: figure-rules
    // ref-rules
    show: ref-rules
    // code block setting
    show: code-block-rules
    // my
    show: my-rules

    show: it => if sys-is-html-target {
      show footnote: it => context {
        let num = counter(footnote).get().at(0)
        link(label("footnote-" + str(num)), super(str(num)))
      }
      it
    } else {
      it
    }

    // Main body.
    set par(justify: true)
    it
  } else {
    it
  }

  show: it => if build-kind == "monthly" and is-same-kind {
    set page(numbering: "i")
    set heading(numbering: "1.1")
    it
  } else if build-kind == "monthly" and kind == "post" {
    set page(numbering: "1", header: context align(
      if calc.even(here().page()) { right } else { left },
      emph[
        #date -- #title
      ],
    )) if not sys-is-html-target
    set heading(offset: 1) if not sys-is-html-target // globally increase offset
    it
  } else {
    it
  }

  if is-same-kind and kind == "monthly" {
    align(center, {
      text(12pt)[Generated on #date]
      linebreak()
      strong(text(26pt, title))
      linebreak()
      text(16pt, desc)
    })
    v(16pt)

    outline()
    pagebreak()
  }

  if build-kind == "monthly" and kind == "post" {
    show heading: set block(above: 0.2em, below: 0em)
    show heading: set text(size: 26pt)
    align(center, {
      text(12pt, date)
      linebreak()
      [#heading(numbering: none, title) <post-heading>]
      counter(heading).step()
      linebreak()
      text(16pt, desc)
    })
    {
      if license in license-info.keys() {
        let url = license-info.at(license).url
        let text = license-info.at(license).text
        let icons = license-info.at(license).icons
        grid(
          columns: icons.len(),
          column-gutter: 0.2em,
          ..icons.map(x => {
            image("assets/license-icons/" + x + ".svg", width: 1em)
          })
        )
        v(-0.7em)
        [
          #title © #date.slice(0, 4) by #link("https://blog.paran3x.us/")[ParaN3xus] is licensed under #link(url, text).
        ]
        v(-0.5em)
      }
    }
    v(16pt)
  }


  // todo monthly hack
  if kind == "monthly" or is-same-kind [
    #metadata((
      title: plain-text(title),
      author: "ParaN3xus",
      description: plain-text(desc),
      date: date,
      tags: tags,
      license: license,
      ..if kind == "monthly" {
        (indices: archive-indices)
      },
    )) <frontmatter>
  ]

  context if show-outline and is-same-kind and sys-is-html-target {
    if query(heading).len() == 0 {
      return
    }

    let outline-counter = counter("html-outline")
    outline-counter.update(0)
    show outline.entry: it => html.elem(
      "div",
      attrs: (
        class: "outline-item x-heading-" + str(it.level),
      ),
      {
        outline-counter.step(level: it.level)
        static-heading-link(it.element, body: [#sym.section#context outline-counter.display("1.") #it.element.body])
      },
    )
    html.elem(
      "div",
      attrs: (
        class: "outline",
      ),
      outline(title: none),
    )
    html.elem("hr")
  }

  if kind == "monthly" {
    archive-creator(archive-indices, body)
  } else {
    body
  }

  context if is-same-kind and sys-is-html-target {
    query(footnote)
      .enumerate()
      .map(((idx, it)) => {
        enum.item[
          #html.elem(
            "div",
            attrs: ("data-typst-label": "footnote-" + str(idx + 1)),
            it.body,
          )
        ]
      })
      .join()
  }
}


#let common-theme-styles(body) = {
  set text(font: pdf-fonts)

  body
}

#let auto-div-frame(body-func) = if is-web-target {
  theme-frame(tag: "div", theme => {
    set text(fill: theme.main-color)
    div-frame(attrs: (class: "inline-equation"), common-theme-styles(body-func(theme)))
  })
} else {
  body-func(default-theme)
}

#let auto-span-frame(body-func) = if is-web-target {
  theme-frame(tag: "span", theme => {
    set text(fill: theme.main-color)
    span-frame(attrs: (class: "inline-equation"), common-theme-styles(body-func(theme)))
  })
} else {
  body-func(default-theme)
}

#let auto-div-pseudocode-list(body) = auto-div-frame(_ => pseudocode-list(body))
