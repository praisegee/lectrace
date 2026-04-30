import tempfile
import textwrap
from pathlib import Path

from lectrace.directives import (
    CLEAR,
    HIDE,
    INSPECT,
    STEPOVER,
    clear_vars,
    has,
    inspect_vars,
    parse,
)
from lectrace.tracer import execute


def _write(content: str) -> Path:
    tmp = tempfile.NamedTemporaryFile(suffix=".py", delete=False, mode="w")
    tmp.write(textwrap.dedent(content))
    tmp.close()
    return Path(tmp.name)


def test_no_comment():
    assert parse("x = 1") == []


def test_inspect_single():
    directives = parse("x = 1  # @inspect x")
    assert len(directives) == 1
    assert directives[0].name == INSPECT
    assert directives[0].args == ["x"]


def test_inspect_multiple_vars():
    directives = parse("x, y = 1, 2  # @inspect x y")
    assert inspect_vars(directives) == ["x", "y"]


def test_multiple_directives():
    directives = parse("x = f()  # @inspect x @stepover")
    assert len(directives) == 2
    assert has(directives, STEPOVER)
    assert inspect_vars(directives) == ["x"]


def test_clear():
    directives = parse("pass  # @clear x y")
    assert clear_vars(directives) == ["x", "y"]
    assert has(directives, CLEAR)


def test_hide():
    directives = parse("secret = 1  # @hide")
    assert has(directives, HIDE)


def test_comment_with_text_before_directive():
    directives = parse("x = 1  # some comment @inspect x")
    assert inspect_vars(directives) == ["x"]
    assert has(directives, INSPECT)


def test_no_directive_in_comment():
    directives = parse("x = 1  # just a regular comment")
    assert directives == []


def test_unknown_directive_warns(capsys):
    parse("x = 1  # @unknown x")
    out = capsys.readouterr().out
    assert "unknown" in out.lower() or "Warning" in out


def test_bare_inspect_has_no_args():
    directives = parse("x = 1  # @inspect")
    assert len(directives) == 1
    assert directives[0].name == INSPECT
    assert directives[0].args == []


def test_clear_removes_variable_from_env():
    path = _write("""
        def main():
            x = 42  # @inspect x
            y = 1   # @clear x
    """)
    trace = execute(path)
    steps_with_x = [s for s in trace.steps if "x" in s.env]
    assert steps_with_x
    last = steps_with_x[-1]
    assert last.env["x"] is None
