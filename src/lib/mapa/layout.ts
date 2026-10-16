/**
 * Układ mapy liczony w buildzie: klasy skali i położenie punktów.
 *
 * Punkt stoi w środku gminy siedziby, a punkty, które by się nachodziły (kilka placówek w jednym
 * mieście), są rozsuwane: kilkaset kroków odpychania kół od siebie i słabego przyciągania do ich
 * gminy. Wynik jest deterministyczny (ta sama kolejność danych = ten sam obraz), więc mapa na
 * stronie i grafika do pobrania wyglądają tak samo.
 */
import { communePoint, geo } from './geo';
import type { ClassScale, PointLayer } from './types';

/** Liczba stopni rampy --seq-* — skala nie może mieć więcej klas. */
export const TONES = 5;

export function toneOf(value: number, scale: ClassScale): number {
  const i = scale.edges.findIndex((e) => value < e);
  return i < 0 ? scale.edges.length : i;
}

/** Promień punktu bez danych i punktu bez wielkości. */
export const R_MISSING = 1.6;
const R_PLAIN = 4;
/** Pole koła proporcjonalne do wielkości; najmniejsze koło nadal czytelne. */
export const radius = (size?: number) => (size == null ? R_PLAIN : Math.max(3, 0.55 * Math.sqrt(size)));

export interface PlacedPoint {
  /** indeks w layer.points */
  i: number;
  x: number;
  y: number;
  r: number;
  /** klasa skali; null = bez danych */
  tone: number | null;
}

const ITERATIONS = 400;
/** odstęp między kołami z danymi (pod obwódkę w kolorze tła) i między pozostałymi */
const GAP = 1.2, GAP_MISSING = 0.5;
const PULL = 0.02;

function relax(nodes: (PlacedPoint & { ax: number; ay: number })[]) {
  const maxR = Math.max(...nodes.map((n) => n.r));
  const cell = 2 * maxR + GAP;
  for (let it = 0; it < ITERATIONS; it++) {
    // siatka przestrzenna: kolidować mogą tylko koła z sąsiednich komórek
    const grid = new Map<number, number[]>();
    nodes.forEach((n, i) => {
      const key = Math.floor(n.x / cell) * 4096 + Math.floor(n.y / cell);
      (grid.get(key) ?? grid.set(key, []).get(key)!).push(i);
    });
    nodes.forEach((a, i) => {
      const cx = Math.floor(a.x / cell), cy = Math.floor(a.y / cell);
      for (let gx = cx - 1; gx <= cx + 1; gx++) {
        for (let gy = cy - 1; gy <= cy + 1; gy++) {
          for (const j of grid.get(gx * 4096 + gy) ?? []) {
            if (j <= i) continue;
            const b = nodes[j];
            const min = a.r + b.r + (a.tone != null && b.tone != null ? GAP : GAP_MISSING);
            let dx = b.x - a.x, dy = b.y - a.y;
            let d = Math.hypot(dx, dy);
            if (d >= min) continue;
            if (d < 1e-6) { dx = 0.01 * (j - i); dy = 0.01; d = Math.hypot(dx, dy); }
            // większe koło przesuwa się mniej (masa ∝ pole)
            const o = (min - d) / d, ma = a.r * a.r, mb = b.r * b.r;
            const sa = mb / (ma + mb), sb = ma / (ma + mb);
            a.x -= dx * o * sa; a.y -= dy * o * sa;
            b.x += dx * o * sb; b.y += dy * o * sb;
          }
        }
      }
    });
    for (const n of nodes) {
      n.x += (n.ax - n.x) * PULL;
      n.y += (n.ay - n.y) * PULL;
    }
  }
}

const cache = new WeakMap<PointLayer, { placed: PlacedPoint[]; unplaced: number[] }>();

/**
 * Położenie punktów warstwy, w kolejności rysowania: najpierw szare, potem z danymi od największych
 * (małe na wierzchu). `unplaced` — indeksy punktów, których kodu TERYT nie ma w PRG.
 */
export function placePoints(layer: PointLayer): { placed: PlacedPoint[]; unplaced: number[] } {
  const hit = cache.get(layer);
  if (hit) return hit;
  const unplaced: number[] = [];
  const perCommune = new Map<string, number>();
  const nodes: (PlacedPoint & { ax: number; ay: number })[] = [];
  layer.points.forEach((p, i) => {
    const at = communePoint(p.teryt);
    if (!at) { unplaced.push(i); return; }
    // punkty z jednej gminy startują na spirali wokół jej środka
    const key = at.join();
    const k = perCommune.get(key) ?? 0;
    perCommune.set(key, k + 1);
    const angle = k * 2.39996, dist = 1.4 * Math.sqrt(k);
    const tone = p.value == null ? null : toneOf(p.value, layer.scale);
    nodes.push({ i, ax: at[0], ay: at[1], x: at[0] + dist * Math.cos(angle), y: at[1] + dist * Math.sin(angle), r: p.value == null ? R_MISSING : radius(p.size), tone });
  });
  relax(nodes);
  const placed = nodes
    .map(({ i, x, y, r, tone }) => ({ i, x: Math.min(geo.width, Math.max(0, x)), y: Math.min(geo.height, Math.max(0, y)), r, tone }))
    .sort((a, b) => Number(a.tone != null) - Number(b.tone != null) || b.r - a.r || a.i - b.i);
  const result = { placed, unplaced };
  cache.set(layer, result);
  return result;
}
