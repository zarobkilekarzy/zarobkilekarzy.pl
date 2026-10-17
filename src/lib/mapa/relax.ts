/**
 * Wielkość kół i rozsuwanie tych, które by się nachodziły — wspólne dla buildu (./layout) i skryptu
 * mapy w przeglądarce: warstwa na żywo zmienia wielkości kół, więc układ liczy się wtedy od nowa.
 * Moduł nie zna geometrii Polski, żeby skrypt mapy nie ciągnął pliku granic.
 *
 * Kilkaset kroków odpychania kół od siebie i słabego przyciągania do ich miejsca; wynik jest
 * deterministyczny (ta sama kolejność danych = ten sam obraz).
 */
import type { Radius } from './types';

/** Promień punktu bez danych i punktu bez wielkości. */
export const R_MISSING = 1.6;
const R_PLAIN = 4;
/** Pole koła proporcjonalne do wielkości; najmniejsze koło nadal czytelne. */
export const RADIUS: Radius = { base: 0, k: 0.55, min: 3 };
export const radius = (size?: number, r: Radius = RADIUS) => (size == null ? R_PLAIN : Math.max(r.min, r.base + r.k * Math.sqrt(size)));

export interface RelaxNode {
  x: number;
  y: number;
  /** miejsce docelowe (środek gminy, współrzędne) */
  ax: number;
  ay: number;
  r: number;
  /** null = punkt bez danych: mniejszy odstęp od sąsiadów */
  tone: number | null;
}

const ITERATIONS = 400;
/** odstęp między kołami z danymi (pod obwódkę w kolorze tła) i między pozostałymi */
const GAP = 1.2, GAP_MISSING = 0.5;
const PULL = 0.02;

export function relax(nodes: RelaxNode[]) {
  if (!nodes.length) return;
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

/** Kolejność rysowania: najpierw szare, potem z danymi od największych (małe na wierzchu). */
export const drawOrder = <T extends { i: number; r: number; tone: number | null }>(a: T, b: T) =>
  Number(a.tone != null) - Number(b.tone != null) || b.r - a.r || a.i - b.i;
