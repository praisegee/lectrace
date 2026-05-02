from __future__ import annotations

import ast
import hashlib
import sys
import traceback as tb
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from lectrace import __version__
from lectrace.directives import (
    HIDE,
    INSPECT,
    STEPOVER,
    clear_vars,
    has,
    inspect_vars,
    parse,
)
from lectrace.files import relativize
from lectrace.renderings import Rendering, flush
from lectrace.serializer import serialize


@dataclass(frozen=True)
class StackFrame:
    path: str
    line_number: int
    function_name: str
    source_line: str


@dataclass
class Step:
    stack: list[StackFrame]
    env: dict[str, Any]
    renderings: list[Rendering] = field(default_factory=list)


@dataclass(frozen=True)
class TraceError:
    exception_type: str
    message: str
    traceback: str


@dataclass(frozen=True)
class TraceMetadata:
    title: str
    module: str
    built_at: str
    source_hash: str
    python_version: str
    lectrace_version: str
    error: TraceError | None = None


@dataclass(frozen=True)
class Trace:
    version: str
    metadata: TraceMetadata
    files: dict[str, str]
    hidden_line_numbers: dict[str, list[int]]
    steps: list[Step]


def _statement_lines(source_text: str) -> set[int]:
    """Return line numbers that begin a statement (not sub-expression continuations)."""
    try:
        tree = ast.parse(source_text)
    except SyntaxError:
        return set()
    return {node.lineno for node in ast.walk(tree) if isinstance(node, ast.stmt)}


_COMPOUND_STMTS = (
    ast.For, ast.AsyncFor, ast.While, ast.If,
    ast.With, ast.AsyncWith, ast.Try, ast.TryStar,
    ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef,
)

def _statement_spans(source_text: str) -> dict[int, int]:
    """Return mapping of statement start line → end line.

    Compound statements (for, while, if, etc.) only span their header line so
    that directives in the body do not bleed into the header's directive set.
    """
    try:
        tree = ast.parse(source_text)
    except SyntaxError:
        return {}
    result = {}
    for node in ast.walk(tree):
        if not isinstance(node, ast.stmt) or not node.end_lineno:
            continue
        if isinstance(node, _COMPOUND_STMTS):
            result[node.lineno] = node.lineno
        else:
            result[node.lineno] = node.end_lineno
    return result


