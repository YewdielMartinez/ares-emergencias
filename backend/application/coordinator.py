"""Política de asignación: produce decisiones sin modificar las entidades."""

from dataclasses import dataclass

from ..algorithms.search import search
from ..domain.grid import Grid, Position
from ..domain.models import Agent, Incident


@dataclass(frozen=True)
class Assignment:
    agent_id: str
    incident_id: str
    path: list[Position]
    cost: int


class Coordinator:
    """Prioridad con envejecimiento y menor costo compatible.

    Política voraz determinista; no optimiza globalmente todas las
    combinaciones de unidades e incidentes.
    """

    def assign(
        self, grid: Grid, agents: list[Agent], incidents: list[Incident], tick: int, algorithm: str
    ) -> list[Assignment]:
        pending = sorted(
            (i for i in incidents if i.status == "pending"),
            key=lambda i: (-(i.severity + (tick - i.created_tick) // 8), i.created_tick, i.id),
        )
        reserved: set[str] = set()
        assignments: list[Assignment] = []
        for incident in pending:
            candidates = []
            for agent in agents:
                if (
                    agent.status != "available"
                    or agent.kind != incident.kind
                    or agent.id in reserved
                ):
                    continue
                result = search(grid, agent.position, incident.position, algorithm)
                if result.path:
                    candidates.append((result.cost, len(result.path), agent.id, result))
            if candidates:
                cost, _, agent_id, result = min(candidates, key=lambda c: c[:3])
                assignments.append(Assignment(agent_id, incident.id, result.path, cost))
                reserved.add(agent_id)
        return assignments
