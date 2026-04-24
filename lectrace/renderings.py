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


def link(arg: type | Reference | str | None = None, style: dict | None = None, **kwargs) -> None:
    s = style or None
    match arg:
        case None:
            ref = Reference(**kwargs)
            _store().append(Rendering(type="link", data=ref.label, style=s, external_link=ref))
        case Reference():
            _store().append(Rendering(type="link", data=arg.label, style=s, external_link=arg))
        case str():
            ref = url_reference(arg, **kwargs)
            _store().append(Rendering(type="link", data=ref.label, style=s, external_link=ref))
        case _ if isinstance(arg, type) or callable(arg):
            src = inspect.getfile(arg)
            _, lineno = inspect.getsourcelines(arg)
            loc = CodeLocation(relativize(src), lineno)
            _store().append(Rendering(type="link", data=arg.__name__, style=s, internal_link=loc))
        case _:
            raise TypeError(f"link() got unexpected argument: {type(arg)}")


def plot(spec: object) -> None:
    _store().append(Rendering(type="plot", data=spec))  # type: ignore[arg-type]


def note(message: str) -> None:
    _store().append(Rendering(type="note", data=textwrap.dedent(message).strip()))


def system_text(command: list[str]) -> None:
    raw = subprocess.check_output(command, text=True)
    clean = re.sub(r"\x1b\[[0-9;]*m", "", raw)
    text(clean, verbatim=True)


def url_reference(url: str, **kwargs) -> Reference:
    from lectrace.arxiv import is_arxiv_url, fetch_reference
    # arXiv URLs get auto-scraped for title/authors; everything else is a plain reference
    if is_arxiv_url(url) and not kwargs.get("title"):
        try:
            return fetch_reference(url, **kwargs)
        except Exception:
            pass
    return Reference(url=url, **kwargs)


def _is_url(s: str) -> bool:
    return s.startswith(("http://", "https://"))


def _local_file(path: str) -> str:
    if not Path(path).exists():
        raise FileNotFoundError(f"File not found: {path}")
    return path
