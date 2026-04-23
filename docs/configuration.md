# Configuration

## lectrace.toml

`lectrace.toml` is optional. Running `lectrace init` generates it with commented-out defaults. Place it in your repo root.

```toml
[lectrace]
title = "My Lectures"

# Lecture files are auto-discovered. Name them with numeric prefixes to control
# sidebar order: 01_intro.py, 02_arrays.py, 03_sorting.py, ...
#
# To target a specific folder or pattern instead:
# lectures = ["lectures/*.py"]
#
# output = "_site"
```

---

## Options

### `title`

The site title shown in the browser tab.

```toml
[lectrace]
title = "CS 101 — Data Structures"
```

### `lectures`

List of glob patterns specifying which files to include. If omitted, lectrace auto-discovers all `.py` files in the repo that import from `lectrace`.

```toml
[lectrace]
lectures = ["lectures/*.py"]
```

Multiple patterns:

```toml
[lectrace]
lectures = ["unit1/*.py", "unit2/*.py"]
```

### `output`

The directory where the static site is written. Default: `_site`.

```toml
[lectrace]
output = "public"
```

---

## File naming conventions

### Ordering

The sidebar lists lectures in alphabetical order. Use numeric prefixes to control sequence:

```
01_introduction.py      → "Introduction"
02_big_o_notation.py    → "Big-O Notation"
03_arrays.py            → "Arrays"
10_graphs.py            → "Graphs"
```

### Helper files

Files starting with `_` are never shown in the sidebar and are never auto-discovered. Use them for shared utilities:

```
_data.py        ← shared datasets, ignored by lectrace
_helpers.py     ← utility functions, ignored by lectrace
01_intro.py     ← lecture ✓
```

Import helpers normally from your lecture files:

```python title="01_intro.py"
from _helpers import make_graph

def main():
    g = make_graph()  # @inspect g
```

---

## What gets ignored

Auto-discovery skips the following directories automatically:

- `__pycache__`
- `.venv`, `venv`, `env`
- `node_modules`
- `.git`
- `_site`
- `site-packages`

And skips files larger than 500 KB.

---

## .gitignore

`lectrace init` appends these entries to your `.gitignore`:

```gitignore
# lectrace
_site/
.lectrace_cache.json
```

The `_site/` directory is the build output — it should not be committed. The cache file stores source hashes for incremental builds.
