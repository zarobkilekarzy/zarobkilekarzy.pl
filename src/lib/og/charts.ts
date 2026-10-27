/**
 * Wykresy do obrazków OG jako gotowe <svg> (media „panels”, lib/og/render.ts) w dziennych barwach serwisu.
 * Podpisy to <text class="c-label …"> — szablon przepisuje je na tekst Satori, więc mają krój serwisu:
 * `--strong` (atrament), `--blue` (kobalt), `--big` (duża liczba krojem tytułowym).
 */
import { tokenColor } from '@/lib/tokens';
import { GEOMETRY } from '@/lib/siatka';

const c = (name: string) => tokenColor(name, false);
const f1 = (n: number) => n.toFixed(1);
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

export const label = (x: number, y: number, text: string, mods: string[] = [], anchor?: 'middle' | 'end') =>
  `<text class="${['c-label', ...mods.map((m) => `c-label--${m}`)].join(' ')}" x="${f1(x)}" y="${f1(y)}"${anchor ? ` text-anchor="${anchor}"` : ''}>${esc(text)}</text>`;

export const svg = (width: number, height: number, body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${body}</svg>`;

/* ---------- Wykres liniowy: ten sam kształt danych co components/budzet/IndexChart ---------- */

export interface LinePoint { x: number; v: number; gapBefore?: boolean }
export interface LineSeries {
  label: string;
  tone: 'accent' | 'data' | 'ref';
  end: string;
  labelShift?: number;
  markers?: boolean;
  points: LinePoint[];
}
export interface LineChartData {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  ticks: number[];
  series: LineSeries[];
  /** rok bazowy indeksu: linia 100 wyróżniona */
  base?: number;
}

const TONE = {
  accent: { stroke: () => c('blue'), width: 3.5, dash: '', text: 'blue' },
  data: { stroke: () => c('chart'), width: 2.5, dash: '', text: 'strong' },
  ref: { stroke: () => c('muted'), width: 2, dash: '5 5', text: '' },
} as const;

/** Linie z podpisami na końcach (wartość + nazwa serii) zamiast legendy; `years` = podpisy osi czasu. */
export function lineChart(d: LineChartData, width: number, height: number, years: number[]): string {
  const RIGHT = 160;
  // podpisy osi w lewym marginesie; rok bazowy indeksu stoi w nagłówku panelu
  const x0 = 38, x1 = width - RIGHT, yTop = 22, y0 = height - 24;
  const X = (x: number) => x0 + ((x - d.xMin) / (d.xMax - d.xMin)) * (x1 - x0);
  const Y = (v: number) => y0 - ((v - d.yMin) / (d.yMax - d.yMin)) * (y0 - yTop);

  let s = '';
  for (const t of d.ticks) {
    const isBase = d.base !== undefined && t === 100;
    s += `<line x1="${x0}" x2="${x1}" y1="${f1(Y(t))}" y2="${f1(Y(t))}" stroke="${c(isBase ? 'line-2' : 'line')}" stroke-width="${isBase ? 1.5 : 1}"/>`;
    s += label(x0 - 8, Y(t) + 4, String(t), isBase ? ['strong'] : [], 'end');
  }
  s += `<line x1="${x0}" x2="${x1}" y1="${y0}" y2="${y0}" stroke="${c('line-2')}"/>`;
  years.forEach((y, i) => s += label(X(y + 0.5), y0 + 18, String(y), [], i === years.length - 1 && X(y + 0.5) > x1 - 20 ? 'end' : 'middle'));

  // akcent na wierzchu
  const order = [...d.series].sort((a, b) => Number(a.tone === 'accent') - Number(b.tone === 'accent'));
  for (const ser of order) {
    const t = TONE[ser.tone];
    const stroke = t.stroke();
    const attrs = `fill="none" stroke="${stroke}" stroke-width="${t.width}" stroke-linejoin="round" stroke-linecap="round"`;
    let run = '';
    ser.points.forEach((p, i) => {
      const xy = `${f1(X(p.x))},${f1(Y(p.v))}`;
      if (i > 0 && p.gapBefore) {
        const prev = ser.points[i - 1];
        s += `<path d="M${f1(X(prev.x))},${f1(Y(prev.v))}L${xy}" ${attrs} stroke-dasharray="3 5"/>`;
        s += `<path d="${run}" ${attrs}${t.dash ? ` stroke-dasharray="${t.dash}"` : ''}/>`;
        run = `M${xy}`;
      } else run += `${i ? 'L' : 'M'}${xy}`;
    });
    s += `<path d="${run}" ${attrs}${t.dash ? ` stroke-dasharray="${t.dash}"` : ''}/>`;
    if (ser.markers) for (const p of ser.points) s += `<circle cx="${f1(X(p.x))}" cy="${f1(Y(p.v))}" r="4" fill="${stroke}" stroke="#fff" stroke-width="1.5"/>`;

    const last = ser.points.at(-1)!;
    const ly = Y(last.v) + (ser.labelShift ?? 0) * 22;
    s += label(x1 + 12, ly + 6, ser.end, ['big', ...(t.text ? [t.text] : [])]);
    s += label(x1 + 12, ly + 24, ser.label);
  }
  return s;
}

/* ---------- Kolumny: wartości w jednej skali od zera ---------- */

export interface Column {
  label: string;
  value: number;
  /** liczba nad kolumną; bez niej kolumna bez podpisu wartości */
  display?: string;
  highlight?: boolean;
}

export function columnChart(cols: Column[], width: number, height: number, max = Math.max(...cols.map((k) => k.value))): string {
  const yTop = 26, y0 = height - 24;
  const slot = width / cols.length;
  const w = Math.min(slot * 0.72, 46);
  const Y = (v: number) => y0 - (v / max) * (y0 - yTop);
  let s = '';
  cols.forEach((k, i) => {
    const cx = slot * i + slot / 2;
    const y = Y(k.value);
    s += `<rect x="${f1(cx - w / 2)}" y="${f1(y)}" width="${f1(w)}" height="${f1(y0 - y)}" fill="${c(k.highlight ? 'blue' : 'chart')}"/>`;
    if (k.display) s += label(cx, y - 8, k.display, k.highlight ? ['blue'] : ['strong'], 'middle');
    if (k.label) s += label(cx, y0 + 18, k.label, k.highlight ? ['blue'] : [], 'middle');
  });
  s += `<line x1="0" x2="${width}" y1="${y0}" y2="${y0}" stroke="${c('line-2')}"/>`;
  return s;
}

/* ---------- COVID-19: wirus ---------- */

/**
 * Ilustracja wirusa na kwadracie `size`: kobaltowa kula z dwunastoma kolcami na polu z plusów (siatka 20×20,
 * geometria lib/siatka); w kuli biała siatka jak DotGrid na kobalcie, z kilkoma zapalonymi polami.
 */
export function virus(size: number): string {
  const cell = size / 20, mid = size / 2, R = cell * 6;
  const stemEnd = R + cell * 1.7, headR = cell * 0.62, spikes = 12;
  // każde zapalone pole w innym wierszu, żeby nie złożyły się w twarz
  const lit = new Set(['9,7', '12,8', '14,9', '7,10', '11,11', '13,12', '9,13']);
  const arm = cell * GEOMETRY.arm, stroke = f1(cell * GEOMETRY.stroke);
  const plus = (x: number, y: number) => `M${f1(x)} ${f1(y - arm)}v${f1(2 * arm)}M${f1(x - arm)} ${f1(y)}h${f1(2 * arm)}`;
  let field = '', inner = '', dots = '', spk = '';
  for (let r = 0; r < 20; r++) for (let q = 0; q < 20; q++) {
    const x = q * cell + cell / 2, y = r * cell + cell / 2, d = Math.hypot(x - mid, y - mid);
    if (d < R - cell * 0.55) {
      if (lit.has(`${q},${r}`)) dots += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(cell * GEOMETRY.on)}" fill="#fff"/>`;
      else inner += plus(x, y);
    } else if (d > stemEnd + headR + cell * 0.4) field += plus(x, y);
  }
  for (let k = 0; k < spikes; k++) {
    const a = ((k + 0.5) * 2 * Math.PI) / spikes;
    const at = (d: number) => [f1(mid + d * Math.cos(a)), f1(mid + d * Math.sin(a))];
    const [x1, y1] = at(R - 4), [x2, y2] = at(stemEnd), [hx, hy] = at(stemEnd + headR * 0.6);
    spk += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c('blue')}" stroke-width="${f1(cell * 0.3)}"/>`;
    spk += `<circle cx="${hx}" cy="${hy}" r="${f1(headR)}" fill="${c('blue')}"/>`;
  }
  return `<path d="${field}" stroke="${c('blue')}" stroke-opacity=".4" stroke-width="${stroke}" fill="none"/>${spk}`
    + `<circle cx="${f1(mid)}" cy="${f1(mid)}" r="${f1(R)}" fill="${c('blue')}"/>`
    + `<path d="${inner}" stroke="#fff" stroke-opacity=".45" stroke-width="${stroke}" fill="none"/>${dots}`;
}

