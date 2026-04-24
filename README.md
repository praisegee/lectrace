# lectrace

Write Python lecture code. Get an interactive step-through viewer on GitHub Pages — automatically.

lectrace traces your Python code line by line using `sys.settrace`, captures variable state and rendered content at each step, and produces a static React app that lets anyone step through the execution with arrow keys. No Node.js, no configuration, no build step for the user — just Python.

---

## Install

```sh
uv add lectrace
# or
pip install lectrace
```

Requires Python 3.11+. Zero mandatory dependencies — lectrace uses the standard library only. numpy, torch, and sympy are detected and rendered automatically if they are already installed in your environment.

---

## A lecture file

A lecture is any `.py` file that imports from `lectrace` and defines a `main()` function:

```python
# 01_binary_search.py
from lectrace import text, link

def binary_search(arr, target):
    lo, hi = 0, len(arr) - 1
    while lo <= hi:              # @inspect lo hi
        mid = (lo + hi) // 2    # @inspect mid
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1

def main():
    text("# Binary Search")
    text("Finds a target in a sorted array in $O(\\log n)$ time.")

    arr = [2, 5, 8, 12, 16, 23, 38, 42]  # @inspect arr
    result = binary_search(arr, 23)       # @inspect result

    text(f"Found 23 at index `{result}`")
    link(binary_search)   # click to jump to the function definition
```

---

## Directives

Directives are inline comments that control tracing and display:

| Directive | Effect |
|-----------|--------|
| `# @inspect x y` | Show `x` and `y` in the variable panel after this line runs |
| `# @clear x` | Remove `x` from the variable panel |
| `# @stepover` | Execute this line as a single step — don't trace into any calls it makes |
| `# @hide` | Run this line silently — never shown in the viewer |

---

## Rendering functions

Call these anywhere inside `main()` or any function it calls:

| Function | What it renders |
|----------|----------------|
| `text("# Heading")` | Markdown with LaTeX math (`$...$` inline, `$$...$$` display) |
| `text("...", verbatim=True)` | Monospace, whitespace preserved |
| `image("fig.png", width=400)` | Local file or remote URL (cached) |
| `video("demo.mp4")` | Embedded video with controls |
| `link(MyClass)` | Clickable jump to that class or function in the viewer |
| `link(title="Paper", url="...", authors=["Smith"], date="2024")` | Reference card with hover metadata |
| `plot({...})` | Interactive Vega-Lite chart |
| `note("speaker annotation")` | Presenter note, hidden until `N` is pressed |
| `system_text(["python3", "--version"])` | Shell command output as verbatim text |

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

## File naming

| Pattern | Behaviour |
|---------|-----------|
| `01_intro.py` | Lecture — appears in sidebar, traced and deployed |
| `02_sorting.py` | Lecture — sidebar order follows alphabetical sort |
| `_utils.py` | Helper — imported normally, never traced or shown |

Number prefixes control sidebar order. Helper files starting with `_` are ignored by lectrace entirely.

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

- **Tracer** — `sys.settrace` intercepts every line of execution. At each step it captures the call stack, inspected variable values (serialized to JSON), and any pending renderings.
- **Serializer** — converts Python values to JSON. Primitives are direct. Collections recurse. numpy/torch/sympy are imported lazily only when encountered.
- **Builder** — discovers lecture files, runs each through the tracer, writes `traces/*.json` plus a `traces/index.json` manifest. Incremental: files are skipped if their SHA-256 hash hasn't changed.
- **Viewer** — a pre-built React + TypeScript SPA bundled into `lectrace/_static/` and shipped inside the pip package. Uses HashRouter so it works at any URL depth with zero configuration. Math via KaTeX, charts via Vega-Lite, syntax highlighting via highlight.js.

---

## Documentation

Full documentation: **https://praisegee.github.io/lectrace/**

- [Getting Started](https://praisegee.github.io/lectrace/getting-started/)
- [Directives](https://praisegee.github.io/lectrace/directives/)
- [Rendering API](https://praisegee.github.io/lectrace/rendering-api/)
- [Custom Types](https://praisegee.github.io/lectrace/custom-types/)
- [Deploying](https://praisegee.github.io/lectrace/deploying/)
- [API Reference](https://praisegee.github.io/lectrace/api-reference/)

---

Inspired by [edtrace](https://github.com/percyliang/edtrace) by Percy Liang.
