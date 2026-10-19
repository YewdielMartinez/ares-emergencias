import unittest

from backend.application.coordinator import Coordinator
from backend.application.simulation import Simulation
from backend.domain.grid import Grid
from backend.domain.models import Agent, Incident
from backend.infrastructure.scenarios import SCENARIOS


class SimulationTests(unittest.TestCase):
    def test_initial_state(self):
        s = Simulation()
        self.assertEqual(s.state()["metrics"]["active"], 4)
        self.assertEqual(s.state()["metrics"]["available"], 6)
        self.assertIsNone(s.state()["metrics"]["average_response_seconds"])

    def test_assignments_are_compatible_and_unique(self):
        s = Simulation()
        self.assertEqual(s.dispatch(), 4)
        self.assertEqual(s.dispatch(), 0)
        self.assertEqual(len({i.agent_id for i in s.incidents}), 4)
        for i in s.incidents:
            agent = next(a for a in s.agents if a.id == i.agent_id)
            self.assertEqual(agent.kind, i.kind)
            self.assertEqual(agent.incident_id, i.id)

    def test_priority_and_aging_without_mutating_candidates(self):
        grid = Grid(3, 1, {(0, 0), (1, 0), (2, 0)})
        agent = Agent("A1", "A1", "medical", (0, 0), (0, 0))
        old = Incident("old", "Old", "medical", (2, 0), 1, 0)
        new = Incident("new", "New", "medical", (1, 0), 3, 0)
        coordinator = Coordinator()
        self.assertEqual(
            coordinator.assign(grid, [agent], [old, new], 0, "A*")[0].incident_id, "new"
        )
        new.created_tick = 24
        self.assertEqual(
            coordinator.assign(grid, [agent], [old, new], 24, "A*")[0].incident_id, "old"
        )
        self.assertEqual(agent.status, "available")
        self.assertEqual(old.status, "pending")

    def test_coordinator_selects_minimum_cost_compatible_agent(self):
        grid = Grid(5, 1, {(x, 0) for x in range(5)})
        agents = [
            Agent("far", "Far", "medical", (0, 0), (0, 0)),
            Agent("near", "Near", "medical", (3, 0), (3, 0)),
        ]
        incident = Incident("I1", "Test", "medical", (4, 0), 3, 0)
        self.assertEqual(
            Coordinator().assign(grid, agents, [incident], 0, "Dijkstra")[0].agent_id, "near"
        )

    def test_every_scenario_finishes_with_every_agent_available(self):
        for scenario in SCENARIOS:
            with self.subTest(scenario=scenario):
                s = Simulation(scenario)
                s.step(500)
                metrics = s.state()["metrics"]
                self.assertEqual(metrics["resolved"], 4)
                self.assertEqual(metrics["active"], 0)
                self.assertEqual(metrics["available"], 6)

    def test_weighted_movement_and_service_time(self):
        s = Simulation()
        s.grid = Grid(3, 1, {(0, 0), (1, 0), (2, 0)}, {(1, 0): 2, (2, 0): 3})
        s.agents = [Agent("A1", "A1", "medical", (0, 0), (0, 0))]
        s.incidents = [Incident("I1", "Test", "medical", (2, 0), 3, 0)]
        s.step(4)
        self.assertIsNone(s.incidents[0].arrival_tick)
        s.step()
        self.assertEqual(s.incidents[0].arrival_tick, 5)
        self.assertEqual(s.agents[0].status, "attending")
        s.step(5)
        self.assertEqual(s.incidents[0].resolved_tick, 10)
        self.assertEqual(s.agents[0].status, "available")

    def test_blocking_replans_and_protects_occupied_cells(self):
        s = Simulation()
        s.dispatch()
        agent = next(a for a in s.agents if a.route)
        position = agent.route[2]
        s.toggle_obstacle(position)
        self.assertIn(position, s.grid.blocked)
        self.assertTrue(all(position not in a.route for a in s.agents))
        with self.assertRaises(ValueError):
            s.toggle_obstacle(s.agents[0].position)
        s.toggle_obstacle(position)
        self.assertNotIn(position, s.grid.blocked)
        s.step(300)
        self.assertEqual(s.state()["metrics"]["resolved"], 4)

    def test_unreachable_incident_returns_to_queue(self):
        s = Simulation()
        s.dispatch()
        i = s.incidents[0]
        s.grid.blocked.update(s.grid.neighbors(i.position))
        s.replan()
        self.assertEqual(i.status, "pending")
        self.assertIsNone(i.agent_id)
        self.assertFalse(any(a.incident_id == i.id for a in s.agents))

    def test_seed_and_comparison_are_reproducible(self):
        a, b = Simulation(seed=42), Simulation(seed=42)
        self.assertEqual(
            a.add_incident("medical", 2, None).position, b.add_incident("medical", 2, None).position
        )
        for x, y in zip(a.compare()["results"], b.compare()["results"]):
            for key in ("path", "visited", "cost", "steps", "expanded"):
                self.assertEqual(x[key], y[key])

    def test_invalid_or_duplicate_incident_is_rejected(self):
        s = Simulation()
        with self.assertRaises(ValueError):
            s.add_incident("fire", 3, (0, 0))
        with self.assertRaises(ValueError):
            s.add_incident("fire", 3, s.incidents[0].position)
