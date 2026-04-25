# Rendering API

Import rendering functions from `lectrace`:

```python
from lectrace import text, image, video, link, plot, note, system_text, Reference
```

Renderings are attached to the step where the call appears. When that step is active in the viewer, the rendering replaces the code line with its visual output.

---

## text()

Render Markdown with optional LaTeX math.

```python
text("# Heading")
text("**Bold**, _italic_, `code`")
text("Euler's identity: $e^{i\\pi} + 1 = 0$")
text("Display math: $$\\sum_{k=0}^{n} k = \\frac{n(n+1)}{2}$$")
```

Multi-line strings — including triple-quoted docstrings — are automatically dedented and trimmed, so you can write naturally without worrying about indentation:

```python
text("""
    # Gradient Descent

    Training a model means finding parameters that minimize a loss function.
    Gradient descent is how we do it — follow the slope downhill, step by step.

    The update rule: $w \\leftarrow w - \\eta \\nabla L(w)$
""")
```

For monospace output that preserves whitespace, use `verbatim=True`:

```python
text("""
    insert   O(log n)   O(n)
    search   O(log n)   O(n)
    delete   O(log n)   O(n)
""", verbatim=True)
```

**Signature:**

```python
text(message: str, verbatim: bool = False, style: dict | None = None) -> None
```

---

## image()

Display an image from a local file or URL.

```python
image("figures/diagram.png")
image("figures/chart.png", width=400)
image("https://example.com/figure.png", width="50%")
```

Remote images are downloaded and cached in `~/.cache/lectrace/` on first use.

**Signature:**

```python
image(url: str, width: int | str | None = None, style: dict | None = None) -> None
```

---

## video()

Embed a video from a local file or URL.

```python
video("demos/forward_pass.mp4")
video("https://example.com/animation.mp4", width=600)
```

**Signature:**

```python
video(url: str, width: int | str | None = None, style: dict | None = None) -> None
```

---

## link()

Add a reference link with a hover card, or a jump-to-source link.

### External reference

```python
link(
    title="Attention Is All You Need",
    url="https://arxiv.org/abs/1706.03762",
    authors=["Vaswani", "Shazeer", "Parmar"],
    date="2017",
    description="Introduced the Transformer architecture.",
)
```

Renders as a `[Vaswani+ 2017]`-style citation. Hovering shows the full card.

### URL shorthand

```python
link("https://en.wikipedia.org/wiki/Binary_search_tree")
```

### Jump to source

Pass a class or function and clicking navigates to its definition in the viewer:

```python
link(Node)      # jumps to class Node:
link(insert)    # jumps to def insert():
```

### Reference object

```python
ref = Reference(
    title="Deep Learning",
    authors=["Goodfellow", "Bengio", "Courville"],
    url="https://www.deeplearningbook.org",
    date="2016",
)
link(ref)
```

**Signature:**

```python
link(
    arg: type | Reference | str | None = None,
    title: str | None = None,
    url: str | None = None,
    authors: list[str] | None = None,
    date: str | None = None,
    description: str | None = None,
    organization: str | None = None,
    notes: str | None = None,
    style: dict | None = None,
) -> None
```

---

## plot()

Embed an interactive [Vega-Lite](https://vega.github.io/vega-lite/) chart.

```python
plot({
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
    "width": 400,
    "height": 250,
    "data": {"values": [{"x": 1, "y": 2}, {"x": 2, "y": 4}, {"x": 3, "y": 1}]},
    "mark": "bar",
    "encoding": {
        "x": {"field": "x", "type": "ordinal"},
        "y": {"field": "y", "type": "quantitative"},
    },
})
```

Pass any valid Vega-Lite spec as a Python dict. The chart is interactive — zoom, pan, and tooltip work out of the box.

**Signature:**

```python
plot(spec: object) -> None
```

---

## note()

Add a presenter annotation rendered as a styled callout beside the line.

```python
values = [5, 3, 7, 1]  # @inspect values
note("deliberately unsorted — worst case is sorted input")

# or multi-line:
note("""
    This is the classic birthday paradox setup.
    With 23 people, collision probability exceeds 50%.
    Ask the audience to guess before revealing.
""")
```

Notes appear inline as callout boxes with a left accent border. Use them for speaker context, questions to pose to the audience, or caveats that would be distracting as main text. Like `text()`, triple-quoted strings are dedented automatically.

**Signature:**

```python
note(message: str) -> None
```

---

## system_text()

Run a shell command and display its output as verbatim text.

```python
system_text(["python3", "--version"])
system_text(["date"])
system_text(["git", "log", "--oneline", "-5"])
```

ANSI color codes are stripped automatically.

**Signature:**

```python
system_text(command: list[str]) -> None
```

---

## Reference

The `Reference` dataclass holds metadata for an external source.

```python
from lectrace import Reference

ref = Reference(
    title="The Art of Computer Programming",
    authors=["Knuth"],
    date="1968",
    url="https://www-cs-faculty.stanford.edu/~knuth/taocp.html",
    description="Volume 1: Fundamental Algorithms",
    organization=None,
    notes=None,
)
```

| Field | Type | Description |
|---|---|---|
| `title` | `str \| None` | Full title of the work |
| `authors` | `list[str] \| None` | Author surnames or full names |
| `organization` | `str \| None` | Team or organization name (shown instead of authors) |
| `date` | `str \| None` | Year or full date string |
| `url` | `str \| None` | Link opened when the citation is clicked |
| `description` | `str \| None` | Short description shown in the hover card |
| `notes` | `str \| None` | Additional multi-line notes |

The citation label is derived automatically:

- One author → `[Knuth 1968]`
- Multiple authors → `[Knuth+ 1968]`
- Organization → `[DeepMind 2023]`
- No authors → full title
