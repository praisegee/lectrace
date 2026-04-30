from __future__ import annotations

import re
from dataclasses import dataclass


@dataclass(frozen=True)
class Reference:
    title: str | None = None
    authors: list[str] | None = None
    organization: str | None = None
    date: str | None = None
    url: str | None = None
    description: str | None = None
    notes: str | None = None

    @property
    def label(self) -> str:
        year = self.date[:4] if self.date else "?"
        if self.authors:
            first = self.authors[0]
            if re.search(r"\bTeam\b", first):
                name = first
            else:
                name = first.split()[-1]
                if len(self.authors) > 1:
                    name += "+"
            return f"[{name} {year}]"
        if self.title:
            return self.title
        if self.url:
            return self.url
        return "?"
