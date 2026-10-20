/**
 * Wykresy do obrazków OG jako gotowe <svg> (media „panels”, lib/og/render.ts) w dziennych barwach serwisu.
 * Podpisy to <text class="c-label …"> — szablon przepisuje je na tekst Satori, więc mają krój serwisu:
 * `--strong` (atrament), `--blue` (kobalt), `--big` (duża liczba krojem tytułowym).
 */
import { tokenColor } from '@/lib/tokens';

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

/* ---------- Postulat: kawałki z kilku placówek składają się w jedną sumę ---------- */

/**
 * Schemat bez kwot: umowy jednej osoby w kilku placówkach (każda widzi tylko swoją), pod spodem te same
 * odcinki złożone w jeden pasek — suma pod identyfikatorem zamiast zaczernionego nazwiska.
 */
export function sumSchema(width: number, height: number, pieces: { label: string; share: number }[], id: string): string {
  const total = pieces.reduce((a, p) => a + p.share, 0);
  const rowH = 80;
  const barH = 22;
  const sumY = height - 64;
  const personY = sumY - 52;
  let s = label(0, 14, 'Każda placówka widzi swoją część');
  let x = 0;
  pieces.forEach((p, i) => {
    const w = (p.share / total) * width;
    const y = 52 + i * rowH;
    s += label(0, y, p.label, ['strong']);
    s += `<rect x="${f1(x)}" y="${y + 10}" width="${f1(w - 4)}" height="${barH}" fill="${c('chart')}"/>`;
    // prowadnica do miejsca tego kawałka w sumie
    s += `<line x1="${f1(x + 1)}" x2="${f1(x + 1)}" y1="${y + 10 + barH}" y2="${sumY}" stroke="${c('line-2')}" stroke-width="1.5" stroke-dasharray="2 4"/>`;
    x += w;
  });
  // osoba: zaczernione nazwisko → identyfikator
  s += `<rect x="0" y="${personY - 17}" width="150" height="22" fill="${c('ink')}"/>`;
  s += `<path d="M164,${personY - 6}H204M197,${personY - 13}L205,${personY - 6}L197,${personY + 1}" fill="none" stroke="${c('muted')}" stroke-width="2" stroke-linejoin="miter"/>`;
  s += label(218, personY + 4, id, ['big', 'blue']);
  // suma: te same odcinki obok siebie, w kobalcie
  x = 0;
  pieces.forEach((p, i) => {
    const w = (p.share / total) * width;
    s += `<rect x="${f1(x)}" y="${sumY}" width="${f1(w - (i < pieces.length - 1 ? 4 : 0))}" height="30" fill="${c('blue')}"/>`;
    x += w;
  });
  s += label(0, sumY + 54, 'Jedna suma, co kwartał, bez nazwiska', ['blue']);
  return s;
}
