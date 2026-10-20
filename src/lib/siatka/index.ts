/**
 * Siatka kropek i plusów — wspólny motyw graficzny strony (od 10.2026).
 *
 * Motyw „combo”: pole zapalone = pełne kółko, wygaszone = cienki plus, pośrednie = mniejsze kółko
 * (projekcja, szacunek, szczegół rysunku), brak danych = ukośny krzyżyk. Stan czyta się z kształtu,
 * nie tylko z koloru i grubości.
 *
 * Rysują go: ui/DotGrid (SVG przy buildzie), ui/Pictogram (maski z ./piktogramy.ts)
 * i ui/MonitorPhoto (EKG na zdjęciu, w przeglądarce — stąd funkcje bez zależności od Node).
 */

export type Cell = 'on' | 'mid' | 'off' | 'miss';

/** Efekty zdjęć z siatką monitora (ui/MonitorPhoto): zapis EKG, punkt pomiaru, fala tętna. */
export type MonitorEffect = 'ekg' | 'scan' | 'pulse';

/** Bok pola w jednostkach viewBox. */
export const CELL = 12;

/**
 * Proporcje kształtów jako ułamek boku pola — jedno źródło dla SVG strony (SHAPES), obrazków OG
 * (lib/og/render) i nakładki na zdjęcia (ui/MonitorPhoto).
 */
export const GEOMETRY = {
  /** promień kropki zapalonej */
  on: .36,
  /** promień kropki pośredniej */
  mid: .23,
  /** ramię plusa (od środka) */
  arm: .25,
  /** grubość kreski plusa i krzyżyka */
  stroke: .09,
};

const MID = CELL / 2;
const units = (v: number) => +(v * CELL).toFixed(2);
const ARM = units(GEOMETRY.arm), STROKE = units(GEOMETRY.stroke), DIAG = units(GEOMETRY.arm * .8);

/** Kształt pola w kwadracie CELL×CELL; kolor z currentColor. */
export const SHAPES: Record<Cell, string> = {
  on: `<circle cx="${MID}" cy="${MID}" r="${units(GEOMETRY.on)}" fill="currentColor"/>`,
  mid: `<circle cx="${MID}" cy="${MID}" r="${units(GEOMETRY.mid)}" fill="currentColor"/>`,
  off: `<path d="M${MID} ${MID - ARM}v${2 * ARM}M${MID - ARM} ${MID}h${2 * ARM}" stroke="currentColor" stroke-width="${STROKE}" fill="none"/>`,
  miss: `<path d="M${MID - DIAG} ${MID - DIAG}l${2 * DIAG} ${2 * DIAG}M${MID + DIAG} ${MID - DIAG}l${-2 * DIAG} ${2 * DIAG}" stroke="currentColor" stroke-width="${STROKE}" fill="none"/>`,
};

/**
 * Rysunek musi mieć w ramce co najmniej jedno wygaszone pole z każdej strony — dotykający krawędzi
 * wygląda na ucięty, a większy niż ramka zostałby po cichu przycięty. Za ciasna ramka zatrzymuje build.
 */
function assertFits(w: number, h: number, cols: number, rows: number) {
  if (w + 2 > cols || h + 2 > rows) throw new Error(`[siatka] rysunek ${w}×${h} potrzebuje ramki co najmniej ${w + 2}×${h + 2} (margines 1 pola), jest ${cols}×${rows}`);
}

export interface Mask {
  cols: number;
  rows: number;
  /** pola wierszami, null = puste miejsce */
  cells: (Cell | null)[];
}

const MASK_CHARS: Record<string, Cell> = { '#': 'on', o: 'mid', '.': 'off', x: 'miss' };

/** Maska z tekstu: `#` zapalone, `o` pośrednie, `.` wygaszone, `x` brak danych, spacja — puste. */
export function parseMask(lines: readonly string[]): Mask {
  const rows = lines.length;
  const cols = Math.max(...lines.map((l) => l.length));
  const cells = lines.flatMap((line) => Array.from({ length: cols }, (_, c) => MASK_CHARS[line[c] ?? ' '] ?? null));
  return { cols, rows, cells };
}

/** Maska na środku większej ramki; margines wypełniają pola wygaszone. */
export function frameMask(mask: Mask, cols: number, rows: number): Mask {
  assertFits(mask.cols, mask.rows, cols, rows);
  const dx = Math.floor((cols - mask.cols) / 2), dy = Math.floor((rows - mask.rows) / 2);
  const cells = Array.from({ length: cols * rows }, (_, i): Cell | null => {
    const x = (i % cols) - dx, y = Math.floor(i / cols) - dy;
    if (x < 0 || y < 0 || x >= mask.cols || y >= mask.rows) return 'off';
    return mask.cells[y * mask.cols + x] ?? 'off';
  });
  return { cols, rows, cells };
}

export type Point = [col: number, row: number];

/**
 * Linia łamana → zapalone pola (klucz `kolumna,wiersz`). Strome odcinki domyka w pionie,
 * żeby linia nie rwała się między sąsiednimi kolumnami.
 */
