# Keyboard Shortcuts

All shortcuts work while the viewer is focused on desktop.

## Navigation

| Key | Action |
|-----|--------|
| `→` or `l` | Step forward one line |
| `←` or `h` | Step backward one line |
| `Shift+→` or `j` | Step over forward — advance without descending into function calls |
| `Shift+←` or `k` | Step over backward |
| `u` | Step out of current function, return to the caller |

Click any line number to jump directly to the first step on that line.

---

## Display toggles

| Key | Toggles |
|-----|---------|
| `A` | **Animation mode** — progressively reveals code lines as you step forward. Lines not yet reached are dimmed. |
| `E` | **Variable panel** — shows/hides the variable panel. |
| `R` | **Raw mode** — shows the original source code instead of rendered markdown and images. Useful for copying code. |
| `F` | **Fullscreen** — enters/exits fullscreen presentation mode. |

---

## Mobile

On mobile there are no keyboard shortcuts. Use:

- **Swipe left/right** to step forward/backward
- **Bottom navigation bar** for all step controls (forward, backward, step over, step out)
- **Variables bar** — tap to expand/collapse the variable panel

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

- `h` ← step backward
- `l` → step forward
- `j` step over forward
- `k` step over backward
