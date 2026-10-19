import { useEffect, useRef, useState } from 'react';
import { Dialog, Menu, Nav, Toaster, useCascade, useTheme } from '@yewdiel21/motion-kit/react';
import type { NavStyle } from '@yewdiel21/motion-kit/react';
import {
  Activity,
  ArrowDownToLine,
  BookOpen,
  Ellipsis,
  GitBranch,
  LayoutDashboard,
  LoaderCircle,
  Plus,
  RefreshCw,
  RotateCcw,
  Users,
} from 'lucide-react';
import { useSimulation } from './hooks/useSimulation';
import { notify } from './services/notifications';
import IncidentForm from './components/IncidentForm';
import ScenarioDialog from './components/ScenarioDialog';
import AppearanceDialog from './components/AppearanceDialog';
import Guide from './pages/Guide';
import Operations from './pages/Operations';
import Algorithms from './pages/Algorithms';
import Agents from './pages/Agents';
import type { Point } from './types';

type Tab = 'operations' | 'algorithms' | 'agents' | 'guide';
const pages = [
  { value: 'operations', label: 'Centro de operaciones', icon: <LayoutDashboard /> },
  { value: 'algorithms', label: 'Algoritmos de búsqueda', icon: <GitBranch /> },
  { value: 'agents', label: 'Unidades y agentes', icon: <Users /> },
  { value: 'guide', label: 'Guía del proyecto', icon: <BookOpen /> },
];
const headings = {
  operations: 'Operaciones',
  algorithms: 'Comparar algoritmos',
  agents: 'Unidades',
  guide: 'Guía del proyecto',
};
const navStyles: NavStyle[] = ['guapa', 'tasks', 'bonita', 'clasica', 'melon', 'dock', 'tunnel'];

