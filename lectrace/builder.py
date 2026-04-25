from __future__ import annotations
import hashlib
import json
import re
import shutil
import time
from dataclasses import asdict
from pathlib import Path


_SKIP_DIRS = {"__pycache__", ".venv", "venv", "env", "node_modules", ".git", "_site", "site-packages"}

def discover(patterns: list[str] | None = None, root: Path | None = None) -> list[Path]:
    root = root or Path.cwd()
    if patterns:
        return sorted(p for pattern in patterns for p in root.glob(pattern))
    candidates = (
        p for p in root.rglob("*.py")
        if not p.name.startswith("_")
        and not any(part in _SKIP_DIRS for part in p.parts)
        and p.stat().st_size < 500_000
    )
    return sorted(
        p for p in candidates
        if re.search(r"from\s+lectrace\s+import|import\s+lectrace", p.read_text(encoding="utf-8"))
    )


def build(
    output: Path = Path("_site"),
    files: list[Path] | None = None,
    incremental: bool = True,
) -> None:
    from lectrace.tracer import execute

    output.mkdir(parents=True, exist_ok=True)
    traces_dir = output / "traces"
    traces_dir.mkdir(exist_ok=True)

    cache_path = output / ".lectrace_cache.json"
    cache: dict = json.loads(cache_path.read_text()) if cache_path.exists() else {}

    lecture_files = files or discover()
    if not lecture_files:
        print("No lecture files found. Import lectrace in a .py file to get started.")
        return

    index_entries = []
    for lecture in lecture_files:
        src_hash = _sha256(lecture)
        cache_key = str(lecture)
        cached_entry = cache.get(cache_key, {})

        if incremental and cached_entry.get("hash") == src_hash:
            index_entries.append(cached_entry["index_entry"])
            print(f"  ✓ {lecture.name} (unchanged)")
            continue

        print(f"  → {lecture.name}")
        t0 = time.monotonic()
        trace = execute(lecture)
        elapsed = time.monotonic() - t0

        out_path = traces_dir / f"{lecture.stem}.json"
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(asdict(trace), f, indent=2)

        entry = {
            "id": lecture.stem,
            "title": _first_title(trace),
            "path": f"traces/{lecture.stem}.json",
            "step_count": len(trace.steps),
            "built_at": trace.metadata.built_at,
        }
        index_entries.append(entry)
        cache[cache_key] = {"hash": src_hash, "index_entry": entry}
        print(f"     {len(trace.steps)} steps in {elapsed:.1f}s")

    with open(traces_dir / "index.json", "w", encoding="utf-8") as f:
        json.dump({"version": "2", "traces": index_entries}, f, indent=2)

    # Remove trace files that are no longer in the build
    current_ids = {e["id"] for e in index_entries}
    for stale in traces_dir.glob("*.json"):
        if stale.name != "index.json" and stale.stem not in current_ids:
            stale.unlink()

    _copy_static(output)
    cache_path.write_text(json.dumps(cache, indent=2))
    print(f"\n✓ {len(index_entries)} lecture(s) → {output}/")


def _sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def _copy_static(dest: Path) -> None:
    static = Path(__file__).parent / "_static"
    if not static.exists():
        raise RuntimeError(
            "Pre-built frontend missing. Run: bash scripts/build_frontend.sh"
        )
    assets_dest = dest / "assets"
    if assets_dest.exists():
        shutil.rmtree(assets_dest)
    for item in static.rglob("*"):
        if item.is_file():
            target = dest / item.relative_to(static)
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(item, target)


def _first_title(trace) -> str:
    for step in trace.steps:
        for r in step.renderings:
            if r.type == "markdown" and r.data:
                text = r.data.strip().lstrip("#").strip()
                if text:
                    return text
    return trace.metadata.module
