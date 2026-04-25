# Getting Started

## Install

=== "uv"

    ```sh
    uv add lectrace
    ```

=== "pip"

    ```sh
    pip install lectrace
    ```

lectrace requires Python 3.11 or newer and has no mandatory dependencies.

---

## The recommended pattern

A lecture file is a plain Python script. Define `main()` first, put helper functions below it, and end with the standard guard. This is valid Python — functions defined below `main()` are resolved at call time, not definition time.

```python title="01_binary_search.py"
from lectrace import text, note

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

**Why this pattern:**

- `python 01_binary_search.py` — runs as a plain script with no lectrace involvement
- `lectrace serve` — opens the interactive viewer
- Push to GitHub — deploys to GitHub Pages automatically

The tracer only traces code that runs inside `main()`. Imports and `def` statements are invisible — they're just setup. Helper functions appear in the viewer only when `main()` actually calls them.

---

## How tracing works

lectrace loads your file silently (running imports and defining functions), then calls `main()` with the tracer active:

- **Module-level code** (imports, `def` statements) — never generates a step
- **`main()` and every function it calls** — stepped through line by line
- **Functions defined but never called** — invisible

When execution enters a helper function, the viewer shows the `def` line first (with the function's arguments already visible), then steps through the body. When the function returns, it jumps back to the call site.

---

## Variable panel

The variable panel on the right shows state at each step:

- **Inside `main()`** — only variables explicitly marked with `# @inspect` are shown
- **Inside any called function** — all local variables are shown automatically, no directives needed
- **Call stack** — shown above the variables when inside a helper function
- **New variables** — highlighted in green when they first appear
- **Changed variables** — highlighted in amber when their value changes

---

## Preview locally

```sh
lectrace serve 01_binary_search.py
```

Opens `http://localhost:7000` in your browser. The viewer rebuilds automatically whenever you save the file.

To serve a whole folder of lectures at once:

```sh
lectrace serve
```

---

## Navigate the viewer

**Desktop keyboard shortcuts:**

| Key | Action |
|-----|--------|
| `→` or `l` | Step forward |
| `←` or `h` | Step backward |
| `Shift+→` or `j` | Step over forward (skip into sub-calls) |
| `Shift+←` or `k` | Step over backward |
| `u` | Step out of current function |
| `A` | Toggle animation mode |
| `E` | Toggle variable panel |
| `R` | Toggle raw code view |
| `F` | Toggle fullscreen |

**Mobile:** swipe left/right to step through lines. Tap the Variables bar to expand the variable panel. Use the fixed bottom navigation bar for step controls.

You can also click any line number to jump directly to that step.

---

## Add more lectures

Name files with numeric prefixes to control sidebar order:

```
01_intro.py
02_complexity.py
03_sorting.py
04_trees.py
```

The sidebar lists them in alphabetical order, so `01_` always appears before `02_`.

Files starting with `_` are treated as helpers and never shown in the sidebar:

```
_utils.py       ← helper, ignored by lectrace
_data.py        ← helper, ignored
01_intro.py     ← lecture ✓
```

---

## Deploy to GitHub Pages

```sh
lectrace init   # generates .github/workflows/lectrace.yml
git add .
git commit -m "add lectures"
git push
```

Enable GitHub Pages in your repo settings (Source: **GitHub Actions**) and your lectures will be live at `https://username.github.io/repo-name/` within minutes.

See [Deploying](deploying.md) for the full walkthrough.
