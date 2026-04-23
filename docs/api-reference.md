# API Reference

## Rendering functions

All rendering functions are imported from `lectrace`:

```python
from lectrace import text, image, video, link, plot, note, system_text, Reference
```

---

### `text(message, verbatim=False, style=None)`

Render a string as Markdown with optional LaTeX math.

| Parameter | Type | Default | Description |
|---|---|---|---|
| `message` | `str` | required | Markdown string. Use `$...$` for inline math, `$$...$$` for display math. |
| `verbatim` | `bool` | `False` | If `True`, renders in monospace and preserves whitespace exactly. |
| `style` | `dict \| None` | `None` | CSS style dict applied to the rendered element. |

---

### `image(url, width=None, style=None)`

Display an image.

| Parameter | Type | Default | Description |
|---|---|---|---|
| `url` | `str` | required | Local file path or HTTP/HTTPS URL. Remote images are cached in `~/.cache/lectrace/`. |
| `width` | `int \| str \| None` | `None` | Width in pixels (int) or CSS value (str, e.g. `"50%"`). |
| `style` | `dict \| None` | `None` | Additional CSS styles. |

---

### `video(url, width=None, style=None)`

Embed a video with native browser controls.

| Parameter | Type | Default | Description |
|---|---|---|---|
| `url` | `str` | required | Local file path or HTTP/HTTPS URL. Remote videos are cached. |
| `width` | `int \| str \| None` | `None` | Width in pixels or CSS value. |
| `style` | `dict \| None` | `None` | Additional CSS styles. |

---

### `link(arg=None, *, title=None, url=None, authors=None, date=None, description=None, organization=None, notes=None, style=None)`

Add a reference link or jump-to-source link.

**Forms:**

```python
# External reference (keyword args)
link(title="Paper Title", url="https://...", authors=["Smith"], date="2024")

# URL shorthand
link("https://example.com")

# Reference object
link(Reference(title="...", url="..."))

# Jump to source (class or function)
link(MyClass)
link(my_function)
```

| Parameter | Type | Description |
|---|---|---|
| `arg` | `type \| Reference \| str \| None` | Positional: a class, function, URL string, or `Reference`. Omit to use keyword args. |
| `title` | `str \| None` | Full title of the work. |
| `url` | `str \| None` | URL opened when clicked. |
| `authors` | `list[str] \| None` | Author surnames. |
| `organization` | `str \| None` | Organization name (used instead of authors in citation). |
| `date` | `str \| None` | Year or date string. |
| `description` | `str \| None` | Short description shown in hover card. |
| `notes` | `str \| None` | Additional notes shown in hover card. |
| `style` | `dict \| None` | CSS styles applied to the anchor element. |

---

### `plot(spec)`

Embed an interactive Vega-Lite chart.

| Parameter | Type | Description |
|---|---|---|
| `spec` | `object` | A valid [Vega-Lite spec](https://vega.github.io/vega-lite/docs/) as a Python dict. |

---

### `note(message)`

Add a presenter annotation visible only when Notes mode is on (`N` key).

| Parameter | Type | Description |
|---|---|---|
| `message` | `str` | Plain text annotation. Shown beside the line in the viewer. |

---

### `system_text(command)`

Run a shell command and display its stdout as verbatim text.

| Parameter | Type | Description |
|---|---|---|
| `command` | `list[str]` | Command and arguments, e.g. `["python3", "--version"]`. |

---

## Reference

```python
from lectrace import Reference

Reference(
    title: str | None = None,
    authors: list[str] | None = None,
    organization: str | None = None,
    date: str | None = None,
    url: str | None = None,
    description: str | None = None,
    notes: str | None = None,
)
```

Frozen dataclass. All fields optional. Used with `link()`.

The citation label displayed in the viewer is derived automatically:

| Condition | Label |
|---|---|
| One author, date | `[Smith 2024]` |
| Multiple authors, date | `[Smith+ 2024]` |
| Organization | `[OpenAI 2023]` |
| Title only | Full title |
| URL only | Full URL |
| Nothing | `?` |

---

## CLI

### `lectrace init`

Generate `.github/workflows/lectrace.yml` and `lectrace.toml` in the current directory. Updates `.gitignore`. Safe to run multiple times — existing files are not overwritten.

### `lectrace serve [FILES...] [--port PORT]`

Build lectures and serve locally at `http://localhost:PORT` (default: 7000). Watches for file changes and rebuilds automatically. Opens the browser.

```sh
lectrace serve                    # auto-discover all lectures
lectrace serve 01_intro.py        # serve one file
lectrace serve 01_intro.py 02_sorting.py  # serve specific files
lectrace serve --port 8080        # custom port
```

### `lectrace build [FILES...] [--output DIR] [--no-incremental]`

Execute lectures and write a deployable static site.

```sh
lectrace build                    # auto-discover, output to _site/
lectrace build --output public    # custom output directory
lectrace build --no-incremental   # rebuild everything, ignore cache
lectrace build 03_trees.py        # build one file only
```

### `lectrace run FILE [--inspect-all]`

Execute a single lecture file and print trace statistics. Useful for debugging.

```sh
lectrace run 01_intro.py
lectrace run 01_intro.py --inspect-all   # capture all local variables
```

---

## `__lectrace__` protocol

Implement `__lectrace__` on any class to control its representation in the variable panel:

```python
class MyClass:
    def __lectrace__(self) -> object:
        # Return any JSON-serializable value
        return {"field": self.field, "summary": str(self)}
```

The return value is recursively serialized using the same rules as all other values. Returning `None` renders as `null`.
