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
    server = http.server.ThreadingHTTPServer(("", port), handler)

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

    def helpers() -> list[Path]:
        # Every other .py file beside a lecture may be imported by one. Rescanned
        # each tick so a helper created while serving is picked up.
        lectures = set(files)
        dirs = {f.parent for f in files}
        return [p for d in dirs for p in d.glob("*.py") if p not in lectures]

    mtimes: dict[str, float] = {str(f): f.stat().st_mtime for f in files + helpers()}

    def changed(paths: list[Path]) -> list[Path]:
        out = []
        for p in paths:
            try:
                mtime = p.stat().st_mtime
            except FileNotFoundError:
                continue
            if mtime != mtimes.get(str(p)):
                mtimes[str(p)] = mtime
                out.append(p)
        return out

    def watch() -> None:
        while True:
            time.sleep(1)
            ts = time.strftime("%H:%M:%S")
            lectures = changed(files)
            if lectures:
                label = (
                    lectures[0].name if len(lectures) == 1 else f"{len(lectures)} files"
                )
                print(f"\n  [{ts}] {label} saved :: rebuilding...")
                build(output=output, files=lectures, incremental=False)
            edited = changed(helpers())
            if edited:
                label = edited[0].name if len(edited) == 1 else f"{len(edited)} helpers"
                print(f"\n  [{ts}] {label} saved :: rebuilding lectures that use it...")
                # The cache records which helpers each trace imported, so an
                # incremental build redoes only the lectures that use them.
                build(output=output, files=files, incremental=True)

    t = threading.Thread(target=watch, daemon=True)
    t.start()


def _make_handler(root: Path):
    class Handler(http.server.SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=str(root), **kwargs)

        def end_headers(self):
            # Make the browser revalidate every file, so a rebuild or a lectrace
            # upgrade is picked up on reload instead of served from cache.
            self.send_header("Cache-Control", "no-cache")
            super().end_headers()

        def log_message(self, fmt, *args):
            pass

        def handle_error(self, request, client_address):
            import sys
            if issubclass(sys.exc_info()[0], BrokenPipeError):
                return
            super().handle_error(request, client_address)

    return Handler
