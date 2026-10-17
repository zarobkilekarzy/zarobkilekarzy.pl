/**
 * Szablon infografik do pobrania: PORÓWNANIE LICZB jako główny element. Wiersz = podmiot
 * (nazwa + kto decyduje), duża liczba i pasek we wspólnej skali od zera; wyróżniony wiersz
 * (zwykle Polska) w kobalcie, reszta w łupku — jak blocks/BarChart. Kontekstu minimum: tytuł,
 * jedna linia miary i okresu, w stopce adres strony, „Obserwuj na X”, źródła w jednej linii i kod QR do strony.
 *
 * Język wizualny z obrazków OG (lib/og/render.ts: fonty, logo, kolory z tokens.css): Inter Tight,
 * linie 1 px. Dwa formaty z jednej treści: pion 1080×1350 (Instagram, Facebook, X) i poziom
 * 1200×675 (X, LinkedIn, prezentacje), każdy w dwóch motywach: jasnym (białe tło, jak obrazki OG)
 * i ciemnym (nocne wartości tych samych tokenów, jak strona w trybie nocnym).
 * Do 4 wierszy układ luźny; przy 5–8 wiersze gęstnieją (zob. G i GD). Liczby wyłącznie z modułów
 * danych stron (zob. ./zestawy.ts).
 *
 * Drugi styl, „wykres” (pole `chart`): gdy liczy się kierunek zmian w czasie — linie na jednej osi
 * (indeksy albo liczby), nad wykresem duże liczby (zob. chartLayout). Trzeci, „proporcje” (pole
 * `split`): części całości — gruby pasek podzielony na segmenty albo kolumny 100% obok siebie
 * (zob. splitLayout). Czwarty, „tabela” (pole `table`): liczby rok po roku dla kilku podmiotów,
 * przy każdej liczbie mały pasek we wspólnej skali (zob. tableLayout). Piąty, „mapa” (pole `map`):
 * warstwa z zestawu map (lib/mapa) — ten sam renderer co mapa na stronie, obok legenda (zob. mapLayout).
 * Rama (nagłówek i stopka) wspólna dla wszystkich stylów.
 */
import sharp from 'sharp';
import satori from 'satori';
import { renderSVG } from 'uqr';
import { formatPL, typo } from '@/lib/format';
import { tokenPair } from '@/lib/tokens';
import { geo } from '@/lib/mapa/geo';
import { radius, R_MISSING, toneOfClass } from '@/lib/mapa/layout';
import { mapSets, type MapSetId } from '@/lib/mapa/sets';
import { regionTones, renderMapSvg, staticColors } from '@/lib/mapa/svg';
import { BODY, DISPLAY, MONO, followX, h, loadFonts, logo, type Node } from '@/lib/og/render';

export type FormatKey = 'pion' | 'poziom';

export const FORMATS: Record<FormatKey, { width: number; height: number; label: string; use: string }> = {
  pion: { width: 1080, height: 1350, label: 'pion', use: 'Instagram, Facebook, X' },
  poziom: { width: 1200, height: 675, label: 'poziom', use: 'X, LinkedIn, prezentacje' },
};

export type ThemeKey = 'jasny' | 'ciemny';

interface Palette { bg: string; ink: string; muted: string; line: string; blue: string; tint: string; bar: string; soft: string; bad: string; amber: string }

