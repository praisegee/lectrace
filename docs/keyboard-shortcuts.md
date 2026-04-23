# Keyboard Shortcuts

All shortcuts work while the viewer is focused.

## Navigation

| Key | Action |
|-----|--------|
| `→` or `l` | Step forward one line |
| `←` or `h` | Step backward one line |
| `Shift+→` or `j` | Step over forward — advance without descending into function calls |
| `Shift+←` or `k` | Step over backward |
| `u` | Step up — exit the current function and return to the caller |

Click any line number to jump directly to the first step on that line.

---

## Display toggles

| Key | Toggles |
|-----|---------|
| `A` | **Animation mode** — progressively reveals code lines as you step forward. Lines not yet reached are hidden. On by default. |
| `E` | **Variable panel** — shows/hides the floating env panel with inspected variables. On by default. |
| `N` | **Notes** — shows/hides `note()` annotations beside their lines. Off by default. |
| `R` | **Raw mode** — shows the original source code instead of rendered markdown/images. Useful for inspecting or copying code. |

---

## Step over vs step forward

**Step forward** (`→`) enters every function call. If `insert()` calls `_find_parent()`, you'll step through `_find_parent` line by line.

**Step over** (`Shift+→`) treats the entire function call as a single step — the viewer jumps from the call site to after the return, without showing any of the internal lines.

Use `@stepover` in your code to mark lines that should always behave as step-over regardless of which key is pressed:

```python
result = sort(data)   # @stepover
```

---

## Vim-style keys

The `h`/`l`/`j`/`k` bindings follow vim conventions:

- `h` ← (left)
- `l` → (right)
- `j` step over forward
- `k` step over backward
