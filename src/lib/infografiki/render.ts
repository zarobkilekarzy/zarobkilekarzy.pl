/**
 * Szablon infografik do pobrania: PORÓWNANIE LICZB jako główny element. Wiersz = podmiot
 * (nazwa + kto decyduje), duża liczba i pasek we wspólnej skali od zera; wyróżniony wiersz
 * (zwykle Polska) w kobalcie, reszta w łupku — jak blocks/BarChart. Kontekstu minimum: tytuł,
 * jedna linia miary i okresu, w stopce adres strony, źródła w jednej linii i kod QR do strony.
 *
 * Język wizualny z obrazków OG (lib/og/render.ts: fonty, logo, kolory z tokens.css): Inter Tight,
 * linie 1 px. Dwa formaty z jednej treści: pion 1080×1350 (Instagram, Facebook, X) i poziom
 * 1200×675 (X, LinkedIn, prezentacje), każdy w dwóch motywach: jasnym (białe tło, jak obrazki OG)
 * i ciemnym (nocne wartości tych samych tokenów, jak strona w trybie nocnym).
 * Do 4 wierszy układ luźny; przy 5–8 wiersze gęstnieją (zob. G i GD). Liczby wyłącznie z modułów
 * danych stron (zob. ./zestawy.ts).
 */
import sharp from 'sharp';
import satori from 'satori';
import { renderSVG } from 'uqr';
import tokensCss from '@/styles/tokens.css?raw';
import { typo } from '@/lib/format';
import { BODY, DISPLAY, MONO, h, loadFonts, logo, type Node } from '@/lib/og/render';

export type FormatKey = 'pion' | 'poziom';

export const FORMATS: Record<FormatKey, { width: number; height: number; label: string; use: string }> = {
  pion: { width: 1080, height: 1350, label: 'pion', use: 'Instagram, Facebook, X' },
  poziom: { width: 1200, height: 675, label: 'poziom', use: 'X, LinkedIn, prezentacje' },
};

export type ThemeKey = 'jasny' | 'ciemny';

/**
 * Token z tokens.css jako para [dzień, noc] z light-dark(). Kotwiczymy do deklaracji na początku
 * wiersza (pierwszej, w :root): nazwy tokenów padają też w komentarzach, a wariant „Większy
 * tekst” deklaruje część z nich drugi raz.
 */
const tokenPair = (name: string): [string, string] => {
  const value = tokensCss.match(new RegExp(`^\\s*--${name}:\\s*([^;]+);`, 'm'))?.[1].trim();
  if (!value) throw new Error(`[infografiki] brak tokenu --${name} w tokens.css`);
  const pair = value.match(/^light-dark\(\s*([^,]+),\s*([^)]+)\)/);
  return pair ? [pair[1].trim(), pair[2].trim()] : [value, value];
};

interface Palette { bg: string; ink: string; muted: string; line: string; blue: string; bar: string }

const palette = (night: boolean): Palette => {
  const t = (name: string) => tokenPair(name)[night ? 1 : 0];
  // jasna: białe tło jak obrazki OG; ciemna: tło strony w trybie nocnym (--bg)
  return { bg: night ? t('bg') : '#fff', ink: t('ink'), muted: t('muted'), line: t('line'), blue: t('blue'), bar: t('chart') };
};

export const THEMES: Record<ThemeKey, { label: string; colors: Palette }> = {
  jasny: { label: 'jasna', colors: palette(false) },
  ciemny: { label: 'ciemna', colors: palette(true) },
};

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
  /** jednostka za każdą liczbą, mniejszym stopniem (np. „%”) */
  unit?: string;
  rows: ComparisonRow[];
  /** jedna linia stopki: źródła + najważniejsze zastrzeżenie */
  sources: string;
  /** tekst alternatywny podglądu — pełne liczby */
  alt: string;
}

export interface InfographicSet {
  /** trasa strony, np. /analizy/odpowiedzialnosc-zawodowa-lekarzy/ */
  route: string;
  /** nazwa tej strony w linku pod grafiką na /media/ */
  page: string;
  /** początek nazwy pobieranego pliku */
  filePrefix: string;
  items: Infographic[];
}

