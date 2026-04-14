from __future__ import annotations
from dataclasses import dataclass

INSPECT = "@inspect"
CLEAR = "@clear"
STEPOVER = "@stepover"
HIDE = "@hide"

_KNOWN = {INSPECT, CLEAR, STEPOVER, HIDE}


@dataclass(frozen=True)
class Directive:
    name: str
    args: list[str]


def parse(line: str) -> list[Directive]:
    if "#" not in line:
        return []
    tokens = line.split("#", 1)[1].split()
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
