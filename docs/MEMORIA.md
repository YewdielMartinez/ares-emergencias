# Memoria técnica

## Objetivo

Simular la gestión de emergencias con unidades especializadas que perciben un entorno urbano, reciben objetivos y calculan caminos. Comparar algoritmos de búsqueda bajo condiciones iguales e identificar la diferencia entre distancia, costo y esfuerzo computacional.

## Unidad 1: fundamentos de inteligencia artificial

ARES utiliza representación simbólica: posiciones, nodos, aristas, costos, objetivos y reglas. La decisión se expresa como selección racional de una unidad y búsqueda de una secuencia de acciones. El sistema no utiliza aprendizaje automático ni modelos de lenguaje: sus decisiones son explicables mediante datos y algoritmos explícitos.

El problema es relevante porque una ruta corta puede atravesar tráfico y requerir más tiempo que una ruta alternativa. Además, una unidad cercana puede ser incompatible con el tipo de emergencia o estar ocupada.

## Unidad 2: agentes y racionalidad

### Agentes

| Agente | Cantidad | Capacidad | Objetivo |
|---|---:|---|---|
| Ambulancia | 2 | Emergencias médicas | Llegar y atender incidentes médicos |
| Bomberos | 2 | Incendios | Llegar y completar la atención de incendios |
| Policía | 2 | Seguridad | Llegar y atender incidentes de seguridad |
| Coordinador | 1 | Asignación y coordinación | Ordenar pendientes y utilizar unidades compatibles disponibles |

Cada unidad tiene identificador, especialidad, posición, base, estado, misión y ruta. Son agentes basados en objetivos y con estado interno. Su estructura combina percepción del estado compartido, planificación, desplazamiento discreto y servicio. El coordinador centraliza la política de cooperación.

### Modelo PEAS

| Elemento | Descripción |
|---|---|
| Performance | Emergencias resueltas, tiempo hasta la llegada, costo de rutas y nodos expandidos |
| Environment | Cuadrícula, calles, tráfico, bloqueos, otras unidades e incidentes |
| Actuators | Avanzar una celda, atender, finalizar, quedar disponible |
| Sensors | Costos y transitabilidad, ubicación y gravedad de incidentes, estado de unidades |

### Racionalidad y política

En cada paso, el coordinador ordena las emergencias pendientes por:

```text
prioridad efectiva = gravedad + floor(ticks de espera / 8)
```

La gravedad vale 1, 2 o 3. En empate se usa el instante de creación y después el identificador. El envejecimiento permite que una emergencia antigua aumente su prioridad.

Para cada emergencia, se calculan rutas de todas las unidades disponibles y compatibles con el algoritmo activo. Se elige menor costo, después menor longitud y finalmente identificador. Una unidad queda reservada para una sola misión. No se asigna una unidad a una ubicación sin ruta.

Esta política es voraz y racional respecto a la información y al algoritmo elegido; no asegura el óptimo global de asignación. Con BFS o DFS la ruta obtenida puede no tener el menor costo, y por eso la unidad elegida también puede diferir de la elegida por Dijkstra/A*.

### Características del entorno

- Totalmente observable mediante la pizarra compartida.
- Discreto: posiciones enteras y movimientos ortogonales.
- Cooperativo y multiagente.
- Determinista entre intervenciones del usuario.
- Dinámico durante la ejecución: cambian posiciones, estados, incidentes y obstáculos.
- Secuencial: una asignación afecta la disponibilidad para futuras decisiones.
- Conocido: reglas de movimiento y costos explícitos.

## Unidad 3: formulación de búsqueda

El entorno ocupa 30 × 23 celdas, pero solo las calles son transitables. Hay calles verticales en x = 2, 7, 12, 17, 22 y 27 y horizontales en y = 2, 7, 12, 17 y 20. Los edificios y áreas verdes no pertenecen al grafo; los bloqueos retiran temporalmente celdas de calle.

- Estado inicial: celda de la unidad; en la tabla de comparación, su base.
- Objetivo: celda del incidente.
- Acciones: derecha, abajo, izquierda y arriba, siempre que la celda destino sea transitable.
- Transición: pasar a una celda vecina.
- Costo: peso de entrada en la celda destino; el origen cuesta cero.
- Camino: secuencia incluyendo origen y destino.

Una calle libre cuesta 1 unidad. El tráfico aumenta el costo a 3, 4 o 5 unidades, según el escenario. Cada celda recorrida mide 100 metros. Un tick representa 15 segundos simulados y cada unidad de costo consume un tick; el costo de ruta representa así una estimación de desplazamiento.

