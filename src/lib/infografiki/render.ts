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
 * same liczby, bez pasków (zob. tableLayout). Piąty, „mapa” (pole `map`):
 * warstwa z zestawu map (lib/mapa) — ten sam renderer co mapa na stronie, obok legenda (zob. mapLayout).
 * Szósty, „cytat” (pole `quote`): wypowiedź dosłownie, pod nią podpis funkcją i krótkie fakty (zob. quoteLayout).
 * Siódmy, „kropki” (pole `dots`): dwie plansze po 100 pól z siatki strony (lib/siatka) — część całości
 * po lewej, a po prawej, co dzieje się z tą częścią (zob. dotsLayout).
 * Ósmy, „oś czasu” (pole `timeline`): kolejne sprzeciwy jednego podmiotu jako znaczniki z krzyżykiem
 * na osi, pod osią dwie liczby ze zdaniem (zob. timelineLayout).
 * Dziewiąty, „trzy okna” (pole `views`): część całości z perspektywy każdego, kto ją widzi — małe plansze
 * po 100 pól, na każdej zapalone tylko pola jednej części; obok pełna plansza w kobalcie z sumą (zob. viewsLayout).
 * Dziesiąty, „kolejka” (pole `queue`): ile osób przypada na jedno miejsce — rząd pól siatki (kropka = miejsce,
 * plusy = reszta kolejki) z liczbą — i obok druga miara jako cienki pasek, np. próg (zob. queueLayout; na stronie blocks/QueueChart).
 * Rama (nagłówek i stopka) wspólna dla wszystkich stylów.
 */
import sharp from 'sharp';
import satori from 'satori';
import { renderSVG } from 'uqr';
import { formatNumber, formatPL, typo } from '@/lib/format';
import type { Locale } from '@/i18n/locales';
import { tokenPair } from '@/lib/tokens';
import { geo } from '@/lib/mapa/geo';
import { radius, R_MISSING, toneOfClass } from '@/lib/mapa/layout';
import { mapSets, type MapSetId } from '@/lib/mapa/sets';
import { regionTones, renderMapSvg, staticColors } from '@/lib/mapa/svg';
import { GEOMETRY } from '@/lib/siatka';
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
  /** dopisek pod liczbą (np. „szacunek”), wersaliki, mono */
  valueNote?: string;
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
  /**
   * Różnica między końcami dwóch linii: klamra na prawo od kropek (od `from` do `to` w punkcie `x`)
   * i podpis obok niej — pierwsza linia w kolorze alarmu. Wymaga zapasu na osi: xMax wyraźnie za `x`.
   */
  gap?: { x: number; from: number; to: number; lines: string[] };
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

export interface Quote {
  /**
   * Wiersze cytatu osobno dla formatów — łamane ręcznie, żeby nazwa nie rozpadła się na dwa wiersze
   * i ostatnie słowo nie zostało samo. Fragment w `**…**` w kobalcie. Cudzysłów otwierający dokleja szablon.
   */
  lines: Record<FormatKey, string[]>;
  /** kto mówi — funkcja, nie nazwisko (pogrubione) */
  who: string;
  /** gdzie i kiedy, np. „w RMF FM, czerwiec 2026” */
  where: string;
  /** fakty pod cytatem: etykieta (mono) i tekst; `**…**` pogrubione, `\n` = nowy wiersz */
  facts: { label: string; text: string }[];
}

/**
 * Plansza 10×10 = 100 pól siatki strony: kropka (zapalone), mniejsza kropka (pośrednie, np. „mniej
 * niż 1”) albo plus (wygaszone). Kobalt niesie tezę; obrysów wokół pól nie ma — część odróżnia kolor.
 */
export interface DotPanel {
  /** duża liczba nad planszą, w kobalcie */
  display: string;
  label: string;
  /** dopisek pod opisem (wersaliki, mono) */
  sub?: string;
  /** ile pól w kobalcie */
  blue: number;
  /** kształt pól w kobalcie */
  blueCell: 'on' | 'mid';
  /** reszta pól: łupkowe kropki (część całości) albo wygaszone plusy */
  rest: 'on' | 'off';
  /** pola w kobalcie od końca planszy (dolny wiersz) albo od początku */
  from: 'start' | 'end';
}

/** Styl „kropki”: dwie plansze obok siebie, liczby i opisy nad nimi (pion) albo po bokach (poziom). */
export interface Dots {
  panels: [DotPanel, DotPanel];
}

/** Wiersz stylu „kolejka”: osoby na jedno miejsce (kolejka ma Math.round(count) pól) i druga miara jako pasek. */
export interface QueueRow {
  label: string;
  count: number;
  countDisplay: string;
  /** druga miara w skali 0…barMax */
  bar: number;
  barDisplay: string;
  highlight?: boolean;
}

/** Styl „kolejka”: kolejki obok siebie, przy każdej pasek drugiej miary (np. próg). */
export interface Queue {
  rows: QueueRow[];
  /** nagłówki kolumn (poziom) i podpis paska (pion), np. „zgłoszenia na jedno miejsce”, „próg” */
  countLabel: string;
  barLabel: string;
  barMax: number;
}

/** Część w stylu „trzy okna”: kto ją widzi i które pola planszy (od `from`, `dots` pól) są jej. */
export interface ViewPart {
  /** kto widzi tę część (wersaliki, mono), np. „widzi szpital A” */
  who: string;
  /** liczba pod planszą (bez „zł” — dokleja szablon) */
  display: string;
  /** rodzaj części, np. „etat” */
  label: string;
  /** pierwsze pole części (0–99); części leżą obok siebie, więc razem dają pełną planszę */
  from: number;
  dots: number;
}

