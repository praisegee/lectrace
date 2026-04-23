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

## Your first lecture

Create a Python file that imports from `lectrace` and defines a `main()` function:

```python title="01_intro.py"
from lectrace import text

def main():
    x = 42       # @inspect x
    y = x * 2    # @inspect y

    text("# My First Lecture")
    text("This is rendered as **Markdown**.")
    text("Math too: $e^{i\\pi} + 1 = 0$")
```

That's it. No configuration required.

---

## Preview locally

```sh
lectrace serve 01_intro.py
```

Opens `http://localhost:7000` in your browser. The viewer rebuilds automatically whenever you save the file.

To serve a whole folder of lectures at once:

```sh
lectrace serve   # auto-discovers all lecture files in the current directory
```

---

## Navigate the viewer

| Key | Action |
|-----|--------|
| `→` or `l` | Step forward |
| `←` or `h` | Step backward |
| `Shift+→` or `j` | Step over (stay at current call depth) |
| `Shift+←` or `k` | Step over backward |
| `u` | Step out of current function |
| `A` | Toggle animation mode |
| `E` | Toggle variable panel |
| `N` | Toggle notes |
| `R` | Toggle raw code view |

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
