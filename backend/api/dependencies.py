"""Contenedor por aplicación: las pruebas no comparten estado global."""

from dataclasses import dataclass, field
from threading import RLock
from typing import Annotated

from fastapi import Depends, Request

from ..application.simulation import Simulation


@dataclass
class SimulationContainer:
    simulation: Simulation = field(default_factory=Simulation)
    lock: RLock = field(default_factory=RLock)


def get_container(request: Request) -> SimulationContainer:
    return request.app.state.container


Container = Annotated[SimulationContainer, Depends(get_container)]
