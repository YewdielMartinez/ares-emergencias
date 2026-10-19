"""Grafo urbano independiente de frameworks."""

from dataclasses import dataclass, field

Position = tuple[int, int]


@dataclass
class Grid:
    width: int
    height: int
    roads: set[Position]
    costs: dict[Position, int] = field(default_factory=dict)
    blocked: set[Position] = field(default_factory=set)

    def valid(self, p: Position) -> bool:
        return p in self.roads and p not in self.blocked

    def neighbors(self, p: Position) -> list[Position]:
        x, y = p
        return [n for n in ((x + 1, y), (x, y + 1), (x - 1, y), (x, y - 1)) if self.valid(n)]

    def cost(self, p: Position) -> int:
        return self.costs.get(p, 1)
