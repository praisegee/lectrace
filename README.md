# lectrace

Write Python lecture code. Get an interactive step-through viewer on GitHub Pages — automatically.

```python
# 01_intro.py
from lectrace import text

def main():
    x = [1, 2, 3]  # @inspect x
    text("# Introduction")
    text("Step through this code with the arrow keys.")
    text("Math works too: $e^{i\\pi} + 1 = 0$")
```

```sh
# Preview locally
lectrace serve 01_intro.py

# Deploy to GitHub Pages
lectrace init && git push
```

## Install

```sh
uv add lectrace
# or
pip install lectrace
```

Zero mandatory dependencies. lectrace uses the Python standard library only. Bring your own numpy, torch, or sympy — detected and rendered automatically.

## Documentation

**[Full documentation →](https://praisegee.github.io/lectrace/)**

- [Getting Started](https://praisegee.github.io/lectrace/getting-started/)
- [Directives](https://praisegee.github.io/lectrace/directives/) — `@inspect`, `@hide`, `@stepover`, `@clear`
- [Rendering API](https://praisegee.github.io/lectrace/rendering-api/) — `text`, `image`, `video`, `link`, `plot`, `note`
- [Deploying](https://praisegee.github.io/lectrace/deploying/) — GitHub Pages in one step
- [API Reference](https://praisegee.github.io/lectrace/api-reference/)

---

Inspired by [edtrace](https://github.com/percyliang/edtrace) by Percy Liang.
