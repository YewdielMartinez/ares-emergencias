import { useMemo, useRef, useState } from 'react';
import { useRouteMotion } from '../hooks/useRouteMotion';
import { Crosshair, Flame, Minus, Plus, Shield, Stethoscope } from 'lucide-react';
import type { Comparison, Kind, Point, State } from '../types';

export const kindColors: Record<Kind, string> = {
  medical: '#3679bd',
  fire: '#e16b3d',
  security: '#8264ae',
};
export const KindIcon = ({ kind, size = 16 }: { kind: Kind; size?: number }) =>
  kind === 'medical' ? (
    <Stethoscope size={size} />
  ) : kind === 'fire' ? (
    <Flame size={size} />
  ) : (
    <Shield size={size} />
  );
const px = (x: number) => 40 + x * 28;
const py = (y: number) => 18 + y * 24;
const pathData = (points: Point[]) =>
  points.map(([x, y], i) => `${i ? 'L' : 'M'} ${px(x)} ${py(y)}`).join(' ');

function MarkerSymbol({ kind }: { kind: Kind }) {
  if (kind === 'medical') return <path d="M-5-2h3v-3h4v3h3v4H2v3h-4V2h-3z" fill="currentColor" />;
  if (kind === 'security')
    return (
      <path
        d="m0-6 5 2v4c0 3-5 6-5 6S-5 3-5 0v-4z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    );
  return (
    <path d="M1-7c1 5 6 6 4 11C3 8-4 7-5 3c-1-3 2-5 3-8 0 3 2 4 2 4s3-3 1-6Z" fill="currentColor" />
  );
}

interface Props {
  state: State;
  comparison: Comparison | null;
  selected: string;
  onSelect: (id: string) => void;
  mode: 'inspect' | 'obstacle' | 'incident';
  onCell: (position: Point) => void;
  showRoutes: boolean;
  showVisited: boolean;
}

export default function CityMap({
  state,
  comparison,
  selected,
  onSelect,
  mode,
  onCell,
  showRoutes,
  showVisited,
}: Props) {
  const [zoom, setZoom] = useState(1);
  const mapRef = useRef<SVGSVGElement>(null);
  const movingAgents = state.agents
    .filter((a) => a.route.length > 0)
    .map((a) => a.id)
    .join(',');
  useRouteMotion(mapRef, `${showRoutes}:${movingAgents}`);
  const blocks = useMemo(() => {
    const items = [];
    const xs = state.grid.street_x;
    const ys = state.grid.street_y;
    for (let a = 0; a < xs.length - 1; a++) {
      for (let b = 0; b < ys.length - 1; b++) {
        const x = px(xs[a]) + 15,
          y = py(ys[b]) + 14;
        const w = px(xs[a + 1]) - x - 15,
          h = py(ys[b + 1]) - y - 14;
        const park = a === 3 && b === 1;
        const hospital = a === 0 && b === 1;
        items.push(
          <g key={`${a}-${b}`}>
            <rect x={x} y={y} width={w} height={h} rx="5" fill={park ? '#dce9d8' : '#e9ece7'} />
            {park ? (
              <>
                <path
                  d={`M${x} ${y + h} Q${x + w * 0.5} ${y + h * 0.7} ${x + w} ${y} M${x} ${y} Q${x + w * 0.5} ${y + h * 0.55} ${x + w} ${y + h}`}
                  fill="none"
                  stroke="#f4f4e9"
                  strokeWidth="8"
                />
                {[0.17, 0.4, 0.7, 0.84].map((n, i) => (
                  <g key={n}>
                    <circle cx={x + w * n} cy={y + 15 + (i % 2) * 44} r="8" fill="#c4d8bf" />
                    <circle cx={x + w * n} cy={y + 15 + (i % 2) * 44} r="4.5" fill="#b1cda9" />
                  </g>
                ))}
                <text x={x + w / 2} y={y + h / 2 + 4} className="map-park" textAnchor="middle">
                  Parque Central
                </text>
              </>
            ) : hospital ? (
              <>
                <rect
                  x={x + 13}
                  y={y + 13}
                  width={w - 26}
                  height={h - 26}
                  rx="3"
                  fill="#dbe6e9"
                  stroke="#bfd1d9"
                />
                <path
                  d={`M${x + w / 2 - 8} ${y + h / 2 - 6}h5v-5h6v5h5v6h-5v5h-6v-5h-5z`}
                  fill="#7498ab"
                />
                <text x={x + w / 2} y={y + h - 17} className="map-small" textAnchor="middle">
                  Hospital General
                </text>
              </>
            ) : (
              Array.from({ length: h > 70 ? 6 : 3 }, (_, i) => {
                const col = i % 3,
                  row = Math.floor(i / 3);
                const bw = (w - 30) / 3,
                  bh = h > 70 ? (h - 25) / 2 : h - 17;
                return (
                  <g key={i}>
                    <rect
                      x={x + 7 + col * (bw + 7)}
                      y={y + 7 + row * (bh + 9)}
                      width={bw - ((a + b + i) % 3) * 2}
                      height={bh - ((i + a) % 3) * 3}
                      rx="2"
                      fill={['#d9ded6', '#dfe1da', '#d4dcd5'][(a + b + i) % 3]}
                      stroke="#cbd2c9"
                      strokeWidth=".6"
                    />
                    <path
                      d={`M${x + 11 + col * (bw + 7)} ${y + 11 + row * (bh + 9)}h${bw - 12}`}
                      stroke="#f6f7f1"
                      strokeWidth="2"
                    />
                  </g>
                );
              })
            )}
          </g>,
        );
      }
    }
    return items;
  }, [state.grid.street_x, state.grid.street_y]);
  const result = comparison?.results.find((r) => r.algorithm === state.algorithm);
  const active = state.incidents.filter((i) => i.status !== 'resolved');
  const vbw = 920 / zoom,
    vbh = 580 / zoom;
  return (
    <div className={`city-map mode-${mode}`}>
      <div className="mk-chip mk-glass map-district">
        <span className="live-dot" /> DISTRITO CENTRO <span>SECTOR 01</span>
      </div>
      <svg
        ref={mapRef}
        viewBox={`${(920 - vbw) / 2} ${(580 - vbh) / 2} ${vbw} ${vbh}`}
        aria-label="Mapa interactivo de emergencias del Distrito Centro"
        className="map-svg"
      >
        <defs>
          <pattern id="map-grid" width="28" height="24" patternUnits="userSpaceOnUse">
            <path d="M28 0H0v24" fill="none" stroke="#dce2d9" strokeWidth=".5" opacity=".6" />
          </pattern>
          <pattern
            id="blocked-pattern"
            width="5"
            height="5"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <rect width="2" height="5" fill="#e67950" />
          </pattern>
          <filter id="marker-shadow" x="-80%" y="-80%" width="260%" height="280%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#1f2937" floodOpacity=".13" />
          </filter>
        </defs>
        <rect width="920" height="580" fill="#f0f2ec" />
        <rect width="920" height="580" fill="url(#map-grid)" />
        <path
          d="M830-20C790 85 880 160 844 260S850 440 940 540"
          stroke="#d3e4e6"
          strokeWidth="50"
          fill="none"
        />
        <path
          d="M835-20C795 85 885 160 849 260S855 440 945 540"
          stroke="#c3dce0"
          strokeWidth="2"
          strokeDasharray="8 8"
          fill="none"
        />
        <text transform="translate(873 350) rotate(72)" className="map-river">
          RÍO SANTA ISABEL
        </text>
        {state.grid.street_y.map((y) => (
          <g key={`road-y-${y}`}>
            <path d={`M${px(2) - 18} ${py(y)}H${px(27) + 18}`} stroke="#d9dfd7" strokeWidth="24" />
            <path d={`M${px(2) - 18} ${py(y)}H${px(27) + 18}`} stroke="#fcfcf9" strokeWidth="21" />
            <path
              d={`M${px(2) - 18} ${py(y)}H${px(27) + 18}`}
              stroke="#d9dfd6"
              strokeWidth="1"
              strokeDasharray="5 7"
            />
          </g>
        ))}
        {state.grid.street_x.map((x) => (
          <g key={`road-x-${x}`}>
            <path d={`M${px(x)} ${py(2) - 18}V${py(20) + 18}`} stroke="#d9dfd7" strokeWidth="24" />
            <path d={`M${px(x)} ${py(2) - 18}V${py(20) + 18}`} stroke="#fcfcf9" strokeWidth="21" />
            <path
              d={`M${px(x)} ${py(2) - 18}V${py(20) + 18}`}
              stroke="#d9dfd6"
              strokeWidth="1"
              strokeDasharray="5 7"
            />
          </g>
        ))}
        {blocks}
        <g className="street-labels">
          <text x="232" y={py(2) + 4}>
            CALLE INDEPENDENCIA
          </text>
          <text x="374" y={py(7) + 4}>
            AV. CENTRAL
          </text>
          <text x="214" y={py(12) + 4}>
            AV. UNIVERSIDAD
          </text>
          <text x="393" y={py(17) + 4}>
            CALLE REFORMA
          </text>
          <text x="379" y={py(20) + 4}>
            PERIFÉRICO SUR
          </text>
          <text transform={`translate(${px(2) + 4} 350) rotate(-90)`}>AV. DE LA SALUD</text>
          <text transform={`translate(${px(17) + 4} 425) rotate(-90)`}>BLVD. DEL PARQUE</text>
        </g>
        {state.grid.costs.map(({ position: [x, y], cost }) => (
          <rect
            key={`cost-${x}-${y}`}
            x={px(x) - 11}
            y={py(y) - 10}
            width="22"
            height="20"
            rx="2"
            fill={cost >= 4 ? '#f2c36b' : '#ead997'}
            opacity=".55"
          />
        ))}
        {showVisited &&
          result?.visited.map(([x, y]) => (
            <rect
              key={`v-${x}-${y}`}
              x={px(x) - 8}
              y={py(y) - 7}
              width="16"
              height="14"
              rx="3"
              fill="#829cd0"
              opacity=".32"
            />
          ))}
        {showRoutes && result?.path.length ? (
          <path
            d={pathData(result.path)}
            fill="none"
            stroke="#ea7550"
            strokeWidth="3"
            strokeDasharray="6 5"
            opacity=".7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}
        {showRoutes &&
          state.agents
            .filter((a) => a.route.length)
            .map((a) => (
              <g key={`route-${a.id}`}>
                <path
                  d={pathData([a.position, ...a.route])}
                  fill="none"
                  stroke="white"
                  strokeWidth="6"
                  strokeLinejoin="round"
                />
                <path
                  d={pathData([a.position, ...a.route])}
                  fill="none"
                  stroke={kindColors[a.kind]}
                  strokeWidth="3"
                  strokeLinejoin="round"
                />
                <path
                  className="route-flow"
                  d={pathData([a.position, ...a.route])}
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  strokeDasharray="2 16"
                  opacity=".65"
                  pointerEvents="none"
                />
              </g>
            ))}
        {state.grid.roads.map(([x, y]) => (
          <rect
            key={`hit-${x}-${y}`}
            x={px(x) - 14}
            y={py(y) - 12}
            width="28"
            height="24"
            className="road-hit"
            onClick={() => mode !== 'inspect' && onCell([x, y])}
          >
            <title>
              Calle ({x}, {y})
              {mode === 'obstacle'
                ? ' · Clic para alternar bloqueo'
                : mode === 'incident'
                  ? ' · Ubicar emergencia'
                  : ''}
            </title>
          </rect>
        ))}
        {state.grid.blocked.map(([x, y]) => (
          <g key={`b-${x}-${y}`} transform={`translate(${px(x)},${py(y)})`} pointerEvents="none">
            <rect x="-11" y="-10" width="22" height="20" rx="3" fill="#fff4e5" stroke="#d87045" />
            <rect x="-9" y="-7" width="18" height="14" fill="url(#blocked-pattern)" />
            <title>Vía bloqueada</title>
          </g>
        ))}
        {active.map((i) => (
          <g
            key={i.id}
            transform={`translate(${px(i.position[0])},${py(i.position[1])})`}
            className={`incident-marker ${selected === i.id ? 'selected' : ''}`}
            role="button"
            tabIndex={0}
            aria-label={`Seleccionar ${i.id}: ${i.title}`}
            onClick={() => onSelect(i.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelect(i.id);
              }
            }}
          >
            {selected === i.id && <circle r="25" fill={kindColors[i.kind]} opacity=".12" />}
            <circle r="16" fill="white" filter="url(#marker-shadow)" />
            <circle r="13" fill={kindColors[i.kind]} />
            <g color="white">
              <MarkerSymbol kind={i.kind} />
            </g>
            <rect x="-23" y="22" width="46" height="16" rx="4" fill="white" stroke="#e1e4df" />
            <text y="33" textAnchor="middle" className="marker-label">
              {i.id}
            </text>
          </g>
        ))}
        {state.agents.map((a, index) => {
          const overlap = active.some(
            (i) => i.position[0] === a.position[0] && i.position[1] === a.position[1],
          );
          return (
            <g
              key={a.id}
              transform={`translate(${px(a.position[0]) + (overlap ? 21 : 0)},${py(a.position[1]) + (overlap ? -17 : 0)})`}
              className="agent-marker"
            >
              <rect
                x="-12"
                y="-12"
                width="24"
                height="24"
                rx="7"
                fill="white"
                stroke={kindColors[a.kind]}
                strokeWidth="1.5"
                filter="url(#marker-shadow)"
              />
              <g color={kindColors[a.kind]}>
                <MarkerSymbol kind={a.kind} />
              </g>
              <circle
                cx="10"
                cy="-10"
                r="3.5"
                fill={a.status === 'available' ? '#3c967a' : '#e5a146'}
                stroke="white"
              />
              <title>
                {a.id} ·{' '}
                {a.status === 'available'
                  ? 'Disponible'
                  : a.status === 'attending'
                    ? 'En atención'
                    : 'En camino'}{' '}
                · Unidad {index + 1}
              </title>
            </g>
          );
        })}
        <g transform="translate(50 474)">
          <path d="m0-13-5 13 5-3 5 3z" fill="#56645d" />
          <text y="14" textAnchor="middle" className="map-small">
            N
          </text>
        </g>
        <g transform="translate(59 546)">
          <path d="M0-4v4h70v-4M35 0v-3" fill="none" stroke="#7d8980" />
          <text x="35" y="13" textAnchor="middle" className="map-small">
            5 celdas · 500 m
          </text>
        </g>
      </svg>
      <div className="map-zoom">
        <button
          className="mk-button mk-button--icon mk-button--tonal"
          title="Acercar mapa"
          aria-label="Acercar mapa"
          onClick={() => setZoom((v) => Math.min(1.8, v + 0.2))}
          disabled={zoom >= 1.8}
        >
          <Plus size={17} />
        </button>
        <button
          className="mk-button mk-button--icon mk-button--tonal"
          title="Alejar mapa"
          aria-label="Alejar mapa"
          onClick={() => setZoom((v) => Math.max(1, v - 0.2))}
          disabled={zoom <= 1}
        >
          <Minus size={17} />
        </button>
        <button
          className="mk-button mk-button--icon mk-button--tonal"
          title="Centrar mapa"
          aria-label="Centrar mapa"
          onClick={() => setZoom(1)}
        >
          <Crosshair size={17} />
        </button>
      </div>
      <div className="map-key">
        <span>
          <i className="key-route" />
          Ruta
        </span>
        <span>
          <i className="key-traffic" />
          Tráfico
        </span>
        <span>
          <i className="key-block" />
          Bloqueo
        </span>
      </div>
      {mode !== 'inspect' && (
        <div className="map-hint">
          {mode === 'obstacle'
            ? 'Haz clic en una calle para bloquearla o habilitarla'
            : 'Haz clic en una calle para ubicar la emergencia'}
        </div>
      )}
      <div className="map-credit">ARES / ENTORNO SIMULADO</div>
    </div>
  );
}
