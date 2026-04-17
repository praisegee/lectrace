from __future__ import annotations
import re
from html.parser import HTMLParser

from lectrace.files import cached
from lectrace.reference import Reference


def is_arxiv_url(url: str) -> bool:
    return url.startswith("https://arxiv.org/")


def fetch_reference(url: str, **kwargs) -> Reference:
    m = re.search(r"arxiv\.org/(?:abs|pdf)/(\d+\.\d+)", url)
    if not m:
        raise ValueError(f"Cannot parse arXiv URL: {url}")
    paper_id = m.group(1)
    abs_url = f"https://arxiv.org/abs/{paper_id}"

    html_path = cached(abs_url, "arxiv")
    html = html_path.read_text(encoding="utf-8")

    try:
        from bs4 import BeautifulSoup  # type: ignore[import-untyped]
        return _parse_bs4(html, url, **kwargs)
    except ImportError:
        return _parse_stdlib(html, url, **kwargs)


def _parse_bs4(html: str, url: str, **kwargs) -> Reference:
    from bs4 import BeautifulSoup
    soup = BeautifulSoup(html, "html.parser")

    def meta(name: str, prop: str | None = None) -> str:
        tag = soup.find("meta", {"name": name}) or (prop and soup.find("meta", {"property": prop}))
        return _collapse(tag["content"]) if tag else ""  # type: ignore[index]

    title = meta("citation_title")
    authors_div = soup.find("div", class_="authors")
    if authors_div:
        authors = [_collapse(a.get_text()) for a in authors_div.find_all("a") if "searchtype=author" in (a.get("href") or "")]
    else:
        authors = [_collapse(t["content"]) for t in soup.find_all("meta", {"name": "citation_author"})]
    date = meta("citation_date").replace("/", "-")
    description = meta("", prop="og:description")

    return Reference(title=title, authors=authors or None, url=url, date=date or None,
                     description=description or None, **kwargs)


def _parse_stdlib(html: str, url: str, **kwargs) -> Reference:
    parser = _MetaParser()
    parser.feed(html)
    meta = parser.meta

    title = _collapse(meta.get("citation_title", ""))
    raw_authors = meta.get("citation_author", [])
    authors = [_collapse(a) for a in (raw_authors if isinstance(raw_authors, list) else [raw_authors])]
    date = meta.get("citation_date", "").replace("/", "-")
    description = _collapse(meta.get("og:description", ""))

    return Reference(title=title or None, authors=authors or None, url=url,
                     date=date or None, description=description or None, **kwargs)


class _MetaParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.meta: dict[str, str | list[str]] = {}

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag != "meta":
            return
        d = dict(attrs)
        key = d.get("name") or d.get("property")
        val = d.get("content")
        if key and val:
            if key in self.meta:
                existing = self.meta[key]
                self.meta[key] = ([existing] if isinstance(existing, str) else existing) + [val]
            else:
                self.meta[key] = val


def _collapse(text: str) -> str:
    return re.sub(r"\s+", " ", text.replace("\n", " ")).strip()
