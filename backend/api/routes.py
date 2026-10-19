"""Controladores HTTP: delegan a los casos de uso."""

from fastapi import APIRouter, HTTPException

from ..application.simulation import Simulation
from .dependencies import Container
from .schemas import AlgorithmRequest, IncidentRequest, ObstacleRequest, ResetRequest, StepRequest

router = APIRouter(prefix="/api")


@router.get("/health")
def health():
    return {"status": "ok", "service": "ARES", "version": "1.0.0"}


@router.get("/state")
def state(container: Container):
    with container.lock:
        return container.simulation.state()


@router.post("/reset")
def reset(body: ResetRequest, container: Container):
    with container.lock:
        container.simulation = Simulation(body.scenario, body.seed)
        return container.simulation.state()


@router.post("/step")
def step(body: StepRequest, container: Container):
    with container.lock:
        container.simulation.step(body.steps)
        return container.simulation.state()


@router.post("/dispatch")
def dispatch(container: Container):
    with container.lock:
        container.simulation.dispatch()
        container.simulation.revision += 1
        return container.simulation.state()


@router.post("/algorithm")
def algorithm(body: AlgorithmRequest, container: Container):
    with container.lock:
        container.simulation.set_algorithm(body.algorithm)
        return container.simulation.state()


@router.post("/incidents")
def add_incident(body: IncidentRequest, container: Container):
    with container.lock:
        try:
            container.simulation.add_incident(body.kind, body.severity, body.position, body.title)
            return container.simulation.state()
        except ValueError as exc:
            raise HTTPException(400, str(exc)) from exc


@router.post("/obstacles")
def obstacle(body: ObstacleRequest, container: Container):
    with container.lock:
        try:
            container.simulation.toggle_obstacle(body.position)
            return container.simulation.state()
        except ValueError as exc:
            raise HTTPException(400, str(exc)) from exc


@router.get("/compare")
def compare(container: Container, incident_id: str | None = None, agent_id: str | None = None):
    with container.lock:
        try:
            return container.simulation.compare(incident_id, agent_id)
        except ValueError as exc:
            raise HTTPException(404, str(exc)) from exc
