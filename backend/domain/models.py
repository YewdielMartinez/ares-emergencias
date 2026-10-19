"""Entidades del dominio."""

from dataclasses import dataclass, field

from .grid import Position


@dataclass
class Agent:
    id: str
    name: str
    kind: str
    position: Position
    base: Position
    status: str = "available"
    incident_id: str | None = None
    route: list[Position] = field(default_factory=list)
    edge_remaining: int = 0
    service_remaining: int = 0
    completed: int = 0


@dataclass
class Incident:
    id: str
    title: str
    kind: str
    position: Position
    severity: int
    created_tick: int
    status: str = "pending"
    agent_id: str | None = None
    arrival_tick: int | None = None
    resolved_tick: int | None = None
