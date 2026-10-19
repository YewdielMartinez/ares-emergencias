"""DTO y validación HTTP."""

from typing import Literal

from pydantic import BaseModel, Field

Algorithm = Literal["BFS", "DFS", "Dijkstra", "A*"]


class ResetRequest(BaseModel):
    scenario: Literal["urban", "traffic", "blocked"] = "urban"
    seed: int = 42


class StepRequest(BaseModel):
    steps: int = Field(default=1, ge=1, le=100)


class AlgorithmRequest(BaseModel):
    algorithm: Algorithm


class IncidentRequest(BaseModel):
    kind: Literal["medical", "fire", "security"]
    severity: int = Field(ge=1, le=3)
    position: tuple[int, int] | None = None
    title: str = Field(default="", max_length=100)


class ObstacleRequest(BaseModel):
    position: tuple[int, int]