export function polyline(points: readonly Point[]): Set<string> {
  const ys = new Map<number, number[]>();
  for (let i = 1; i < points.length; i++) {
    const [x0, y0] = points[i - 1], [x1, y1] = points[i];
    for (let x = x0; x <= x1; x++) {
      const y = x1 === x0 ? y1 : Math.round(y0 + (y1 - y0) * (x - x0) / (x1 - x0));
      ys.set(x, [...(ys.get(x) ?? []), y]);
    }
  }
  const on = new Set<string>();
  let prev: { lo: number; hi: number } | null = null;
  for (const x of [...ys.keys()].sort((a, b) => a - b)) {
    const list = ys.get(x)!;
    const own = { lo: Math.min(...list), hi: Math.max(...list) };
    let { lo, hi } = own;
    if (prev && prev.hi < lo - 1) lo = prev.hi + 1;
    if (prev && prev.lo > hi + 1) hi = prev.lo - 1;
    for (let y = lo; y <= hi; y++) on.add(`${x},${y}`);
    prev = own;
  }
  return on;
}

/** Jedno uderzenie EKG od kolumny x0 (17 kolumn: załamek P, zespół QRS, załamek T); amp skaluje wysokość. */
export function beat(x0: number, base: number, amp = 1): Point[] {
  const a = (d: number) => base - Math.round(d * amp);
  return [
    [x0, base], [x0 + 2, a(1)], [x0 + 3, a(1)], [x0 + 4, base],
    [x0 + 6, base], [x0 + 7, a(-1)], [x0 + 8, a(8)], [x0 + 9, a(-3)], [x0 + 10, base],
    [x0 + 12, base], [x0 + 13, a(2)], [x0 + 15, a(2)], [x0 + 16, base],
  ];
}

/**
 * Zapis EKG na siatce cols×rows: uderzenia do `flatFrom` szerokości, dalej płaska linia
 * (jak avatar i film „Brak odczytu”: serce bije i staje).
 */
export function ekgTrace(cols: number, rows: number, { flatFrom = .62, baseline = .64, height = .3 } = {}): Set<string> {
  const base = Math.round(rows * baseline);
  const points: Point[] = [[0, base]];
  for (let x = 2; x + 16 <= cols * flatFrom; x += 17) points.push(...beat(x, base, rows * height / 8));
  points.push([cols - 1, base]);
  return polyline(points);
}

/**
 * Słupki z pól: wartości (np. rok po roku) zgrupowane w `cols` kolumn (średnia z przedziału), wysokość
 * od zera do `max` w `rows` polach minus `headroom` — górny rząd zostaje pusty, jak margines piktogramów.
 * Kolumny od indeksu wartości `past` to projekcja — pola pośrednie, historia — zapalone; nad słupkami plusy.
 */
export function barsMask(values: readonly number[], { cols, rows, max = Math.max(...values), past = values.length, headroom = 1 }: { cols: number; rows: number; max?: number; past?: number; headroom?: number }): Mask {
  const top = rows - headroom;
  const n = Math.min(cols, values.length);
  const heights = Array.from({ length: n }, (_, j) => {
    const from = Math.floor(j * values.length / n), to = Math.floor((j + 1) * values.length / n);
    const avg = values.slice(from, to).reduce((a, b) => a + b, 0) / (to - from);
    return { h: Math.max(1, Math.min(top, Math.round(avg / max * top))), projected: from >= past };
  });
  const cells = Array.from({ length: n * rows }, (_, i): Cell => {
    const { h, projected } = heights[i % n];
    return rows - Math.floor(i / n) <= h ? (projected ? 'mid' : 'on') : 'off';
  });
  return { cols: n, rows, cells };
}

/** Maska tekstowa na środku ramki cols×rows, margines z pól wygaszonych (`.`). */
export function frameLines(lines: readonly string[], cols: number, rows: number): string[] {
  const w = Math.max(...lines.map((l) => l.length));
  assertFits(w, lines.length, cols, rows);
  const dx = Math.floor((cols - w) / 2), dy = Math.floor((rows - lines.length) / 2);
  const blank = '.'.repeat(cols);
  return Array.from({ length: rows }, (_, r) => {
    const line = lines[r - dy];
    return line === undefined ? blank : ('.'.repeat(dx) + line.replaceAll(' ', '.').padEnd(w, '.')).padEnd(cols, '.');
  });
}

/** Jedno uderzenie EKG i płaska linia jako maska tekstowa cols×rows (`#` = zapis). */
export function ekgLines(cols: number, rows: number): string[] {
  const base = Math.round(rows * .62);
  const on = polyline([[0, base], ...beat(2, base, rows * .38 / 8), [cols - 1, base]]);
  return Array.from({ length: rows }, (_, r) => Array.from({ length: cols }, (_, c) => (on.has(`${c},${r}`) ? '#' : '.')).join(''));
}
