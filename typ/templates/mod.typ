
#import "@preview/fletcher:0.5.7"
#import "target.typ": sys-is-html-target
#import "theme.typ": theme-frame
#import "@preview/shiroa:0.2.3": plain-text, templates
#import templates: get-label-disambiguator, label-disambiguator, make-unique-label

#let code-image = if sys-is-html-target {
  it => {
    theme-frame(theme => {
      set text(fill: theme.main-color)
      html.frame(it)
    })
  }
} else {
  it => it
}

/// Alternative resolves all heading as static link
///
/// - `elem`(content): The heading element to resolve
#let static-heading-link(elem, body: "#") = context {
  let id = {
    let title = plain-text(elem).trim()
    "label-"
    str(
      make-unique-label(
        title,
        disambiguator: label-disambiguator.at(elem.location()).at(title, default: 0) + 1,
      ),
    )
  }
  html.elem(
    "a",
    attrs: (
      "href": "#" + id,
      ..if body == "#" { ("id": id, "data-typst-label": id) },
    ),
    body,
  )
}

#let blog-tags = (
  linux: "Linux",
  network: "Network",
  free-ride: "Free Ride",
  math: "Mathematics",
  thinking: "Thinking",
  cpp: "C++",
  probablities: "Probabilities",
  crack: "Crack",
  typst: "Typst",
  summary: "Summary",
  python: "Python",
  ai: "AI",
  pytorch: "PyTorch",
  rl: "Reinforcement Learning",
  programming: "Programming",
  reverse: "Reverse Engineering",
  vrchat: "VRChat",
  diy: "DIY",
  unity: "Unity",
)

#let archive-tags = (
  blog-post: "Blog Post",
)

#let licenses = (
  cc-0: "cc-0",
  cc-by: "cc-by",
  cc-by-sa: "cc-by-sa",
  cc-by-nd: "cc-by-nd",
  cc-by-nc: "cc-by-nc",
  cc-by-nc-sa: "cc-by-nc-sa",
  cc-by-nc-nd: "cc-by-nc-nd",
)

#let license-info = (
  "cc-0": (
    url: "https://creativecommons.org/publicdomain/zero/1.0/",
    text: "CC0 1.0",
    icons: ("cc", "zero"),
  ),
  "cc-by": (
    url: "https://creativecommons.org/licenses/by/4.0/",
    text: "CC BY 4.0",
    icons: ("cc", "by"),
  ),
  "cc-by-sa": (
    url: "https://creativecommons.org/licenses/by-sa/4.0/",
    text: "CC BY-SA 4.0",
    icons: ("cc", "by", "sa"),
  ),
  "cc-by-nd": (
    url: "https://creativecommons.org/licenses/by-nd/4.0/",
    text: "CC BY-ND 4.0",
    icons: ("cc", "by", "nd"),
  ),
  "cc-by-nc": (
    url: "https://creativecommons.org/licenses/by-nc/4.0/",
    text: "CC BY-NC 4.0",
    icons: ("cc", "by", "nc"),
  ),
  "cc-by-nc-sa": (
    url: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
    text: "CC BY-NC-SA 4.0",
    icons: ("cc", "by", "nc", "sa"),
  ),
  "cc-by-nc-nd": (
    url: "https://creativecommons.org/licenses/by-nc-nd/4.0/",
    text: "CC BY-NC-ND 4.0",
    icons: ("cc", "by", "nc", "nd"),
  ),
)



#let articles = json("articles.json").map(it => ((it): it)).join()
