# lectrace

Write Python lecture code. Get an interactive step-through viewer on GitHub Pages — automatically.

```python
# 01_intro.py
from lectrace import text

def main():
    x = [1, 2, 3]  # @inspect x
    text("# Introduction")
    text("Step through this lecture with the arrow keys.")
    text("Math works too: $e^{i\\pi} + 1 = 0$")
```

```sh
lectrace serve 01_intro.py   # preview at http://localhost:7000
git push                      # → live on GitHub Pages automatically
```

---

## Why lectrace?

Teaching code is different from writing code. Students need to *step through* execution, see variable state change, and understand *why* each line runs — not just read a static file.

lectrace gives you that without any frontend work. Write Python, add a few comments, push to GitHub. The interactive viewer is generated automatically.

**Zero mandatory dependencies.** Pure Python standard library. Bring your own numpy, torch, or sympy — lectrace detects and renders them automatically.

---

## Features

- **Step-through execution** — navigate forward and backward through every line
- **Variable panel** — inspect named variables as they change
- **Markdown + LaTeX** — render text, headings, and math inline with code
- **Interactive charts** — embed Vega-Lite plots directly in lectures
- **Directives** — `@inspect`, `@hide`, `@stepover`, `@clear` as inline comments
- **Custom type rendering** — implement `__lectrace__` on any class
- **Zero configuration** — auto-discovers lecture files, deploys to GitHub Pages with one command
- **Animation mode** — progressively reveal code as you step through it

---

## Quick install

=== "uv"

    ```sh
    uv add lectrace
    ```

=== "pip"

    ```sh
    pip install lectrace
    ```

---

## Next steps

<div class="grid cards" markdown>

- :material-clock-fast: **[Getting Started](getting-started.md)** — build your first lecture in 5 minutes
- :material-pencil: **[Writing Lectures](directives.md)** — directives, rendering, custom types
- :material-rocket-launch: **[Deploying](deploying.md)** — publish to GitHub Pages automatically
- :material-book-open: **[API Reference](api-reference.md)** — complete function signatures

</div>
