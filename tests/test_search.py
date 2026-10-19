import random
import unittest

from backend.algorithms.search import ALGORITHMS, search
from backend.domain.grid import Grid


class SearchTests(unittest.TestCase):
    def assert_valid_route(self, grid, result, start, goal):
        self.assertEqual(result.path[0], start)
        self.assertEqual(result.path[-1], goal)
        self.assertEqual(len(result.path), len(set(result.path)))
        for a, b in zip(result.path, result.path[1:]):
            self.assertIn(b, grid.neighbors(a))
        self.assertEqual(result.cost, sum(grid.cost(p) for p in result.path[1:]))

    def test_bfs_minimizes_steps_on_uniform_grid(self):
        grid = Grid(5, 5, {(x, y) for x in range(5) for y in range(5)})
        result = search(grid, (0, 0), (4, 4), "BFS")
        self.assertEqual(len(result.path) - 1, 8)
        self.assert_valid_route(grid, result, (0, 0), (4, 4))

    def test_weighted_detour_beats_fewer_steps(self):
        grid = Grid(
            5, 3, {(x, y) for x in range(5) for y in range(3)}, {(x, 1): 9 for x in range(1, 4)}
        )
        bfs = search(grid, (0, 1), (4, 1), "BFS")
        self.assertEqual(bfs.cost, 28)
        self.assertEqual(len(bfs.path) - 1, 4)
        for name in ("Dijkstra", "A*"):
            result = search(grid, (0, 1), (4, 1), name)
            self.assertEqual(result.cost, 6)
            self.assertEqual(len(result.path) - 1, 6)
            self.assert_valid_route(grid, result, (0, 1), (4, 1))

    def test_all_algorithms_respect_obstacles_and_report_no_route(self):
        grid = Grid(
            3, 3, {(x, y) for x in range(3) for y in range(3)}, blocked={(1, y) for y in range(3)}
        )
        for algorithm in ALGORITHMS:
            with self.subTest(algorithm=algorithm):
                result = search(grid, (0, 1), (2, 1), algorithm)
                self.assertEqual(result.path, [])
                self.assertIsNone(result.cost)
                self.assertFalse(result.to_dict()["found"])

    def test_same_origin_and_goal_has_zero_cost(self):
        grid = Grid(1, 1, {(0, 0)}, {(0, 0): 7})
        for algorithm in ALGORITHMS:
            result = search(grid, (0, 0), (0, 0), algorithm)
            self.assertEqual(result.path, [(0, 0)])
            self.assertEqual(result.cost, 0)

    def test_invalid_endpoint_and_algorithm(self):
        grid = Grid(1, 1, {(0, 0)})
        self.assertFalse(search(grid, (-1, 0), (0, 0)).path)
        with self.assertRaises(ValueError):
            search(grid, (0, 0), (0, 0), "unknown")

    def test_dfs_returns_valid_path_without_cycles(self):
        grid = Grid(5, 5, {(x, y) for x in range(5) for y in range(5)}, blocked={(2, 1), (2, 2)})
        result = search(grid, (0, 0), (4, 4), "DFS")
        self.assert_valid_route(grid, result, (0, 0), (4, 4))
        self.assertEqual(len(result.visited), len(set(result.visited)))

    def test_optimal_searches_against_independent_bellman_ford(self):
        for seed in range(24):
            with self.subTest(seed=seed):
                rng = random.Random(seed)
                roads = {(x, y) for x in range(6) for y in range(6)}
                blocked = {
                    p for p in sorted(roads) if p not in {(0, 0), (5, 5)} and rng.random() < 0.18
                }
                grid = Grid(6, 6, roads, {p: rng.randint(1, 8) for p in sorted(roads)}, blocked)
                distance = {(0, 0): 0}
                for _ in range(len(roads)):
                    changed = False
                    for p in sorted(roads - blocked):
                        if p not in distance:
                            continue
                        for neighbor in grid.neighbors(p):
                            candidate = distance[p] + grid.cost(neighbor)
                            if candidate < distance.get(neighbor, float("inf")):
                                distance[neighbor] = candidate
                                changed = True
                    if not changed:
                        break
                expected = distance.get((5, 5))
                for name in ("Dijkstra", "A*"):
                    result = search(grid, (0, 0), (5, 5), name)
                    self.assertEqual(result.cost, expected)
                    if expected is not None:
                        self.assert_valid_route(grid, result, (0, 0), (5, 5))
