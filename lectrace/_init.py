from __future__ import annotations
import shutil
from pathlib import Path


_TOML_TEMPLATE = """\
[lectrace]
title = "{title}"

# Lecture files are auto-discovered. Name them with numeric prefixes to control
# sidebar order: 01_intro.py, 02_arrays.py, 03_sorting.py, ...
#
# To target a specific folder or pattern instead:
# lectures = ["lectures/*.py"]
#
# output = "_site"
"""

_GITIGNORE_ADDITIONS = ["_site/", ".lectrace_cache.json"]


def run_init() -> None:
    workflow_dest = Path(".github/workflows/lectrace.yml")
    toml_dest = Path("lectrace.toml")

    _write_workflow(workflow_dest)
    _write_toml(toml_dest)
    _update_gitignore()

    print("\nDone! Next steps:")
    print("  1. Enable GitHub Pages in your repo settings (source: GitHub Actions)")
    print("  2. Push to main — your lectures will be live automatically")
    print(f"\n  Preview locally: lectrace serve")


def _write_workflow(dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.exists():
        print(f"  {dest} :: already exists, skipping")
        return
    template = Path(__file__).parent / "_templates" / "lectrace.yml"
    shutil.copy(template, dest)
    print(f"  {dest} :: created")


def _write_toml(dest: Path) -> None:
    if dest.exists():
        print(f"  {dest} :: already exists, skipping")
        return
    name = Path.cwd().name.replace("-", " ").replace("_", " ").title()
    dest.write_text(_TOML_TEMPLATE.format(title=name))
    print(f"  {dest} :: created")


def _update_gitignore() -> None:
    gi = Path(".gitignore")
    existing = gi.read_text() if gi.exists() else ""
    to_add = [line for line in _GITIGNORE_ADDITIONS if line not in existing]
    if to_add:
        with open(gi, "a") as f:
            f.write("\n# lectrace\n" + "\n".join(to_add) + "\n")
        print(f"  .gitignore :: updated")
