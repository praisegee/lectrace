from __future__ import annotations
import hashlib
import shutil
import time
import urllib.error
import urllib.request
from pathlib import Path


_CACHE_DIR = Path.home() / ".cache" / "lectrace"


def download(url: str, dest: Path, timeout: int = 30) -> None:
    if dest.exists():
        return
    dest.parent.mkdir(parents=True, exist_ok=True)
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (compatible; lectrace/1.0)"})
    for attempt in range(5):
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                with open(dest, "wb") as f:
                    shutil.copyfileobj(resp, f)
            return
        except urllib.error.HTTPError as exc:
            if exc.code != 429:
                raise
            wait = min(2 ** attempt, 60)
            print(f"Rate limited — retrying in {wait}s...")
            time.sleep(wait)
    raise RuntimeError(f"Failed to download {url} after 5 attempts")


def cached(url: str, prefix: str) -> Path:
    url_hash = hashlib.sha256(url.encode()).hexdigest()[:20]
    suffix = Path(url.split("?")[0]).suffix or ".bin"
    dest = _CACHE_DIR / f"{prefix}-{url_hash}{suffix}"
    download(url, dest)
    return dest


def relativize(path: str | Path) -> str:
    try:
        return str(Path(path).relative_to(Path.cwd()))
    except ValueError:
        return str(path)