### Algoritmos

| Algoritmo | Frontera | Criterio | Garantía en este entorno |
|---|---|---|---|
| BFS | Cola FIFO | Profundidad | Menor número de pasos, equivalente a menor distancia |
| DFS | Pila LIFO | Profundizar una rama | Encuentra camino si existe; no garantiza óptimo |
| Dijkstra | Heap de prioridad | `g(n)` | Menor costo con pesos positivos |
| A* | Heap de prioridad | `g(n) + h(n)` | Menor costo con la heurística utilizada |

Para A*: `h(n) = abs(x_n - x_objetivo) + abs(y_n - y_objetivo)`. Cada arista cuesta al menos 1 y no hay diagonales ni teletransportes, por lo que Manhattan no sobreestima y es consistente. El algoritmo puede cerrar nodos sin perder optimalidad. Los empates del heap se resuelven mediante un contador incremental determinista.

BFS y DFS utilizan O(V + E) en tiempo y O(V) en espacio. Dijkstra y A* con heap tienen O((V + E) log V) en el peor caso de este grafo finito; la cola puede almacenar entradas repetidas y las obsoletas se descartan. En una cuadrícula el grado es acotado y E es O(V). La heurística puede reducir las expansiones de A*, pero no garantiza un tiempo de cómputo inferior en todos los problemas.

### Comparación controlada

Los cuatro algoritmos reciben el mismo grafo, costos, obstáculos, origen y destino dentro de un lock. El origen por defecto es la **base de la primera unidad compatible**; no cambia cuando esa unidad se desplaza. Así se conserva el problema para la exposición. No se comparan rutas de cuatro unidades diferentes.

Se reportan pasos, costo total, nodos extraídos/expandidos (incluido el objetivo) y tiempo medido con `perf_counter`. Si no existe ruta, el costo es nulo y `found=false`; cero se reserva para origen igual a destino. Los nodos visibles en el mapa corresponden a la búsqueda del algoritmo activo y la ruta punteada es la comparación desde la base. Las rutas sólidas corresponden a las misiones reales.

## Cambios y atención

Al bloquear o habilitar una calle, las unidades en camino vuelven a planificar desde su celda actual. También se recalcula al cambiar el algoritmo. No se permite bloquear una celda ocupada por una unidad o una emergencia activa. Si una unidad pierde toda ruta posible, queda disponible y su incidente vuelve a pendiente.

Las unidades permanecen en una celda durante los ticks que cuesta entrar en la siguiente. Al recalcular se descarta el avance parcial de la arista actual: se trata de una aproximación discreta conservadora. Al llegar, la atención dura `gravedad + 2` ticks. Después, la unidad queda disponible en la última ubicación y puede recibir otra misión.

El tiempo de respuesta promedio mide desde la creación hasta la llegada; incluye espera por asignación y desplazamiento, pero no el servicio. Se promedia sobre incidentes con llegada registrada, estén aún en atención o ya resueltos.

## Resultado de ejemplo

En centro urbano, semilla 42, de la base AMB-01 `(2, 7)` a EM-002 `(12, 12)`:

| Algoritmo | Pasos | Costo | Nodos expandidos |
|---|---:|---:|---:|
| BFS | 15 | 30 | 78 |
| DFS | 101 | 138 | 112 |
| Dijkstra | 15 | 15 | 62 |
| A* | 15 | 15 | 25 |

BFS encuentra una ruta corta que pasa por tráfico. Dijkstra y A* obtienen una alternativa con el mismo número de pasos y la mitad de costo. En el caso ponderado adicional de las pruebas, sí necesitan más pasos: seis en lugar de cuatro, con costo 6 en lugar de 28. Son dos manifestaciones distintas del efecto de los pesos.

Los 48 experimentos de tres escenarios, cuatro emergencias y cuatro algoritmos se encuentran en `comparacion.csv`, con mediana de tiempo de 25 repeticiones. Las conclusiones se limitan a los mapas probados; no se infiere superioridad universal a partir de tiempos submilisegundo.

## Alcance y posibles extensiones

Se simula cooperación mediante estado compartido, sin mensajería distribuida. No se modelan choques entre unidades, consumo de combustible ni traslado de pacientes. Las ampliaciones naturales son persistencia, escenarios personalizados, negociación distribuida y asignación global mediante optimización; no son necesarias para demostrar las primeras tres unidades.
