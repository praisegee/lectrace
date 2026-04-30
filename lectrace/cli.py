from __future__ import annotations

import argparse
import sys
from pathlib import Path


def main() -> None:
    parser = argparse.ArgumentParser(
        prog="lectrace", description="Interactive Python lecture tracer"
    )
    sub = parser.add_subparsers(dest="command", metavar="command")

    sub.add_parser("init", help="Set up GitHub Actions workflow and config file")

    build_p = sub.add_parser("build", help="Execute lectures and build static site")
    build_p.add_argument("files", nargs="*", type=Path, metavar="FILE")
    build_p.add_argument(
        "--output", "-o", type=Path, default=Path("_site"), metavar="DIR"
    )
    build_p.add_argument(
        "--no-incremental", action="store_true", help="Rebuild all, ignoring cache"
    )

    serve_p = sub.add_parser(
        "serve", help="Build and serve locally with auto-reload on save"
    )
    serve_p.add_argument("files", nargs="*", type=Path, metavar="FILE")
    serve_p.add_argument("--port", "-p", type=int, default=7000)

    run_p = sub.add_parser("run", help="Execute a single file and print trace info")
    run_p.add_argument("file", type=Path)
    run_p.add_argument(
        "--inspect-all", "-I", action="store_true", help="Capture all local variables"
    )

    args = parser.parse_args()

    match args.command:
        case "init":
            from lectrace._init import run_init

            run_init()
        case "build":
            from lectrace.builder import build

            build(
                output=args.output,
                files=_validate_py_files(args.files),
                incremental=not args.no_incremental,
            )
        case "serve":
            from lectrace.server import serve

            serve(files=_validate_py_files(args.files), port=args.port)
        case "run":
            _run(args.file, args.inspect_all)
        case _:
            parser.print_help()
            sys.exit(0)


def _validate_py_files(files: list[Path]) -> list[Path] | None:
    if not files:
        return None
    for f in files:
        if f.suffix != ".py":
            print(f"Error: {f} is not a Python file — lectrace only traces .py files")
            sys.exit(1)
        if f.name.startswith("_"):
            print(
                f"Error: {f} looks like a helper file — prefix lecture files without underscore"
            )
            sys.exit(1)
        if not f.exists():
            print(f"Error: {f} not found")
            sys.exit(1)
    return files


def _run(path: Path, inspect_all: bool) -> None:
    from lectrace.tracer import execute

    if path.suffix != ".py":
        print(f"Error: {path} is not a Python file — lectrace only traces .py files")
        sys.exit(1)
    if not path.exists():
        print(f"Error: {path} not found")
        sys.exit(1)

    trace = execute(path, inspect_all=inspect_all)
    print(f"{len(trace.steps)} steps from {path}")
    if trace.metadata.error:
        print(
            f"Warning: raised {trace.metadata.error.exception_type}: {trace.metadata.error.message}"
        )
