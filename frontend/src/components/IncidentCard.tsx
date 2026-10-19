import { KindIcon } from './CityMap';
import type { Incident } from '../types';
import { severityNames, statusNames } from '../types';

export default function IncidentCard({
  incident: i,
  selected,
  onClick,
}: {
  incident: Incident;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`incident-card ${selected ? 'selected' : ''}`}
      data-flip-id={i.id}
      onClick={onClick}
      aria-pressed={selected}
    >
      <div className="incident-card-top">
        <span className={`type-icon type-${i.kind}`}>
          <KindIcon kind={i.kind} />
        </span>
        <h3>{i.title}</h3>
        <span className={`severity severity-${i.severity}`}>
          <i />
          {severityNames[i.severity]}
        </span>
      </div>
      <div className="incident-card-bottom">
        <span className="mono incident-id">{i.id}</span>
        <span className={`status-pill status-${i.status}`}>
          <i />
          {statusNames[i.status]}
        </span>
      </div>
      {selected && (
        <p className="incident-detail">
          ({i.position.join(', ')}) · {i.agent_id ?? 'Unidad por asignar'}
        </p>
      )}
    </button>
  );
}
