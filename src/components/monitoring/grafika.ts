/**
 * Grafika placówki z monitoringu do udostępnienia (PNG), rysowana w przeglądarce na <canvas> —
 * bez serwera. Język wizualny infografik (lib/infografiki/render.ts): logo, nazwa jako tytuł, miara
 * w kobalcie, duże liczby, wiersze z paskami, stopka z adresem strony, źródłem i kodem QR.
 * Treść: fundusz płac, mediana i najwyższa wypłata, każda z pozycją na tle wszystkich list płac
 * (ten sam pasek co w szczegółach wiersza), oraz rozkład wypłat w przedziałach — od 500 tys. zł
 * w kobalcie, jak na stronie.
 *
 * Dwa formaty jak infografiki: pion 1080×1350 (Instagram, Facebook, X) i poziom 1200×675
 * (X, LinkedIn), każdy w wersji jasnej (białe tło jak obrazki OG) i ciemnej (nocne wartości tokenów).
 */
import { encode } from 'uqr';
import { formatPL, typo } from '@/lib/format';
import type { Payroll } from '@/lib/monitoring';

export type FormatKey = 'pion' | 'poziom';
export type ThemeKey = 'jasny' | 'ciemny';

export const FORMATS: Record<FormatKey, { width: number; height: number }> = {
  pion: { width: 1080, height: 1350 },
  poziom: { width: 1200, height: 675 },
};

type Metric = 'total' | 'median' | 'max';

export interface CardInput {
  /** numer sprawy w fedrowaniu */
  id: number;
  /** nazwa do wyświetlania */
  name: string;
  city: string;
  voivodeship: string;
  year: number;
  payroll: Payroll;
  /** etykiety przedziałów rozkładu i wyróżnienie przedziałów od 500 tys. zł */
  labels: string[];
  high: boolean[];
  /** wartości wśród wszystkich placówek z listą płac, rosnąco */
  dist: Record<Metric, number[]>;
  source: { name: string; monitoring: string };
  /** adres strony w stopce (bez https://) */
  page: string;
  /** adres w kodzie QR */
  link: string;
}

interface Palette { bg: string; ink: string; muted: string; line: string; line2: string; blue: string; chart: string; tick: string }

// Wartości tokenów z styles/tokens.css (dzień, noc); tło jasnej wersji białe jak obrazki OG,
// kreski placówek jak .mon-strip__ticks w MonitoringGrid.
const PALETTES: Record<ThemeKey, Palette> = {
  jasny: { bg: '#FFFFFF', ink: '#040B1B', muted: '#666E80', line: '#E6E9EF', line2: '#D5DAE2', blue: '#2664EC', chart: '#A3ADBD', tick: '#A7AEBB' },
  ciemny: { bg: '#0A0F1C', ink: '#EEF2F8', muted: '#8691A5', line: '#1E2638', line2: '#2C3549', blue: '#6E9BFF', chart: '#56627A', tick: '#6B7790' },
};
const LOGO_BLUE = '#2664EC'; // ikona logo ma stały kolor (icons.ts → logo)

/* ---------- formatowanie ---------- */

/** [liczba, jednostka]: 118 648 901 → [„118,6”, „mln zł”], 266 464 → [„266”, „tys. zł”] */
const money = (n: number): [string, string] =>
  n >= 1e6 ? [formatPL(n / 1e6, n >= 1e7 ? 1 : 2), 'mln zł'] : [formatPL(Math.round(n / 1e3)), 'tys. zł'];
const moneyText = (n: number) => money(n).join(' ');
const rankOf = (values: number[], v: number) => 1 + values.filter((x) => x > v).length;
const upper = (s: string) => s.toLocaleUpperCase('pl');

/** Tekst alternatywny podglądu — te same liczby co na grafice. */
export function cardAlt(c: CardInput): string {
  const p = c.payroll;
  const n = c.dist.total.length;
  const bins = c.labels.map((label, i) => `${label}: ${p.histogram[i]}`).join(', ');
  return `${c.name}, ${c.city}: roczne wypłaty brutto dla lekarzy w ${c.year} r. Fundusz płac ${moneyText(p.total)} (${rankOf(c.dist.total, p.total)}. miejsce wśród ${n} placówek), mediana ${moneyText(p.median)} (${rankOf(c.dist.median, p.median)}.), najwyższa wypłata ${moneyText(p.max)} (${rankOf(c.dist.max, p.max)}.). Lekarze według rocznej wypłaty: ${bins}.`;
}

