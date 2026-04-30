# lectrace

**Executable Python lecture notes.**

Write a Python script. Run `lectrace serve` to get an interactive step-through viewer in your browser. Push to GitHub to deploy it to GitHub Pages, automatically.

No Node.js. No configuration. No build step for your students. Just Python.

> Inspired by [edtrace](https://github.com/percyliang/edtrace) by Percy Liang.

---

![Demo](demo.gif)

---

**See it live:** [AI Lectures](https://praisegee.github.io/ai-lectures/), a real course built with lectrace ([source](https://github.com/praisegee/ai-lectures))

---

## Install

```sh
uv add lectrace
# or
pip install lectrace
```

Requires Python 3.11+. Zero mandatory dependencies. lectrace uses the standard library only. numpy, torch, and sympy are detected and rendered automatically if already installed in your environment.

---

## Write a lecture

A lecture file is a plain Python script. Define `main()` first, put helper functions below it, call `main()` at the end:

```python
# 01_binary_search.py
from lectrace import text, note, plot

def main():
    text("# Binary Search")
    text("Finds a target in a sorted array in $O(\\log n)$ time.")

    arr = [2, 5, 8, 12, 16, 23, 38, 42]  # @inspect arr
    result = binary_search(arr, 23)        # @inspect result

    text(f"Found 23 at index `{result}`.")
    note("Binary search only works on sorted arrays.")

def binary_search(arr, target):
    lo, hi = 0, len(arr) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1

if __name__ == "__main__":
    main()
```

This gives you three things at once:

- `python 01_binary_search.py`: runs as a plain script, no lectrace involvement
- `lectrace serve`: opens the interactive viewer in your browser
- `git push`: deploys to GitHub Pages automatically

The tracer only traces code that runs inside `main()`. Imports and function definitions are invisible (they're just setup). Helper functions appear in the viewer only when `main()` actually calls them.

---

## How tracing works

lectrace loads your file silently (running imports and defining functions), then calls `main()` with `sys.settrace` active:

- **Module-level code** (imports, `def` statements): never generates a step
- **`main()` and every function it calls**: stepped through line by line
- **Functions defined but never called**: invisible

When execution enters a helper function, the viewer shows the `def` line first with arguments already in the variable panel, then steps through the body. When the function returns, the viewer jumps back to the call site.

---

## Variable panel

The variable panel on the right tracks state at every step:

- **Inside `main()`**: only variables marked with `# @inspect` are shown
- **Inside any helper function**: all local variables are shown automatically, no directives needed
- **Call stack**: shown above variables when inside a helper, displaying the full chain of calls
- **New variables**: highlighted in green when they first appear
- **Changed variables**: highlighted in amber when their value changes

---

## Directives

Inline comments that control tracing and display:

| Directive        | Effect                                                     |
| ---------------- | ---------------------------------------------------------- |
| `# @inspect x y` | Show `x` and `y` in the variable panel after this line     |
| `# @inspect`     | Show all local variables at this line                      |
| `# @clear x`     | Remove `x` from the variable panel                         |
| `# @stepover`    | Execute this line without stepping into any calls it makes |
| `# @hide`        | Run this line silently, never shown in the viewer          |

---

## Rendering functions

Call these anywhere inside `main()` or any function it calls:

| Function                                                         | What it renders                                              |
| ---------------------------------------------------------------- | ------------------------------------------------------------ |
| `text("# Heading")`                                              | Markdown with LaTeX math (`$...$` inline, `$$...$$` display) |
| `text("...", verbatim=True)`                                     | Monospace, whitespace preserved                              |
| `image("fig.png", width=400)`                                    | Local file or remote URL (cached)                            |
| `video("demo.mp4")`                                              | Embedded video with controls                                 |
| `link(my_function)`                                              | Clickable jump to that function in the viewer                |
| `link(title="Paper", url="...", authors=["Smith"], date="2024")` | Reference card with hover metadata                           |
| `plot({...})`                                                    | Interactive Vega-Lite chart                                  |
| `note("speaker annotation")`                                     | Presenter note shown as a styled callout                     |
| `system_text(["python3", "--version"])`                          | Shell command output as verbatim text                        |

## Citing arXiv papers

Pass an arXiv URL to `link()` and lectrace fetches the title, authors, date, and abstract for you automatically. No manual metadata needed:

```python
# lectrace fetches everything from arXiv
link(url="https://arxiv.org/abs/1706.03762")

# without arXiv auto-fetch, you'd write this by hand
link(title="Attention Is All You Need", authors=["Vaswani", "Shazeer", "Parmar", "..."], date="2017", url="https://arxiv.org/abs/1706.03762")
```

Both `/abs/` and `/pdf/` arXiv URLs are supported. Metadata is cached locally so the network request only happens once per paper.

For more robust HTML parsing, install the `arxiv` extra:

```sh
pip install lectrace[arxiv]
# or
uv add lectrace[arxiv]
```

Without it, lectrace falls back to the standard library's HTML parser, which works for most papers.

---

## Custom type rendering

Implement `__lectrace__` on any class to control how it appears in the variable panel:

```python
class Node:
    def __init__(self, val, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

    def __lectrace__(self):
        return {
            "val": self.val,
            "left": self.left.val if self.left else None,
            "right": self.right.val if self.right else None,
        }
```

Without `__lectrace__`, nested objects show their full repr. With it, you control exactly what students see.

---

## Viewer

A mobile-responsive React app that works in any browser. Students need nothing installed.

**Keyboard shortcuts:**

| Key              | Action                             |
| ---------------- | ---------------------------------- |
| `→` or `l`       | Step forward                       |
| `←` or `h`       | Step backward                      |
| `Shift+→` or `j` | Step over forward (skip sub-calls) |
| `Shift+←` or `k` | Step over backward                 |
| `u`              | Step out of current function       |
| `R`              | Toggle raw code view               |
| `A`              | Toggle reveal animation            |
| `E`              | Toggle variable panel              |
| `F`              | Toggle fullscreen                  |

**Mobile:** swipe left/right to step, tap the Variables bar to expand the variable panel.

---

## File naming

| Pattern         | Behaviour                                        |
| --------------- | ------------------------------------------------ |
| `01_intro.py`   | Lecture, appears in sidebar, traced and deployed |
| `02_sorting.py` | Lecture, sidebar order follows alphabetical sort |
| `_utils.py`     | Helper, imported normally, never traced or shown |

```
my-course/
  _data.py            ← shared data, ignored by lectrace
  01_intro.py         ← first in sidebar
  02_complexity.py    ← second
  03_sorting.py       ← third
```

---

## CLI

```sh
lectrace serve                  # build + serve all lectures at http://localhost:7000
lectrace serve 01_intro.py      # serve a single file
lectrace build --output _site   # build static site for deployment
lectrace init                   # generate GitHub Actions workflow + lectrace.toml
lectrace run 01_intro.py        # execute and print trace stats (no server)
```

---

## Deploy to GitHub Pages

```sh
lectrace init   # generates .github/workflows/lectrace.yml
git add .
git commit -m "add lectures"
git push
```

Enable GitHub Pages in your repo settings (Source: **GitHub Actions**). Every push to `main` rebuilds and redeploys automatically.

---

## How it works

- **Tracer**: loads the module without tracing, then activates `sys.settrace` and calls `main()`. Every step shown is inside a function that was actually called.
- **Serializer**: converts Python values to JSON. Primitives are direct. Collections recurse. numpy/torch/sympy are detected lazily.
- **Builder**: discovers lecture files, runs each through the tracer, writes `traces/*.json` plus a manifest. Incremental: files are skipped if their SHA-256 hash hasn't changed.
- **Viewer**: a pre-built React + TypeScript SPA bundled into the pip package. Uses HashRouter so it works at any URL depth with zero configuration. Math via KaTeX, charts via Vega-Lite, syntax highlighting via highlight.js.

---

## Documentation

Full documentation: **https://praisegee.github.io/lectrace/**

- [Getting Started](https://praisegee.github.io/lectrace/getting-started/)
- [Directives](https://praisegee.github.io/lectrace/directives/)
- [Rendering API](https://praisegee.github.io/lectrace/rendering-api/)
- [Custom Types](https://praisegee.github.io/lectrace/custom-types/)
- [Deploying](https://praisegee.github.io/lectrace/deploying/)
- [API Reference](https://praisegee.github.io/lectrace/api-reference/)