/**
 * Styl „trzy okna”: każdy widzi na swojej planszy tylko swoje pola (reszta to wygaszone plusy), a pełnej
 * planszy w kobalcie z sumą nie widzi nikt. Nad planszami opcjonalnie nawiasy ⊓ jak w filmie „Doba”.
 */
export interface Views {
  parts: ViewPart[];
  total: { display: string; label: string; sub: string };
  /** hasło w prawym dolnym rogu, np. „Jedna osoba. Jedna suma. Anonimowo.” */
  slogan: string;
  /** podpisy nawiasów: nad każdą małą planszą i nad pełną */
  brackets?: { part: string; total: string };
}

/** Zdarzenie na osi czasu: rok, co się stało, kto (wersaliki, mono). */
export interface TimelineEvent {
  year: string;
  text: string;
  who: string;
}

/** Duża liczba pod osią czasu ze zdaniem obok (poziom) albo pod nią (pion). */
export interface TimelineFigure {
  value: string;
  /** jednostka za liczbą, mniejszym stopniem (np. „mies.”) */
  unit?: string;
  text: string;
  /** liczba w kobalcie (to, o czym teza) */
  highlight?: boolean;
}

/**
 * Styl „oś czasu”: zdarzenia jedno po drugim — w poziomie kolumny wzdłuż osi, w pionie wiersze
 * wzdłuż osi pionowej. Znacznik każdego zdarzenia to krzyżyk w kółku w kolorze alarmu (sprzeciw).
 */
export interface Timeline {
  events: TimelineEvent[];
  /** zdanie pod osią, np. uzasadnienie podmiotu (szare) */
  note?: string;
  /** dwie liczby pod osią */
  figures: TimelineFigure[];
}

export interface Infographic {
  /** slug pliku */
  id: string;
  /** tytuł na /media/ i w udostępnianiu; grafika z `quote` go nie rysuje */
  title: string;
  /** dalszy ciąg tytułu w kolorze alarmu (wykres): „Kolejka nie maleje.” */
  titleAccent?: string;
  /** zamiast wierszy: wykres liniowy */
  chart?: LineChart;
  /** zamiast wierszy: części całości */
  split?: Split;
  /** zamiast wierszy: tabela rok po roku */
  table?: DataTable;
  /** zamiast wierszy: oś czasu */
  timeline?: Timeline;
  /** zamiast wierszy: warstwa mapy z lib/mapa/sets */
  map?: { set: MapSetId; layer: string };
  /** zamiast wierszy: dwie plansze po 100 pól */
  dots?: Dots;
  /** zamiast wierszy: części na osobnych planszach i pełna plansza z sumą */
  views?: Views;
  /** zamiast wierszy: kolejki na jedno miejsce z drugą miarą obok */
  queue?: Queue;
  /** zamiast wierszy: cytat */
  quote?: Quote;
  /** miara i okres, np. „na 100 tys. lekarzy rocznie · 2020–2025”; przy cytacie — etykieta obok logo */
  measure: string;
  /** jednostka za każdą liczbą, mniejszym stopniem (np. „%”) */
  unit?: string;
  /** wiersze porównania (styl podstawowy); grafika z `chart`, `split`, `table`, `map`, `dots`, `views` albo `timeline` ich nie ma */
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
  /** język stałych napisów i zapisu liczb (wersje EN: src/lib/infografiki/zestawy-en.ts); domyślnie polski */
  locale?: Locale;
  /**
   * klucze zestawów innych stron, których grafiki pokazujemy też w sekcji „Infografiki do pobrania” tej strony
   * (bez kopii plików: adres, QR i podpis prowadzą do strony źródłowej; na /media/ grafika jest raz)
   */
  also?: string[];
}

/** Akapit nad siatką infografik: formaty i to, co jest na grafice. */
export const infographicsLead = (count: number) =>
  `${count > 1 ? 'Grafiki' : 'Grafika'} do udostępnienia w dwóch formatach: pionowym ${FORMATS.pion.width}×${FORMATS.pion.height} (${FORMATS.pion.use}) i poziomym ${FORMATS.poziom.width}×${FORMATS.poziom.height} (${FORMATS.poziom.use}), w wersji jasnej i ciemnej. Źródła, adres strony i kod QR do niej są na grafice.`;

const setSlug = (route: string) => route.replace(/^\/|\/$/g, '').split('/').pop()!;

