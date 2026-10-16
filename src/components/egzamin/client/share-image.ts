/**
 * Obrazek z wynikiem testu (1200×630, PNG) rysowany w przeglądarce na <canvas> — bez serwera
 * i bez danych o czytelniku. Układ jak karty OG (lib/og/render.ts): logo, etykieta w kobalcie,
 * duża liczba, linia i stopka monospace. Obrazek jest zawsze jasny — kolory to dzienne wartości
 * tokenów z styles/tokens.css. Pobranie i podgląd przez data: URL (nie fetch(data:) — CSP connect-src).
 */
import type { TestResult } from '@/lib/egzamin/types';
import { formatPL } from '@/lib/format';

export interface ShareImageInput {
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

const W = 1200, H = 630, PAD_X = 64;
// Dzienne wartości tokenów (tokens.css)
const C = {
  bg: '#FFFFFF', blue: '#2664EC', ink: '#040B1B', text: '#4B5466', muted: '#666E80', line: '#E6E9EF',
  soft: '#F6F7FA', chart: '#A3ADBD', ok: '#0F7B4F', okBg: '#E7F5EE', bad: '#B42318', badBg: '#FDECEA', amber: '#8A5A00',
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
  g.save();
  g.translate(PAD_X, 50); g.scale(30 / 24, 30 / 24);
  g.fillStyle = C.blue; g.fillRect(0, 0, 24, 24);
  g.strokeStyle = '#fff'; g.lineWidth = 2; g.miterLimit = 5;
  g.stroke(new Path2D('M0 14H7.5L10 5.5 13.5 18.5 15.5 14H24'));
  g.restore();
  const nameW = text('zarobkilekarzy', PAD_X + 44, 75, `500 26px ${DISPLAY}`, C.ink);
  text('.pl', PAD_X + 44 + nameW, 75, `500 26px ${DISPLAY}`, C.muted);

  // Werdykt w prawym górnym rogu
  const verdict = (r.passed ? (input.exam ? 'Zdany' : 'Powyżej progu') : 'Poniżej progu') + ` · próg ${formatPL(threshold * 100, 0)}%`;
  g.font = `500 15px ${MONO}`;
  const vw = [...verdict.toUpperCase()].reduce((w, ch) => w + g.measureText(ch).width + 1.2, 0) + 28;
  g.fillStyle = r.passed ? C.okBg : C.badBg; g.fillRect(W - PAD_X - vw, 46, vw, 36);
  tracked(verdict.toUpperCase(), W - PAD_X - vw + 14, 69, `500 15px ${MONO}`, r.passed ? C.ok : C.bad, 1.2);

  // Etykieta: egzamin · sesja · tryb
  g.fillStyle = C.blue; g.fillRect(PAD_X, 141, 10, 10);
  tracked(input.eyebrow.toUpperCase(), PAD_X + 22, 152, `500 16px ${MONO}`, C.blue, 1.3);

  // Nagłówek i duży wynik
  const LEFT_W = 520;
  g.font = `500 32px ${DISPLAY}`;
  text(fit(input.headline, LEFT_W + 60), PAD_X, 206, g.font, C.ink);
  const pctW = text(formatPL(you * 100, 1), PAD_X - 6, 342, `300 140px ${DISPLAY}`, C.ink);
  text('%', PAD_X - 6 + pctW + 4, 342, `300 68px ${DISPLAY}`, C.blue);
  text(`${r.points} / ${r.max} pkt`, PAD_X, 386, `400 24px ${BODY}`, C.text);

  // Skala 0–100% z progiem i przeciętnym zdającym
  const SX = PAD_X, SW = LEFT_W, SY = 446;
  g.fillStyle = C.soft; g.fillRect(SX, SY, SW, 12);
  g.strokeStyle = C.line; g.lineWidth = 1; g.strokeRect(SX + 0.5, SY + 0.5, SW - 1, 11);
  g.fillStyle = r.passed ? C.blue : C.bad; g.fillRect(SX, SY, SW * you, 12);
  const tick = (v: number, color: string, width: number, dashed = false) => {
    const x = Math.round(SX + SW * v) + 0.5;
    g.strokeStyle = color; g.lineWidth = width; g.setLineDash(dashed ? [4, 3] : []);
    g.beginPath(); g.moveTo(x, SY - 10); g.lineTo(x, SY + 22); g.stroke(); g.setLineDash([]);
    return x;
  };
  // Etykiety pod osią: wyśrodkowane pod kreską; gdy dwie się stykają — lewa na lewo od swojej kreski, prawa na prawo
  const below = [
    { v: threshold, label: `próg ${formatPL(threshold * 100, 0)}%`, color: C.text, x: tick(threshold, C.ink, 1.5, true), w: 0 },
    ...(r.max ? [{ v: avg, label: `przeciętny ${formatPL(avg * 100, 0)}%`, color: C.amber, x: tick(avg, C.amber, 2), w: 0 }] : []),
  ].sort((a, b) => a.v - b.v);
  g.font = `400 15px ${MONO}`;
  for (const b of below) b.w = g.measureText(b.label).width;
  const clamp = (x: number, w: number) => Math.min(Math.max(x, SX), SX + SW - w);
  const centred = below.map((b) => clamp(b.x - b.w / 2, b.w));
  const clash = below.length === 2 && centred[0] + below[0].w + 12 > centred[1];
  below.forEach((b, k) => {
    const x = !clash ? centred[k] : k === 0 ? clamp(b.x - b.w - 6, b.w) : clamp(b.x + 6, b.w);
    text(b.label, x, SY + 42, `400 15px ${MONO}`, b.color);
  });
  const youX = tick(you, C.ink, 3);
  g.font = `500 15px ${MONO}`;
  const youLabel = `Ty ${formatPL(you * 100, 0)}%`;
  const youW = g.measureText(youLabel).width;
  text(youLabel, clamp(youX - youW / 2, youW), SY - 18, g.font, C.ink);

  // Prawa kolumna: dziedziny albo kafelki
  const RX = 680, RW = W - PAD_X - RX;
  if (input.fields.length > 1) {
    tracked('WEDŁUG DZIEDZIN', RX, 152, `500 14px ${MONO}`, C.muted, 1.2);
    const rows = input.fields.slice(0, 10);
    const step = Math.min(36, 330 / rows.length);
    let y = 190;
    for (const f of rows) {
      g.font = `400 16px ${BODY}`;
      text(fit(f.label, RW - 70), RX, y, g.font, C.ink);
      text(`${formatPL(f.share * 100, 0)}%`, RX + RW, y, `500 15px ${MONO}`, C.ink, 'right');
      g.fillStyle = C.soft; g.fillRect(RX, y + 8, RW, 8);
      g.fillStyle = f.share < threshold ? C.bad : C.chart; g.fillRect(RX, y + 8, Math.max(2, RW * f.share), 8);
      if (f.average !== null) { g.fillStyle = C.amber; g.fillRect(Math.round(RX + RW * f.average) - 1, y + 4, 2, 16); }
      y += step;
    }
  } else {
    const tiles: [string, string, string][] = [
      ['Dobrze', String(r.correct), C.ok], ['Źle', String(r.wrong), C.bad],
      ['Bez odpowiedzi', String(r.blank), C.ink], ['Przeciętny zdający', r.max ? `${formatPL(avg * 100, 0)}%` : '—', C.amber],
    ];
    tiles.forEach(([label, value, color], i) => {
      const x = RX + (i % 2) * (RW / 2), y = 170 + Math.floor(i / 2) * 150;
      g.fillStyle = C.line; g.fillRect(x, y, RW / 2 - 24, 1);
      tracked(label.toUpperCase(), x, y + 32, `500 13px ${MONO}`, C.muted, 1.1);
      text(value, x, y + 100, `300 64px ${DISPLAY}`, color);
    });
  }

  // Stopka
  g.fillStyle = C.line; g.fillRect(PAD_X, 548, W - 2 * PAD_X, 1);
  text(input.agent ? 'Rozwiązane z asystentem AI · pytania z jawnej bazy CEM' : 'Pytania i statystyka sali z jawnej bazy CEM',
    PAD_X, 588, `400 15px ${MONO}`, input.agent ? C.amber : C.muted);
  text(`${location.host}/egzamin`, W - PAD_X, 588, `500 15px ${MONO}`, C.blue, 'right');
  return c;
}

/** Canvas → plik PNG do navigator.share (null, gdy przeglądarka nie umie). */
export const canvasFile = (c: HTMLCanvasElement, name: string) =>
  new Promise<File | null>((ok) => c.toBlob((b) => ok(b ? new File([b], name, { type: 'image/png' }) : null), 'image/png'));
