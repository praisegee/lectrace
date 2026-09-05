from __future__ import annotations

import io
import tokenize
from dataclasses import dataclass

INSPECT = "@inspect"
CLEAR = "@clear"
STEPOVER = "@stepover"
HIDE = "@hide"
INVISIBLE = "@invisible"

_KNOWN = {INSPECT, CLEAR, STEPOVER, HIDE, INVISIBLE}


@dataclass(frozen=True)
class Directive:
    name: str
    args: list[str]


def _comment(line: str) -> str:
    """The line's comment text, or "" if it has none.

    Tokenizing avoids treating a `#` inside a string literal as a comment,
    which would turn `msg = "use #@stepover"` into a live directive.
    """
    if "#" not in line:
        return ""
    try:
        for token in tokenize.generate_tokens(io.StringIO(line).readline):
            if token.type == tokenize.COMMENT:
                return token.string[1:]
    except (tokenize.TokenError, IndentationError, SyntaxError):
        # Continuation lines and fragments don't tokenize on their own; fall
        # back to the naive split rather than dropping the directive.
        return line.split("#", 1)[1]
    return ""


def parse(line: str) -> list[Directive]:
    comment = _comment(line)
    if not comment:
        return []
    tokens = comment.split()
    directives: list[Directive] = []
    for token in tokens:
        if token.startswith("@"):
            if token not in _KNOWN:
                print(f"Warning: unknown directive {token!r}")
            directives.append(Directive(name=token, args=[]))
        elif directives:
            directives[-1].args.append(token)
    return directives


def inspect_vars(directives: list[Directive]) -> list[str]:
    return [arg for d in directives if d.name == INSPECT for arg in d.args]


def clear_vars(directives: list[Directive]) -> list[str]:
    return [arg for d in directives if d.name == CLEAR for arg in d.args]


def has(directives: list[Directive], name: str) -> bool:
    return any(d.name == name for d in directives)
