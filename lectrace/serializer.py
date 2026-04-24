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
        return serialize(value.__lectrace__(), depth + 1)

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
            return {
                "type": t,
                "dtype": str(value.dtype),
                "shape": list(value.shape),
                "contents": value.tolist(),
            }
        if isinstance(value, np.integer):
            return {"type": t, "contents": int(value)}
        if isinstance(value, np.floating):
            return {"type": t, "contents": float(value)}

    if (torch := _lazy("torch")) is not None and isinstance(value, torch.Tensor):
        return {
            "type": t,
            "dtype": str(value.dtype),
            "shape": list(value.shape),
            "contents": value.tolist(),
        }

    if (sympy := _lazy("sympy")) is not None and isinstance(value, sympy.Basic):
        if isinstance(value, sympy.Integer):
            return {"type": t, "contents": int(value)}
        if isinstance(value, sympy.Float):
            return {"type": t, "contents": float(value)}
        return {"type": t, "contents": str(value)}

    if hasattr(value, "asdict") and callable(value.asdict):
        return serialize(value.asdict(), depth + 1)

    return {"type": t, "contents": repr(value)}


def _type_str(value: Any) -> str:
    t = type(value)
    return t.__name__ if t.__module__ == "builtins" else f"{t.__module__}.{t.__name__}"


def _key(k: Any) -> str:
    return k if isinstance(k, str) else repr(k)
