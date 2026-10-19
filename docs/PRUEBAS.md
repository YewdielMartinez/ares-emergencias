# Pruebas y resultados

Verificación realizada el **19 de octubre de 2026** en Windows, Python 3.11 y Node 24. Las pruebas se ejecutaron contra el código entregado y el frontend compilado.

## Motor y API: 23 pruebas aprobadas

Comando desde la raíz:

```powershell
.\.venv\Scripts\python.exe -m unittest discover -s tests -v
```

| Archivo | Cantidad | Evidencia |
|---|---:|---|
| `tests/test_search.py` | 7 | Camino mínimo BFS, desvío ponderado óptimo, obstáculos, falta de ruta, origen=destino, entradas inválidas y DFS sin ciclos |
| `tests/test_simulation.py` | 10 | Estado inicial, compatibilidad, exclusión de misiones duplicadas, prioridad/envejecimiento, menor costo, resolución de tres escenarios, movimiento ponderado, recálculo, cola sin ruta y semilla reproducible |
| `tests/test_api.py` | 6 | Salud/OpenAPI, aplicaciones aisladas, paso/reinicio/algoritmo, límites de entrada, mutaciones/errores y endpoints iguales en comparaciones |

La prueba de optimalidad contiene **24 subcasos aleatorios reproducibles**, con mapas ponderados y bloqueos. Contrasta Dijkstra y A* contra una implementación independiente de relajación Bellman-Ford y valida la adyacencia y el costo de cada camino encontrado.

El caso de tráfico verifica un problema pequeño cuyo resultado se conoce: BFS produce cuatro pasos y costo 28; Dijkstra y A* producen seis pasos y costo 6. La prueba de movimiento confirma que entrar en celdas de costos 2 y 3 requiere cinco ticks y que el servicio crítico termina cinco ticks después.

## Navegador: 14 pruebas aprobadas

Desde `frontend`:

```powershell
npx playwright install chromium
npm run test:e2e
```

| Caso | Verificación |
|---|---|
| Operaciones | Mapa y conteos visibles, detalles plegados, comparación fuera de la pantalla principal y avance de un tick |
| Reloj | Inicio, pausa, 4× y habilitación del paso manual |
| Emergencias | Registro en tres pasos y asignación a bomberos de un incidente de incendio |
| Mapa | Bloqueo mediante clic y exclusión de esa celda de todas las rutas |
| Navegación | Menú de emergencia, tabla de cuatro algoritmos, estrategia Dijkstra, CSV, detalles de agentes y guía PEAS |
| Escenarios | Reinicio con bloqueos, resolución completa y consulta de cuatro resueltas |
| Móvil | Viewport 390 × 844, menú de emergencias, comparación sin desbordamiento de página, barra Nav y tema oscuro |
| Diálogo Motion Kit | Título accesible, foco inicial, Escape y retorno al botón de origen |
| Movimiento reducido | Registro de emergencia y contador correcto con `prefers-reduced-motion: reduce` |
| Menu nativo | Selección del planificador con Home/Enter y retorno del foco al disparador |
| Menu de emergencia | Componente `dialog.mk-menu`, selección con Home/flecha/Enter, tabla de EM-002, retorno de foco y ausencia de select nativo |
| Detalles progresivos | Métricas ocultas al inicio, apertura con teclado, datos actualizados tras un tick y explicación de los cuatro algoritmos |
| Steps | Validación del primer campo, revisión final y preservación de valores al regresar |
| ThemePicker y Nav | Seis paletas, selección de azul, estilo Tasks y persistencia tras recargar |

Todas las pruebas de navegador comprueban que no se produzcan errores JavaScript de página. El dashboard se capturó a 1440 × 1080; la captura completa puede ser más alta por el contenido vertical.

## Compilación y estilo

`npm run build` realiza comprobación TypeScript estricta y genera el bundle Vite. `npm run format` aplica Prettier. La validación y formato Python se realizan con Ruff, instalado mediante `requirements-dev.txt`.

## Experimento de algoritmos

`python -m scripts.benchmark` genera 48 filas: 3 escenarios × 4 incidentes × 4 algoritmos. Cada fila contiene el resultado determinista y la mediana de 25 mediciones después de calentamiento. La evidencia está en `comparacion.csv`.

Para reproducir caminos y costos, conservar semilla, escenario, origen, destino, costos y obstáculos. Los tiempos cambian con hardware, carga del sistema y versión de Python; no deben compararse como si fueran constantes ni utilizarse para afirmar superioridad universal.

## Límites de la evidencia

Las pruebas cubren el simulador local, sin despliegue distribuido. No validan atención real de emergencias, GPS, tránsito externo, colisiones ni operación con varios procesos Uvicorn. El servidor comparte un escenario en memoria y las pruebas E2E lo reinician.
