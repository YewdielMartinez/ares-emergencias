export type Point = [number, number];
export type Kind = 'medical' | 'fire' | 'security';
export type Algorithm = 'BFS' | 'DFS' | 'Dijkstra' | 'A*';
export interface Agent {
  id: string;
  name: string;
  kind: Kind;
  position: Point;
  base: Point;
  status: 'available' | 'en_route' | 'attending';
  incident_id: string | null;
  route: Point[];
  edge_remaining: number;
  service_remaining: number;
  completed: number;
}
export interface Incident {
  id: string;
  title: string;
  kind: Kind;
  position: Point;
  severity: number;
  created_tick: number;
  status: 'pending' | 'assigned' | 'attending' | 'resolved';
  agent_id: string | null;
  arrival_tick: number | null;
  resolved_tick: number | null;
}
export interface SearchResult {
  algorithm: Algorithm;
  path: Point[];
  visited: Point[];
  found: boolean;
  steps: number;
  cost: number | null;
  expanded: number;
  elapsed_ms: number;
}
export interface Comparison {
  agent_id: string;
  incident_id: string;
  start: Point;
  goal: Point;
  revision: number;
  results: SearchResult[];
}
export interface State {
  scenario: string;
  scenario_name: string;
  seed: number;
  tick: number;
  elapsed_seconds: number;
  algorithm: Algorithm;
  revision: number;
  grid: {
    width: number;
    height: number;
    roads: Point[];
    blocked: Point[];
    costs: { position: Point; cost: number }[];
    street_x: number[];
    street_y: number[];
  };
  agents: Agent[];
  incidents: Incident[];
  events: { id: number; tick: number; category: string; message: string }[];
  metrics: {
    active: number;
    pending: number;
    available: number;
    total_agents: number;
    resolved: number;
    average_response_seconds: number | null;
  };
}
export const kindNames: Record<Kind, string> = {
  medical: 'Ambulancia',
  fire: 'Bomberos',
  security: 'Policía',
};
export const statusNames = {
  pending: 'Pendiente',
  assigned: 'En camino',
  attending: 'En atención',
  resolved: 'Resuelta',
  available: 'Disponible',
  en_route: 'En camino',
};
export const severityNames = ['', 'Baja', 'Media', 'Crítica'];
export const algorithms: Algorithm[] = ['BFS', 'DFS', 'Dijkstra', 'A*'];
export function duration(seconds: number | null): string {
  if (seconds === null) return '—';
  const rounded = Math.round(seconds);
  return `${String(Math.floor(rounded / 60)).padStart(2, '0')}:${String(rounded % 60).padStart(2, '0')}`;
}
