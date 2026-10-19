import { Dialog } from '@yewdiel21/motion-kit/react';
import { LoaderCircle, RotateCcw, X } from 'lucide-react';

export default function ScenarioDialog({
  scenario,
  onScenario,
  busy,
  onReset,
  onCancel,
}: {
  scenario: string;
  onScenario: (scenario: string) => void;
  busy: boolean;
  onReset: () => void;
  onCancel: () => void;
}) {
  return (
    <>
      <Dialog.Header>
        <div>
          <span className="eyebrow">UN NUEVO PUNTO DE PARTIDA</span>
          <Dialog.Title id="emergency-dialog-title">Preparar escenario</Dialog.Title>
        </div>
        <Dialog.Close aria-label="Cerrar diálogo">
          <X size={22} />
        </Dialog.Close>
      </Dialog.Header>
      <Dialog.Body>
        <div className="settings-stack">
          <div className="feature-symbol">
            <RotateCcw size={30} />
          </div>
          <p className="supporting-text">
            Se reiniciarán las unidades, emergencias y la bitácora. La semilla 42 permite repetir el
            experimento.
          </p>
          <label className="mk-field">
            <span className="mk-field__label">Escenario</span>
            <select
              aria-label="Escenario del reinicio"
              value={scenario}
              onChange={(event) => onScenario(event.target.value)}
            >
              <option value="urban">Centro urbano</option>
              <option value="traffic">Hora pico</option>
              <option value="blocked">Vías bloqueadas</option>
            </select>
          </label>
          <span className="mk-chip">Semilla 42 · 6 unidades · 4 emergencias</span>
        </div>
      </Dialog.Body>
      <Dialog.Footer>
        <button type="button" className="mk-button mk-button--text" onClick={onCancel}>
          Cancelar
        </button>
        <button
          type="button"
          className="mk-button mk-button--primary"
          disabled={busy}
          onClick={onReset}
        >
          {busy ? <LoaderCircle className="spin" size={18} /> : <RotateCcw size={18} />}Reiniciar
          escenario
        </button>
      </Dialog.Footer>
    </>
  );
}
