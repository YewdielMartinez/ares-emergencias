"""Strategy: cuatro búsquedas intercambiables con un contrato común.

Las estrategias son sin estado. El costo de una arista es el costo de
entrada de la celda destino. El origen no tiene costo de entrada.
"""

from collections import deque
from dataclasses import dataclass
from heapq import heappop, heappush
from itertools import count
from time import perf_counter
from typing import Protocol

from ..domain.grid import Grid, Position


@dataclass
class Exploration:
    parents: dict[Position, Position | None]
    visited: list[Position]
    reached: bool


class SearchStrategy(Protocol):
    def explore(self, grid: Grid, start: Position, goal: Position) -> Exploration: ...


class BreadthFirstStrategy:
    depth_first = False

    def explore(self, grid: Grid, start: Position, goal: Position) -> Exploration:
        parents: dict[Position, Position | None] = {start: None}
        visited: list[Position] = []
        frontier = deque([start])
        while frontier:
            node = frontier.pop() if self.depth_first else frontier.popleft()
            visited.append(node)
            if node == goal:
                return Exploration(parents, visited, True)
            neighbors = grid.neighbors(node)
            if self.depth_first:
                neighbors.reverse()
            for neighbor in neighbors:
                if neighbor not in parents:
                    parents[neighbor] = node
                    frontier.append(neighbor)
        return Exploration(parents, visited, False)


class DepthFirstStrategy(BreadthFirstStrategy):
    depth_first = True


class DijkstraStrategy:
    def heuristic(self, position: Position, goal: Position) -> int:
        return 0

    def explore(self, grid: Grid, start: Position, goal: Position) -> Exploration:
        parents: dict[Position, Position | None] = {start: None}
        visited: list[Position] = []
        order = count()
        heap = [(self.heuristic(start, goal), next(order), 0, start)]
        distances = {start: 0}
        closed: set[Position] = set()
        while heap:
            _, _, cost, node = heappop(heap)
            if cost != distances.get(node) or node in closed:
                continue
            closed.add(node)
            visited.append(node)
            if node == goal:
                return Exploration(parents, visited, True)
            for neighbor in grid.neighbors(node):
                candidate = cost + grid.cost(neighbor)
                if candidate < distances.get(neighbor, float("inf")):
                    distances[neighbor] = candidate
                    parents[neighbor] = node
                    heappush(
                        heap,
                        (
                            candidate + self.heuristic(neighbor, goal),
                            next(order),
                            candidate,
                            neighbor,
                        ),
                    )
        return Exploration(parents, visited, False)


class AStarStrategy(DijkstraStrategy):
    def heuristic(self, position: Position, goal: Position) -> int:
        # Cuatro direcciones y pesos >= 1: Manhattan es consistente y admisible.
        return abs(position[0] - goal[0]) + abs(position[1] - goal[1])


STRATEGIES: dict[str, SearchStrategy] = {
    "BFS": BreadthFirstStrategy(),
    "DFS": DepthFirstStrategy(),
    "Dijkstra": DijkstraStrategy(),
    "A*": AStarStrategy(),
}
ALGORITHMS = tuple(STRATEGIES)


@dataclass
class SearchResult:
    algorithm: str
    path: list[Position]
    visited: list[Position]
    cost: int | None
    elapsed_ms: float

    def to_dict(self) -> dict:
        return {
            "algorithm": self.algorithm,
            "path": self.path,
            "visited": self.visited,
            "found": bool(self.path),
            "steps": max(0, len(self.path) - 1),
            "cost": self.cost,
            "expanded": len(self.visited),
            "elapsed_ms": round(self.elapsed_ms, 4),
        }


def search(grid: Grid, start: Position, goal: Position, algorithm: str = "A*") -> SearchResult:
    if algorithm not in STRATEGIES:
        raise ValueError(f"Algoritmo desconocido: {algorithm}")
    began = perf_counter()
    exploration = (
        STRATEGIES[algorithm].explore(grid, start, goal)
        if grid.valid(start) and grid.valid(goal)
        else Exploration({}, [], False)
    )
    path: list[Position] = []
    if exploration.reached:
        cursor: Position | None = goal
        while cursor is not None:
            path.append(cursor)
            cursor = exploration.parents[cursor]
        path.reverse()
    cost = sum(grid.cost(p) for p in path[1:]) if path else None
    return SearchResult(algorithm, path, exploration.visited, cost, (perf_counter() - began) * 1000)
