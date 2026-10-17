/**
 * Układ mapy liczony w buildzie: klasy skali i położenie punktów.
 *
 * Punkt stoi we współrzędnych geograficznych (`at`) albo w środku gminy siedziby (`teryt`), a punkty,
 * które by się nachodziły (kilka placówek w jednym mieście), są rozsuwane (./relax). Wynik jest
 * deterministyczny (ta sama kolejność danych = ten sam obraz), więc mapa na stronie i grafika do
 * pobrania wyglądają tak samo.
 */
import { communePoint, geo, project } from './geo';
import { drawOrder, R_MISSING, radius, relax, type RelaxNode } from './relax';
import { toneOf } from './scale';
import type { PointLayer } from './types';

export { R_MISSING, radius } from './relax';
export { classOf, TONES, toneOf, toneOfClass } from './scale';

export interface PlacedPoint {
  /** indeks w layer.points */
  i: number;
  x: number;
  y: number;
  r: number;
  /** stopień rampy; null = bez danych */
  tone: number | null;
  /** miejsce docelowe przed rozsunięciem (dla warstw na żywo, które układają punkty od nowa) */
  ax: number;
  ay: number;
}

/** Miejsce punktu na mapie: współrzędne geograficzne albo środek gminy. */
export function pointAnchor(p: PointLayer['points'][number]): [number, number] | null {
  if (p.at) return project(p.at.lat, p.at.lng);
  return p.teryt ? communePoint(p.teryt) : null;
}

const cache = new WeakMap<PointLayer, { placed: PlacedPoint[]; unplaced: number[] }>();

/**
 * Położenie punktów warstwy, w kolejności rysowania: najpierw szare, potem z danymi od największych
 * (małe na wierzchu). `unplaced` — indeksy punktów bez położenia (kod TERYT spoza PRG).
 */
export function placePoints(layer: PointLayer): { placed: PlacedPoint[]; unplaced: number[] } {
  const hit = cache.get(layer);
  if (hit) return hit;
  const unplaced: number[] = [];
  const perAnchor = new Map<string, number>();
  const nodes: (RelaxNode & { i: number })[] = [];
  layer.points.forEach((p, i) => {
    const at = pointAnchor(p);
    if (!at) { unplaced.push(i); return; }
    // punkty z jednego miejsca startują na spirali wokół niego
    const key = at.join();
    const k = perAnchor.get(key) ?? 0;
    perAnchor.set(key, k + 1);
    const angle = k * 2.39996, dist = 1.4 * Math.sqrt(k);
    const tone = p.value == null ? null : toneOf(p.value, layer.scale);
    nodes.push({ i, ax: at[0], ay: at[1], x: at[0] + dist * Math.cos(angle), y: at[1] + dist * Math.sin(angle), r: p.value == null ? R_MISSING : radius(p.size, layer.size?.radius), tone });
  });
  relax(nodes);
  const placed = nodes
    .map(({ i, x, y, r, tone, ax, ay }) => ({ i, x: Math.min(geo.width, Math.max(0, x)), y: Math.min(geo.height, Math.max(0, y)), r, tone, ax, ay }))
    .sort(drawOrder);
  const result = { placed, unplaced };
  cache.set(layer, result);
  return result;
}
