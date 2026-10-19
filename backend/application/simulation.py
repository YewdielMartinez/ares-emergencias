"""Casos de uso de la simulación multiagente."""

from dataclasses import asdict
from random import Random

from ..algorithms.search import ALGORITHMS, search
from ..domain.grid import Position
from ..domain.models import Agent, Incident
from ..infrastructure.scenarios import (
    KINDS,
    SCENARIOS,
    STREET_X,
    STREET_Y,
    TICK_SECONDS,
    create_grid,
)
from .coordinator import Coordinator


class Simulation:
    def __init__(self, scenario: str = "urban", seed: int = 42):
        if scenario not in SCENARIOS:
            raise ValueError("Escenario desconocido")
        self.scenario = scenario
        self.seed = seed
        self.tick = 0
        self.algorithm = "A*"
        self.revision = 0
        self.events: list[dict] = []
        self.random = Random(seed)
        self.grid = create_grid(scenario)
        self.coordinator = Coordinator()
        self.agents = [
            Agent("AMB-01", "Ambulancia 01", "medical", (2, 7), (2, 7)),
            Agent("AMB-02", "Ambulancia 02", "medical", (22, 17), (22, 17)),
            Agent("BOM-01", "Bomberos 01", "fire", (7, 17), (7, 17)),
            Agent("BOM-02", "Bomberos 02", "fire", (27, 2), (27, 2)),
            Agent("POL-01", "Patrulla 01", "security", (12, 2), (12, 2)),
            Agent("POL-02", "Patrulla 02", "security", (27, 20), (27, 20)),
        ]
        self.incidents: list[Incident] = [
            Incident("EM-001", "Incendio en zona comercial", "fire", (17, 7), 3, 0),
            Incident("EM-002", "Atención médica urgente", "medical", (12, 12), 3, 0),
            Incident("EM-003", "Accidente en Av. Central", "medical", (7, 2), 2, 0),
            Incident("EM-004", "Incidente en vía pública", "security", (22, 12), 1, 0),
        ]
        self.next_incident = 5
        self.log("system", f"Entorno preparado: {SCENARIOS[scenario]}. 6 unidades disponibles.")

    def log(self, category: str, message: str):
        self.events.insert(
            0,
            {
                "id": len(self.events) + 1,
                "tick": self.tick,
                "category": category,
                "message": message,
            },
        )

    def get_incident(self, incident_id: str) -> Incident:
        for incident in self.incidents:
            if incident.id == incident_id:
                return incident
        raise ValueError("La emergencia no existe")

    def compatible(self, agent: Agent, incident: Incident) -> bool:
        return agent.kind == incident.kind

    def dispatch(self):
        assignments = self.coordinator.assign(
            self.grid, self.agents, self.incidents, self.tick, self.algorithm
        )
        for assignment in assignments:
            agent = next(a for a in self.agents if a.id == assignment.agent_id)
            incident = self.get_incident(assignment.incident_id)
            agent.route = assignment.path[1:]
            agent.status = "en_route"
            agent.edge_remaining = 0
            agent.incident_id = incident.id
            incident.agent_id = agent.id
            incident.status = "assigned"
            self.log(
                "dispatch",
                f"{agent.id} asignada a {incident.id} · {assignment.cost} u de costo · {self.algorithm}.",
            )
        return len(assignments)

    def step(self, steps: int = 1):
        for _ in range(steps):
            self.dispatch()
            self.tick += 1
            for agent in self.agents:
                if agent.status == "en_route":
                    if agent.route:
                        if agent.edge_remaining == 0:
                            agent.edge_remaining = self.grid.cost(agent.route[0])
                        agent.edge_remaining -= 1
                        if agent.edge_remaining == 0:
                            agent.position = agent.route.pop(0)
                    if not agent.route:
                        incident = self.get_incident(agent.incident_id)
                        incident.status = "attending"
                        incident.arrival_tick = self.tick
                        agent.status = "attending"
                        agent.service_remaining = incident.severity + 2
                        self.log("arrival", f"{agent.id} llegó a {incident.id}. Atención en curso.")
                elif agent.status == "attending":
                    agent.service_remaining -= 1
                    if agent.service_remaining <= 0:
                        incident = self.get_incident(agent.incident_id)
                        incident.status = "resolved"
                        incident.resolved_tick = self.tick
                        agent.status = "available"
                        agent.incident_id = None
                        agent.completed += 1
                        self.log(
                            "resolved", f"{incident.id} resuelta por {agent.id}. Unidad disponible."
                        )
            self.revision += 1

    def add_incident(self, kind: str, severity: int, position: Position | None, title: str = ""):
        active_positions = {i.position for i in self.incidents if i.status != "resolved"}
        if position is None:
            choices = sorted(self.grid.roads - self.grid.blocked - active_positions)
            if not choices:
                raise ValueError("No hay posiciones disponibles")
            position = self.random.choice(choices)
        if not self.grid.valid(position):
            raise ValueError("Selecciona una calle transitable del mapa")
        if position in active_positions:
            raise ValueError("Ya existe una emergencia activa en esa ubicación")
        incident = Incident(
            f"EM-{self.next_incident:03}",
            title.strip() or KINDS[kind],
            kind,
            position,
            severity,
            self.tick,
        )
        self.next_incident += 1
        self.incidents.append(incident)
        self.log("incident", f"Nueva emergencia {incident.id}: {incident.title}.")
        self.revision += 1
        return incident

    def replan(self):
        for agent in self.agents:
            if agent.status != "en_route":
                continue
            incident = self.get_incident(agent.incident_id)
            result = search(self.grid, agent.position, incident.position, self.algorithm)
            agent.edge_remaining = 0
            if result.path:
                agent.route = result.path[1:]
                self.log("route", f"{agent.id} recalculó su ruta con {self.algorithm}.")
            else:
                agent.route = []
                agent.status = "available"
                agent.incident_id = None
                incident.status = "pending"
                incident.agent_id = None
                self.log("warning", f"Sin ruta para {agent.id}. {incident.id} vuelve a la cola.")

    def toggle_obstacle(self, position: Position):
        if position not in self.grid.roads:
            raise ValueError("Los obstáculos se colocan sobre las calles")
        protected = {a.position for a in self.agents} | {
            i.position for i in self.incidents if i.status != "resolved"
        }
        if position in protected:
            raise ValueError("No se puede bloquear una celda ocupada por una unidad o emergencia")
        if position in self.grid.blocked:
            self.grid.blocked.remove(position)
            message = "Vía habilitada"
        else:
            self.grid.blocked.add(position)
            message = "Vía bloqueada"
        self.log("environment", f"{message} en ({position[0]}, {position[1]}).")
        self.replan()
        self.revision += 1

    def set_algorithm(self, algorithm: str):
        if algorithm not in ALGORITHMS:
            raise ValueError("Algoritmo desconocido")
        self.algorithm = algorithm
        self.log("system", f"Algoritmo de planificación cambiado a {algorithm}.")
        self.replan()
        self.revision += 1

    def compare(self, incident_id: str | None = None, agent_id: str | None = None):
        incident = (
            self.get_incident(incident_id)
            if incident_id
            else next((i for i in self.incidents if i.status != "resolved"), self.incidents[0])
        )
        if agent_id:
            agent = next((a for a in self.agents if a.id == agent_id), None)
            if agent is None:
                raise ValueError("La unidad no existe")
        else:
            # Origen común estable (base) para poder repetir la comparación durante la ejecución.
            agent = next(a for a in self.agents if self.compatible(a, incident))
        results = [
            search(self.grid, agent.base, incident.position, name).to_dict() for name in ALGORITHMS
        ]
        return {
            "agent_id": agent.id,
            "incident_id": incident.id,
            "start": agent.base,
            "goal": incident.position,
            "revision": self.revision,
            "results": results,
        }

    def state(self):
        resolved = [i for i in self.incidents if i.status == "resolved"]
        arrived = [i for i in self.incidents if i.arrival_tick is not None]
        response = (
            sum((i.arrival_tick - i.created_tick) * TICK_SECONDS for i in arrived) / len(arrived)
            if arrived
            else None
        )
        return {
            "scenario": self.scenario,
            "scenario_name": SCENARIOS[self.scenario],
            "seed": self.seed,
            "tick": self.tick,
            "elapsed_seconds": self.tick * TICK_SECONDS,
            "algorithm": self.algorithm,
            "revision": self.revision,
            "grid": {
                "width": self.grid.width,
                "height": self.grid.height,
                "roads": sorted(self.grid.roads),
                "blocked": sorted(self.grid.blocked),
                "costs": [{"position": p, "cost": c} for p, c in sorted(self.grid.costs.items())],
                "street_x": STREET_X,
                "street_y": STREET_Y,
            },
            "agents": [asdict(a) for a in self.agents],
            "incidents": [asdict(i) for i in self.incidents],
            "events": self.events[:60],
            "metrics": {
                "active": len(self.incidents) - len(resolved),
                "pending": sum(i.status == "pending" for i in self.incidents),
                "available": sum(a.status == "available" for a in self.agents),
                "total_agents": len(self.agents),
                "resolved": len(resolved),
                "average_response_seconds": round(response, 1) if response is not None else None,
            },
        }
