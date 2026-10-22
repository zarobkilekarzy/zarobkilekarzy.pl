/**
 * Obrazek z wynikiem testu (PNG) rysowany w przeglądarce na <canvas> — bez serwera i bez danych
 * o czytelniku. Dwa formaty jak infografiki: pion 1080×1350 (telefon: relacje, komunikatory, posty)
 * i poziom 1200×630 (X, Facebook z komputera). Układ jak karty OG (lib/og/render.ts): logo, etykieta
 * w kobalcie, duża liczba, linia i stopka monospace. Obrazek jest zawsze jasny — kolory to dzienne
 * wartości tokenów z styles/tokens.css. Pobranie i podgląd przez data: URL (nie fetch(data:) — CSP connect-src).
 */
import type { TestResult } from '@/lib/egzamin/types';
import { formatPL } from '@/lib/format';

export type ShareFormat = 'pion' | 'poziom';

export const SHARE_FORMATS = {
  pion: { width: 1080, height: 1350 },
  poziom: { width: 1200, height: 630 },
} as const;

export interface ShareImageInput {
  format: ShareFormat;
  /** „LEK · jesień 2026 · Pełny egzamin” */
  eyebrow: string;
  /** „Mój wynik z próbnego egzaminu LEK” */
  headline: string;
  result: TestResult;
  /** próg jako ułamek (0,56) */
  threshold: number;
  /** pełny egzamin: „Zdany”; inne tryby: „Powyżej progu” */
  exam: boolean;
  fields: { label: string; share: number; average: number | null }[];
  agent: boolean;
}

// Dzienne wartości tokenów (tokens.css)
const C = {
  bg: '#FFFFFF', blue: '#2664EC', ink: '#040B1B', text: '#4B5466', muted: '#666E80', line: '#E6E9EF',
  soft: '#F6F7FA', chart: '#A3ADBD', ok: '#0F7B4F', okBg: '#E7F5EE', bad: '#B42318', badBg: '#FDECEA', amber: '#8A5A00',
};

/** Rozmieszczenie elementów w danym formacie (y = linia bazowa tekstu, chyba że opisano inaczej). */
const G = {
  poziom: {
    padX: 64,
    logo: { top: 50, size: 30, gap: 14, name: 26, nameY: 75 },
    verdict: { top: 46, h: 36, font: 15, y: 69, spacing: 1.2 },
    eyebrow: { y: 152, square: 10, font: 16, spacing: 1.3 },
    headline: { y: 206, font: 32, w: 580 },
    big: { x: -6, y: 342, font: 140, unit: 68, gap: 4 },
    points: { y: 386, font: 24 },
    scale: { y: 446, w: 520, h: 12, up: 10, down: 22, font: 15, below: 42, above: 18, ticks: [1.5, 2, 3], dash: [4, 3] },
    fields: { x: 680, head: 152, headFont: 14, top: 190, area: 330, step: 36, font: 16, val: 15, bar: 8, valW: 70 },
    tiles: { x: 680, top: 170, row: 150, label: 13, labelY: 32, value: 64, valueY: 100 },
    foot: { line: 548, y: 588, font: 15 },
  },
  pion: {
    padX: 72,
    logo: { top: 64, size: 40, gap: 18, name: 34, nameY: 97 },
    verdict: { top: 62, h: 44, font: 18, y: 90, spacing: 1.4 },
    eyebrow: { y: 204, square: 12, font: 19, spacing: 1.5 },
    headline: { y: 266, font: 42, w: 936 },
    big: { x: -8, y: 498, font: 230, unit: 110, gap: 6 },
    points: { y: 554, font: 30 },
    scale: { y: 650, w: 936, h: 16, up: 12, down: 28, font: 18, below: 54, above: 22, ticks: [2, 2.5, 4], dash: [5, 4] },
    fields: { x: 72, head: 782, headFont: 16, top: 830, area: 380, step: 54, font: 20, val: 19, bar: 10, valW: 90 },
    tiles: { x: 72, top: 790, row: 210, label: 15, labelY: 36, value: 84, valueY: 120 },
    foot: { line: 1250, y: 1298, font: 17 },
  },
};