/* ---------- Oś etapów: ten sam kształt co blocks/StatusTrack (oś pionowa) ---------- */

export interface TrackRow {
  state: 'done' | 'current' | 'next';
  /** linia nad etykietą: stan, ewentualnie z datą */
  kicker: string;
  label: string;
  note?: string;
}

/**
 * Etapy jeden pod drugim, znacznik z lewej: zakończony = pełny kwadrat w kobalcie, bieżący = obrys z poświatą,
 * przed nami = szary obrys. Odcinek do następnego etapu niebieski, gdy etap jest za nami.
 */
export function stageTrack(rows: TrackRow[], width: number, height: number): string {
  const step = height / rows.length, m = 14, x = m / 2 + 4, text = 40;
  let s = '';
  rows.forEach((r, i) => {
    const y = i * step + 4;
    if (i < rows.length - 1) s += `<line x1="${x}" x2="${x}" y1="${f1(y + m)}" y2="${f1(y + step)}" stroke="${c(r.state === 'done' ? 'blue' : 'line-2')}" stroke-width="2"/>`;
    if (r.state === 'current') s += `<rect x="${x - m / 2 - 5}" y="${f1(y - 5)}" width="${m + 10}" height="${m + 10}" fill="${c('blue-100')}"/>`;
    const filled = r.state === 'done';
    s += `<rect x="${x - m / 2 + 1}" y="${f1(y + 1)}" width="${m - 2}" height="${m - 2}" fill="${filled ? c('blue') : '#fff'}" stroke="${c(r.state === 'next' ? 'line-2' : 'blue')}" stroke-width="2"/>`;
    s += label(text, y + 11, r.kicker.toUpperCase(), r.state === 'current' ? ['blue'] : []);
    s += label(text, y + 44, r.label, ['big', ...(r.state === 'current' ? ['blue'] : r.state === 'done' ? ['strong'] : [])]);
    if (r.note) s += label(text, y + 68, r.note);
  });
  return s;
}
