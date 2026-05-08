from __future__ import annotations

import inspect
import re
import subprocess
import textwrap
import threading
from dataclasses import dataclass
from pathlib import Path

from lectrace.files import cached, relativize
from lectrace.reference import Reference


@dataclass(frozen=True)
class CodeLocation:
    path: str
    line_number: int


@dataclass(frozen=True)
class Rendering:
    type: str
    data: str | None = None
    style: dict | None = None
    external_link: Reference | None = None
    internal_link: CodeLocation | None = None


_local = threading.local()


def _store() -> list[Rendering]:
    if not hasattr(_local, "renderings"):
        _local.renderings = []
    return _local.renderings


def flush() -> list[Rendering]:
    result = list(_store())
    _store().clear()
    return result


def text(message: str, style: dict | None = None, verbatim: bool = False) -> None:
    message = textwrap.dedent(message).strip()
    extra: dict = {"fontFamily": "monospace", "whiteSpace": "pre"} if verbatim else {}
    merged = {**extra, **(style or {})} or None
    _store().append(Rendering(type="markdown", data=message, style=merged))


def image(url: str, style: dict | None = None, width: int | str | None = None) -> None:
    s = {**(style or {}), **({"width": width} if width is not None else {})} or None
    path = str(cached(url, "image")) if _is_url(url) else _local_file(url)
    _store().append(Rendering(type="image", data=path, style=s))


def video(url: str, style: dict | None = None, width: int | str | None = None) -> None:
    s = {**(style or {}), **({"width": width} if width is not None else {})} or None
    path = str(cached(url, "video")) if _is_url(url) else _local_file(url)
    _store().append(Rendering(type="video", data=path, style=s))


def link(
    arg: type | Reference | str | None = None, style: dict | None = None, **kwargs
) -> None:
    s = style or None
    match arg:
        case None:
            ref = Reference(**kwargs)
            _store().append(
                Rendering(type="link", data=ref.label, style=s, external_link=ref)
            )
        case Reference():
            _store().append(
                Rendering(type="link", data=arg.label, style=s, external_link=arg)
            )
        case str():
            ref = url_reference(arg, **kwargs)
            _store().append(
                Rendering(type="link", data=ref.label, style=s, external_link=ref)
            )
        case _ if isinstance(arg, type) or callable(arg):
            src = inspect.getfile(arg)
            _, lineno = inspect.getsourcelines(arg)
            loc = CodeLocation(relativize(src), lineno)
            _store().append(
                Rendering(type="link", data=arg.__name__, style=s, internal_link=loc)
            )
        case _:
            raise TypeError(f"link() got unexpected argument: {type(arg)}")


def plot(spec: object) -> None:
    try:
        import matplotlib.figure

        if isinstance(spec, matplotlib.figure.Figure):
            import base64
            import io

            buf = io.BytesIO()
            spec.savefig(buf, format="svg", bbox_inches="tight")
            buf.seek(0)
            data = "data:image/svg+xml;base64," + base64.b64encode(buf.read()).decode()
            import matplotlib.pyplot as plt

            plt.close(spec)
            _store().append(Rendering(type="image", data=data))
            return
    except ImportError:
        pass
    _store().append(Rendering(type="plot", data=spec))  # type: ignore[arg-type]


def table(
    rows: "list[dict] | list[list]",
    headers: "list[str] | None" = None,
    caption: "str | None" = None,
    style: "dict | None" = None,
) -> None:
    try:
        import pandas as pd  # type: ignore[import-untyped]

        if isinstance(rows, pd.DataFrame):
            if headers is None:
                headers = [str(c) for c in rows.columns]
            rows = [list(r) for r in rows.itertuples(index=False, name=None)]
    except ImportError:
        pass

    rows = list(rows)

    if rows and isinstance(rows[0], dict):
        if headers is None:
            seen: dict[str, None] = {}
            for row in rows:
                seen.update(dict.fromkeys(row.keys()))
            headers = list(seen)
        rows = [[row.get(h) for h in headers] for row in rows]  # type: ignore[union-attr]
    elif rows and isinstance(rows[0], (list, tuple)):
        if headers is None:
            raise ValueError("table() requires headers= when rows are lists")
    elif rows:
        raise TypeError(
            f"table() expects list[dict], list[list], or a DataFrame; "
            f"got list[{type(rows[0]).__name__}]"
        )

    data: dict = {
        "headers": list(headers) if headers else [],
        "rows": [[_cell(v) for v in row] for row in rows],
    }
    if caption is not None:
        data["caption"] = caption

    _store().append(Rendering(type="table", data=data, style=style or None))


def note(message: str) -> None:
    _store().append(Rendering(type="note", data=textwrap.dedent(message).strip()))


def system_text(command: list[str]) -> None:
    raw = subprocess.check_output(command, text=True)
    clean = re.sub(r"\x1b\[[0-9;]*m", "", raw)
    text(clean, verbatim=True)


def url_reference(url: str, **kwargs) -> Reference:
    from lectrace.arxiv import fetch_reference, is_arxiv_url

    # arXiv URLs get auto-scraped for title/authors; everything else is a plain reference
    if is_arxiv_url(url) and not kwargs.get("title"):
        try:
            return fetch_reference(url, **kwargs)
        except Exception:
            pass
    return Reference(url=url, **kwargs)


def _cell(v: object) -> "str | int | float | bool | None":
    if v is None:
        return None
    if isinstance(v, bool):
        return v
    if isinstance(v, int):
        return v
    if isinstance(v, float):
        import math

        return str(v) if (math.isnan(v) or math.isinf(v)) else v
    try:
        import numpy as np  # type: ignore[import-untyped]

        if isinstance(v, np.bool_):
            return bool(v)
        if isinstance(v, np.integer):
            return int(v)
        if isinstance(v, np.floating):
            import math

            f = float(v)
            return str(f) if (math.isnan(f) or math.isinf(f)) else f
    except ImportError:
        pass
    return str(v)


def _is_url(s: str) -> bool:
    return s.startswith(("http://", "https://"))


def _local_file(path: str) -> str:
    if not Path(path).exists():
        raise FileNotFoundError(f"File not found: {path}")
    return path
