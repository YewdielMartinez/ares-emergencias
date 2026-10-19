import { MapPin } from 'lucide-react';
import ComparisonPanel from '../components/ComparisonPanel';
import Disclosure from '../components/Disclosure';
import { SelectMenu } from '../components/KitControls';
import { algorithmInfo } from '../config/algorithms';
import { algorithms } from '../types';
import type { State } from '../types';
import type { useSimulation } from '../hooks/useSimulation';

interface Props {
  state: State;
  simulation: ReturnType<typeof useSimulation>;
  selected: string;
  setSelected: (id: string) => void;
  exportComparison: () => void;
}

export default function Algorithms({
  state,
  simulation,
  selected,
  setSelected,
  exportComparison,
}: Props) {
  const { comparison, busy, perform } = simulation;
  const incident = state.incidents.find((item) => item.id === selected);
  return (
    <div className="algorithms-page">
      <div className="comparison-controls">
        <span className="supporting-text">Emergencia a comparar</span>
        <SelectMenu
          label="Emergencia a comparar"
          icon={<MapPin size={16} />}
          value={selected}
          triggerLabel={incident ? `${incident.id} · ${incident.title}` : 'Elegir emergencia'}
          options={state.incidents.map((item) => ({
            value: item.id,
            label: `${item.id} · ${item.title}`,
          }))}
          onChange={setSelected}
        />
      </div>
      <ComparisonPanel
        comparison={comparison}
        state={state}
        setAlgorithm={(a) => void perform('/algorithm', { algorithm: a })}
        exportComparison={exportComparison}
        busy={busy}
      />
      <Disclosure title="Cómo interpretar los resultados">
        <p>
          Todas las búsquedas usan la misma base, destino, obstáculos y tráfico. Una celda mide 100
          m y cuesta 1 unidad; con tráfico cuesta de 3 a 5. Menos pasos no siempre significa menor
          costo. El tiempo de cómputo se mide con <code>perf_counter</code> y puede variar.
        </p>
        <dl className="algorithm-notes">
          {algorithms.map((algorithm) => (
            <div key={algorithm}>
              <dt>
                {algorithm} <span>{algorithmInfo[algorithm].name}</span>
              </dt>
              <dd>{algorithmInfo[algorithm].description}</dd>
            </div>
          ))}
        </dl>
      </Disclosure>
    </div>
  );
}
