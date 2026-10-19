import { Cpu, Flame, Layers3, Shield, Stethoscope } from 'lucide-react';
import Disclosure from '../components/Disclosure';

export default function Guide() {
  return (
    <div className="guide-page">
      <p className="supporting-text">
        Simulación multiagente de emergencias. Python toma las decisiones; React permite explorar el
        entorno.
      </p>
      <Disclosure title="Fundamentos de IA · Unidades 1–3">
        <div className="architecture">
          <span>
            <Cpu size={20} />
            Coordinador
          </span>
          <i />
          <div>
            <span>
              <Stethoscope size={18} />
              Salud
            </span>
            <span>
              <Flame size={18} />
              Bomberos
            </span>
            <span>
              <Shield size={18} />
              Policía
            </span>
          </div>
          <i />
          <span>
            <Layers3 size={20} />
            Entorno urbano compartido
          </span>
        </div>
        <div className="guide-units">
          {[
            {
              n: '01',
              title: 'Fundamentos de IA',
              text: 'La inteligencia se expresa como percepción, elección de acciones y resolución de problemas. El sistema utiliza búsqueda simbólica y reglas explícitas; no necesita un modelo de lenguaje ni entrenamiento.',
            },
            {
              n: '02',
              title: 'Agentes inteligentes',
              text: 'Agentes basados en objetivos: cada unidad conoce su ubicación, misión y ruta. El coordinador observa prioridades, compatibilidad y disponibilidad; elige por menor costo y evita asignaciones duplicadas.',
            },
            {
              n: '03',
              title: 'Resolución de problemas',
              text: 'Estado: una celda transitable. Acciones: moverse en cuatro direcciones. Objetivo: llegar al incidente. Se comparan BFS, DFS, Dijkstra y A* en pasos, costo, nodos expandidos y tiempo real de cómputo.',
            },
          ].map((u) => (
            <article className="panel guide-unit" key={u.n}>
              <span>UNIDAD {u.n}</span>
              <h2>{u.title}</h2>
              <p>{u.text}</p>
            </article>
          ))}
        </div>
      </Disclosure>
      <Disclosure title="Demostración paso a paso">
        <section className="guide-demo">
          <h2>Tu demostración, paso a paso</h2>
          <ol>
            <li>
              <strong>Observa el entorno.</strong> Identifica las seis unidades y las cuatro
              emergencias iniciales. Las celdas amarillas representan tráfico.
            </li>
            <li>
              <strong>Inicia la simulación.</strong> Cada paso representa 15 segundos. El
              coordinador asigna unidades según especialidad, prioridad y costo.
            </li>
            <li>
              <strong>Cambia el algoritmo.</strong> Selecciona BFS, DFS, Dijkstra o A* y observa los
              cambios de ruta. La tabla compara siempre el mismo origen y destino.
            </li>
            <li>
              <strong>Modifica el mapa.</strong> Activa “Bloqueos” y pulsa una calle libre: las
              unidades recalculan sus rutas. Usa el pin para ubicar una nueva emergencia.
            </li>
            <li>
              <strong>Comprueba y exporta.</strong> Observa las llegadas y resoluciones en la
              sección “Actividad y métricas”, compara los resultados y descarga el CSV.
            </li>
          </ol>
          <p>
            Entorno discreto, observable y determinista entre cambios manuales; dinámico durante la
            ejecución. Las unidades pueden compartir calles: no se modelan colisiones. El estado
            vive en memoria y se reinicia al cerrar Python.
          </p>
        </section>
      </Disclosure>
      <Disclosure title="Modelo PEAS">
        <section className="peas-panel">
          <h2>Modelo PEAS</h2>
          <div>
            <article>
              <strong>Rendimiento</strong>
              <p>
                Emergencias resueltas, tiempo hasta la llegada, costo de ruta y nodos expandidos.
              </p>
            </article>
            <article>
              <strong>Entorno</strong>
              <p>Ciudad de 30 × 23 celdas, calles, obstáculos, tráfico y otras unidades.</p>
            </article>
            <article>
              <strong>Actuadores</strong>
              <p>Desplazarse, atender una emergencia, finalizar y volver a estar disponible.</p>
            </article>
            <article>
              <strong>Sensores</strong>
              <p>Estado de calles, costos, ubicación de incidentes, gravedad y disponibilidad.</p>
            </article>
          </div>
        </section>
      </Disclosure>
    </div>
  );
}
