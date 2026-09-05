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


def _in_lectrace() -> bool:
    return getattr(_local, "active", False)


def _set_active(flag: bool) -> None:
    _local.active = flag


def text(
    message: str,
    style: dict | None = None,
    verbatim: bool = False,
    language: str | None = None,
) -> None:
    message = textwrap.dedent(message).strip()
    if verbatim or language:
        # A real fenced block. Styling it as monospace markdown is not enough:
        # the markdown parser eats the indentation and reads `__name__` as bold
        # long before any CSS applies.
        message = _fence(message, language)
    _store().append(Rendering(type="markdown", data=message, style=style or None))


def _fence(message: str, language: str | None) -> str:
    longest = max((len(run) for run in re.findall(r"`+", message)), default=0)
    ticks = "`" * max(3, longest + 1)
    return f"{ticks}{language or ''}\n{message}\n{ticks}"


def image(url: str, style: dict | None = None, width: int | str | None = None) -> None:
    import base64
    import mimetypes

    s = {**(style or {}), **({"width": width} if width is not None else {})} or None
    file_path = cached(url, "image") if _is_url(url) else Path(_local_file(url))
    mime = mimetypes.guess_type(url)[0] or "image/png"
    data = (
        "data:" + mime + ";base64," + base64.b64encode(file_path.read_bytes()).decode()
    )
    _store().append(Rendering(type="image", data=data, style=s))


def video(url: str, style: dict | None = None, width: int | str | None = None) -> None:
    import base64
    import mimetypes

    s = {**(style or {}), **({"width": width} if width is not None else {})} or None
    file_path = cached(url, "video") if _is_url(url) else Path(_local_file(url))
    mime = mimetypes.guess_type(url)[0] or "video/mp4"
    data = (
        "data:" + mime + ";base64," + base64.b64encode(file_path.read_bytes()).decode()
    )
    _store().append(Rendering(type="video", data=data, style=s))


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
        import matplotlib.pyplot as plt  # type: ignore

        fig: plt.Figure | None = None
        if isinstance(spec, plt.Figure):
            fig = spec
        elif isinstance(spec, plt.Axes):
            fig = spec.get_figure()

        if fig is not None:
            if not _in_lectrace():
                return

            import base64
            import io

            buf = io.BytesIO()
            fig.savefig(buf, format="svg", bbox_inches="tight")
            buf.seek(0)
            data = "data:image/svg+xml;base64," + base64.b64encode(buf.read()).decode()
            plt.close(fig)
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
    head: "int | None" = 5,
    tail: "int | None" = 5,
) -> None:
    try:
        import pandas as pd  # type: ignore[import-untyped]

        if isinstance(rows, pd.DataFrame):
            if headers is None:
                headers = [str(c) for c in rows.columns]
            rows = [list(r) for r in rows.itertuples(index=False, name=None)]
    except ImportError:
        pass

    try:
        import numpy as np  # type: ignore[import-untyped]

        if isinstance(rows, np.ndarray):
            if rows.ndim != 2:
                raise ValueError(
                    f"table() requires a 2-D array; got shape {rows.shape}"
                )
            rows = rows.tolist()
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
        "rows": _elide(
            [[_cell(v) for v in row] for row in rows],
            head,
            tail,
            len(headers) if headers else 0,
        ),
    }
    if caption is not None:
        data["caption"] = caption

    _store().append(Rendering(type="table", data=data, style=style or None))


ELLIPSIS = "..."


def _elide(rows: list[list], head: int | None, tail: int | None, width: int) -> list[list]:
    """Keep the first `head` and last `tail` rows, joined by a row of ellipses.

    `None` means "no limit" on that side. Rows are returned untouched when
    nothing would be hidden, so a 10-row table under the 5/5 default still
    shows all ten.
    """
    if (head is not None and head < 0) or (tail is not None and tail < 0):
        raise ValueError("table() head= and tail= must not be negative")
    if head is None and tail is None:
        return rows

    n = len(rows)
    h = n if head is None else head
    t = n if tail is None else tail
    if n <= h + t:
        return rows

    gap = [ELLIPSIS] * (width or (len(rows[0]) if rows else 0))
    return rows[:h] + [gap] + (rows[n - t :] if t else [])


def note(message: str) -> None:
    _store().append(Rendering(type="note", data=textwrap.dedent(message).strip()))


def system_text(command: list[str], timeout: int = 60, language: str | None = None) -> None:
    raw = subprocess.check_output(command, text=True, timeout=timeout)
    clean = re.sub(r"\x1b\[[0-9;]*m", "", raw)
    text(clean, verbatim=True, language=language)


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