/** Akapit nad siatką infografik: formaty i to, co jest na grafice. */
export const infographicsLead = (count: number) =>
  `${count > 1 ? 'Grafiki' : 'Grafika'} do udostępnienia w dwóch formatach: pionowym ${FORMATS.pion.width}×${FORMATS.pion.height} (${FORMATS.pion.use}) i poziomym ${FORMATS.poziom.width}×${FORMATS.poziom.height} (${FORMATS.poziom.use}), w wersji jasnej i ciemnej. Źródła, adres strony i kod QR do niej są na grafice.`;

const setSlug = (route: string) => route.replace(/^\/|\/$/g, '').split('/').pop()!;

/** Adres PNG: /infografiki/<ostatni człon trasy>/<id>-<szer>x<wys>[-ciemny].png */
export const infographicUrl = (set: InfographicSet, id: string, f: FormatKey, theme: ThemeKey = 'jasny') =>
  `/infografiki/${setSlug(set.route)}/${id}-${FORMATS[f].width}x${FORMATS[f].height}${theme === 'jasny' ? '' : `-${theme}`}.png`;

/**
 * Kod QR prowadzący do strony (SVG jako <img>, bo Satori nie rysuje ścieżek inline). Zawsze ciemne
 * moduły na białym: odwróconego kodu nie odczyta część skanerów, więc na ciemnej grafice
 * kod dostaje białe pole z marginesem.
 */
function qr(url: string, size: number, night: boolean): Node {
  const svg = renderSVG(url, { ecc: 'M', border: 0, blackColor: THEMES.jasny.colors.ink, whiteColor: '#ffffff' });
  const img = h('img', { src: `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`, width: size, height: size });
  const pad = Math.round(size / 12);
  return night ? h('div', { style: { padding: pad, background: '#fff' } }, img) : img;
}

/* ---------- Geometria (jawne wymiary: Satori nie przekaże szerokości flex do pasków) ---------- */
const G = {
  pion: { padX: 72, padY: 64, title: 60, measure: 18, rowH: 200, label: 24, sub: 15, num: 150, numW: 250, labelW: 250, bar: 28, url: 18, src: 14, qr: 92 },
  poziom: { padX: 56, padY: 44, title: 38, measure: 14, rowH: 96, label: 20, sub: 12, num: 80, numW: 170, labelW: 250, bar: 20, url: 14, src: 11, qr: 60 },
};
const LOOSE_ROWS = 4;
/** Gęsty układ (5–8 wierszy): nazwa | liczba | pasek w jednej linii także w pionie; wiersze dzielą `rowsH`. */
const GD = {
  pion: { ...G.pion, rowsH: 840, label: 24, sub: 14, num: 84, numW: 170, labelW: 330, bar: 18 },
  poziom: { ...G.poziom, rowsH: 357, label: 17, sub: 11, num: 40, numW: 100, labelW: 250, bar: 12 },
};

/**
 * Szerokość tekstu w px, szacowana z szerokości glifów Inter Tight Light (w em, z odstępem
 * -0.05em jak w liczbach) — Satori nie zmierzy tekstu przed układem, a kolumna liczb musi mieć
 * stałą szerokość, żeby paski zaczynały się w jednej linii.
 */
const GLYPH_EM: Record<string, number> = { '1': 0.36, ',': 0.24, '.': 0.24, ' ': 0.24, '%': 0.8 };
const textWidth = (text: string, size: number) => [...text].reduce((w, ch) => w + (GLYPH_EM[ch] ?? 0.58) - 0.05, 0) * size;
const UNIT_SCALE = 0.42;

