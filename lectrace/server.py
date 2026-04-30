from __future__ import annotations

import http.server
import threading
import time
import webbrowser
from pathlib import Path


def serve(files: list[Path] | None = None, port: int = 7000) -> None:
    from lectrace.builder import build, discover

    output = Path("_site")
    lecture_files = files or discover()

    noun = "lecture" if len(lecture_files) == 1 else "lectures"
    print(f"Building {len(lecture_files)} {noun}...")
    build(output=output, files=lecture_files, incremental=True)

    _watch_and_rebuild(lecture_files, output)

    handler = _make_handler(output)
    server = http.server.HTTPServer(("", port), handler)

    url = f"http://localhost:{port}"
    print(f"\n  Serving at {url}")
    print("  Press Ctrl+C to stop\n")
    webbrowser.open(url)

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")


def _watch_and_rebuild(files: list[Path], output: Path) -> None:
    from lectrace.builder import build

    mtimes: dict[str, float] = {str(f): f.stat().st_mtime for f in files}

    def watch() -> None:
        while True:
            time.sleep(1)
            changed = [f for f in files if f.stat().st_mtime != mtimes.get(str(f))]
            if changed:
                for f in changed:
                    mtimes[str(f)] = f.stat().st_mtime
                label = (
                    changed[0].name if len(changed) == 1 else f"{len(changed)} files"
                )
                ts = time.strftime("%H:%M:%S")
                print(f"\n  [{ts}] {label} saved :: rebuilding...")
                build(output=output, files=changed, incremental=False)

    t = threading.Thread(target=watch, daemon=True)
    t.start()


def _make_handler(root: Path):
    class Handler(http.server.SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=str(root), **kwargs)

        def log_message(self, fmt, *args):
            pass  # suppress request logs

    return Handler
