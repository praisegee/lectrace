# Directives

Directives are inline comments that control how lectrace traces and displays your code. They follow the `# @name` syntax and sit at the end of a line.

```python
x = 42  # @inspect x
```

---

## @inspect

Show the value of one or more variables in the variable panel after this line executes.

```python
x = [1, 2, 3]         # @inspect x
y = x[0] + x[-1]      # @inspect y
a, b = 10, 20         # @inspect a b
```

Multiple variables are separated by spaces. You can also inspect object attributes:

```python
node = Node(val=5)    # @inspect node.val node.left
```

The variable panel accumulates values as you step forward — once a variable appears it stays visible until cleared with `@clear`.

**Inside helper functions:** you do not need `@inspect` at all. When the viewer steps into any called function, all local variables are shown automatically. `@inspect` is only needed in `main()` to select which variables to highlight.

**Bare `@inspect` in `main()`:** omit the variable names to show all locals at that point:

```python
result = compute()   # @inspect   ← shows everything in scope here
```

---

## @clear

Remove a variable from the variable panel.

```python
temp = compute_intermediate()  # @inspect temp
result = finalize(temp)        # @inspect result
temp                           # @clear temp
```

Use it to keep the panel tidy — scaffolding variables that were only relevant for a few steps can be hidden once you've moved past them.

---

## @stepover

Skip the body of a function call — trace over it as a single step rather than entering it.

```python
def sort(arr):       # called many times — noise in the viewer
    ...

data = [3, 1, 4]
data = sort(data)    # @stepover  ← one step, no internals shown
```

This is especially useful for utility functions, recursive helpers, or library calls that students don't need to follow line by line.

!!! note
    `@stepover` marks the line where the call is made. Everything the call does internally is invisible to the viewer — the step jumps from the call site directly to after the return.

---

## @hide

Hide this line from the viewer entirely. The line still executes; it just never appears on screen.

```python
assert isinstance(root, Node)  # @hide  ← sanity check, not relevant to lecture
logging.debug("here")          # @hide
```

Use it for assertions, debug prints, and any code that is correct but distracting.

---

## Combining directives

Multiple directives on the same line are all applied:

```python
x = compute()  # @inspect x @stepover
```

This inspects `x` after the line runs and steps over the `compute()` call.

---

## Helper files

Files named with a leading underscore (`_utils.py`, `_data.py`) are excluded from the viewer automatically — they're imported as normal Python modules but never traced or shown in the sidebar.

```python title="01_sorting.py"
from _data import sample_arrays   # helper — not traced

def main():
    arr = sample_arrays[0]  # @inspect arr
    ...
```
