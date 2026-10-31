from __future__ import annotations

import dataclasses
import datetime
import importlib
import math
import pathlib
from typing import Any


def _lazy(name: str) -> Any:
    try:
        return importlib.import_module(name)
    except ImportError:
        return None


def serialize(value: Any, depth: int = 0) -> dict:
    if depth > 12:
        return {"type": "...", "contents": "[max depth]"}

    if hasattr(value, "__lectrace__"):
        try:
            return serialize(value.__lectrace__(), depth + 1)
        except Exception:  # noqa: BLE001, S110
            pass

    t = _type_str(value)

    match value:
        case None:
            return {"type": "NoneType", "contents": None}
        case bool():
            return {"type": "bool", "contents": value}
        case int():
            return {"type": "int", "contents": value}
        case float():
            return {
                "type": "float",
                "contents": (
                    str(value) if (math.isnan(value) or math.isinf(value)) else value
                ),
            }
        case str():
            return {"type": "str", "contents": value}
        case complex():
            return {
                "type": "complex",
                "contents": {"real": value.real, "imag": value.imag},
            }
        case list() | tuple():
            return {"type": t, "contents": [serialize(v, depth + 1) for v in value]}
        case set() | frozenset():
            return {
                "type": t,
                "contents": [serialize(v, depth + 1) for v in sorted(value, key=repr)],
            }
        case dict():
            return {
                "type": t,
                "contents": {
                    _key(k): serialize(v, depth + 1) for k, v in value.items()
                },
            }
        case datetime.datetime():
            return {"type": t, "contents": value.isoformat()}
        case pathlib.Path():
            return {"type": t, "contents": str(value)}

    if dataclasses.is_dataclass(value) and not isinstance(value, type):
        return {
            "type": t,
            "contents": {
                f.name: serialize(getattr(value, f.name), depth + 1)
                for f in dataclasses.fields(value)
            },
        }

    if (np := _lazy("numpy")) is not None:
        if isinstance(value, np.ndarray):
            if value.dtype.kind == "O":  # object array: recurse into elements
                return {
                    "type": t,
                    "dtype": str(value.dtype),
                    "shape": list(value.shape),
                    "contents": [serialize(v, depth + 1) for v in value.flat],
                }
            return _tensor(np, value, t, str(value.dtype))
        if isinstance(value, np.integer):
            return {"type": t, "contents": int(value)}
        if isinstance(value, np.floating):
            return {"type": t, "contents": float(value)}

    if (torch := _lazy("torch")) is not None and isinstance(value, torch.Tensor):
        if np is None:
            return {
                "type": t,
                "dtype": str(value.dtype),
                "shape": list(value.shape),
                "contents": value.tolist(),
            }
        v = value.detach().cpu()
        # numpy has no bfloat16, so floats are widened to float32 before converting.
        arr = v.float().numpy() if v.is_floating_point() else v.numpy()
        return _tensor(np, arr, t, str(value.dtype))

    if (sympy := _lazy("sympy")) is not None and isinstance(value, sympy.Basic):
        if isinstance(value, sympy.Integer):
            return {"type": t, "contents": int(value)}
        if isinstance(value, sympy.Float):
            return {"type": t, "contents": float(value)}
        return {"type": t, "contents": str(value)}

    if hasattr(value, "asdict") and callable(value.asdict):
        return serialize(value.asdict(), depth + 1)

    return {"type": t, "contents": repr(value)}


# Tensors up to this many elements are sent in full; larger ones as a preview.
FULL_LIMIT = 256
# Largest side of the 2D preview grid sent for a large tensor.
PREVIEW_SIZE = 32


def _tensor(np: Any, arr: Any, t: str, dtype: str) -> dict:
    """Serialize a numeric array with summary stats.

    Small arrays keep every value. Large ones are reduced to a block-averaged
    2D preview of their first 2D slice, which is all the viewer can show and
    keeps a trace from storing every element of every tensor at every step.
    """
    out: dict = {"type": t, "dtype": dtype, "shape": list(arr.shape)}
    if arr.dtype.kind not in "biuf":
        out["contents"] = arr.tolist()
        return out
    if arr.size <= FULL_LIMIT:
        out["contents"] = _json_safe(np, arr)
    else:
        out["contents"] = _json_safe(np, _preview(np, arr))
        out["truncated"] = True
    if arr.ndim > 0 and arr.size > 0:
        out["summary"] = _summary(np, arr)
    return out


def _summary(np: Any, arr: Any) -> dict:
    x = arr.astype(np.float64)
    nan = np.isnan(x)
    inf = np.isinf(x)
    finite = x[~(nan | inf)]
    stats: dict = {"nan": int(nan.sum()), "inf": int(inf.sum())}
    if finite.size:
        stats.update(
            mean=float(finite.mean()),
            std=float(finite.std()),
            min=float(finite.min()),
            max=float(finite.max()),
        )
    return stats


def _preview(np: Any, arr: Any) -> Any:
    """First 2D slice of `arr`, block-averaged to at most PREVIEW_SIZE per side."""
    x = arr.astype(np.float64)
    if x.ndim == 1:
        x = x[np.newaxis, :]
    while x.ndim > 2:
        x = x[0]
    for axis in (0, 1):
        n = x.shape[axis]
        if n > PREVIEW_SIZE:
            starts = np.linspace(0, n, PREVIEW_SIZE, endpoint=False).astype(int)
            counts = np.diff(np.append(starts, n))
            x = np.add.reduceat(x, starts, axis=axis)
            x = x / (counts[:, None] if axis == 0 else counts[None, :])
    return x


def _json_safe(np: Any, arr: Any) -> Any:
    """`arr.tolist()`, with NaN/inf as strings: bare NaN is not valid JSON."""
    if arr.dtype.kind != "f" or np.isfinite(arr).all():
        return arr.tolist()
    out = arr.astype(object)
    out[np.isnan(arr)] = "nan"
    out[np.isposinf(arr)] = "inf"
    out[np.isneginf(arr)] = "-inf"
    return out.tolist()


def _type_str(value: Any) -> str:
    t = type(value)
    return t.__name__ if t.__module__ == "builtins" else f"{t.__module__}.{t.__name__}"


def _key(k: Any) -> str:
    return k if isinstance(k, str) else repr(k)