def execute(source: Path, inspect_all: bool = False) -> Trace:
    import importlib.util

    steps: list[Step] = []
    visible: set[str] = set()
    stepovers: list[tuple[str, int]] = []
    error: TraceError | None = None

    src_text = source.read_text(encoding="utf-8")
    src_lines = src_text.split("\n")
    stmt_lines = _statement_lines(src_text)
    stmt_spans = _statement_spans(src_text)

    spec = importlib.util.spec_from_file_location("_lecture", source)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.modules["_lecture"] = module
    visible.add(str(source.resolve()))

    source_dir = str(source.parent.resolve())
    if source_dir not in sys.path:
        sys.path.insert(0, source_dir)
        _added_to_path = True
    else:
        _added_to_path = False

    # Statically detect functions marked with bare @inspect on their def line.
    # We do this before tracing so module-level execution doesn't need to be traced at all.
    inspect_functions: set[int] = set()
    for i, line in enumerate(src_lines, start=1):
        directives = parse(line)
        if has(directives, INSPECT) and not inspect_vars(directives):
            if line.lstrip().startswith("def "):
                inspect_functions.add(i)

    def build_stack() -> list[StackFrame]:
        frames = []
        for fi in tb.extract_stack():
            if fi.filename not in visible:
                continue
            frames.append(
                StackFrame(
                    path=relativize(fi.filename),
                    line_number=fi.lineno,
                    function_name=fi.name,
                    source_line=(fi.line or "").strip(),
                )
            )
        return frames

    # (path, line) of bare @inspect call sites — propagates inspection one level into called fn
    inspect_call_sites: set[tuple[str, int]] = set()

    def on_line(frame, event, arg):
        if frame.f_code.co_filename not in visible:
            return on_line

        if event == "return":
            return on_line

        if frame.f_lineno not in stmt_lines:
            return on_line

        stack = build_stack()
        if not stack:
            return on_line

        current = stack[-1]

        if current.function_name in (
            "<listcomp>",
            "<genexpr>",
            "<setcomp>",
            "<dictcomp>",
        ):
            return on_line

        end_ln = stmt_spans.get(frame.f_lineno, frame.f_lineno)
        directives = [
            d for ln in src_lines[frame.f_lineno - 1 : end_ln] for d in parse(ln)
        ]

        if has(directives, STEPOVER):
            key = (current.path, current.line_number)
            if stepovers and stepovers[-1] == key:
                stepovers.pop()
            else:
                stepovers.append(key)

        if _under_stepover(stack, stepovers):
            return on_line

        # Bare @inspect on a non-def line: inspect all locals here and in any direct call.
        # Bare @inspect on a def line: already handled statically via inspect_functions.
        bare_inspect = has(directives, INSPECT) and not inspect_vars(directives)
        if bare_inspect:
            if src_lines[frame.f_lineno - 1].lstrip().startswith("def "):
                bare_inspect = (
                    False  # inside_inspect_fn handles this; don't dump all locals here
                )
            else:
                inspect_call_sites.add((current.path, current.line_number))

        called_from_inspect = (
            len(stack) >= 2
            and (stack[-2].path, stack[-2].line_number) in inspect_call_sites
        )
        inside_inspect_fn = frame.f_code.co_firstlineno in inspect_functions
        inside_called_fn = len(stack) >= 2

        should_inspect_all = (
            inspect_all
            or bare_inspect
            or called_from_inspect
            or inside_inspect_fn
            or inside_called_fn
        )

        step = Step(stack=stack, env={})
        if not steps or step.stack != steps[-1].stack:
            steps.append(step)
        step_index = len(steps) - 1

        def after_line(frame, event, arg):
            target = steps[step_index]

            frame_locals = frame.f_locals
            exprs = (
                list(frame_locals.keys())
                if should_inspect_all
                else inspect_vars(directives)
            )

            for expr in exprs:
                parts = expr.split(".", 1)
                var = parts[0]
                attr = parts[1] if len(parts) > 1 else None
                if var not in frame_locals:
                    continue
                val = frame_locals[var]
                if attr:
                    for a in attr.split("."):
                        if val is None:
                            break
                        val = getattr(val, a, None)
                target.env[expr] = serialize(val)

            for expr in clear_vars(directives):
                target.env[expr] = None

            target.renderings = flush()
            return on_line(frame, event, arg)

        return after_line

    # Load the module WITHOUT tracing — this only defines functions and runs imports.
    # Tracing starts when main() is called, so every step the viewer shows is inside a function.
    try:
        spec.loader.exec_module(module)  # type: ignore[union-attr]
    except Exception as exc:
        error = TraceError(
            exception_type=type(exc).__name__,
            message=str(exc),
            traceback=tb.format_exc(),
        )
        if error.exception_type != "SystemExit":
            print(f"\nModule load error: {error.exception_type}: {error.message}")

    if error is None:
        sys.settrace(on_line)
        try:
            if hasattr(module, "main"):
                module.main()
        except Exception as exc:
            error = TraceError(
                exception_type=type(exc).__name__,
                message=str(exc),
                traceback=tb.format_exc(),
            )
            if error.exception_type != "SystemExit":
                print(f"\nExecution error: {error.exception_type}: {error.message}")
        finally:
            sys.settrace(None)

    sys.modules.pop("_lecture", None)
    if _added_to_path and source_dir in sys.path:
        sys.path.remove(source_dir)

    files = {relativize(source.resolve()): src_text}
    hidden = _hidden_lines(files)
    src_hash = hashlib.sha256(src_text.encode()).hexdigest()

    metadata = TraceMetadata(
        title=source.stem,
        module=source.stem,
        built_at=datetime.now(timezone.utc).isoformat(),
        source_hash=src_hash,
        python_version=sys.version.split()[0],
        lectrace_version=__version__,
        error=error,
    )

    return Trace(
        version="2",
        metadata=metadata,
        files=files,
        hidden_line_numbers=hidden,
        steps=steps,
    )


def _under_stepover(stack: list[StackFrame], stepovers: list[tuple[str, int]]) -> bool:
    for ancestor in stack[:-1]:
        if any(
            s[0] == ancestor.path and s[1] == ancestor.line_number for s in stepovers
        ):
            return True
    return False


_RENDER_FNS = frozenset(
    {"text", "note", "plot", "image", "video", "link", "system_text"}
)


def _render_interior_lines(source_text: str) -> set[int]:
    """Return lines that are continuations of multi-line render function calls."""
    try:
        tree = ast.parse(source_text)
    except SyntaxError:
        return set()
    hidden: set[int] = set()
    for node in ast.walk(tree):
        if not isinstance(node, ast.Call):
            continue
        func = node.func
        if not (isinstance(func, ast.Name) and func.id in _RENDER_FNS):
            continue
        if node.end_lineno and node.end_lineno > node.lineno:
            hidden.update(range(node.lineno + 1, node.end_lineno + 1))
    return hidden


def _hidden_lines(files: dict[str, str]) -> dict[str, list[int]]:
    result = {}
    for path, contents in files.items():
        hidden: set[int] = set()
        for i, line in enumerate(contents.split("\n"), start=1):
            if has(parse(line), HIDE):
                hidden.add(i)
        hidden |= _render_interior_lines(contents)
        result[path] = sorted(hidden)
    return result
