import { useRef, useState } from 'react';
import { Dialog, Steps } from '@yewdiel21/motion-kit/react';
import { ArrowLeft, ArrowRight, Check, LoaderCircle, MapPin, Plus, X } from 'lucide-react';
import { KindIcon } from './CityMap';
import type { Kind, Point } from '../types';
import { kindNames, severityNames } from '../types';

export default function IncidentForm({
  position,
  busy,
  onCancel,
  onSubmit,
}: {
  position: Point | null;
  busy: boolean;
  onCancel: () => void;
  onSubmit: (body: unknown) => Promise<void>;
}) {
  const [step, setStep] = useState(0);
  const [renderedStep, setRenderedStep] = useState(0);
  const transitioning = step !== renderedStep;
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState<Kind>('medical');
  const [severity, setSeverity] = useState('3');
  const description = useRef<HTMLInputElement>(null);
  const next = () => {
    if (transitioning) return;
    if (step === 0 && !description.current?.reportValidity()) return;
    setStep((value) => Math.min(2, value + 1));
  };
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (step < 2) next();
        else void onSubmit({ kind, severity: Number(severity), position, title });
      }}
    >
      <Dialog.Header>
        <div>
          <span className="eyebrow">COORDINAR UNA RESPUESTA</span>
          <Dialog.Title id="emergency-dialog-title">Nueva emergencia</Dialog.Title>
        </div>
        <Dialog.Close aria-label="Cerrar diálogo">
          <X size={22} />
        </Dialog.Close>
      </Dialog.Header>
      <Dialog.Body>
        <Steps
          index={step}
          onChange={setRenderedStep}
          busy={busy || transitioning}
          className="incident-steps"
        >
          <div className="step-progress">
            <span className="mk-chip">
              Paso <Steps.Counter /> de 3
            </span>
            <span className="supporting-text">
              {['Incidente', 'Prioridad y ubicación', 'Confirmación'][renderedStep]}
            </span>
          </div>
          <Steps.Step>
            <div className="step-content">
              <h3 className="mk-type-title-large" data-mk-step-title="" data-mk-flow-item="">
                ¿Qué está ocurriendo?
              </h3>
              <p className="supporting-text" data-mk-flow-item="">
                Describe el incidente y elige el tipo de unidad que puede atenderlo.
              </p>
              <label className="mk-field">
                <span className="mk-field__label">Descripción</span>
                <input
                  ref={description}
                  aria-label="Descripción"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  required
                  maxLength={100}
                  placeholder="Ej. Incendio en edificio residencial"
                  autoComplete="off"
                />
              </label>
              <fieldset className="type-fieldset" data-mk-flow-item="">
                <legend>Tipo de respuesta</legend>
                <div className="choice-row">
                  {(['medical', 'fire', 'security'] as Kind[]).map((value) => (
                    <label
                      className="mk-chip mk-chip--filter"
                      aria-pressed={kind === value}
                      key={value}
                    >
                      <input
                        type="radio"
                        name="kind"
                        value={value}
                        checked={kind === value}
                        onChange={() => setKind(value)}
                      />
                      <KindIcon kind={value} size={18} />
                      {kindNames[value]}
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>
          </Steps.Step>
          <Steps.Step>
            <div className="step-content">
              <h3 className="mk-type-title-large" data-mk-step-title="" data-mk-flow-item="">
                Define la atención
              </h3>
              <p className="supporting-text" data-mk-flow-item="">
                La gravedad determina la prioridad de asignación y el tiempo de servicio.
              </p>
              <label className="mk-field" data-mk-flow-item="">
                <span className="mk-field__label">Prioridad</span>
                <select
                  aria-label="Prioridad"
                  value={severity}
                  onChange={(event) => setSeverity(event.target.value)}
                >
                  <option value="3">Crítica · atención inmediata</option>
                  <option value="2">Media · atención prioritaria</option>
                  <option value="1">Baja · atención regular</option>
                </select>
              </label>
              <div className="tonal-note" data-mk-flow-item="">
                <MapPin size={22} />
                <div>
                  <strong>Ubicación del incidente</strong>
                  <p>
                    {position
                      ? `Calle seleccionada: (${position.join(', ')})`
                      : 'Asignación automática en una calle disponible'}
                  </p>
                </div>
              </div>
            </div>
          </Steps.Step>
          <Steps.Step>
            <div className="step-content">
              <span className="feature-symbol" data-mk-flow-item="">
                <Check size={30} />
              </span>
              <h3 className="mk-type-title-large" data-mk-step-title="" data-mk-flow-item="">
                Todo listo para responder
              </h3>
              <p className="supporting-text" data-mk-flow-item="">
                Revisa los datos. El coordinador buscará una unidad compatible en el siguiente paso
                de simulación.
              </p>
              <dl className="review-list" data-mk-flow-item="">
                <div>
                  <dt>Descripción</dt>
                  <dd>{title}</dd>
                </div>
                <div>
                  <dt>Unidad</dt>
                  <dd>{kindNames[kind]}</dd>
                </div>
                <div>
                  <dt>Prioridad</dt>
                  <dd>{severityNames[Number(severity)]}</dd>
                </div>
                <div>
                  <dt>Ubicación</dt>
                  <dd>{position ? `(${position.join(', ')})` : 'Automática'}</dd>
                </div>
              </dl>
            </div>
          </Steps.Step>
        </Steps>
      </Dialog.Body>
      <Dialog.Footer>
        <button type="button" className="mk-button mk-button--text" onClick={onCancel}>
          Cancelar
        </button>
        {step > 0 && (
          <button
            type="button"
            className="mk-button mk-button--outlined"
            disabled={transitioning || busy}
            onClick={() => setStep((value) => value - 1)}
          >
            <ArrowLeft size={18} />
            Atrás
          </button>
        )}
        {step < 2 ? (
          <button
            type="button"
            className="mk-button mk-button--primary"
            disabled={transitioning || busy}
            onClick={next}
          >
            Siguiente
            <ArrowRight size={18} />
          </button>
        ) : (
          <button
            className="mk-button mk-button--primary"
            disabled={busy || transitioning}
            type="submit"
          >
            {busy ? <LoaderCircle className="spin" size={18} /> : <Plus size={18} />}Registrar
            emergencia
          </button>
        )}
      </Dialog.Footer>
    </form>
  );
}
