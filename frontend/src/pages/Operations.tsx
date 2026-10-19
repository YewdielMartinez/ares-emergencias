import { useEffect, useRef, useState } from 'react';
import { AnimatedNumber, FlipGroup } from '@yewdiel21/motion-kit/react';
import {
  CheckCircle2,
  Clock3,
  Layers3,
  MapPin,
  MousePointer2,
  Pause,
  Play,
  RotateCcw,
  SkipForward,
  SlidersHorizontal,
} from 'lucide-react';
import CityMap, { KindIcon } from '../components/CityMap';
import IncidentCard from '../components/IncidentCard';
import Disclosure from '../components/Disclosure';
import { ControlSwitch, SegmentedControl, SelectMenu } from '../components/KitControls';
import type { Kind, Point, State } from '../types';
import { algorithms, duration, kindNames } from '../types';
import type { useSimulation } from '../hooks/useSimulation';

interface Props {
  state: State;
  simulation: ReturnType<typeof useSimulation>;
  selected: string;
  setSelected: (id: string) => void;
  onReset: (scenario: string) => void;
  onNewIncident: (position: Point) => void;
}
export default function Operations({
  state,
  simulation,
  selected,
  setSelected,
  onReset,
  onNewIncident,
}: Props) {
  const { comparison, running, setRunning, busy, speed, setSpeed, perform } = simulation;
  const [mode, setMode] = useState<'inspect' | 'obstacle' | 'incident'>('inspect');
  const [showRoutes, setShowRoutes] = useState(true);
  const [showVisited, setShowVisited] = useState(false);
  const [filter, setFilter] = useState<'active' | 'resolved'>('active');
  const incidentsRef = useRef<HTMLDivElement>(null);
  useEffect(() => setFilter('active'), [state.incidents.length]);
  const incidents = state.incidents
    .filter((i) => (filter === 'active' ? i.status !== 'resolved' : i.status === 'resolved'))
    .sort((a, b) => b.severity - a.severity);
  return (
    <>
      <section className="simulation-bar" aria-label="Controles de simulación">
        <div className="simulation-status">
          <span className={running ? 'live-dot' : 'pause-dot'} />
          <strong>{running ? 'Simulación en curso' : 'Simulación en pausa'}</strong>
          <span className="mk-chip">
            <Clock3 size={15} />
            <span className="mono">{duration(state.elapsed_seconds)}</span>
          </span>
          <span className="tick-label">TICK {String(state.tick).padStart(3, '0')}</span>
        </div>
        <div className="simulation-actions">
          <SelectMenu
            label="Velocidad de simulación"
            value={String(speed)}
            options={[
              { value: '1', label: '1× velocidad' },
              { value: '2', label: '2× velocidad' },
              { value: '4', label: '4× velocidad' },
            ]}
            onChange={(value) => setSpeed(Number(value))}
          />
          <button
            className="mk-button mk-button--icon mk-button--text"
            aria-label="Reiniciar simulación"
            title="Reiniciar simulación"
            onClick={() => onReset(state.scenario)}
          >
            <RotateCcw size={20} />
          </button>
          <button
            className="mk-button mk-button--outlined"
            disabled={running || busy}
            onClick={() => void perform('/step', { steps: 1 })}
          >
            <SkipForward size={18} />
            Un paso
          </button>
          <button
            className={`mk-button ${running ? 'mk-button--tonal' : 'mk-button--primary'}`}
            disabled={busy}
            onClick={() => setRunning((value) => !value)}
          >
            {running ? <Pause size={18} /> : <Play size={18} />}{' '}
            {running ? 'Pausar' : 'Iniciar simulación'}
          </button>
        </div>
      </section>
      <div className="operations-grid">
        <section className="panel map-panel">
          <div className="panel-heading">
            <div>
              <h2 className="mk-type-title-medium">Mapa</h2>
            </div>
            <SelectMenu
              label="Elegir escenario"
              icon={<Layers3 size={16} />}
              value={state.scenario}
              onChange={onReset}
              disabled={busy}
              options={[
                { value: 'urban', label: 'Centro urbano' },
                { value: 'traffic', label: 'Hora pico' },
                { value: 'blocked', label: 'Vías bloqueadas' },
              ]}
            />
          </div>
          <div className="map-toolbar">
            <SegmentedControl
              label="Herramienta de mapa"
              value={mode}
              onChange={setMode}
              options={[
                { value: 'inspect', label: 'Explorar', icon: <MousePointer2 size={17} /> },
                { value: 'obstacle', label: 'Bloqueos', icon: <SlidersHorizontal size={17} /> },
                { value: 'incident', label: 'Ubicar', icon: <MapPin size={17} /> },
              ]}
            />
            <div className="map-toggles">
              <ControlSwitch label="Rutas" checked={showRoutes} onChange={setShowRoutes} />
              <ControlSwitch label="Nodos" checked={showVisited} onChange={setShowVisited} />
            </div>
          </div>
          <CityMap
            state={state}
            comparison={comparison}
            selected={selected}
            onSelect={setSelected}
            mode={mode}
            onCell={(point) => {
              if (mode === 'obstacle') void perform('/obstacles', { position: point });
              else {
                setMode('inspect');
                onNewIncident(point);
              }
            }}
            showRoutes={showRoutes}
            showVisited={showVisited}
          />
          <div className="map-footer">
            <span className="available-units">
              <span className="live-dot" />
              <AnimatedNumber value={state.metrics.available} duration={0.35} />/{' '}
              {state.metrics.total_agents} unidades disponibles
            </span>
            <SelectMenu
              label="Planificador"
              value={state.algorithm}
              disabled={busy}
              onChange={(algorithm) => void perform('/algorithm', { algorithm })}
              options={algorithms.map((value) => ({ value, label: value }))}
            />
          </div>
        </section>
        <section className="panel incidents-panel">
          <div className="panel-heading">
            <h2 className="mk-type-title-medium">Emergencias</h2>
          </div>
          <div className="incident-tabs">
            <SegmentedControl
              label="Estado de emergencias"
              value={filter}
              onChange={setFilter}
              options={[
                {
                  value: 'active',
                  label: (
                    <>
                      Activas <AnimatedNumber value={state.metrics.active} duration={0.35} />
                    </>
                  ),
                },
                {
                  value: 'resolved',
                  label: (
                    <>
                      Resueltas <AnimatedNumber value={state.metrics.resolved} duration={0.35} />
                    </>
                  ),
                },
              ]}
            />
          </div>
          <FlipGroup
            root={incidentsRef}
            signature={`${filter}:${incidents.map((i) => i.id).join(',')}`}
          >
            <div className="incident-list" ref={incidentsRef}>
              {incidents.map((incident) => (
                <IncidentCard
                  key={incident.id}
                  incident={incident}
                  selected={selected === incident.id}
                  onClick={() => setSelected(incident.id)}
                />
              ))}
              {!incidents.length && (
                <div className="empty-state">
                  <span className="feature-symbol">
                    <CheckCircle2 size={32} />
                  </span>
                  <h3>
                    {filter === 'active' ? 'Todo bajo control' : 'Aún no hay emergencias resueltas'}
                  </h3>
                  <p className="supporting-text">
                    {filter === 'active'
                      ? 'Las unidades están listas para responder.'
                      : 'Inicia la simulación para coordinar la atención.'}
                  </p>
                </div>
              )}
            </div>
          </FlipGroup>
        </section>
      </div>
      <Disclosure title="Actividad y métricas">
        <div className="activity-details">
          <section>
            <h3>Últimas decisiones</h3>
            <div className="event-list">
              {state.events.slice(0, 5).map((event) => (
                <div className={`event event-${event.category}`} key={event.id}>
                  <span className="event-dot" />
                  <div>
                    <p>{event.message}</p>
                    <time>
                      {duration(event.tick * 15)} · Tick {event.tick}
                    </time>
                  </div>
                </div>
              ))}
            </div>
          </section>
          <section>
            <h3>Resumen del entorno</h3>
            <dl className="metrics-list">
              <div>
                <dt>Pendientes de asignación</dt>
                <dd>{state.metrics.pending}</dd>
              </div>
              <div>
                <dt>Respuesta promedio</dt>
                <dd>
                  {duration(state.metrics.average_response_seconds)} <small>min:seg</small>
                </dd>
              </div>
              <div>
                <dt>Semilla</dt>
                <dd>{state.seed}</dd>
              </div>
              <div>
                <dt>Cuadrícula</dt>
                <dd>
                  {state.grid.width} × {state.grid.height} · 100 m/celda
                </dd>
              </div>
            </dl>
            <div className="unit-legend">
              {(['medical', 'fire', 'security'] as Kind[]).map((kind) => (
                <span className="mk-chip" key={kind}>
                  <KindIcon kind={kind} size={15} />
                  {kindNames[kind]}
                </span>
              ))}
            </div>
          </section>
        </div>
      </Disclosure>
    </>
  );
}
