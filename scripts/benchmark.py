"""Exporta evidencia repetible sin iniciar la API ni React.

Uso desde la raíz: python -m scripts.benchmark
"""

import csv
from pathlib import Path
from statistics import median

from backend.algorithms.search import ALGORITHMS, search
from backend.application.simulation import Simulation
from backend.infrastructure.scenarios import SCENARIOS


def main():
    output = Path(__file__).resolve().parents[1] / "docs" / "comparacion.csv"
    rows = []
    for scenario in SCENARIOS:
        simulation = Simulation(scenario, seed=42)
        for incident in simulation.incidents:
            agent = next(a for a in simulation.agents if a.kind == incident.kind)
            for algorithm in ALGORITHMS:
                # Calentamiento y mediana de 25 repeticiones del mismo problema.
                search(simulation.grid, agent.base, incident.position, algorithm)
                samples = [
                    search(simulation.grid, agent.base, incident.position, algorithm)
                    for _ in range(25)
                ]
                result = samples[0]
                rows.append(
                    {
                        "escenario": scenario,
                        "semilla": 42,
                        "emergencia": incident.id,
                        "origen": str(agent.base),
                        "destino": str(incident.position),
                        "algoritmo": algorithm,
                        "encontrada": bool(result.path),
                        "pasos": len(result.path) - 1 if result.path else "",
                        "costo": result.cost,
                        "nodos_expandidos": len(result.visited),
                        "mediana_ms_25_repeticiones": round(
                            median(r.elapsed_ms for r in samples), 4
                        ),
                    }
                )
    output.parent.mkdir(exist_ok=True)
    with output.open("w", newline="", encoding="utf-8-sig") as file:
        writer = csv.DictWriter(file, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)
    print(f"{len(rows)} comparaciones exportadas a {output}")


if __name__ == "__main__":
    main()