/** Adres PNG: /infografiki/[en/]<ostatni człon trasy>/<id>-<szer>x<wys>[-ciemny].png */
export const infographicUrl = (set: InfographicSet, id: string, f: FormatKey, theme: ThemeKey = 'jasny') =>
  `/infografiki/${set.locale === 'en' ? 'en/' : ''}${setSlug(set.route)}/${id}-${FORMATS[f].width}x${FORMATS[f].height}${theme === 'jasny' ? '' : `-${theme}`}.png`;

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
  const figure = (r: ComparisonRow) =>
    h('div', { style: { alignItems: 'baseline', fontFamily: DISPLAY, fontWeight: 300, fontSize: g.num, lineHeight: 1, letterSpacing: '-0.05em', color: r.highlight ? C.blue : C.ink } },
      r.display,
      i.unit && h('span', { style: { marginLeft: 8, fontSize: Math.round(g.num * UNIT_SCALE), letterSpacing: '-0.02em' } }, i.unit));
  const number = (r: ComparisonRow) =>
    r.valueNote
      ? h('div', { style: { width: numW, flexShrink: 0, flexDirection: 'column' } },
          figure(r),
          h('span', { style: { marginTop: 4, fontFamily: MONO, fontSize: g.sub, letterSpacing: '0.06em', textTransform: 'uppercase', color: C.muted } }, typo(r.valueNote)))
      : h('div', { style: { width: numW, flexShrink: 0 } }, figure(r));
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
    // cytat nie ma tytułu: bohaterem jest wypowiedź, nad nią tylko logo i etykieta w jednym wierszu
    i.quote
      ? h('div', { style: { alignItems: 'center', justifyContent: 'space-between', paddingBottom: pion ? 28 : 18, borderBottom: `1px solid ${C.line}` } },
          logo(C),
          h('span', { style: { fontFamily: MONO, fontSize: g.measure, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.muted } }, typo(i.measure)))
      : h('div', { style: { flexDirection: 'column' } },
      logo(C),
      i.titleAccent
        ? h('div', { style: { ...titleStyle, flexWrap: 'wrap' } }, h('span', { style: { marginRight: '0.25em' } }, typo(i.title)), h('span', { style: { color: C.bad } }, typo(i.titleAccent)))
        : h('div', { style: titleStyle }, typo(i.title)),
      h('div', { style: { marginTop: pion ? 18 : 10, fontFamily: MONO, fontSize: g.measure, letterSpacing: '0.06em', textTransform: 'uppercase', color: C.blue } }, typo(i.measure))),
    body,
    h('div', { style: { alignItems: 'center', justifyContent: 'space-between', paddingTop: pion ? 20 : 12, borderTop: `1px solid ${C.ink}`, fontFamily: MONO } },
      h('div', { style: { flexDirection: 'column', paddingRight: 24 } },
        h('span', { style: { fontSize: g.url, color: C.ink } }, pageUrl.replace(/^https:\/\/|\/$/g, '')),
        followX(C, g.src + 2, { marginTop: pion ? 8 : 5 }, set.locale),
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
  // klamra różnicy: pionowa kreska z wąsami do obu kropek, na prawo od ich obwódek
  const gapX = c.gap ? r1(sx(c.gap.x) + cg.dot * 3.4) : 0;
  if (c.gap) {
    const [y1, y2] = [r1(sy(c.gap.from)), r1(sy(c.gap.to))];
    const tickW = r1(cg.dot * 1.6);
    const sw = r1(cg.stroke * 0.45);
    svg.push(`<path d="M${r1(gapX - tickW)} ${y1}H${gapX}V${y2}H${r1(gapX - tickW)}" fill="none" stroke="${C.bad}" stroke-width="${sw}"/>`);
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
  const gapLabel = c.gap && (() => {
    const lh = 1.25;
    const height = Math.round(cg.note * lh + (c.gap!.lines.length - 1) * cg.noteSub * lh);
    const leftX = Math.round(gapX + 12);
    return h('div', { style: { position: 'absolute', left: leftX, width: W - leftX, top: Math.round(sy((c.gap.from + c.gap.to) / 2) - height / 2), flexDirection: 'column', lineHeight: lh } },
      ...c.gap.lines.map((text, k) =>
        h('span', { style: k === 0 ? { fontFamily: BODY, fontSize: cg.note, color: C.bad } : { fontFamily: BODY, fontSize: cg.noteSub, color: C.ink } }, typo(text))));
  })();
  const chart = h('div', { style: { position: 'relative', width: W, height: H, flexShrink: 0 } },
    h('img', { src: lines, width: W, height: H, style: { position: 'absolute', left: 0, top: 0 } }),
    ...c.yTicks.map((t) => tick(String(t), { left: 0, width: left - 12, top: Math.round(sy(t) - cg.tick / 2), justifyContent: 'flex-end' })),
    ...c.xTicks.map((t) => tick(t.label, { left: Math.round(sx(t.x) - 40), width: 80, top: top + plotH + Math.round((cg.xLab - cg.tick) / 2), justifyContent: 'center' })),
    c.baseline && h('div', { style: { position: 'absolute', right: 14, top: Math.round(sy(c.baseline.v) - cg.note * 1.3 - 8), fontFamily: BODY, fontSize: cg.note, lineHeight: 1.3, color: C.ink } },
      typo(c.baseline.label),
      c.baseline.accent && h('span', { style: { marginLeft: '0.3em', color: C.bad } }, typo(c.baseline.accent))),
    note,
    gapLabel);

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

/* ---------- Styl „tabela”: liczby rok po roku ---------- */

/**
 * Geometria tabeli. Pion: lata w wierszach, podmioty w kolumnach. Poziom: podmioty w wierszach,
 * lata w kolumnach (16 lat nie zmieści się w wysokości 675). Same liczby, bez pasków w komórkach:
 * małe paski nic nie mówiły (decyzja 21.10.2026); proporcje niesie grafika z porównaniem krajów.
 */
const TG = {
  pion: { headH: 84, rowH: 39, sumH: 60, periodW: 150, num: 24, numW: 60, label: 22, sub: 13, period: 16, sumSub: 12, total: 30 },
  poziom: { headH: 46, rowH: 76, labelW: 190, sumW: 92, num: 20, label: 17, sub: 10, period: 11, sumSub: 10, total: 24 },
};

function tableLayout(set: InfographicSet, i: Infographic, t: DataTable, f: FormatKey, theme: ThemeKey): Node {
  const C = THEMES[theme].colors;
  const inner = FORMATS[f].width - 2 * G[f].padX;
  // zera wyciszone (jak tabela w artykule), żeby było widać lata z decyzjami
  const numColor = (s: TableSeries, v: number) => (v === 0 ? C.muted : s.highlight ? C.blue : C.ink);
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
          return cell(s, h('div', { style: { width: g.numW, flexShrink: 0, justifyContent: 'flex-end', ...numStyle(s, v, g.num) } }, formatNumber(v, 0, set.locale ?? 'pl')));
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
        h('div', { style: { width: cellW, flexShrink: 0, justifyContent: 'center', ...numStyle(s, v, g.num) } }, formatNumber(v, 0, set.locale ?? 'pl'))),
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

/* ---------- Styl „cytat”: wypowiedź dosłownie, podpis funkcją, pod spodem fakty ---------- */

/** Geometria: `hang` = margines, w który wisi cudzysłów otwierający; pion — fakty jeden pod drugim, poziom — obok siebie. */
const QG = {
  pion: { quote: 82, hang: 42, who: 24, whoGap: 32, label: 15, fact: 23, factPad: 26 },
  poziom: { quote: 62, hang: 34, who: 19, whoGap: 20, label: 12, fact: 16, factPad: 16 },
};

function quoteLayout(set: InfographicSet, i: Infographic, q: Quote, f: FormatKey, theme: ThemeKey): Node {
  const { width } = FORMATS[f];
  const C = THEMES[theme].colors;
  const g = G[f];
  const qg = QG[f];
  const pion = f === 'pion';
  const inner = width - 2 * g.padX;

  // fragmenty `**…**` jako osobne spany, odstęp między nimi marginesem (Satori obcina spacje na brzegach)
  const parts = (text: string, marked: Record<string, string | number>) =>
    text.split(/\*\*(.+?)\*\*/).map((part, j) => part.trim()
      ? h('span', { style: { marginRight: '0.25em', ...(j % 2 ? marked : {}) } }, typo(part.trim()))
      : null);
  const line = (text: string, k: number) =>
    h('div', { style: { position: 'relative', color: C.ink } },
      // cudzysłów otwierający: po polsku dolny „, po angielsku górny “
      k === 0 && h('span', { style: { position: 'absolute', left: -qg.hang, top: 0, color: C.blue } }, set.locale === 'en' ? '“' : '„'),
      ...parts(text, { color: C.blue }));
  const quote = h('div', { style: { flexDirection: 'column', flexGrow: 1, justifyContent: 'center', paddingLeft: qg.hang } },
    h('div', { style: { flexDirection: 'column', fontFamily: DISPLAY, fontWeight: 400, fontSize: qg.quote, lineHeight: 1.08, letterSpacing: '-0.022em' } },
      ...q.lines[f].map(line)),
    h('div', { style: { marginTop: qg.whoGap, fontFamily: BODY, fontSize: qg.who, color: C.muted } },
      h('span', { style: { marginRight: '0.3em' } }, '—'),
      h('span', { style: { marginRight: '0.25em', fontWeight: 600, color: C.ink } }, typo(q.who)),
      typo(q.where)));

  const factW = pion ? inner : Math.floor((inner * 2) / 3);
  const fact = (x: Quote['facts'][number], k: number) => {
    const w = pion ? inner : k === 0 ? factW : inner - factW;
    const side = !pion && k > 0;
    return h('div', { style: { flexDirection: 'column', width: w, padding: `${qg.factPad}px ${side ? 0 : 24}px ${qg.factPad}px ${side ? 32 : 0}px`, ...(side ? { borderLeft: `1px solid ${C.line}` } : {}), ...(pion && k > 0 ? { borderTop: `1px solid ${C.line}` } : {}) } },
      h('span', { style: { marginBottom: pion ? 10 : 6, fontFamily: MONO, fontSize: qg.label, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.muted } }, typo(x.label)),
      ...x.text.split('\n').map((row) =>
        h('div', { style: { flexWrap: 'wrap', fontFamily: BODY, fontSize: qg.fact, lineHeight: 1.4, color: C.ink } }, ...parts(row, { fontWeight: 600 }))));
  };
  const facts = h('div', { style: { flexDirection: pion ? 'column' : 'row', width: inner, marginBottom: pion ? 8 : 4, borderTop: `1px solid ${C.line}` } }, ...q.facts.map(fact));

  return frame(set, i, f, theme, h('div', { style: { flexDirection: 'column', flexGrow: 1, width: inner } }, quote, facts));
}

/* ---------- Styl „kropki”: dwie plansze po 100 pól ---------- */

/** Geometria: `cell` = bok pola planszy; poziom — opisy po bokach, `gap` między planszami. */
const DG = {
  pion: { cell: 38, num: 120, label: 24, sub: 14, gap: 40 },
  poziom: { cell: 27, num: 64, label: 16, sub: 10, gap: 120 },
};
const DOTS_N = 10;

function dotsLayout(set: InfographicSet, i: Infographic, d: Dots, f: FormatKey, theme: ThemeKey): Node {
  const C = THEMES[theme].colors;
  const dg = DG[f];
  const pion = f === 'pion';
  const inner = FORMATS[f].width - 2 * G[f].padX;
  const side = DOTS_N * dg.cell;
  const total = DOTS_N * DOTS_N;

  // plansza jako SVG w <img> (Satori nie rysuje ścieżek inline); kształty z geometrii siatki strony
  const board = (p: DotPanel) => {
    const c = dg.cell;
    const arm = GEOMETRY.arm * c;
    const cells = Array.from({ length: total }, (_, k) => {
      const cx = (k % DOTS_N) * c + c / 2;
      const cy = Math.floor(k / DOTS_N) * c + c / 2;
      const blue = p.from === 'end' ? k >= total - p.blue : k < p.blue;
      if (blue) return `<circle cx="${cx}" cy="${cy}" r="${GEOMETRY[p.blueCell] * c}" fill="${C.blue}"/>`;
      return p.rest === 'on'
        ? `<circle cx="${cx}" cy="${cy}" r="${GEOMETRY.on * c}" fill="${C.bar}"/>`
        : `<path d="M${cx} ${cy - arm}v${2 * arm}M${cx - arm} ${cy}h${2 * arm}" stroke="${C.bar}" stroke-width="${GEOMETRY.stroke * c}" fill="none"/>`;
    });
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${side}" height="${side}" viewBox="0 0 ${side} ${side}">${cells.join('')}</svg>`;
    return h('img', { src: `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`, width: side, height: side });
  };
  const figure = (p: DotPanel, w: number) =>
    h('div', { style: { flexDirection: 'column', width: w } },
      h('div', { style: { alignItems: 'baseline', fontFamily: DISPLAY, fontWeight: 300, fontSize: dg.num, lineHeight: 1, letterSpacing: '-0.05em', color: C.blue } },
        p.display,
        i.unit && h('span', { style: { marginLeft: 8, fontSize: Math.round(dg.num * UNIT_SCALE), letterSpacing: '-0.02em' } }, i.unit)),
      h('span', { style: { marginTop: pion ? 12 : 6, fontFamily: BODY, fontSize: dg.label, lineHeight: 1.25, color: C.ink } }, typo(p.label)),
      p.sub && h('span', { style: { marginTop: pion ? 8 : 4, fontFamily: MONO, fontSize: dg.sub, letterSpacing: '0.06em', textTransform: 'uppercase', color: C.muted } }, typo(p.sub)));

  const [a, b] = d.panels;
  if (pion) {
    return frame(set, i, f, theme,
      h('div', { style: { flexDirection: 'column', width: inner } },
        h('div', { style: { justifyContent: 'space-between', alignItems: 'flex-end' } }, figure(a, side), figure(b, side)),
        h('div', { style: { justifyContent: 'space-between', marginTop: dg.gap } }, board(a), board(b))));
  }
  // poziom: opis | plansza — przerwa — plansza | opis
  const textW = Math.floor((inner - 2 * side - dg.gap) / 2) - 20;
  return frame(set, i, f, theme,
    h('div', { style: { alignItems: 'center', justifyContent: 'space-between', width: inner } },
      figure(a, textW),
      h('div', { style: { width: 2 * side + dg.gap, justifyContent: 'space-between' } }, board(a), board(b)),
      figure(b, textW)));
}

/* ---------- Styl „trzy okna”: każdy widzi swoje pola, pełnej planszy nikt ---------- */

/**
 * Geometria. Pion: małe plansze w rzędzie, pod linią pełna plansza z sumą i hasłem obok. Poziom: małe
 * plansze po lewej, za pionową linią pełna plansza z sumą. `hb`/`hbBig` — podpisy nawiasów.
 */
const VG = {
  pion: { cell: 22, who: 15, num: 52, label: 19, board: 28, totalNum: 112, slogan: 34, gap: 30, hb: 26, hbBig: 28, stroke: 3, tick: 14, partsW: 0 },
  poziom: { cell: 13, who: 10, num: 30, label: 13, board: 20, totalNum: 58, slogan: 20, gap: 28, hb: 15, hbBig: 19, stroke: 2, tick: 8, partsW: 560 },
};

function viewsLayout(set: InfographicSet, i: Infographic, v: Views, f: FormatKey, theme: ThemeKey): Node {
  const C = THEMES[theme].colors;
  const g = VG[f];
  const pion = f === 'pion';
  const inner = FORMATS[f].width - 2 * G[f].padX;

  // plansza 10×10 jako SVG w <img>, kształty z geometrii siatki strony; flexShrink: 0 — inaczej Satori ściska ją w owal
  const board = (cell: number, lit: (k: number) => boolean, on: string) => {
    const side = DOTS_N * cell;
    const arm = GEOMETRY.arm * cell;
    const cells = Array.from({ length: DOTS_N * DOTS_N }, (_, k) => {
      const cx = (k % DOTS_N) * cell + cell / 2;
      const cy = Math.floor(k / DOTS_N) * cell + cell / 2;
      return lit(k)
        ? `<circle cx="${cx}" cy="${cy}" r="${GEOMETRY.on * cell}" fill="${on}"/>`
        : `<path d="M${cx} ${cy - arm}v${2 * arm}M${cx - arm} ${cy}h${2 * arm}" stroke="${C.bar}" stroke-width="${GEOMETRY.stroke * cell}" fill="none"/>`;
    });
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${side}" height="${side}" viewBox="0 0 ${side} ${side}">${cells.join('')}</svg>`;
    return h('img', { src: `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`, width: side, height: side, style: { flexShrink: 0 } });
  };
  // nawias jak w filmie (ujęcie „72 h”): ⊓ na szerokość planszy, pogrubiony podpis w jednym wierszu nad nim
  const bracket = (label: string, side: number, size: number) =>
    h('div', { style: { flexDirection: 'column', width: side } },
      h('span', { style: { fontFamily: BODY, fontWeight: 600, fontSize: size, lineHeight: 1, whiteSpace: 'nowrap', color: C.ink } }, typo(label)),
      h('div', { style: { marginTop: pion ? 10 : 6, width: side, height: g.tick, borderTop: `${g.stroke}px solid ${C.ink}`, borderLeft: `${g.stroke}px solid ${C.ink}`, borderRight: `${g.stroke}px solid ${C.ink}` } }));
  const mono = (text: string, color: string, marginTop = 0) =>
    h('span', { style: { marginTop, fontFamily: MONO, fontSize: g.who, letterSpacing: '0.06em', textTransform: 'uppercase', color } }, typo(text));
  // waluta jak w tekście strony: „240 000 zł”, po angielsku „PLN 240,000”
  const unit = (size: number, side: 'marginLeft' | 'marginRight') =>
    h('span', { style: { [side]: 6, fontSize: Math.round(size * UNIT_SCALE), letterSpacing: '-0.02em' } }, set.locale === 'en' ? 'PLN' : 'zł');
  const money = (text: string, size: number, color: string) =>
    h('div', { style: { alignItems: 'baseline', fontFamily: DISPLAY, fontWeight: 300, fontSize: size, lineHeight: 1, letterSpacing: '-0.05em', color } },
      ...(set.locale === 'en' ? [unit(size, 'marginRight'), text] : [text, unit(size, 'marginLeft')]));

  const part = (p: ViewPart, w: number) =>
    h('div', { style: { flexDirection: 'column', width: w } },
      mono(p.who, C.muted),
      v.brackets && h('div', { style: { marginTop: pion ? 18 : 10 } }, bracket(v.brackets.part, DOTS_N * g.cell, g.hb)),
      h('div', { style: { marginTop: pion ? 10 : 6 } }, board(g.cell, (k) => k >= p.from && k < p.from + p.dots, C.ink)),
      h('div', { style: { marginTop: pion ? 16 : 8 } }, money(p.display, g.num, C.ink)),
      h('span', { style: { marginTop: pion ? 6 : 3, fontFamily: BODY, fontSize: g.label, color: C.ink } }, typo(p.label)));
  const full = h('div', { style: { flexDirection: 'column', flexShrink: 0 } },
    v.brackets && bracket(v.brackets.total, DOTS_N * g.board, g.hbBig),
    h('div', { style: { marginTop: v.brackets ? (pion ? 10 : 6) : 0 } }, board(g.board, () => true, C.blue)));
  const total = h('div', { style: { flexDirection: 'column' } },
    mono(set.locale === 'en' ? 'seen by nobody' : 'nie widzi nikt', C.blue),
    h('div', { style: { marginTop: pion ? 14 : 8 } }, money(v.total.display, g.totalNum, C.blue)),
    h('span', { style: { marginTop: pion ? 10 : 5, fontFamily: BODY, fontSize: g.label + 2, color: C.ink } }, typo(v.total.label)),
    mono(v.total.sub, C.muted, pion ? 6 : 3));
  const slogan = h('div', { style: { fontFamily: DISPLAY, fontWeight: 400, fontSize: g.slogan, lineHeight: 1.15, letterSpacing: '-0.03em', color: C.ink } }, typo(v.slogan));
  // suma u góry, hasło na wysokości dołu planszy
  const side = (extra: Record<string, unknown>) =>
    h('div', { style: { flexDirection: 'column', justifyContent: 'space-between', alignSelf: 'stretch', ...extra } }, total, slogan);

  if (pion) {
    const colW = Math.floor(inner / v.parts.length);
    return frame(set, i, f, theme,
      h('div', { style: { flexDirection: 'column', width: inner, marginTop: 20 } },
        h('div', {}, ...v.parts.map((p) => part(p, colW))),
        h('div', { style: { marginTop: g.gap, paddingTop: g.gap, borderTop: `1px solid ${C.line}` } }, full, side({ marginLeft: 40 }))));
  }
  const colW = Math.floor(g.partsW / v.parts.length);
  return frame(set, i, f, theme,
    h('div', { style: { width: inner, alignItems: 'flex-start', justifyContent: 'space-between' } },
      h('div', { style: { width: g.partsW } }, ...v.parts.map((p) => part(p, colW))),
      h('div', { style: { width: inner - g.partsW - g.gap, paddingLeft: g.gap, borderLeft: `1px solid ${C.line}` } }, full, side({ marginLeft: 24, flexGrow: 1 }))));
}

/* ---------- Styl „oś czasu”: krzyżyki na osi, pod nią dwie liczby ---------- */

/**
 * Geometria. Poziom: zdarzenia w równych kolumnach (rok nad znacznikiem, zdanie i podmiot pod nim,
 * wyśrodkowane), liczby w dwóch kolumnach ze zdaniem obok. Pion: wiersz = rok | znacznik | zdanie
 * i podmiot, liczby ze zdaniem pod spodem.
 */
const LG = {
  pion: { node: 30, year: 44, yearW: 120, rowH: 86, text: 24, who: 14, note: 19, num: 96, unit: 40, figText: 20 },
  poziom: { node: 26, year: 34, yearW: 0, rowH: 0, text: 15, who: 11, note: 14, num: 64, unit: 26, figText: 15 },
};

/** Krzyżyk w kółku na tle grafiki (przerywa oś); SVG jako <img>, bo Satori nie rysuje ścieżek inline. */
function crossMark(size: number, color: string, bg: string): Node {
  const c = size / 2, r = c - 1.5, a = size * 0.3;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><circle cx="${c}" cy="${c}" r="${r}" fill="${bg}" stroke="${color}" stroke-width="2"/><path d="M${a} ${a}L${size - a} ${size - a}M${size - a} ${a}L${a} ${size - a}" stroke="${color}" stroke-width="2.5" stroke-linecap="round"/></svg>`;
  return h('img', { src: `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`, width: size, height: size });
}

function timelineLayout(set: InfographicSet, i: Infographic, t: Timeline, f: FormatKey, theme: ThemeKey): Node {
  const C = THEMES[theme].colors;
  const lg = LG[f];
  const pion = f === 'pion';
  const inner = FORMATS[f].width - 2 * G[f].padX;
  const n = t.events.length;
  const yearStyle = { fontFamily: DISPLAY, fontWeight: 300, fontSize: lg.year, lineHeight: 1, letterSpacing: '-0.04em', color: C.ink };
  const whoStyle = { fontFamily: MONO, fontSize: lg.who, letterSpacing: '0.06em', textTransform: 'uppercase', color: C.muted };
  const figure = (x: TimelineFigure, style: Record<string, string | number> = {}) =>
    h('div', { style: { alignItems: 'baseline', fontFamily: DISPLAY, fontWeight: 300, fontSize: lg.num, lineHeight: 1, letterSpacing: '-0.05em', color: x.highlight ? C.blue : C.ink, ...style } },
      x.value,
      x.unit && h('span', { style: { marginLeft: pion ? 10 : 8, fontSize: lg.unit, letterSpacing: '-0.02em' } }, x.unit));
  const note = (style: Record<string, string | number>) =>
    t.note && h('span', { style: { fontFamily: BODY, fontSize: lg.note, color: C.muted, ...style } }, typo(t.note));
  // odcinki osi między znacznikami (pod znacznik Satori by ich nie schował: rysuje pozycjonowane na wierzchu)
  const segment = (style: Record<string, number>) => h('div', { style: { position: 'absolute', background: C.ink, ...style } });

  if (!pion) {
    const colW = Math.floor(inner / n);
    const axisY = lg.year + 14 + lg.node / 2;
    const axis = h('div', { style: { position: 'relative', width: inner } },
      ...t.events.slice(1).map((_, k) => segment({ left: colW / 2 + lg.node / 2 + k * colW, top: axisY, width: colW - lg.node, height: 1 })),
      ...t.events.map((e) => h('div', { style: { width: colW, flexDirection: 'column', alignItems: 'center', paddingLeft: 8, paddingRight: 8 } },
        h('span', { style: yearStyle }, e.year),
        h('div', { style: { marginTop: 14 } }, crossMark(lg.node, C.bad, C.bg)),
        h('span', { style: { marginTop: 14, fontFamily: BODY, fontSize: lg.text, lineHeight: 1.3, color: C.ink, textAlign: 'center' } }, typo(e.text)),
        h('span', { style: { marginTop: 8, ...whoStyle, textAlign: 'center' } }, typo(e.who)))));
    const figures = h('div', { style: { borderTop: `1px solid ${C.line}`, paddingTop: 18 } },
      ...t.figures.map((x, k) => h('div', { style: { width: inner / t.figures.length, alignItems: 'center', paddingRight: k === 0 ? 32 : 0, paddingLeft: k > 0 ? 32 : 0, borderLeft: k > 0 ? `1px solid ${C.line}` : 'none' } },
        figure(x, { flexShrink: 0 }),
        h('span', { style: { marginLeft: 20, fontFamily: BODY, fontSize: lg.figText, lineHeight: 1.3, color: C.ink } }, typo(x.text)))));
    return frame(set, i, f, theme, h('div', { style: { flexDirection: 'column' } },
      axis,
      note({ marginTop: 14, marginBottom: 16, textAlign: 'center', justifyContent: 'center' }),
      figures));
  }

  const axis = h('div', { style: { position: 'relative', flexDirection: 'column', width: inner } },
    ...t.events.slice(1).map((_, k) => segment({ left: lg.yearW + lg.node / 2, top: lg.rowH / 2 + lg.node / 2 + k * lg.rowH, width: 1, height: lg.rowH - lg.node })),
    ...t.events.map((e) => h('div', { style: { height: lg.rowH, alignItems: 'center' } },
      h('span', { style: { width: lg.yearW, ...yearStyle } }, e.year),
      crossMark(lg.node, C.bad, C.bg),
      h('div', { style: { flexDirection: 'column', marginLeft: 28, width: inner - lg.yearW - lg.node - 28 } },
        h('span', { style: { fontFamily: BODY, fontSize: lg.text, lineHeight: 1.25, color: C.ink } }, typo(e.text)),
        h('span', { style: { marginTop: 6, ...whoStyle } }, typo(e.who))))));
  const figures = h('div', { style: { borderTop: `1px solid ${C.line}` } },
    ...t.figures.map((x, k) => h('div', { style: { width: inner / t.figures.length, flexDirection: 'column', paddingTop: 24, paddingRight: k === 0 ? 28 : 0, paddingLeft: k > 0 ? 28 : 0, borderLeft: k > 0 ? `1px solid ${C.line}` : 'none' } },
      figure(x),
      h('span', { style: { marginTop: 12, fontFamily: BODY, fontSize: lg.figText, lineHeight: 1.3, color: C.ink } }, typo(x.text)))));
  return frame(set, i, f, theme, h('div', { style: { flexDirection: 'column' } },
    axis,
    note({ marginTop: 18, marginBottom: 28 }),
    figures));
}

/* ---------- Styl „kolejka”: ilu chętnych na jedno miejsce, obok druga miara ---------- */

/**
 * Geometria. Pion: wiersz w dwóch liniach — nazwa i pasek z wartością, pod spodem kolejka z liczbą
 * (pole do `cell`, mniejsze, gdy najdłuższa kolejka się nie mieści). Poziom: nazwa | kolejka z liczbą | pasek
 * w jednej linii, nad wierszami nagłówki kolumn.
 */
const KG = {
  pion: { cell: 24, label: 27, num: 54, barW: 170, bar: 9, val: 30, head: 15, padY: 18, gap: 12, labelW: 0, rowH: 0 },
  poziom: { cell: 14, label: 18, num: 30, barW: 170, bar: 7, val: 20, head: 11, padY: 0, gap: 0, labelW: 230, rowH: 58 },
};

function queueLayout(set: InfographicSet, i: Infographic, q: Queue, f: FormatKey, theme: ThemeKey): Node {
  const C = THEMES[theme].colors;
  const qg = KG[f];
  const pion = f === 'pion';
  const inner = FORMATS[f].width - 2 * G[f].padX;
  const longest = Math.max(...q.rows.map((r) => Math.max(1, Math.round(r.count))));
  const numW = Math.ceil(Math.max(...q.rows.map((r) => textWidth(r.countDisplay, qg.num))) + qg.num * 0.3);
  // miejsce na wartość paska: szacunek szerokości z zapasem (Inter Tight 400 jest szerszy niż Light z textWidth)
  const valW = Math.ceil(textWidth('00,00', qg.val) * 1.15);
  const barCol = qg.barW + 16 + valW;
  const queueW = pion ? inner - numW - 16 : inner - qg.labelW - barCol - 2 * 24 - numW - 12;
  const cell = Math.min(qg.cell, Math.floor(queueW / longest));

  // kolejka jako SVG w <img> (Satori nie rysuje ścieżek inline); kształty z geometrii siatki strony
  const dots = (r: QueueRow) => {
    const n = Math.max(1, Math.round(r.count));
    const arm = GEOMETRY.arm * cell;
    const cells = Array.from({ length: n }, (_, k) => {
      const cx = k * cell + cell / 2;
      const cy = cell / 2;
      return k === 0
        ? `<circle cx="${cx}" cy="${cy}" r="${GEOMETRY.on * cell}" fill="${r.highlight ? C.blue : C.ink}"/>`
        : `<path d="M${cx} ${cy - arm}v${2 * arm}M${cx - arm} ${cy}h${2 * arm}" stroke="${C.bar}" stroke-width="${GEOMETRY.stroke * cell * 1.2}" fill="none"/>`;
    });
    const w = n * cell;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${cell}" viewBox="0 0 ${w} ${cell}">${cells.join('')}</svg>`;
    return h('img', { src: `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`, width: w, height: cell });
  };
  const count = (r: QueueRow) =>
    h('span', { style: { marginLeft: 12, fontFamily: DISPLAY, fontWeight: r.highlight ? 400 : 300, fontSize: qg.num, lineHeight: 1, letterSpacing: '-0.05em', color: r.highlight ? C.blue : C.ink } }, r.countDisplay);
  const bar = (r: QueueRow) =>
    h('div', { style: { alignItems: 'center' } },
      h('div', { style: { width: qg.barW, height: qg.bar, background: C.line } },
        h('div', { style: { width: Math.max(2, (r.bar / q.barMax) * qg.barW), height: qg.bar, background: r.highlight ? C.blue : C.bar } })),
      h('span', { style: { marginLeft: 16, width: valW, justifyContent: 'flex-end', fontFamily: DISPLAY, fontWeight: 400, fontSize: qg.val, lineHeight: 1, color: r.highlight ? C.blue : C.ink } }, r.barDisplay));
  const name = (r: QueueRow) =>
    h('span', { style: { fontFamily: BODY, fontSize: qg.label, lineHeight: 1.2, fontWeight: r.highlight ? 500 : 400, color: r.highlight ? C.blue : C.ink } }, typo(r.label));
  const mono = (text: string) =>
    h('span', { style: { fontFamily: MONO, fontSize: qg.head, letterSpacing: '0.06em', textTransform: 'uppercase', color: C.muted } }, typo(text));

  if (pion) {
    const row = (r: QueueRow) =>
      h('div', { style: { flexDirection: 'column', padding: `${qg.padY}px 0`, borderTop: `1px solid ${C.line}` } },
        h('div', { style: { alignItems: 'center', justifyContent: 'space-between' } },
          name(r),
          h('div', { style: { alignItems: 'center' } }, h('span', { style: { marginRight: 16, display: 'flex' } }, mono(q.barLabel)), bar(r))),
        h('div', { style: { alignItems: 'center', marginTop: qg.gap } }, dots(r), count(r)));
    // w pionie bez nagłówków kolumn — miara nad treścią mówi, co liczymy, a „próg” stoi przy każdym pasku
    return frame(set, i, f, theme, h('div', { style: { flexDirection: 'column', width: inner } }, ...q.rows.map(row)));
  }

  const row = (r: QueueRow) =>
    h('div', { style: { alignItems: 'center', height: qg.rowH, borderTop: `1px solid ${C.line}` } },
      h('div', { style: { width: qg.labelW, flexShrink: 0, paddingRight: 16 } }, name(r)),
      h('div', { style: { flexGrow: 1, alignItems: 'center' } }, dots(r), count(r)),
      h('div', { style: { width: barCol, flexShrink: 0, justifyContent: 'flex-end' } }, bar(r)));
  return frame(set, i, f, theme,
    h('div', { style: { flexDirection: 'column', width: inner } },
      h('div', { style: { paddingBottom: 8 } },
        h('div', { style: { width: qg.labelW, flexShrink: 0 } }),
        h('div', { style: { flexGrow: 1 } }, mono(q.countLabel)),
        h('div', { style: { width: barCol, flexShrink: 0 } }, mono(q.barLabel))),
      ...q.rows.map(row)));
}

/** PNG z paletą 8-bit, jak obrazki OG. */
export async function renderInfographic(set: InfographicSet, i: Infographic, f: FormatKey, theme: ThemeKey = 'jasny'): Promise<Buffer> {
  const { width, height } = FORMATS[f];
  const tree = i.quote
    ? quoteLayout(set, i, i.quote, f, theme)
    : i.map
    ? mapLayout(set, i, i.map, f, theme)
    : i.chart
      ? chartLayout(set, i, i.chart, f, theme)
      : i.split
        ? splitLayout(set, i, i.split, f, theme)
        : i.table
          ? tableLayout(set, i, i.table, f, theme)
          : i.dots
            ? dotsLayout(set, i, i.dots, f, theme)
            : i.views
            ? viewsLayout(set, i, i.views, f, theme)
            : i.queue
            ? queueLayout(set, i, i.queue, f, theme)
            : i.timeline
              ? timelineLayout(set, i, i.timeline, f, theme)
              : layout(set, i, i.rows ?? [], f, theme);
  const svg = await satori(tree as unknown as Parameters<typeof satori>[0], { width, height, fonts: await loadFonts() });
  return sharp(Buffer.from(svg)).png({ palette: true, quality: 90, compressionLevel: 9 }).toBuffer();
}