/* ---------- tekst ---------- */

type Family = 'display' | 'body' | 'mono';

/** Stos fontu z Fonts API Astro (zmienna CSS z nazwą rodziny i zapasowymi) — jak share-image egzaminu. */
const stack = (cssVar: string, fallback: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim() || fallback;

class Pen {
  spacing = 0;
  /** ctx.letterSpacing nie wszędzie jest (starsze Safari) — bez niego odstępy znak po znaku */
  readonly native: boolean;
  constructor(
    readonly g: CanvasRenderingContext2D,
    readonly fonts: Record<Family, string>,
  ) {
    this.native = 'letterSpacing' in g;
  }

  /** krój; `tracking` w em, jak letter-spacing w CSS */
  set(family: Family, weight: number, size: number, tracking = 0) {
    this.g.font = `${weight} ${size}px ${this.fonts[family]}`;
    this.spacing = tracking * size;
    if (this.native) this.g.letterSpacing = `${this.spacing}px`;
    return this;
  }

  width(s: string) {
    const w = this.g.measureText(s).width;
    return this.native ? w : w + this.spacing * [...s].length;
  }

  text(s: string, x: number, y: number, color: string, align: 'left' | 'right' = 'left') {
    const g = this.g;
    g.fillStyle = color;
    g.textAlign = 'left';
    let cx = align === 'right' ? x - this.width(s) : x;
    if (this.native || !this.spacing) return g.fillText(s, cx, y);
    for (const ch of s) {
      g.fillText(ch, cx, y);
      cx += g.measureText(ch).width + this.spacing;
    }
  }

  /** Łamanie po spacjach (twarde spacje z typo() trzymają razem). */
  wrap(s: string, max: number): string[] {
    const lines: string[] = [];
    let line = '';
    for (const word of s.split(' ')) {
      const next = line ? `${line} ${word}` : word;
      if (line && this.width(next) > max) {
        lines.push(line);
        line = word;
      } else line = next;
    }
    if (line) lines.push(line);
    return lines;
  }

  /** Duża liczba z jednostką mniejszym stopniem na wspólnej linii bazowej (jak UNIT_SCALE w infografikach). */
  number([num, unit]: [string, string], x: number, y: number, size: number, color: string | null, align: 'left' | 'right' = 'left') {
    this.set('display', 300, size, -0.05);
    const nw = this.width(num);
    const gap = unit ? size * 0.09 : 0;
    this.set('display', 300, Math.round(size * 0.42), -0.02);
    const total = nw + gap + (unit ? this.width(unit) : 0);
    if (color === null) return total;
    const x0 = align === 'right' ? x - total : x;
    if (unit) this.text(unit, x0 + nw + gap, y, color);
    this.set('display', 300, size, -0.05).text(num, x0, y, color);
    return total;
  }
}

async function loadFonts(fonts: Record<Family, string>, sample: string) {
  const faces = [`300 80px ${fonts.display}`, `400 60px ${fonts.display}`, `500 26px ${fonts.display}`, `400 20px ${fonts.body}`, `400 16px ${fonts.mono}`, `500 16px ${fonts.mono}`];
  try {
    await Promise.all(faces.map((f) => document.fonts.load(f, `AaĄąĆćĘęŁłŃńÓóŚśŹźŻż0123456789„”–—%# ${sample}`)));
  } catch {
    /* czcionki systemowe */
  }
}

/* ---------- elementy ---------- */

/** Logo: kwadrat z linią EKG (icons.ts → logo) + nazwa serwisu. */
function logo(p: Pen, x: number, y: number, C: Palette) {
  const g = p.g;
  g.save();
  g.translate(x, y);
  g.scale(30 / 24, 30 / 24);
  g.fillStyle = LOGO_BLUE;
  g.fillRect(0, 0, 24, 24);
  g.strokeStyle = '#fff';
  g.lineWidth = 2;
  g.miterLimit = 5;
  g.stroke(new Path2D('M0 14H7.5L10 5.5 13.5 18.5 15.5 14H24'));
  g.restore();
  p.set('display', 500, 26, -0.03);
  p.text('zarobkilekarzy', x + 44, y + 25, C.ink);
  p.text('.pl', x + 44 + p.width('zarobkilekarzy'), y + 25, C.muted);
}

/**
 * Kod QR: zawsze ciemne moduły na białym — odwróconego kodu nie odczyta część skanerów, więc na
 * ciemnej grafice kod dostaje białe pole z marginesem (jak w infografikach).
 */
function qr(g: CanvasRenderingContext2D, url: string, x: number, y: number, size: number, night: boolean) {
  const { data, size: n } = encode(url, { ecc: 'M', border: 0 });
  const pad = night ? Math.round(size / 12) : 0;
  g.fillStyle = '#fff';
  g.fillRect(x, y, size, size);
  const m = (size - 2 * pad) / n;
  g.fillStyle = PALETTES.jasny.ink;
  data.forEach((row, r) =>
    row.forEach((on, c) => {
      if (on) g.fillRect(x + pad + c * m, y + pad + r * m, Math.ceil(m), Math.ceil(m));
    }),
  );
}

/** Pozycja na tle wszystkich list płac (wartości rosnąco): kreski = placówki, niebieska = ta. */
function strip(g: CanvasRenderingContext2D, values: number[], v: number, x: number, y: number, w: number, h: number, C: Palette) {
  const min = values[0];
  const span = values[values.length - 1] - min || 1;
  const sx = (n: number) => x + 2 + ((n - min) / span) * (w - 4);
  const mid = Math.round(y + h / 2);
  const tick = Math.round(h * 0.47);
  g.fillStyle = C.line2;
  g.fillRect(x, mid, w, 1);
  g.fillStyle = C.tick;
  for (const n of values) g.fillRect(sx(n) - 0.75, mid - tick / 2, 1.5, tick);
  g.fillStyle = C.blue;
  g.fillRect(Math.round(sx(v) - 2), y, 4, h);
}

/* ---------- geometria ---------- */

const G = {
  pion: {
    padX: 72, padY: 64, logoGap: 56, title: [64, 40], titleLines: 3, measure: 18, measureLH: 26,
    url: 19, src: 15, srcLH: 21, qr: 104, footPad: 22, gap: 48,
    kpi: { label: 15, num: 92, strip: 34, rank: 15 },
    hist: { head: 15, headH: 30, label: 23, num: 52, pct: 16, labelW: 250, numW: 120, pctW: 72, barGap: 24, rowMax: 72 },
  },
  poziom: {
    padX: 56, padY: 44, logoGap: 26, title: [40, 28], titleLines: 2, measure: 14, measureLH: 20,
    url: 15, src: 11.5, srcLH: 16, qr: 72, footPad: 14, gap: 26,
    kpi: { label: 12, num: 50, strip: 24, rank: 12, numW: 228, w: 500 },
    hist: { head: 12, headH: 24, label: 16, num: 30, pct: 12, labelW: 126, numW: 58, pctW: 44, barGap: 14, rowMax: 52 },
  },
};
type Geometry = (typeof G)['pion' | 'poziom'];

/** Logo, nazwa placówki (do 3 wierszy w pionie, 2 w poziomie) i miara. Zwraca dolną krawędź. */
function header(p: Pen, c: CardInput, g: Geometry, C: Palette, inner: number): number {
  logo(p, g.padX, g.padY, C);
  const [max, min] = g.title;
  let size = max;
  let lines: string[] = [];
  for (; size >= min; size -= 2) {
    p.set('display', 400, size, -0.035);
    lines = p.wrap(typo(c.name), inner);
    if (lines.length <= g.titleLines) break;
  }
  size = Math.max(size, min);
  const lh = Math.round(size * 1.06);
  let y = g.padY + 30 + g.logoGap + size * 0.8;
  lines.forEach((line, i) => p.text(line, g.padX, y + i * lh, C.ink));
  y += (lines.length - 1) * lh + size * 0.25 + g.measure + (g.measure > 16 ? 16 : 10);
  p.set('mono', 400, g.measure, 0.06);
  const measure = p.wrap(upper(`${c.city}, ${c.voivodeship} · roczne wypłaty brutto dla lekarzy w ${c.year} r.`), inner);
  measure.forEach((line, i) => p.text(line, g.padX, y + i * g.measureLH, C.blue));
  return y + (measure.length - 1) * g.measureLH + g.measure * 0.3;
}

/** Linia, adres strony, źródło z zastrzeżeniem i kod QR. Zwraca górną krawędź stopki. */
function footer(p: Pen, c: CardInput, g: Geometry, C: Palette, inner: number, height: number, night: boolean): number {
  const textW = inner - g.qr - 32;
  p.set('mono', 400, g.src);
  const src = p.wrap(
    typo(`Źródło: ${c.source.name}, monitoring „${c.source.monitoring}”, sprawa #${c.id}. Kwoty wypłacone przez tę jedną placówkę — lekarz pracujący w kilku miejscach ma tu tylko część dochodu.`),
    textW,
  );
  const textH = g.url * 1.15 + g.srcLH * 0.45 + src.length * g.srcLH;
  const blockH = Math.max(g.qr, textH);
  const top = height - g.padY - blockH - g.footPad;
  p.g.fillStyle = C.ink;
  p.g.fillRect(g.padX, top, inner, 1);
  const ty = top + g.footPad + (blockH - textH) / 2;
  p.set('mono', 400, g.url).text(c.page, g.padX, ty + g.url * 0.9, C.ink);
  p.set('mono', 400, g.src);
  src.forEach((line, i) => p.text(line, g.padX, ty + g.url * 1.15 + g.srcLH * 0.45 + g.src * 0.9 + i * g.srcLH, C.muted));
  qr(p.g, c.link, g.padX + inner - g.qr, top + g.footPad + (blockH - g.qr) / 2, g.qr, night);
  return top;
}

const KPIS: { metric: Metric; label: string; hi?: boolean }[] = [
  { metric: 'total', label: 'Fundusz płac lekarzy' },
  { metric: 'median', label: 'Mediana' },
  { metric: 'max', label: 'Najwyższa wypłata', hi: true },
];

/** „3. miejsce wśród 93 placówek” — numer miejsca mocniej. */
function rank(p: Pen, c: CardInput, m: Metric, hi: boolean, x: number, y: number, size: number, C: Palette) {
  const label = `${rankOf(c.dist[m], c.payroll[m])}.`;
  p.set('mono', 500, size).text(label, x, y, hi ? C.blue : C.ink);
  const w = p.width(label);
  p.set('mono', 400, size).text(` miejsce wśród ${c.dist[m].length} placówek`, x + w, y, C.muted);
}

/** Największy stopień, w którym wszystkie trzy liczby mieszczą się w `width`. */
function kpiSize(p: Pen, c: CardInput, max: number, width: number) {
  let size = max;
  while (size > 24 && KPIS.some((k) => p.number(money(c.payroll[k.metric]), 0, 0, size, null) > width)) size -= 2;
  return size;
}

/** Rozkład: wiersze = przedziały, liczba lekarzy i pasek we wspólnej skali, udział na końcu. */
function histogram(p: Pen, c: CardInput, h: Geometry['hist'], C: Palette, x: number, y: number, w: number, rowH: number) {
  const pay = c.payroll;
  const g = p.g;
  p.set('mono', 500, h.head, 0.06);
  p.text(upper(`Ilu z ${formatPL(pay.doctors)} lekarzy na liście dostało rocznie brutto`), x, y + h.head * 0.8, C.ink);
  p.text('UDZIAŁ', x + w, y + h.head * 0.8, C.muted, 'right');
  const top = Math.max(...pay.histogram);
  const barX = x + h.labelW + h.numW + h.barGap;
  const barW = w - h.labelW - h.numW - h.barGap - h.pctW;
  const num = Math.min(h.num, Math.round(rowH * 0.62));
  const barH = Math.round(rowH * 0.3);
  pay.histogram.forEach((n, i) => {
    const ry = y + h.headH + i * rowH;
    const mid = ry + rowH / 2;
    const hi = c.high[i];
    g.fillStyle = C.line;
    g.fillRect(x, Math.round(ry), w, 1);
    p.set('body', 400, h.label).text(c.labels[i], x, mid + h.label * 0.36, hi ? C.blue : C.ink);
    p.number([formatPL(n), ''], x + h.labelW + h.numW, mid + num * 0.36, num, n === 0 ? C.muted : hi ? C.blue : C.ink, 'right');
    if (n) {
      g.fillStyle = hi ? C.blue : C.chart;
      g.fillRect(barX, Math.round(mid - barH / 2), Math.max(4, (n / top) * barW), barH);
    }
    p.set('mono', 400, h.pct).text(`${Math.round((n / pay.doctors) * 100)}%`, x + w, mid + h.pct * 0.36, C.muted, 'right');
  });
}

/* ---------- układy ---------- */

/** Pion: trzy liczby w rzędzie (pod każdą pasek pozycji i miejsce), pod nimi rozkład. */
function bodyPion(p: Pen, c: CardInput, C: Palette, top: number, bottom: number, inner: number) {
  const g = G.pion;
  const k = g.kpi;
  const colW = inner / 3;
  const stripW = colW - 36;
  const size = kpiSize(p, c, k.num, stripW);
  const numBase = 20 + k.label + 18 + size * 0.72;
  const stripTop = numBase + size * 0.06 + 24;
  const kpiH = stripTop + k.strip + 16 + k.rank;

  const rows = c.payroll.histogram.length;
  const rowH = Math.max(44, Math.min(g.hist.rowMax, Math.floor((bottom - top - kpiH - g.hist.headH - 3 * g.gap) / rows)));
  const bodyH = kpiH + g.gap + g.hist.headH + rowH * rows;
  let y = top + (bottom - top - bodyH) / 2;

  p.g.fillStyle = C.line;
  p.g.fillRect(g.padX, Math.round(y), inner, 1);
  KPIS.forEach(({ metric, label, hi = false }, i) => {
    const x = g.padX + i * colW;
    p.set('mono', 500, k.label, 0.06).text(upper(label), x, y + 20 + k.label * 0.85, C.ink);
    p.number(money(c.payroll[metric]), x, y + numBase, size, hi ? C.blue : C.ink);
    strip(p.g, c.dist[metric], c.payroll[metric], x, y + stripTop, stripW, k.strip, C);
    rank(p, c, metric, hi, x, y + stripTop + k.strip + 16 + k.rank * 0.85, k.rank, C);
  });
  y += kpiH + g.gap;
  histogram(p, c, g.hist, C, g.padX, y, inner, rowH);
}

/** Poziom: po lewej trzy liczby jedna pod drugą (liczba | pasek pozycji), po prawej rozkład. */
function bodyPoziom(p: Pen, c: CardInput, C: Palette, top: number, bottom: number, inner: number) {
  const g = G.poziom;
  const k = g.kpi;
  const stripX = g.padX + k.numW + 16;
  const stripW = k.w - k.numW - 16;
  const size = kpiSize(p, c, k.num, k.numW - 8);
  const kh = (bottom - top) / KPIS.length;
  KPIS.forEach(({ metric, label, hi = false }, i) => {
    const y = top + i * kh;
    p.g.fillStyle = C.line;
    p.g.fillRect(g.padX, Math.round(y), k.w, 1);
    p.set('mono', 500, k.label, 0.06).text(upper(label), g.padX, y + 14 + k.label * 0.85, C.ink);
    const base = y + 14 + k.label + 10 + size * 0.72;
    p.number(money(c.payroll[metric]), g.padX, base, size, hi ? C.blue : C.ink);
    const stripTop = base - size * 0.36 - k.strip / 2 - 4;
    strip(p.g, c.dist[metric], c.payroll[metric], stripX, stripTop, stripW, k.strip, C);
    rank(p, c, metric, hi, stripX, stripTop + k.strip + 10 + k.rank * 0.85, k.rank, C);
  });
  const hx = g.padX + k.w + 48;
  const rows = c.payroll.histogram.length;
  const rowH = Math.min(g.hist.rowMax, (bottom - top - g.hist.headH) / rows);
  histogram(p, c, g.hist, C, hx, top, g.padX + inner - hx, rowH);
}

/** Rysuje grafikę na podanym canvasie (ustawia jego wymiary). */
export async function drawCard(canvas: HTMLCanvasElement, c: CardInput, format: FormatKey, theme: ThemeKey) {
  const fonts: Record<Family, string> = {
    display: stack('--font-inter-tight', '"Helvetica Neue", Arial, sans-serif'),
    body: stack('--font-plex-sans', '"Helvetica Neue", Arial, sans-serif'),
    mono: stack('--font-plex-mono', 'Menlo, monospace'),
  };
  await loadFonts(fonts, c.name);

  const { width, height } = FORMATS[format];
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  const p = new Pen(ctx, fonts);
  const C = PALETTES[theme];
  const g = G[format];
  const inner = width - 2 * g.padX;

  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, width, height);
  const headBottom = header(p, c, g, C, inner);
  const footTop = footer(p, c, g, C, inner, height, theme === 'ciemny');
  if (format === 'pion') bodyPion(p, c, C, headBottom, footTop, inner);
  else bodyPoziom(p, c, C, headBottom + g.gap, footTop - g.gap, inner);
}

/** Canvas → plik PNG (do pobrania i do navigator.share). */
export const canvasFile = (canvas: HTMLCanvasElement, name: string) =>
  new Promise<File | null>((ok) => canvas.toBlob((b) => ok(b ? new File([b], name, { type: 'image/png' }) : null), 'image/png'));
