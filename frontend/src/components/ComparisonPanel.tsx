import { SelectMenu } from './KitControls';
import { ArrowDownToLine, Check } from 'lucide-react';
import type { Algorithm, Comparison, State } from '../types';
import { algorithms } from '../types';

export default function ComparisonPanel({
  comparison,
  state,
  setAlgorithm,
  exportComparison,
  busy,
}: {
  comparison: Comparison | null;
  state: State;
  setAlgorithm: (a: Algorithm) => void;
  exportComparison: () => void;
  busy: boolean;
}) {
  const optimum = comparison?.results.find((r) => r.algorithm === 'Dijkstra')?.cost;
  return (
    <section className="panel comparison-panel">
      <div className="panel-heading">
        <div>
          <h2>Resultados</h2>
          <span className="subtle">
            {comparison
              ? `${comparison.agent_id} (base) → ${comparison.incident_id} · Mismas condiciones`
              : 'Calculando rutas…'}
          </span>
        </div>
        <button
          className="mk-button mk-button--icon mk-button--text"
          title="Exportar comparación CSV"
          aria-label="Exportar comparación CSV"
          onClick={exportComparison}
          disabled={!comparison}
        >
          <ArrowDownToLine size={17} />
        </button>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>ALGORITMO</th>
              <th>PASOS</th>
              <th>COSTO</th>
              <th>NODOS</th>
              <th>TIEMPO</th>
            </tr>
          </thead>
          <tbody>
            {comparison?.results.map((r) => (
              <tr className={state.algorithm === r.algorithm ? 'active-row' : ''} key={r.algorithm}>
                <td>
                  <button
                    className="mk-button mk-button--text mk-button--sm"
                    onClick={() => setAlgorithm(r.algorithm)}
                    disabled={busy}
                    title={`Usar ${r.algorithm}`}
                    aria-label={`Usar ${r.algorithm}`}
                    aria-pressed={state.algorithm === r.algorithm}
                  >
                    <strong>{r.algorithm}</strong>
                    {state.algorithm === r.algorithm && <span className="algo-active">ACTIVO</span>}
                  </button>
                </td>
                <td>{r.found ? r.steps : '—'}</td>
                <td>
                  <strong>{r.cost ?? 'Sin ruta'}</strong>
                  {r.cost !== null && <span className="unit">u</span>}
                  {r.cost !== null && r.cost === optimum && (
                    <Check size={11} className="optimal-check" />
                  )}
                </td>
                <td>{r.expanded}</td>
                <td>
                  {r.elapsed_ms.toFixed(2)}
                  <span className="unit">ms</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="comparison-foot">
        <span>
          <Check size={14} />
          Menor costo
        </span>
        <SelectMenu
          label="Planificador"
          value={state.algorithm}
          disabled={busy}
          onChange={setAlgorithm}
          options={algorithms.map((value) => ({ value, label: value }))}
        />
      </div>
    </section>
  );
}
