/**
 * Szablon infografik do pobrania: PORÓWNANIE LICZB jako główny element. Wiersz = podmiot
 * (nazwa + kto decyduje), duża liczba i pasek we wspólnej skali od zera; wyróżniony wiersz
 * (zwykle Polska) w kobalcie, reszta w łupku — jak blocks/BarChart. Kontekstu minimum: tytuł,
 * jedna linia miary i okresu, w stopce adres strony, źródła w jednej linii i kod QR do strony.
 *
 * Język wizualny z obrazków OG (lib/og/render.ts: fonty, logo, kolory z tokens.css): białe tło,
 * Inter Tight, linie 1 px. Grafiki są zawsze jasne, jak obrazki OG.
 * Dwa formaty z jednej treści: pion 1080×1350 (Instagram, Facebook, X) i poziom 1200×675
 * (X, LinkedIn, prezentacje). Liczby wyłącznie z modułów danych stron (zob. ./zestawy.ts).
 */
import sharp from 'sharp';
import satori from 'satori';
import { renderSVG } from 'uqr';
import tokensCss from '@/styles/tokens.css?raw';
import { typo } from '@/lib/format';
import { BODY, C, DISPLAY, MONO, h, loadFonts, logo, type Node } from '@/lib/og/render';

export type FormatKey = 'pion' | 'poziom';

export const FORMATS: Record<FormatKey, { width: number; height: number; label: string; use: string }> = {
  pion: { width: 1080, height: 1350, label: 'pion', use: 'Instagram, Facebook, X' },
  poziom: { width: 1200, height: 675, label: 'poziom', use: 'X, LinkedIn, prezentacje' },
};

/**
 * Kolor słupka neutralnego = token --chart (wartość dzienna z light-dark()). Nie przez
 * og/render token(): nazwa --chart pada też w komentarzu tokens.css, a token() bierze pierwsze
 * trafienie — tu kotwiczymy do deklaracji na początku wiersza.
 */