export default function App() {
  const [tab, setTab] = useState<Tab>('operations');
  const [selected, setSelected] = useState('EM-001');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogKind, setDialogKind] = useState<'incident' | 'reset'>('incident');
  const [formVersion, setFormVersion] = useState(0);
  const [position, setPosition] = useState<Point | null>(null);
  const [nextScenario, setNextScenario] = useState('urban');
  const [navStyle, setNavStyle] = useState<NavStyle>(() => {
    const stored = localStorage.getItem('ares-nav') as NavStyle;
    return navStyles.includes(stored) ? stored : 'guapa';
  });
  const theme = useTheme();
  const content = useRef<HTMLDivElement>(null);
  const simulation = useSimulation(selected, notify);
  const { state, comparison, error, setRunning, busy, load, perform } = simulation;
  useEffect(() => {
    localStorage.setItem('ares-nav', navStyle);
  }, [navStyle]);
  useEffect(() => {
    document.documentElement.dataset.theme = theme.resolved;
  }, [theme.resolved]);
  useCascade(content, { trigger: 'load', duration: 0.45, step: 0.06, once: true }, [
    tab,
    Boolean(state),
  ]);

  const openIncident = (p: Point | null = null) => {
    setPosition(p);
    setFormVersion((v) => v + 1);
    setDialogKind('incident');
    setDialogOpen(true);
  };
  const openReset = (scenario: string) => {
    setNextScenario(scenario);
    setDialogKind('reset');
    setDialogOpen(true);
  };
  const reset = async () => {
    setRunning(false);
    if (await perform('/reset', { scenario: nextScenario, seed: 42 })) {
      setSelected('EM-001');
      setDialogOpen(false);
      notify('Escenario reiniciado con semilla 42.');
    }
  };
  const exportComparison = () => {
    if (!comparison || !state) return;
    const rows = [
      'algoritmo,pasos,costo,nodos_expandidos,tiempo_ms,encontrada',
      ...comparison.results.map(
        (r) => `${r.algorithm},${r.steps},${r.cost ?? ''},${r.expanded},${r.elapsed_ms},${r.found}`,
      ),
    ];
    const text = `# ARES; escenario=${state.scenario}; semilla=${state.seed}; tick=${state.tick}; origen=${comparison.start.join(':')}; destino=${comparison.goal.join(':')}; emergencia=${comparison.incident_id}\n${rows.join('\n')}\n`;
    const url = URL.createObjectURL(
      new Blob(['\ufeff' + text], { type: 'text/csv;charset=utf-8;' }),
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = `ares-comparacion-${state.scenario}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    notify('Comparación exportada en formato CSV.');
  };

  return (
    <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen} drag={false} autoResize={false}>
      <div className="mk-shell ares-shell">
        <main className="mk-shell__view" data-mk-underlay="">
          <header className="mk-shell__header workspace-header">
            <div className="workspace-identity">
              <Activity size={20} />
              <h1 className="mk-shell__title">ARES</h1>
            </div>
            <div className="header-actions">
              <span className="connection">
                <span className={state ? 'live-dot' : 'pause-dot'} />
                {state ? 'Motor Python conectado' : 'Conectando…'}
              </span>
              <Menu.Root
                onSelect={(value) => {
                  if (value === 'export') exportComparison();
                  if (value === 'reset' && state) openReset(state.scenario);
                  if (value === 'guide') setTab('guide');
                }}
              >
                <Menu.Trigger
                  className="mk-button mk-button--icon mk-button--text"
                  aria-label="Opciones del escenario"
                >
                  <Ellipsis size={24} />
                </Menu.Trigger>
                <Menu.Content aria-label="Opciones del escenario">
                  <Menu.Item value="export" disabled={!comparison}>
                    <ArrowDownToLine size={18} />
                    Exportar comparación
                  </Menu.Item>
                  <Menu.Item value="guide">
                    <BookOpen size={18} />
                    Ver guía del proyecto
                  </Menu.Item>
                  <Menu.Separator />
                  <Menu.Item value="reset" disabled={!state}>
                    <RotateCcw size={18} />
                    Reiniciar simulación
                  </Menu.Item>
                </Menu.Content>
              </Menu.Root>
            </div>
          </header>
          <div className="mk-shell__content workspace-content" ref={content}>
            <div className="page-heading" data-mk-cascade="fade">
              <h2 className="mk-type-headline-medium">{headings[tab]}</h2>
              <Dialog.Trigger
                className="mk-button mk-button--primary"
                disabled={!state}
                onClick={() => openIncident()}
              >
                <Plus size={20} />
                Nueva emergencia
              </Dialog.Trigger>
            </div>
            {!state ? (
              <div className="loading-panel">
                <LoaderCircle className="spin" size={32} />
                <h2>{error ? 'No pudimos conectar con Python' : 'Preparando el entorno'}</h2>
                <p>{error || 'Conectando agentes, mapa y motor de búsqueda…'}</p>
                {error && (
                  <button className="mk-button" onClick={load}>
                    <RefreshCw size={18} />
                    Reintentar conexión
                  </button>
                )}
              </div>
            ) : (
              <>
                {tab === 'operations' && (
                  <Operations
                    state={state}
                    simulation={simulation}
                    selected={selected}
                    setSelected={setSelected}
                    onReset={openReset}
                    onNewIncident={openIncident}
                  />
                )}
                {tab === 'algorithms' && (
                  <Algorithms
                    state={state}
                    simulation={simulation}
                    selected={selected}
                    setSelected={setSelected}
                    exportComparison={exportComparison}
                  />
                )}
                {tab === 'agents' && <Agents state={state} />}
                {tab === 'guide' && <Guide />}
                <footer className="page-footer">
                  <span>ARES · Inteligencia artificial aplicada</span>
                  <span>Python + React · Unidades 01—03</span>
                </footer>
              </>
            )}
          </div>
        </main>
        <Nav
          aria-label="Navegación principal"
          navStyle={navStyle}
          accent
          items={pages}
          active={tab}
          onSelect={(value) => setTab(value as Tab)}
          first={
            <button
              className="mk-nav__button mk-nav__button--first"
              onClick={() => setTab('operations')}
              aria-label="ARES, inicio"
            >
              <span className="mk-nav__icon">
                <Activity />
              </span>
              <span className="mk-nav__name">ARES</span>
            </button>
          }
          actions={<AppearanceDialog navStyle={navStyle} onNavStyle={setNavStyle} />}
        />
      </div>
      <Toaster labels={{ dismiss: 'Cerrar aviso' }} />
      <Dialog.Content size="lg" aria-labelledby="emergency-dialog-title">
        {dialogKind === 'incident' ? (
          <IncidentForm
            key={formVersion}
            position={position}
            busy={busy}
            onCancel={() => setDialogOpen(false)}
            onSubmit={async (body) => {
              const value = await perform('/incidents', body);
              if (value) {
                setSelected(value.incidents[value.incidents.length - 1].id);
                setDialogOpen(false);
                setTab('operations');
                notify('Emergencia registrada. La asignación se realizará en el próximo paso.');
              }
            }}
          />
        ) : (
          <ScenarioDialog
            scenario={nextScenario}
            onScenario={setNextScenario}
            busy={busy}
            onReset={() => void reset()}
            onCancel={() => setDialogOpen(false)}
          />
        )}
      </Dialog.Content>
    </Dialog.Root>
  );
}
