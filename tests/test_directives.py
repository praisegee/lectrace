import pytest
from lectrace.directives import parse, inspect_vars, clear_vars, has, INSPECT, CLEAR, HIDE, STEPOVER


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


def test_hide():
    directives = parse("secret = 1  # @hide")
    assert has(directives, HIDE)


def test_comment_with_text_before_directive():
    directives = parse("x = 1  # some comment @inspect x")
    assert inspect_vars(directives) == ["x"]


def test_no_directive_in_comment():
    directives = parse("x = 1  # just a regular comment")
    assert directives == []


def test_unknown_directive_warns(capsys):
    parse("x = 1  # @unknown x")
    out = capsys.readouterr().out
    assert "unknown" in out.lower() or "Warning" in out
