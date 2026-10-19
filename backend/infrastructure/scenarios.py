"""Factoría de escenarios reproducibles."""

from ..domain.grid import Grid

STREET_X = (2, 7, 12, 17, 22, 27)
STREET_Y = (2, 7, 12, 17, 20)
SCENARIOS = {"urban": "Centro urbano", "traffic": "Hora pico", "blocked": "Vías bloqueadas"}
KINDS = {"medical": "Emergencia médica", "fire": "Incendio", "security": "Seguridad"}
TICK_SECONDS = 15


def create_grid(scenario: str) -> Grid:
    roads = {(x, y) for x in range(2, 28) for y in range(2, 21) if x in STREET_X or y in STREET_Y}
    grid = Grid(30, 23, roads)
    # Tráfico base reproducible; el desvío de costo mínimo difiere del de menos pasos.
    grid.costs = {(x, 7): 4 for x in range(8, 17)}
    grid.costs.update({(22, y): 3 for y in range(8, 17)})
    if scenario == "traffic":
        grid.costs.update({(x, 12): 5 for x in range(3, 27)})
        grid.costs.update({(12, y): 4 for y in range(3, 20)})
    if scenario == "blocked":
        grid.blocked.update({(10, 7), (17, 10), (22, 15), (8, 17)})
    return grid