/** Stos fontu z Fonts API Astro (zmienna CSS z nazwą rodziny i zapasowymi). */
const stack = (cssVar: string, fallback: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim() || fallback;

export async function drawShareImage(input: ShareImageInput): Promise<HTMLCanvasElement> {
  const DISPLAY = stack('--font-inter-tight', '"Helvetica Neue", Arial, sans-serif');
  const BODY = stack('--font-plex-sans', '"Helvetica Neue", Arial, sans-serif');
  const MONO = stack('--font-plex-mono', 'Menlo, monospace');
  try {
    await Promise.all([`300 140px ${DISPLAY}`, `500 32px ${DISPLAY}`, `500 26px ${DISPLAY}`, `400 20px ${BODY}`, `400 15px ${MONO}`, `500 15px ${MONO}`]
      .map((f) => document.fonts.load(f, 'ąęłóśżź%0123456789')));
  } catch { /* czcionki systemowe */ }

  const { result: r, threshold } = input;
  const L = G[input.format];
  const { width: W, height: H } = SHARE_FORMATS[input.format];
  const PAD_X = L.padX;
  const you = r.max ? r.points / r.max : 0;
  const avg = r.max ? r.average / r.max : 0;

  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d')!;
  const text = (s: string, x: number, y: number, font: string, color: string, align: CanvasTextAlign = 'left') => {
    g.font = font; g.fillStyle = color; g.textAlign = align; g.fillText(s, x, y);
    return g.measureText(s).width;
  };
  const fit = (s: string, max: number) => {
    if (g.measureText(s).width <= max) return s;
    while (s.length > 1 && g.measureText(`${s}…`).width > max) s = s.slice(0, -1);
    return `${s}…`;
  };
  const tracked = (s: string, x: number, y: number, font: string, color: string, spacing: number) => {
    g.font = font; g.fillStyle = color; g.textAlign = 'left';
    for (const ch of s) { g.fillText(ch, x, y); x += g.measureText(ch).width + spacing; }
    return x;
  };

  g.fillStyle = C.bg; g.fillRect(0, 0, W, H);

  // Logo: kwadrat z linią EKG (icons.ts → logo) + nazwa
  const lg = L.logo;
  g.save();
  g.translate(PAD_X, lg.top); g.scale(lg.size / 24, lg.size / 24);
  g.fillStyle = C.blue; g.fillRect(0, 0, 24, 24);
  g.strokeStyle = '#fff'; g.lineWidth = 2; g.miterLimit = 5;
  g.stroke(new Path2D('M0 14H7.5L10 5.5 13.5 18.5 15.5 14H24'));
  g.restore();
  const nameX = PAD_X + lg.size + lg.gap;
  const nameW = text('zarobkilekarzy', nameX, lg.nameY, `500 ${lg.name}px ${DISPLAY}`, C.ink);
  text('.pl', nameX + nameW, lg.nameY, `500 ${lg.name}px ${DISPLAY}`, C.muted);

  // Werdykt w prawym górnym rogu
  const vd = L.verdict;
  const verdict = (r.passed ? (input.exam ? 'Zdany' : 'Powyżej progu') : 'Poniżej progu') + ` · próg ${formatPL(threshold * 100, 0)}%`;
  g.font = `500 ${vd.font}px ${MONO}`;
  const vw = [...verdict.toUpperCase()].reduce((w, ch) => w + g.measureText(ch).width + vd.spacing, 0) + 28;
  g.fillStyle = r.passed ? C.okBg : C.badBg; g.fillRect(W - PAD_X - vw, vd.top, vw, vd.h);
  tracked(verdict.toUpperCase(), W - PAD_X - vw + 14, vd.y, `500 ${vd.font}px ${MONO}`, r.passed ? C.ok : C.bad, vd.spacing);

  // Etykieta: egzamin · sesja · tryb
  const eb = L.eyebrow;
  g.fillStyle = C.blue; g.fillRect(PAD_X, eb.y - eb.square - 1, eb.square, eb.square);
  tracked(input.eyebrow.toUpperCase(), PAD_X + eb.square + 12, eb.y, `500 ${eb.font}px ${MONO}`, C.blue, eb.spacing);

  // Nagłówek i duży wynik
  g.font = `500 ${L.headline.font}px ${DISPLAY}`;
  text(fit(input.headline, L.headline.w), PAD_X, L.headline.y, g.font, C.ink);
  const bg = L.big;
  const pctW = text(formatPL(you * 100, 1), PAD_X + bg.x, bg.y, `300 ${bg.font}px ${DISPLAY}`, C.ink);
  text('%', PAD_X + bg.x + pctW + bg.gap, bg.y, `300 ${bg.unit}px ${DISPLAY}`, C.blue);
  text(`${r.points} / ${r.max} pkt`, PAD_X, L.points.y, `400 ${L.points.font}px ${BODY}`, C.text);

  // Skala 0–100% z progiem i przeciętnym zdającym
  const sc = L.scale;
  const SX = PAD_X, SW = sc.w, SY = sc.y;
  g.fillStyle = C.soft; g.fillRect(SX, SY, SW, sc.h);
  g.strokeStyle = C.line; g.lineWidth = 1; g.strokeRect(SX + 0.5, SY + 0.5, SW - 1, sc.h - 1);
  g.fillStyle = r.passed ? C.blue : C.bad; g.fillRect(SX, SY, SW * you, sc.h);
  const tick = (v: number, color: string, width: number, dashed = false) => {
    const x = Math.round(SX + SW * v) + 0.5;
    g.strokeStyle = color; g.lineWidth = width; g.setLineDash(dashed ? sc.dash : []);
    g.beginPath(); g.moveTo(x, SY - sc.up); g.lineTo(x, SY + sc.down); g.stroke(); g.setLineDash([]);
    return x;
  };
  // Etykiety pod osią: wyśrodkowane pod kreską; gdy dwie się stykają — lewa na lewo od swojej kreski, prawa na prawo
  const [thrW, avgW, youTickW] = sc.ticks;
  const below = [
    { v: threshold, label: `próg ${formatPL(threshold * 100, 0)}%`, color: C.text, x: tick(threshold, C.ink, thrW, true), w: 0 },
    ...(r.max ? [{ v: avg, label: `przeciętny ${formatPL(avg * 100, 0)}%`, color: C.amber, x: tick(avg, C.amber, avgW), w: 0 }] : []),
  ].sort((a, b) => a.v - b.v);
  g.font = `400 ${sc.font}px ${MONO}`;
  for (const b of below) b.w = g.measureText(b.label).width;
  const clamp = (x: number, w: number) => Math.min(Math.max(x, SX), SX + SW - w);
  const centred = below.map((b) => clamp(b.x - b.w / 2, b.w));
  const clash = below.length === 2 && centred[0] + below[0].w + 12 > centred[1];
  below.forEach((b, k) => {
    const x = !clash ? centred[k] : k === 0 ? clamp(b.x - b.w - 6, b.w) : clamp(b.x + 6, b.w);
    text(b.label, x, SY + sc.below, `400 ${sc.font}px ${MONO}`, b.color);
  });
  const youX = tick(you, C.ink, youTickW);
  g.font = `500 ${sc.font}px ${MONO}`;
  const youLabel = `Ty ${formatPL(you * 100, 0)}%`;
  const youW = g.measureText(youLabel).width;
  text(youLabel, clamp(youX - youW / 2, youW), SY - sc.above, g.font, C.ink);

  // Dziedziny albo kafelki: w poziomie prawa kolumna, w pionie pod skalą na całą szerokość
  if (input.fields.length > 1) {
    const fl = L.fields;
    const RX = fl.x, RW = W - PAD_X - RX;
    tracked('WEDŁUG DZIEDZIN', RX, fl.head, `500 ${fl.headFont}px ${MONO}`, C.muted, 1.2);
    const rows = input.fields.slice(0, 10);
    const step = Math.min(fl.step, fl.area / rows.length);
    let y = fl.top;
    for (const f of rows) {
      g.font = `400 ${fl.font}px ${BODY}`;
      text(fit(f.label, RW - fl.valW), RX, y, g.font, C.ink);
      text(`${formatPL(f.share * 100, 0)}%`, RX + RW, y, `500 ${fl.val}px ${MONO}`, C.ink, 'right');
      g.fillStyle = C.soft; g.fillRect(RX, y + fl.bar, RW, fl.bar);
      g.fillStyle = f.share < threshold ? C.bad : C.chart; g.fillRect(RX, y + fl.bar, Math.max(2, RW * f.share), fl.bar);
      if (f.average !== null) { g.fillStyle = C.amber; g.fillRect(Math.round(RX + RW * f.average) - 1, y + fl.bar / 2, 2, fl.bar * 2); }
      y += step;
    }
  } else {
    const tl = L.tiles;
    const RX = tl.x, RW = W - PAD_X - RX;
    const tiles: [string, string, string][] = [
      ['Dobrze', String(r.correct), C.ok], ['Źle', String(r.wrong), C.bad],
      ['Bez odpowiedzi', String(r.blank), C.ink], ['Przeciętny zdający', r.max ? `${formatPL(avg * 100, 0)}%` : '—', C.amber],
    ];
    tiles.forEach(([label, value, color], i) => {
      const x = RX + (i % 2) * (RW / 2), y = tl.top + Math.floor(i / 2) * tl.row;
      g.fillStyle = C.line; g.fillRect(x, y, RW / 2 - 24, 1);
      tracked(label.toUpperCase(), x, y + tl.labelY, `500 ${tl.label}px ${MONO}`, C.muted, 1.1);
      text(value, x, y + tl.valueY, `300 ${tl.value}px ${DISPLAY}`, color);
    });
  }

  // Stopka
  const ft = L.foot;
  g.fillStyle = C.line; g.fillRect(PAD_X, ft.line, W - 2 * PAD_X, 1);
  text(input.agent ? 'Rozwiązane z asystentem AI · pytania z jawnej bazy CEM' : 'Pytania i statystyka sali z jawnej bazy CEM',
    PAD_X, ft.y, `400 ${ft.font}px ${MONO}`, input.agent ? C.amber : C.muted);
  text(`${location.host}/egzamin`, W - PAD_X, ft.y, `500 ${ft.font}px ${MONO}`, C.blue, 'right');
  return c;
}

/** Canvas → plik PNG do navigator.share (null, gdy przeglądarka nie umie). */
export const canvasFile = (c: HTMLCanvasElement, name: string) =>
  new Promise<File | null>((ok) => c.toBlob((b) => ok(b ? new File([b], name, { type: 'image/png' }) : null), 'image/png'));
