"""Composition root: ensambla dependencias, API y frontend estático."""

from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .api.dependencies import SimulationContainer
from .api.routes import router
from .application.simulation import Simulation


def create_app(simulation: Simulation | None = None) -> FastAPI:
    app = FastAPI(
        title="ARES · Gestión de emergencias",
        version="1.0.0",
        description="Simulación académica. Cada tick representa 15 segundos simulados.",
    )
    app.state.container = SimulationContainer(
        simulation if simulation is not None else Simulation()
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
        allow_methods=["GET", "POST"],
        allow_headers=["Content-Type"],
    )
    app.include_router(router)
    dist = Path(__file__).resolve().parents[1] / "frontend" / "dist"
    if dist.exists():
        app.mount("/", StaticFiles(directory=dist, html=True), name="frontend")
    return app


app = create_app()
