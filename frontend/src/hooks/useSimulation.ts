import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../services/api';
import type { Comparison, State } from '../types';

/** Adaptador de la API: React nunca calcula rutas ni decide asignaciones. */
export function useSimulation(selected: string, notify: (message: string) => void) {
  const [state, setState] = useState<State | null>(null);
  const [comparison, setComparison] = useState<Comparison | null>(null);
  const [error, setError] = useState('');
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [busy, setBusy] = useState(false);
  const queue = useRef<Promise<unknown>>(Promise.resolve());

  const load = useCallback(async () => {
    try {
      setState(await api<State>('/state'));
      setError('');
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  // Una cola serial conserva el orden de los pasos y las modificaciones.
  const perform = useCallback(
    (path: string, body: unknown = {}, silent = false): Promise<State | null> => {
      const operation = queue.current.then(async () => {
        if (!silent) setBusy(true);
        try {
          const value = await api<State>(path, body);
          setState(value);
          setError('');
          return value;
        } catch (e) {
          notify((e as Error).message);
          setRunning(false);
          return null;
        } finally {
          if (!silent) setBusy(false);
        }
      });
      queue.current = operation;
      return operation;
    },
    [notify],
  );

  useEffect(() => {
    if (!running) return;
    let disposed = false;
    let timer: ReturnType<typeof setTimeout>;
    const advance = async () => {
      if (disposed) return;
      const next = await perform('/step', { steps: 1 }, true);
      if (!disposed && next?.metrics.active === 0) {
        setRunning(false);
        notify('Todas las emergencias fueron atendidas. Puedes agregar un nuevo incidente.');
      }
      if (!disposed) timer = setTimeout(advance, 1000 / speed);
    };
    timer = setTimeout(advance, 1000 / speed);
    return () => {
      disposed = true;
      clearTimeout(timer);
    };
  }, [running, speed, perform, notify]);

  useEffect(() => {
    if (!state) return;
    let disposed = false;
    api<Comparison>(`/compare?incident_id=${encodeURIComponent(selected)}`)
      .then((value) => {
        if (!disposed) setComparison(value);
      })
      .catch((e) => {
        if (!disposed) notify(e.message);
      });
    return () => {
      disposed = true;
    };
  }, [selected, state?.revision, state?.scenario, notify]);

  return { state, comparison, error, running, setRunning, speed, setSpeed, busy, load, perform };
}
