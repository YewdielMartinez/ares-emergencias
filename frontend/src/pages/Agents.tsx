import { KindIcon } from '../components/CityMap';
import Disclosure from '../components/Disclosure';
import type { State } from '../types';
import { kindNames, statusNames } from '../types';

export default function Agents({ state }: { state: State }) {
  return (
    <>
      <p className="supporting-text">{state.agents.length} unidades · 3 especialidades</p>
      <div className="agents-grid">
        {state.agents.map((a) => (
          <article className="panel agent-card" key={a.id}>
            <div className="agent-card-header">
              <span className={`type-icon type-${a.kind}`}>
                <KindIcon kind={a.kind} size={22} />
              </span>
              <span className={`status-pill status-${a.status}`}>
                <i />
                {statusNames[a.status]}
              </span>
            </div>
            <h2>{a.name}</h2>
            <span className="mono subtle">
              {a.id} · {kindNames[a.kind]}
            </span>
            <Disclosure title={`Detalles de ${a.id}`}>
              <div className="agent-data">
                <div>
                  <span>Ubicación</span>
                  <strong>({a.position.join(', ')})</strong>
                </div>
                <div>
                  <span>Misión</span>
                  <strong>{a.incident_id ?? 'Sin asignar'}</strong>
                </div>
                <div>
                  <span>Ruta restante</span>
                  <strong>{a.route.length} celdas</strong>
                </div>
                <div>
                  <span>Atenciones</span>
                  <strong>{a.completed}</strong>
                </div>
              </div>
            </Disclosure>
            <div className="agent-card-footer">
              <span className={a.status === 'available' ? 'live-dot' : 'pause-dot'} />
              {a.status === 'available'
                ? 'Lista para recibir una misión'
                : a.status === 'en_route'
                  ? `Navegando con ${state.algorithm}`
                  : `Atendiendo · ${a.service_remaining} ticks restantes`}
            </div>
          </article>
        ))}
      </div>
      <Disclosure title="Criterio de asignación">
        <p>
          <strong>Política racional de coordinación.</strong> Las emergencias se ordenan por
          gravedad y tiempo de espera. Para cada una, el coordinador elige la unidad disponible y
          compatible con menor costo de ruta. Un bloqueo provoca una nueva planificación; si no hay
          ruta, la emergencia vuelve a la cola.
        </p>
      </Disclosure>
    </>
  );
}
