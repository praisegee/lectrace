# Custom Types

## The `__lectrace__` protocol

Any class can control how it appears in the variable panel by implementing a `__lectrace__` method. Return any JSON-serializable value — a dict, list, string, or number — and lectrace will display that instead of the default representation.

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

Without `__lectrace__`, a `Node` would show as `Node(val=5, left=<Node>, right=<Node>)`. With it, the panel shows a clean dict that students can read at a glance.

---

## Built-in type rendering

lectrace renders these types automatically without any `__lectrace__`:

| Type | How it renders |
|---|---|
| `None`, `bool`, `int`, `float`, `str` | Direct value |
| `complex` | `{"real": ..., "imag": ...}` |
| `list`, `tuple` | Indexed array |
| `dict` | Key-value pairs |
| `set`, `frozenset` | Sorted array |
| `datetime.datetime` | ISO 8601 string |
| `pathlib.Path` | String path |
| `dataclasses.dataclass` | Dict of field names → values |
| `numpy.ndarray` | Shape, dtype, and nested values |
| `torch.Tensor` | Shape, dtype, and nested values |
| `sympy.Basic` | String expression or numeric value |

---

## Dataclasses

Standard `@dataclass` classes are rendered automatically — all fields are shown as a dict:

```python
@dataclasses.dataclass
class Point:
    x: float
    y: float

p = Point(1.5, 2.0)  # @inspect p
# shows: {"x": 1.5, "y": 2.0}
```

If you want a different representation — for example, only some fields, or a computed value — add `__lectrace__`:

```python
@dataclasses.dataclass
class Matrix:
    data: list[list[float]]

    def __lectrace__(self):
        rows = len(self.data)
        cols = len(self.data[0]) if self.data else 0
        return {"shape": f"{rows}×{cols}", "data": self.data}
```

---

## NumPy arrays

Numpy is an optional dependency. If it is installed, arrays are rendered with their shape, dtype, and values:

```python
import numpy as np

a = np.array([[1, 2], [3, 4]])  # @inspect a
# shows: shape=[2,2], dtype=int64, values=[[1,2],[3,4]]
```

No import required in your lecture — lectrace detects the type lazily.

---

## PyTorch tensors

Same as numpy — detected and rendered automatically if torch is installed:

```python
import torch

w = torch.randn(3, 4)  # @inspect w
# shows: shape=[3,4], dtype=torch.float32, values=[...]
```

---

## Depth limit

Rendering stops at depth 12. Very deeply nested structures show `[depth limit]` at the truncation point. Use `__lectrace__` to flatten deeply nested objects before they reach that limit.