const chartToken = (name: string) => {
  const value = tokensCss.match(new RegExp(`^\\s*--${name}:\\s*([^;]+);`, 'm'))?.[1].trim();
  if (!value) throw new Error(`[infografiki] brak tokenu --${name} w tokens.css`);
  return value.match(/^light-dark\(\s*([^,]+),/)?.[1].trim() ?? value;
};
const BAR = chartToken('chart');

export interface ComparisonRow {
  label: string;
  /** kto decyduje / dopisek pod nazwą (wersaliki, mono) */
  sub?: string;
  value: number;
  /** wartość do druku (np. zaokrąglona) */
  display: string;
  highlight?: boolean;
}

export interface Infographic {
  /** slug pliku */
  id: string;
  title: string;
  /** miara i okres, np. „na 100 tys. lekarzy rocznie · 2020–2025” */
  measure: string;
  rows: ComparisonRow[];
  /** jedna linia stopki: źródła + najważniejsze zastrzeżenie */
  sources: string;
  /** tekst alternatywny podglądu — pełne liczby */
  alt: string;
}

export interface InfographicSet {
  /** trasa strony, np. /analizy/odpowiedzialnosc-zawodowa-lekarzy/ */
  route: string;
  /** początek nazwy pobieranego pliku */
  filePrefix: string;
  items: Infographic[];
}

const setSlug = (route: string) => route.replace(/^\/|\/$/g, '').split('/').pop()!;

/** Adres PNG: /infografiki/<ostatni człon trasy>/<id>-<szer>x<wys>.png */
export const infographicUrl = (set: InfographicSet, id: string, f: FormatKey) =>
  `/infografiki/${setSlug(set.route)}/${id}-${FORMATS[f].width}x${FORMATS[f].height}.png`;

/** Kod QR prowadzący do strony (SVG jako <img>, bo Satori nie rysuje ścieżek inline). */
function qr(url: string, size: number): Node {
  const svg = renderSVG(url, { ecc: 'M', border: 0, blackColor: C.ink, whiteColor: '#ffffff' });
  return h('img', { src: `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`, width: size, height: size });
}

/* ---------- Geometria (jawne wymiary: Satori nie przekaże szerokości flex do pasków) ---------- */
const G = {
  pion: { padX: 72, padY: 64, title: 60, measure: 18, rowH: 200, label: 24, sub: 15, num: 150, numW: 250, bar: 28, url: 18, src: 14, qr: 92 },
  poziom: { padX: 56, padY: 44, title: 38, measure: 14, rowH: 96, label: 20, sub: 12, num: 80, numW: 170, bar: 20, url: 14, src: 11, qr: 60 },
};

function layout(set: InfographicSet, i: Infographic, f: FormatKey): Node {
  const { width, height } = FORMATS[f];
  const g = G[f];
  const pion = f === 'pion';
  const inner = width - 2 * g.padX;
  const max = Math.max(...i.rows.map((r) => r.value));
  // adres z `site` w astro.config — ten sam, z którego Astro buduje adresy kanoniczne
  const pageUrl = new URL(set.route, import.meta.env.SITE).href;

  const subLine = (r: ComparisonRow) =>
    r.sub ? h('span', { style: { fontFamily: MONO, fontSize: g.sub, letterSpacing: '0.06em', textTransform: 'uppercase', color: r.highlight ? C.blue : C.muted } }, typo(r.sub)) : null;
  const number = (r: ComparisonRow) =>
    h('div', { style: { width: g.numW, flexShrink: 0, fontFamily: DISPLAY, fontWeight: 300, fontSize: g.num, lineHeight: 1, letterSpacing: '-0.05em', color: r.highlight ? C.blue : C.ink } }, r.display);
  const bar = (r: ComparisonRow, w: number) =>
    h('div', { style: { width: Math.max(8, (r.value / max) * w), height: g.bar, background: r.highlight ? C.blue : BAR } });

  // Pion: nazwa nad wierszem, pod nią liczba i pasek. Poziom: nazwa | liczba | pasek w jednej linii.
  const row = (r: ComparisonRow) =>
    pion
      ? h('div', { style: { flexDirection: 'column', justifyContent: 'center', height: g.rowH, borderTop: `1px solid ${C.line}` } },
          h('div', { style: { alignItems: 'baseline', fontFamily: BODY, fontSize: g.label, color: C.ink } }, typo(r.label), r.sub && h('span', { style: { marginLeft: 10 } }, subLine(r))),
          h('div', { style: { alignItems: 'center', marginTop: 10 } }, number(r), bar(r, inner - g.numW)))
      : h('div', { style: { alignItems: 'center', height: g.rowH, borderTop: `1px solid ${C.line}` } },
          h('div', { style: { flexDirection: 'column', width: 250, flexShrink: 0 } },
            h('span', { style: { fontFamily: BODY, fontSize: g.label, color: C.ink } }, typo(r.label)),
            r.sub && h('div', { style: { marginTop: 4 } }, subLine(r))),
          number(r),
          bar(r, inner - 250 - g.numW));

  return h('div', { style: { width, height, padding: `${g.padY}px ${g.padX}px`, background: '#fff', flexDirection: 'column', justifyContent: 'space-between', fontFamily: BODY } },
    h('div', { style: { flexDirection: 'column' } },
      logo(),
      h('div', { style: { marginTop: pion ? 52 : 22, fontFamily: DISPLAY, fontWeight: 400, fontSize: g.title, lineHeight: 1.04, letterSpacing: '-0.04em', color: C.ink } }, typo(i.title)),
      h('div', { style: { marginTop: pion ? 18 : 10, fontFamily: MONO, fontSize: g.measure, letterSpacing: '0.06em', textTransform: 'uppercase', color: C.blue } }, typo(i.measure))),
    h('div', { style: { flexDirection: 'column' } }, ...i.rows.map(row)),
    h('div', { style: { alignItems: 'center', justifyContent: 'space-between', paddingTop: pion ? 20 : 12, borderTop: `1px solid ${C.ink}`, fontFamily: MONO } },
      h('div', { style: { flexDirection: 'column', paddingRight: 24 } },
        h('span', { style: { fontSize: g.url, color: C.ink } }, pageUrl.replace(/^https:\/\/|\/$/g, '')),
        h('span', { style: { marginTop: pion ? 8 : 5, fontSize: g.src, lineHeight: 1.4, color: C.muted } }, typo(i.sources))),
      qr(pageUrl, g.qr)));
}

/** PNG z paletą 8-bit, jak obrazki OG. */
export async function renderInfographic(set: InfographicSet, i: Infographic, f: FormatKey): Promise<Buffer> {
  const { width, height } = FORMATS[f];
  const svg = await satori(layout(set, i, f) as unknown as Parameters<typeof satori>[0], { width, height, fonts: await loadFonts() });
  return sharp(Buffer.from(svg)).png({ palette: true, quality: 90, compressionLevel: 9 }).toBuffer();
}