function layout(set: InfographicSet, i: Infographic, f: FormatKey, theme: ThemeKey): Node {
  const { width, height } = FORMATS[f];
  const C = THEMES[theme].colors;
  const night = theme === 'ciemny';
  const dense = i.rows.length > LOOSE_ROWS;
  const g = dense ? { ...GD[f], rowH: Math.floor(GD[f].rowsH / i.rows.length) } : G[f];
  const pion = f === 'pion';
  // luźny pion: nazwa nad liczbą; poza tym nazwa | liczba | pasek w jednej linii
  const stacked = pion && !dense;
  const inner = width - 2 * g.padX;
  const max = Math.max(...i.rows.map((r) => r.value));
  // kolumna liczb: domyślna szerokość albo szersza, gdy liczby z jednostką się w niej nie mieszczą
  const unitW = i.unit ? textWidth(i.unit, g.num * UNIT_SCALE) + 8 : 0;
  const numW = Math.max(g.numW, Math.ceil(Math.max(...i.rows.map((r) => textWidth(r.display, g.num))) + unitW + g.num * 0.3));
  // adres z `site` w astro.config — ten sam, z którego Astro buduje adresy kanoniczne
  const pageUrl = new URL(set.route, import.meta.env.SITE).href;

  const subLine = (r: ComparisonRow) =>
    r.sub ? h('span', { style: { fontFamily: MONO, fontSize: g.sub, letterSpacing: '0.06em', textTransform: 'uppercase', color: r.highlight ? C.blue : C.muted } }, typo(r.sub)) : null;
  const number = (r: ComparisonRow) =>
    h('div', { style: { width: numW, flexShrink: 0, alignItems: 'baseline', fontFamily: DISPLAY, fontWeight: 300, fontSize: g.num, lineHeight: 1, letterSpacing: '-0.05em', color: r.highlight ? C.blue : C.ink } },
      r.display,
      i.unit && h('span', { style: { marginLeft: 8, fontSize: Math.round(g.num * UNIT_SCALE), letterSpacing: '-0.02em' } }, i.unit));
  const bar = (r: ComparisonRow, w: number) =>
    h('div', { style: { width: Math.max(8, (r.value / max) * w), height: g.bar, background: r.highlight ? C.blue : C.bar } });

  const row = (r: ComparisonRow) =>
    stacked
      ? h('div', { style: { flexDirection: 'column', justifyContent: 'center', height: g.rowH, borderTop: `1px solid ${C.line}` } },
          h('div', { style: { alignItems: 'baseline', fontFamily: BODY, fontSize: g.label, color: C.ink } }, typo(r.label), r.sub && h('span', { style: { marginLeft: 10 } }, subLine(r))),
          h('div', { style: { alignItems: 'center', marginTop: 10 } }, number(r), bar(r, inner - numW)))
      : h('div', { style: { alignItems: 'center', height: g.rowH, borderTop: `1px solid ${C.line}` } },
          h('div', { style: { flexDirection: 'column', width: g.labelW, flexShrink: 0, paddingRight: 16 } },
            h('span', { style: { fontFamily: BODY, fontSize: g.label, color: C.ink } }, typo(r.label)),
            r.sub && h('div', { style: { marginTop: 4 } }, subLine(r))),
          number(r),
          bar(r, inner - g.labelW - numW));

  return h('div', { style: { width, height, padding: `${g.padY}px ${g.padX}px`, background: C.bg, flexDirection: 'column', justifyContent: 'space-between', fontFamily: BODY } },
    h('div', { style: { flexDirection: 'column' } },
      logo(C),
      h('div', { style: { marginTop: pion ? 52 : 22, fontFamily: DISPLAY, fontWeight: 400, fontSize: g.title, lineHeight: 1.04, letterSpacing: '-0.04em', color: C.ink } }, typo(i.title)),
      h('div', { style: { marginTop: pion ? 18 : 10, fontFamily: MONO, fontSize: g.measure, letterSpacing: '0.06em', textTransform: 'uppercase', color: C.blue } }, typo(i.measure))),
    h('div', { style: { flexDirection: 'column' } }, ...i.rows.map(row)),
    h('div', { style: { alignItems: 'center', justifyContent: 'space-between', paddingTop: pion ? 20 : 12, borderTop: `1px solid ${C.ink}`, fontFamily: MONO } },
      h('div', { style: { flexDirection: 'column', paddingRight: 24 } },
        h('span', { style: { fontSize: g.url, color: C.ink } }, pageUrl.replace(/^https:\/\/|\/$/g, '')),
        h('span', { style: { marginTop: pion ? 8 : 5, fontSize: g.src, lineHeight: 1.4, color: C.muted } }, typo(i.sources))),
      qr(pageUrl, night ? g.qr - 2 * Math.round(g.qr / 12) : g.qr, night)));
}

/** PNG z paletą 8-bit, jak obrazki OG. */
export async function renderInfographic(set: InfographicSet, i: Infographic, f: FormatKey, theme: ThemeKey = 'jasny'): Promise<Buffer> {
  const { width, height } = FORMATS[f];
  const svg = await satori(layout(set, i, f, theme) as unknown as Parameters<typeof satori>[0], { width, height, fonts: await loadFonts() });
  return sharp(Buffer.from(svg)).png({ palette: true, quality: 90, compressionLevel: 9 }).toBuffer();
}