const palette = (night: boolean): Palette => {
  const t = (name: string) => tokenPair(name)[night ? 1 : 0];
  // jasna: białe tło jak obrazki OG; ciemna: tło strony w trybie nocnym (--bg)
  return { bg: night ? t('bg') : '#fff', ink: t('ink'), muted: t('muted'), line: t('line'), blue: t('blue'), tint: t('blue-50'), bar: t('chart'), soft: t('chart-soft'), bad: t('bad'), amber: t('amber') };
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

/** Punkt wykresu: położenie na osi lat (rok + ułamek) i wartość (indeks albo liczba). */
export interface ChartPoint {
  x: number;
  v: number;
  /** przerwa w pomiarach przed tym punktem: odcinek kropkowany */
  gapBefore?: boolean;
}

export interface ChartSeries {
  label: string;
  /** kolor linii; red — to, co powinno spadać (rysowane na wierzchu) */
  tone: 'blue' | 'amber' | 'slate' | 'red';
  points: ChartPoint[];
  /** punkty od tego x to plan w toku albo projekt: linia przerywana, puste kropki */
  dashedFrom?: number;
  /** duża liczba nad wykresem, np. „+59%” */
  value: string;
  /** jednostka za liczbą, mniejszym stopniem (np. „tys.”) */
  unit?: string;
  /** dopisek pod liczbą, np. „z 138,7 do 220,2 mld zł (2025)” — bez strzałek: Plex Mono ich nie ma */
  detail: string;
}

/** Wykres liniowy (np. indeks, rok bazowy = 100): linie zamiast pasków, gdy liczy się kierunek zmian w czasie. */
export interface LineChart {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  yTicks: number[];
  xTicks: { x: number; label: string }[];
  series: ChartSeries[];
  /** dopisek przy punkcie (np. ostatnim punkcie projektu), kolejne linie w kolejnych wierszach */
  note?: { x: number; v: number; lines: string[] };
  /** kropki przy każdym punkcie (pomiary) albo tylko na końcu linii (projekcja rok po roku) */
  markers?: 'all' | 'last';
  /** poziom odniesienia (np. stan dzisiejszy): przerywana linia przez cały wykres, podpis nad nią po prawej */
  baseline?: { v: number; label: string; /** dalszy ciąg podpisu w kolorze alarmu */ accent?: string };
}

/** Część całości: segment paska 100%. */
export interface SplitSegment {
  label: string;
  /** dopisek pod nazwą (wersaliki, mono) */
  sub?: string;
  /** wielkość segmentu; skala = suma segmentów paska */
  value: number;
  /** duża liczba przy segmencie */
  display: string;
  /** napis w segmencie (pasek poziomy), np. „66,7%” */
  share?: string;
  /** blue — to, o czym jest grafika; slate i soft — reszta */
  tone: 'blue' | 'slate' | 'soft';
}

export interface SplitBar {
  /** nagłówek kolumny (kolumny pionowe) */
  label?: string;
  segments: SplitSegment[];
}

/**
 * Styl „proporcje”: jeden pasek → gruby pasek poziomy podzielony na części, liczby pod nim;
 * kilka pasków → kolumny 100% obok siebie, liczby przy segmentach.
 */
export interface Split {
  bars: SplitBar[];
  /** jednostka za dużymi liczbami (np. „%”) */
  unit?: string;
}

/** Podmiot tabeli (kraj): kolumna w pionie, wiersz w poziomie. */
export interface TableSeries {
  label: string;
  /** dopisek pod nazwą (wersaliki, mono), np. kto decyduje */
  sub?: string;
  /** liczby w kolejności `periods` */
  values: number[];
  highlight?: boolean;
}

/** Styl „tabela”: liczby rok po roku dla kilku podmiotów, z sumą na końcu. */
export interface DataTable {
  /** etykiety okresów (lat): wiersze w pionie, kolumny w poziomie */
  periods: string[];
  series: TableSeries[];
  /**
   * Podsumowania pod latami (pion) albo za nimi (poziom), np. suma i wskaźnik na 100 tys.:
   * wartości do druku w kolejności `series`, `sub` — okres, gdy inny niż w tabeli.
   */
  summary: { label: string; sub?: string; values: string[] }[];
}

export interface Infographic {
  /** slug pliku */
  id: string;
  title: string;
  /** dalszy ciąg tytułu w kolorze alarmu (wykres): „Kolejka nie maleje.” */
  titleAccent?: string;
  /** zamiast wierszy: wykres liniowy */
  chart?: LineChart;
  /** zamiast wierszy: części całości */
  split?: Split;
  /** zamiast wierszy: tabela rok po roku */
  table?: DataTable;
  /** zamiast wierszy: warstwa mapy z lib/mapa/sets */
  map?: { set: MapSetId; layer: string };
  /** miara i okres, np. „na 100 tys. lekarzy rocznie · 2020–2025” */
  measure: string;
  /** jednostka za każdą liczbą, mniejszym stopniem (np. „%”) */
  unit?: string;
  /** wiersze porównania (styl podstawowy); grafika z `chart`, `split` albo `table` ich nie ma */
  rows?: ComparisonRow[];
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

function layout(set: InfographicSet, i: Infographic, rows: ComparisonRow[], f: FormatKey, theme: ThemeKey): Node {
  const { width } = FORMATS[f];
  const C = THEMES[theme].colors;
  const dense = rows.length > LOOSE_ROWS;
  const g = dense ? { ...GD[f], rowH: Math.floor(GD[f].rowsH / rows.length) } : G[f];
  const pion = f === 'pion';
  // luźny pion: nazwa nad liczbą; poza tym nazwa | liczba | pasek w jednej linii
  const stacked = pion && !dense;
  const inner = width - 2 * g.padX;
  const max = Math.max(...rows.map((r) => r.value));
  // kolumna liczb: domyślna szerokość albo szersza, gdy liczby z jednostką się w niej nie mieszczą
  const unitW = i.unit ? textWidth(i.unit, g.num * UNIT_SCALE) + 8 : 0;
  const numW = Math.max(g.numW, Math.ceil(Math.max(...rows.map((r) => textWidth(r.display, g.num))) + unitW + g.num * 0.3));

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

  return frame(set, i, f, theme, h('div', { style: { flexDirection: 'column' } }, ...rows.map(row)));
}

/** Rama wspólna dla wszystkich stylów: logo, tytuł i miara — treść — adres strony, „Obserwuj na X”, źródła i kod QR. */
function frame(set: InfographicSet, i: Infographic, f: FormatKey, theme: ThemeKey, body: Node): Node {
  const { width, height } = FORMATS[f];
  const C = THEMES[theme].colors;
  const night = theme === 'ciemny';
  const g = G[f];
  const pion = f === 'pion';
  // adres z `site` w astro.config — ten sam, z którego Astro buduje adresy kanoniczne
  const pageUrl = new URL(set.route, import.meta.env.SITE).href;
  const titleStyle = { marginTop: pion ? 52 : 22, fontFamily: DISPLAY, fontWeight: 400, fontSize: g.title, lineHeight: 1.04, letterSpacing: '-0.04em', color: C.ink };

  return h('div', { style: { width, height, padding: `${g.padY}px ${g.padX}px`, background: C.bg, flexDirection: 'column', justifyContent: 'space-between', fontFamily: BODY } },
    h('div', { style: { flexDirection: 'column' } },
      logo(C),
      i.titleAccent
        ? h('div', { style: { ...titleStyle, flexWrap: 'wrap' } }, h('span', { style: { marginRight: '0.25em' } }, typo(i.title)), h('span', { style: { color: C.bad } }, typo(i.titleAccent)))
        : h('div', { style: titleStyle }, typo(i.title)),
      h('div', { style: { marginTop: pion ? 18 : 10, fontFamily: MONO, fontSize: g.measure, letterSpacing: '0.06em', textTransform: 'uppercase', color: C.blue } }, typo(i.measure))),
    body,
    h('div', { style: { alignItems: 'center', justifyContent: 'space-between', paddingTop: pion ? 20 : 12, borderTop: `1px solid ${C.ink}`, fontFamily: MONO } },
      h('div', { style: { flexDirection: 'column', paddingRight: 24 } },
        h('span', { style: { fontSize: g.url, color: C.ink } }, pageUrl.replace(/^https:\/\/|\/$/g, '')),
        followX(C, g.src + 2, { marginTop: pion ? 8 : 5 }),
        h('span', { style: { marginTop: pion ? 8 : 5, fontSize: g.src, lineHeight: 1.4, color: C.muted } }, typo(i.sources))),
      qr(pageUrl, night ? g.qr - 2 * Math.round(g.qr / 12) : g.qr, night)));
}

/* ---------- Styl „wykres”: linie w czasie na jednej osi, duże liczby nad wykresem ---------- */

/**
 * Geometria wykresu. Pion: trzy liczby w rzędzie nad wykresem na całą szerokość; poziom: liczby
 * w kolumnie po lewej, wykres po prawej. `chartH` obejmuje podpisy lat pod osią.
 */
const CG = {
  pion: { legendW: 0, gap: 40, chartH: 600, gutter: 56, xLab: 40, label: 14, value: 80, valueDense: 64, detail: 15, tick: 15, stroke: 5, dot: 6, note: 20, noteSub: 17 },
  poziom: { legendW: 280, gap: 32, chartH: 360, gutter: 44, xLab: 28, label: 11, value: 50, valueDense: 36, detail: 12, tick: 12, stroke: 3.5, dot: 4.5, note: 15, noteSub: 13 },
};

function chartLayout(set: InfographicSet, i: Infographic, c: LineChart, f: FormatKey, theme: ThemeKey): Node {
  const C = THEMES[theme].colors;
  const g = G[f];
  const cg = CG[f];
  const pion = f === 'pion';
  const inner = FORMATS[f].width - 2 * g.padX;
  const W = pion ? inner : inner - cg.legendW - cg.gap;
  const H = cg.chartH;
  // liczba nad wykresem w kolorze swojej linii; szarość łupku = --muted, bo jaśniejsze --chart
  // nie ma kontrastu tekstu (2,3:1 na białym)
  const color = (s: ChartSeries) => ({ blue: C.blue, amber: C.amber, slate: C.muted, red: C.bad })[s.tone];
  // przy czterech seriach liczby nad wykresem mniejsze, żeby zmieściły się w rzędzie (pion) i kolumnie (poziom)
  const valueSize = c.series.length > 3 ? cg.valueDense : cg.value;

  // pole wykresu: od lewej podpisy osi, u góry zapas na obwódkę kropki, na dole podpisy lat
  const top = 14;
  const left = cg.gutter;
  const plotW = W - left - 14;
  const plotH = H - top - cg.xLab;
  const sx = (x: number) => left + ((x - c.xMin) / (c.xMax - c.xMin)) * plotW;
  const sy = (v: number) => top + ((c.yMax - v) / (c.yMax - c.yMin)) * plotH;
  const r1 = (n: number) => Math.round(n * 10) / 10;

  const svg: string[] = [];
  for (const t of c.yTicks) {
    // linia 100 = rok bazowy: przerywana i mocniejsza od siatki
    const base = t === 100;
    svg.push(`<line x1="${left}" x2="${left + plotW}" y1="${r1(sy(t))}" y2="${r1(sy(t))}" stroke="${base ? C.bar : C.line}" stroke-width="${base ? 1.5 : 1}"${base ? ' stroke-dasharray="3 6"' : ''}/>`);
  }
  if (c.baseline) {
    const y = r1(sy(c.baseline.v));
    svg.push(`<line x1="${left}" x2="${left + plotW}" y1="${y}" y2="${y}" stroke="${C.ink}" stroke-width="${r1(cg.stroke * 0.4)}" stroke-dasharray="${r1(cg.stroke * 1.6)} ${r1(cg.stroke * 1.2)}"/>`);
  }
  // czerwień na wierzchu
  const order = [...c.series].sort((a, b) => Number(a.tone === 'red') - Number(b.tone === 'red'));
  for (const s of order) {
    const col = color(s);
    const w = cg.stroke;
    const planned = (p: ChartPoint) => s.dashedFrom !== undefined && p.x >= s.dashedFrom;
    s.points.slice(1).forEach((b, k) => {
      const a = s.points[k];
      const dash = b.gapBefore ? ` stroke-dasharray="0.1 ${r1(w * 2.4)}"` : planned(b) ? ` stroke-dasharray="${r1(w * 2.4)} ${r1(w * 1.8)}"` : '';
      svg.push(`<line x1="${r1(sx(a.x))}" y1="${r1(sy(a.v))}" x2="${r1(sx(b.x))}" y2="${r1(sy(b.v))}" stroke="${col}" stroke-width="${b.gapBefore ? r1(w * 0.8) : w}" stroke-linecap="round"${dash}/>`);
    });
    const last = s.points.at(-1)!;
    svg.push(`<circle cx="${r1(sx(last.x))}" cy="${r1(sy(last.v))}" r="${r1(cg.dot * 2.2)}" fill="${col}" fill-opacity="0.22"/>`);
    for (const p of c.markers === 'last' ? [last] : s.points) {
      const r = cg.dot;
      svg.push(planned(p)
        ? `<circle cx="${r1(sx(p.x))}" cy="${r1(sy(p.v))}" r="${r1(r)}" fill="${C.bg}" stroke="${col}" stroke-width="${r1(w * 0.6)}"/>`
        : `<circle cx="${r1(sx(p.x))}" cy="${r1(sy(p.v))}" r="${r1(r)}" fill="${col}"/>`);
    }
  }
  const lines = `data:image/svg+xml;base64,${Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${svg.join('')}</svg>`).toString('base64')}`;

  // podpisy jako elementy Satori (krój Plex Mono), linie i kropki jako obrazek SVG pod nimi
  const tick = (text: string, style: Record<string, string | number>) =>
    h('div', { style: { position: 'absolute', fontFamily: MONO, fontSize: cg.tick, lineHeight: 1, color: C.muted, ...style } }, text);
  const note = c.note && (() => {
    const lh = 1.3;
    const height = Math.round(cg.note * lh + (c.note.lines.length - 1) * cg.noteSub * lh);
    return h('div', { style: { position: 'absolute', right: Math.round(W - sx(c.note.x) - cg.dot), top: Math.round(sy(c.note.v) - cg.dot * 3 - height), flexDirection: 'column', alignItems: 'flex-end', lineHeight: lh } },
      ...c.note.lines.map((text, k) =>
        h('span', { style: k === 0 ? { fontFamily: BODY, fontSize: cg.note, color: C.ink } : { fontFamily: BODY, fontSize: cg.noteSub, color: C.bad } }, typo(text))));
  })();
  const chart = h('div', { style: { position: 'relative', width: W, height: H, flexShrink: 0 } },
    h('img', { src: lines, width: W, height: H, style: { position: 'absolute', left: 0, top: 0 } }),
    ...c.yTicks.map((t) => tick(String(t), { left: 0, width: left - 12, top: Math.round(sy(t) - cg.tick / 2), justifyContent: 'flex-end' })),
    ...c.xTicks.map((t) => tick(t.label, { left: Math.round(sx(t.x) - 40), width: 80, top: top + plotH + Math.round((cg.xLab - cg.tick) / 2), justifyContent: 'center' })),
    c.baseline && h('div', { style: { position: 'absolute', right: 14, top: Math.round(sy(c.baseline.v) - cg.note * 1.3 - 8), fontFamily: BODY, fontSize: cg.note, lineHeight: 1.3, color: C.ink } },
      typo(c.baseline.label),
      c.baseline.accent && h('span', { style: { marginLeft: '0.3em', color: C.bad } }, typo(c.baseline.accent))),
    note);

  const legendItem = (s: ChartSeries) =>
    h('div', { style: { flexDirection: 'column', flexGrow: 1, flexBasis: 0, paddingTop: pion ? 18 : 12, paddingRight: 16, borderTop: `1px solid ${C.line}` } },
      h('div', { style: { alignItems: 'center', fontFamily: MONO, fontSize: cg.label, letterSpacing: '0.06em', textTransform: 'uppercase', color: C.ink } },
        h('div', { style: { width: pion ? 28 : 20, height: cg.stroke, marginRight: 10, background: color(s), flexShrink: 0 } }),
        typo(s.label)),
      h('div', { style: { marginTop: pion ? 12 : 6, alignItems: 'baseline', fontFamily: DISPLAY, fontWeight: 300, fontSize: valueSize, lineHeight: 1, letterSpacing: '-0.05em', color: color(s) } },
        s.value,
        s.unit && h('span', { style: { marginLeft: 8, fontSize: Math.round(valueSize * UNIT_SCALE), letterSpacing: '-0.02em' } }, s.unit)),
      h('div', { style: { marginTop: pion ? 10 : 6, fontFamily: MONO, fontSize: cg.detail, lineHeight: 1.35, color: C.muted } }, typo(s.detail)));
  const legend = h('div', { style: pion ? { width: W } : { flexDirection: 'column', width: cg.legendW, flexShrink: 0, justifyContent: 'space-between', marginRight: cg.gap } },
    ...c.series.map(legendItem));

  return frame(set, i, f, theme,
    pion
      ? h('div', { style: { flexDirection: 'column' } }, legend, h('div', { style: { marginTop: cg.gap } }, chart))
      : h('div', { style: { alignItems: 'stretch' } }, legend, chart));
}

/* ---------- Styl „proporcje”: części całości ---------- */

/** Geometria: pasek poziomy (barH, liczby pod nim) albo kolumny 100% (colW × colH, liczby obok segmentów). */
const SG = {
  pion: { barH: 220, gap: 56, seam: 4, num: 96, label: 24, sub: 14, share: 28, head: 15, headH: 52, colW: 150, colH: 600, tick: 16 },
  poziom: { barH: 84, gap: 28, seam: 3, num: 56, label: 18, sub: 11, share: 18, head: 11, headH: 32, colW: 96, colH: 300, tick: 12 },
};

function splitLayout(set: InfographicSet, i: Infographic, sp: Split, f: FormatKey, theme: ThemeKey): Node {
  const C = THEMES[theme].colors;
  const sg = SG[f];
  const pion = f === 'pion';
  const inner = FORMATS[f].width - 2 * G[f].padX;
  const fill = (seg: SplitSegment) => ({ blue: C.blue, slate: C.bar, soft: C.soft })[seg.tone];
  // napis na kobalcie w kolorze tła (biel w dzień, granat w nocy), na łupku — atrament
  const onFill = (seg: SplitSegment) => (seg.tone === 'blue' ? C.bg : C.ink);
  const total = (bar: SplitBar) => bar.segments.reduce((n, seg) => n + seg.value, 0);
  const number = (seg: SplitSegment) =>
    h('div', { style: { alignItems: 'baseline', fontFamily: DISPLAY, fontWeight: 300, fontSize: sg.num, lineHeight: 1, letterSpacing: '-0.05em', color: seg.tone === 'blue' ? C.blue : C.ink } },
      seg.display,
      sp.unit && h('span', { style: { marginLeft: 8, fontSize: Math.round(sg.num * UNIT_SCALE), letterSpacing: '-0.02em' } }, sp.unit));
  const labels = (seg: SplitSegment) => [
    h('span', { style: { marginTop: pion ? 12 : 6, fontFamily: BODY, fontSize: sg.label, lineHeight: 1.25, color: C.ink } }, typo(seg.label)),
    seg.sub && h('span', { style: { marginTop: pion ? 6 : 3, fontFamily: MONO, fontSize: sg.sub, letterSpacing: '0.06em', textTransform: 'uppercase', color: seg.tone === 'blue' ? C.blue : C.muted } }, typo(seg.sub)),
  ];

  // jeden pasek: gruba krecha na całą szerokość, udziały w segmentach, liczby w kolumnach pod spodem
  if (sp.bars.length === 1) {
    const bar = sp.bars[0];
    const width = inner - (bar.segments.length - 1) * sg.seam;
    const strip = h('div', { style: { width: inner, height: sg.barH } },
      ...bar.segments.map((seg, k) =>
        h('div', { style: { width: Math.round((seg.value / total(bar)) * width), height: sg.barH, marginLeft: k ? sg.seam : 0, background: fill(seg), alignItems: 'flex-end', padding: pion ? 16 : 10, fontFamily: DISPLAY, fontSize: sg.share, lineHeight: 1, color: onFill(seg) } },
          seg.share ?? '')));
    const legend = h('div', { style: { width: inner, marginTop: sg.gap } },
      ...bar.segments.map((seg) =>
        h('div', { style: { flexDirection: 'column', flexGrow: 1, flexBasis: 0, paddingRight: 16 } },
          h('div', { style: { width: pion ? 28 : 20, height: pion ? 10 : 7, marginBottom: pion ? 16 : 10, background: fill(seg) } }),
          number(seg),
          ...labels(seg))));
    return frame(set, i, f, theme, h('div', { style: { flexDirection: 'column' } }, strip, legend));
  }

  // kilka pasków: kolumny 100% obok siebie, przy każdym segmencie kreska do liczby
  const blockH = sg.num + sg.label * 1.25 + (pion ? 12 : 6) + sg.sub * 1.4 + (pion ? 6 : 3);
  const column = (bar: SplitBar) => {
    const height = sg.colH - (bar.segments.length - 1) * sg.seam;
    let y = 0;
    const placed = bar.segments.map((seg, k) => {
      const hgt = (seg.value / total(bar)) * height;
      const top = y + (k ? sg.seam : 0);
      y = top + hgt;
      return { seg, top, hgt, mid: top + hgt / 2 };
    });
    return h('div', { style: { flexDirection: 'column', flexGrow: 1, flexBasis: 0 } },
      h('div', { style: { height: sg.headH, alignItems: 'flex-end', paddingBottom: pion ? 14 : 8, paddingRight: 24, fontFamily: MONO, fontSize: sg.head, lineHeight: 1.35, letterSpacing: '0.06em', textTransform: 'uppercase', color: C.ink } }, typo(bar.label ?? '')),
      h('div', {},
        h('div', { style: { position: 'relative', width: sg.colW, height: sg.colH, flexShrink: 0 } },
          ...placed.map(({ seg, top, hgt }) =>
            h('div', { style: { position: 'absolute', left: 0, top: Math.round(top), width: sg.colW, height: Math.max(2, Math.round(hgt)), background: fill(seg) } }))),
        h('div', { style: { position: 'relative', flexGrow: 1, height: sg.colH } },
          ...placed.flatMap(({ seg, mid }) => [
            h('div', { style: { position: 'absolute', left: 0, top: Math.round(mid - 1), width: sg.tick, height: 2, background: fill(seg) } }),
            h('div', { style: { position: 'absolute', left: sg.tick + 10, top: Math.round(Math.min(Math.max(mid - blockH / 2, 0), sg.colH - blockH)), flexDirection: 'column' } },
              number(seg),
              ...labels(seg)),
          ]))));
  };
  return frame(set, i, f, theme, h('div', { style: { width: inner } }, ...sp.bars.map(column)));
}

/* ---------- Styl „tabela”: liczby rok po roku, przy każdej mały pasek ---------- */

/**
 * Geometria tabeli. Pion: lata w wierszach, podmioty w kolumnach, pasek poziomy obok liczby.
 * Poziom: podmioty w wierszach, lata w kolumnach (16 lat nie zmieści się w wysokości 675),
 * pasek pionowy nad liczbą — w obu układach paski rosną w poprzek osi czasu.
 */
const TG = {
  pion: { headH: 84, rowH: 39, sumH: 60, periodW: 150, num: 24, numW: 42, barH: 10, barMax: 104, label: 22, sub: 13, period: 16, sumSub: 12, total: 30 },
  poziom: { headH: 46, rowH: 76, labelW: 190, sumW: 92, num: 16, barW: 12, barMax: 38, label: 17, sub: 10, period: 11, sumSub: 10, total: 24 },
};

function tableLayout(set: InfographicSet, i: Infographic, t: DataTable, f: FormatKey, theme: ThemeKey): Node {
  const C = THEMES[theme].colors;
  const inner = FORMATS[f].width - 2 * G[f].padX;
  const max = Math.max(...t.series.flatMap((s) => s.values));
  // zera wyciszone (jak tabela w artykule), żeby było widać lata z decyzjami; zero nie ma paska
  const numColor = (s: TableSeries, v: number) => (v === 0 ? C.muted : s.highlight ? C.blue : C.ink);
  const fill = (s: TableSeries) => (s.highlight ? C.blue : C.bar);
  const tint = (s: TableSeries) => (s.highlight ? C.tint : 'transparent');
  const numStyle = (s: TableSeries, v: number, size: number) => ({ fontFamily: DISPLAY, fontWeight: 300, fontSize: size, lineHeight: 1, letterSpacing: '-0.03em', color: numColor(s, v) });
  const sumStyle = (s: TableSeries, size: number) => ({ fontFamily: DISPLAY, fontWeight: 400, fontSize: size, lineHeight: 1, letterSpacing: '-0.04em', color: s.highlight ? C.blue : C.ink });
  const mono = (size: number, color: string) => ({ fontFamily: MONO, fontSize: size, lineHeight: 1.3, letterSpacing: '0.05em', textTransform: 'uppercase', color });
  const head = (s: TableSeries, g: { label: number; sub: number }) => [
    h('span', { style: { fontFamily: BODY, fontSize: g.label, lineHeight: 1.2, color: C.ink } }, typo(s.label)),
    s.sub && h('span', { style: { marginTop: 4, ...mono(g.sub, s.highlight ? C.blue : C.muted) } }, typo(s.sub)),
  ];
  const sumHead = (row: DataTable['summary'][number], g: { period: number; sumSub: number }) => [
    h('span', { style: mono(g.period, C.ink) }, typo(row.label)),
    row.sub && h('span', { style: { marginTop: 2, ...mono(g.sumSub, C.muted) } }, typo(row.sub)),
  ];

  // Wiersz bez alignItems: komórki rozciągają się na wnętrze wiersza (bez jego linii), więc tło
  // kolumny wyróżnionej nie zasłania linii; treść komórki centruje sama komórka.
  if (f === 'pion') {
    const g = TG.pion;
    const colW = Math.floor((inner - g.periodW) / t.series.length);
    const cell = (s: TableSeries, ...children: (Node | false | undefined)[]) =>
      h('div', { style: { width: colW, flexShrink: 0, alignItems: 'center', paddingLeft: 12, background: tint(s) } }, ...children);
    const line = (color: string) => `1px solid ${color}`;
    const header = h('div', { style: { height: g.headH, borderBottom: line(C.line) } },
      h('div', { style: { width: g.periodW, flexShrink: 0 } }),
      ...t.series.map((s) =>
        h('div', { style: { width: colW, flexShrink: 0, flexDirection: 'column', justifyContent: 'flex-end', paddingLeft: 12, paddingBottom: 12, background: tint(s) } }, ...head(s, g))));
    const row = (period: string, k: number) =>
      h('div', { style: { height: g.rowH, borderBottom: line(C.line) } },
        h('div', { style: { width: g.periodW, flexShrink: 0, alignItems: 'center', ...mono(g.period, C.muted), textTransform: 'none' } }, period),
        ...t.series.map((s) => {
          const v = s.values[k];
          return cell(s,
            h('div', { style: { width: g.numW, flexShrink: 0, justifyContent: 'flex-end', ...numStyle(s, v, g.num) } }, formatPL(v)),
            v > 0 && h('div', { style: { width: Math.max(3, (v / max) * g.barMax), height: g.barH, marginLeft: 12, background: fill(s) } }));
        }));
    // pierwsze podsumowanie oddziela od lat linia w kolorze tekstu, kolejne — zwykła
    const summary = t.summary.map((sum, k) =>
      h('div', { style: { height: g.sumH, borderTop: line(k ? C.line : C.ink) } },
        h('div', { style: { width: g.periodW, flexShrink: 0, flexDirection: 'column', justifyContent: 'center' } }, ...sumHead(sum, g)),
        ...t.series.map((s, j) => cell(s, h('div', { style: sumStyle(s, g.total) }, sum.values[j])))));
    return frame(set, i, f, theme, h('div', { style: { flexDirection: 'column', width: inner } }, header, ...t.periods.map(row), ...summary));
  }

  const g = TG.poziom;
  const cellW = Math.floor((inner - g.labelW - t.summary.length * g.sumW) / t.periods.length);
  const header = h('div', { style: { height: g.headH, borderBottom: `1px solid ${C.line}` } },
    h('div', { style: { width: g.labelW, flexShrink: 0 } }),
    ...t.periods.map((p) => h('div', { style: { width: cellW, flexShrink: 0, justifyContent: 'center', alignItems: 'flex-end', paddingBottom: 6, ...mono(g.period, C.muted), textTransform: 'none' } }, p)),
    ...t.summary.map((sum) =>
      h('div', { style: { width: g.sumW, flexShrink: 0, flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'flex-end', paddingBottom: 6, paddingRight: 8, textAlign: 'right' } }, ...sumHead(sum, g))));
  const row = (s: TableSeries, j: number) =>
    h('div', { style: { height: g.rowH, alignItems: 'center', borderBottom: `1px solid ${C.line}`, background: tint(s) } },
      h('div', { style: { width: g.labelW, flexShrink: 0, flexDirection: 'column', paddingLeft: 8 } }, ...head(s, g)),
      ...s.values.map((v) =>
        h('div', { style: { width: cellW, flexShrink: 0, flexDirection: 'column', alignItems: 'center' } },
          h('div', { style: { height: g.barMax, alignItems: 'flex-end' } },
            v > 0 && h('div', { style: { width: g.barW, height: Math.max(2, (v / max) * g.barMax), background: fill(s) } })),
          h('div', { style: { marginTop: 6, ...numStyle(s, v, g.num) } }, formatPL(v)))),
      ...t.summary.map((sum) =>
        h('div', { style: { width: g.sumW, flexShrink: 0, justifyContent: 'flex-end', paddingRight: 8, ...sumStyle(s, g.total) } }, sum.values[j])));
  return frame(set, i, f, theme, h('div', { style: { flexDirection: 'column', width: inner } }, header, ...t.series.map(row)));
}

/* ---------- Styl „mapa”: warstwa z zestawu map, obok duża liczba i legenda ---------- */

/** Geometria: pion — liczba nad mapą, legenda obok mapy; poziom — mapa po lewej, liczba i legenda po prawej. */
const MG = {
  pion: { mapW: 600, gap: 40, num: 120, text: 24, head: 14, item: 20, sw: 18, val: 22, sizeLab: 15 },
  poziom: { mapW: 410, gap: 44, num: 76, text: 17, head: 11, item: 15, sw: 14, val: 15, sizeLab: 12 },
};

function mapLayout(set: InfographicSet, i: Infographic, m: NonNullable<Infographic['map']>, f: FormatKey, theme: ThemeKey): Node {
  const C = THEMES[theme].colors;
  const sc = staticColors(theme === 'ciemny');
  const mg = MG[f];
  const pion = f === 'pion';
  const inner = FORMATS[f].width - 2 * G[f].padX;
  const layer = mapSets[m.set].layers.find((l) => l.id === m.layer);
  if (!layer) throw new Error(`[infografiki] zestaw map „${m.set}” nie ma warstwy „${m.layer}”`);

  // mapa jako obrazek SVG z tego samego renderera co strona; wartości województw jako tekst Satori (krój)
  const W = mg.mapW, H = Math.round((W * geo.height) / geo.width), k = W / geo.width;
  const src = `data:image/svg+xml;base64,${Buffer.from(renderMapSvg([layer], { theme, active: layer.id, labels: false })).toString('base64')}`;
  const tones = layer.kind === 'regions' ? regionTones(layer) : null;
  const values = tones
    ? geo.voivodeships.map((r) => {
        const t = tones.get(r.teryt)!;
        return h('div', { style: { position: 'absolute', left: Math.round(r.label[0] * k - 40), top: Math.round(r.label[1] * k - mg.val * 0.6), width: 80, justifyContent: 'center', fontFamily: MONO, fontWeight: 500, fontSize: mg.val, lineHeight: 1.2, color: sc.onSeq[t.tone] } }, t.display);
      })
    : [];
  const map = h('div', { style: { position: 'relative', width: W, height: H, flexShrink: 0 } }, h('img', { src, width: W, height: H, style: { position: 'absolute', left: 0, top: 0 } }), ...values);

  const head = (text: string) =>
    h('div', { style: { marginBottom: pion ? 12 : 8, fontFamily: MONO, fontSize: mg.head, letterSpacing: '0.06em', textTransform: 'uppercase', color: C.muted } }, typo(text));
  const item = (sw: Node, label: string, n?: string) =>
    h('div', { style: { alignItems: 'center', marginTop: pion ? 10 : 6, fontFamily: BODY, fontSize: mg.item, lineHeight: 1.3, color: C.ink } },
      h('div', { style: { width: Math.round(mg.sw * 1.6), flexShrink: 0, justifyContent: 'center' } }, sw),
      h('span', { style: { marginLeft: 10, flexGrow: 1 } }, typo(label)),
      n && h('span', { style: { marginLeft: 12, fontFamily: MONO, fontSize: Math.round(mg.item * 0.85), color: C.muted } }, n));
  const swatch = (color: string, square: boolean) =>
    h('div', { style: square ? { width: Math.round(mg.sw * 1.6), height: Math.round(mg.sw * 0.7), background: color } : { width: mg.sw, height: mg.sw, borderRadius: '50%', background: color } });

  const summary = layer.summary &&
    h('div', { style: { alignItems: 'baseline', marginBottom: pion ? 32 : 18 } },
      h('span', { style: { flexShrink: 0, fontFamily: DISPLAY, fontWeight: 300, fontSize: mg.num, lineHeight: 1, letterSpacing: '-0.05em', color: C.ink } }, layer.summary.value),
      h('span', { style: { marginLeft: 18, maxWidth: pion ? 420 : 300, fontFamily: BODY, fontSize: mg.text, lineHeight: 1.35, color: C.ink } }, layer.summary.text));

  const scale = h('div', { style: { flexDirection: 'column' } },
    head(layer.scale.title),
    ...layer.scale.labels.map((label, t) => item(swatch(sc.seq[toneOfClass(t, layer.scale)], layer.kind === 'regions'), label, layer.scale.counts && formatPL(layer.scale.counts[t]))));
  const sizes = layer.kind === 'points' && layer.size && (() => {
    const R = radius(Math.max(...layer.size.samples), layer.size.radius) * k * 1.6;
    return h('div', { style: { flexDirection: 'column', marginTop: pion ? 28 : 16 } },
      head(layer.size.title),
      h('div', { style: { alignItems: 'flex-end' } },
        ...layer.size.samples.map((n) => {
          const r = radius(n, layer.size!.radius) * k * 1.6;
          return h('div', { style: { flexDirection: 'column', alignItems: 'center', width: Math.max(2 * R, 48), marginRight: 12 } },
            h('div', { style: { width: 2 * r, height: 2 * r, borderRadius: '50%', border: `1px solid ${C.muted}` } }),
            h('span', { style: { marginTop: 6, fontFamily: MONO, fontSize: mg.sizeLab, color: C.muted } }, formatPL(n)));
        })));
  })();
  const missing = layer.kind === 'points' && layer.missing &&
    h('div', { style: { marginTop: pion ? 18 : 10 } }, item(h('div', { style: { width: Math.round(R_MISSING * k * 4), height: Math.round(R_MISSING * k * 4), borderRadius: '50%', background: sc.missing } }), layer.missing.label, formatPL(layer.missing.count)));
  const legend = h('div', { style: { flexDirection: 'column', flexGrow: 1 } }, scale, sizes, missing);

  return frame(set, i, f, theme,
    pion
      ? h('div', { style: { flexDirection: 'column', width: inner } }, summary, h('div', { style: { alignItems: 'flex-start' } }, map, h('div', { style: { flexDirection: 'column', marginLeft: mg.gap, width: inner - W - mg.gap } }, legend)))
      : h('div', { style: { alignItems: 'center', width: inner } }, map, h('div', { style: { flexDirection: 'column', marginLeft: mg.gap, width: inner - W - mg.gap } }, summary, legend)));
}

/** PNG z paletą 8-bit, jak obrazki OG. */
export async function renderInfographic(set: InfographicSet, i: Infographic, f: FormatKey, theme: ThemeKey = 'jasny'): Promise<Buffer> {
  const { width, height } = FORMATS[f];
  const tree = i.map
    ? mapLayout(set, i, i.map, f, theme)
    : i.chart
      ? chartLayout(set, i, i.chart, f, theme)
      : i.split
        ? splitLayout(set, i, i.split, f, theme)
        : i.table
          ? tableLayout(set, i, i.table, f, theme)
          : layout(set, i, i.rows ?? [], f, theme);
  const svg = await satori(tree as unknown as Parameters<typeof satori>[0], { width, height, fonts: await loadFonts() });
  return sharp(Buffer.from(svg)).png({ palette: true, quality: 90, compressionLevel: 9 }).toBuffer();
}
