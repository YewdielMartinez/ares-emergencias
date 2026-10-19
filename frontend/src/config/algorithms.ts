import type { Algorithm } from '../types';

export const algorithmInfo: Record<Algorithm, { name: string; description: string; tag: string }> =
  {
    BFS: {
      name: 'Búsqueda en anchura',
      description:
        'Explora por niveles con una cola FIFO. Encuentra la ruta con menos pasos, pero ignora el costo de tráfico.',
      tag: 'Sin información',
    },
    DFS: {
      name: 'Búsqueda en profundidad',
      description:
        'Explora una rama antes de retroceder mediante una pila LIFO. Encuentra una ruta, sin garantizar distancia o costo mínimo.',
      tag: 'Sin información',
    },
    Dijkstra: {
      name: 'Búsqueda de costo uniforme',
      description:
        'Expande primero el nodo con menor costo acumulado. Garantiza el menor costo con pesos positivos.',
      tag: 'Costo óptimo',
    },
    'A*': {
      name: 'Búsqueda heurística',
      description:
        'Combina el costo acumulado g(n) y la distancia Manhattan h(n). Con esta heurística consistente garantiza el costo mínimo.',
      tag: 'Costo óptimo',
    },
  };
