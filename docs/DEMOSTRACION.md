# Guion de demostración · 6–8 minutos

## Preparación

Ejecutar `start.bat`. Abrir la interfaz. Mantener Python en ejecución y comenzar con **Centro urbano**, semilla 42. Reiniciar el escenario si ya fue utilizado. Todas las posiciones y emergencias iniciales se repiten.

## 1. Presentar el sistema · 1 minuto

“ARES simula seis unidades especializadas que atienden emergencias. Python representa el entorno y toma las decisiones. React permite observar y modificar el escenario. Los agentes cooperan a través de un coordinador.”

Mostrar las unidades en el mapa, el conteo de unidades disponibles y las cuatro emergencias iniciales. Abrir **Actividad y métricas** para consultar la bitácora y el tiempo promedio de respuesta. Las calles amarillas tienen mayor costo.

## 2. Comparar algoritmos · 2 minutos

Abrir **Algoritmos de búsqueda**, pulsar el menú **Emergencia a comparar** y seleccionar **EM-002 · Atención médica urgente**. El origen común es AMB-01 en su base `(2, 7)` y el destino `(12, 12)`. Las explicaciones están en **Cómo interpretar los resultados**.

- BFS: 15 pasos, costo 30.
- DFS: 101 pasos, costo 138.
- Dijkstra: 15 pasos, costo 15.
- A*: 15 pasos, costo 15, con 25 nodos expandidos frente a los 62 de Dijkstra.

“BFS minimiza pasos; Dijkstra y A* minimizan el costo ponderado. A* usa distancia Manhattan para orientar la expansión. DFS puede encontrar un camino mucho más largo.”

Los tiempos son mediciones reales y pueden variar. Pulsar el icono de descarga para obtener el CSV. Seleccionar A* para continuar.

## 3. Observar decisiones racionales · 1 minuto

Volver a **Centro de operaciones** y pulsar **Un paso**. Desplegar **Actividad y métricas** para ver las asignaciones en la bitácora. Abrir **Unidades y agentes** y desplegar **Detalles de AMB-01** para ver su misión y ubicación.

“Una patrulla no atiende un incendio. El coordinador filtra por capacidad y disponibilidad, prioriza gravedad y espera, y elige menor costo de ruta entre unidades compatibles.”

## 4. Modificar el entorno · 1 minuto

Volver al mapa. Activar **Bloqueos** y pulsar una calle libre, por ejemplo `(10, 7)`. Aparece la barrera y la bitácora registra recálculos. La calle puede habilitarse pulsándola otra vez. Evitar las posiciones ocupadas: el sistema las protege.

Activar **Nodos** para ver las expansiones de la comparación seleccionada. La línea punteada parte de la base de comparación; las rutas de misión se muestran con el color de la especialidad.

“Un agente debe revisar su plan si cambian las condiciones. Si desaparece toda ruta, el incidente vuelve a la cola de pendientes.”

## 5. Agregar una emergencia y terminar · 1–2 minutos

Pulsar **Nueva emergencia**. El diálogo del kit guía tres pasos: descripción y tipo, prioridad y ubicación, y revisión final. Usar **Siguiente**, comprobar los datos y pulsar **Registrar emergencia**. La ubicación se elige automáticamente; alternativamente se puede usar **Ubicar** en el mapa para indicar una calle.

Iniciar la simulación y usar 4× si es necesario. Cada paso equivale a 15 segundos simulados. Ver llegada, atención y resolución. Al no quedar emergencias, la simulación se pausa automáticamente.

Mostrar **Resueltas**, las unidades disponibles y el tiempo promedio de respuesta en **Actividad y métricas**. Finalmente, abrir **Guía del proyecto** y desplegar **Fundamentos de IA · Unidades 1–3** y **Modelo PEAS**.

El botón **Apariencia** abre `ThemePicker`: permite cambiar de paleta, modo de pantalla y cualquiera de los siete estilos del componente `Nav`. En móvil, la navegación se convierte en la barra de cristal original del kit.

## Reparto sugerido del equipo

| Parte | Tema que debe explicar |
|---|---|
| Presentación | Problema, objetivo y entorno |
| Agentes | PEAS, especialidades, racionalidad y coordinación |
| Algoritmos | BFS/DFS/Dijkstra/A*, pesos y heurística |
| Demostración | Bloqueos, recálculo, pruebas y resultados |

No se presupone un número específico de integrantes. El mismo miembro puede cubrir más de una parte.
