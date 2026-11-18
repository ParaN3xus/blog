
/// The last `n` segments of `url`'s path
#let url-segments(url, n: 1) = (
  url.split("/").filter(x => x.trim() != "").slice(-n).join("/")
)

/// A link whose text is the last `n` segments of its url.
#let url-tail(url, n: 1) = link(url, url-segments(url, n: n))

/// A GitHub repository: `https://github.com/owner/repo` → `repo`,
/// or `owner/repo` with `owner: true`.
#let gh-repo(url, owner: false) = url-tail(url, n: if owner { 2 } else { 1 })

/// A GitHub user: `https://github.com/owner` → `@owner`, or `owner` with
/// `at: false`.
#let gh-user(url, at: true) = link(url, (if at { "@" } else { "" }) + url-segments(url))

/// An issue or pull request on GitHub
#let gh-entry(url, kind) = {
  let segments = url.split("/").filter(x => x.trim() != "")
  let at = segments.position(x => x == kind)
  let number = segments.at(at + 1).split("#").first()
  link(url, segments.slice(at - 2, at).join("/") + "#" + number)
}

/// A GitHub issue: `.../owner/repo/issues/123` → `owner/repo#123`.
#let gh-issue(url) = gh-entry(url, "issues")

/// A GitHub pull request: `.../owner/repo/pull/123` → `owner/repo#123`.
#let gh-pr(url) = gh-entry(url, "pull")
