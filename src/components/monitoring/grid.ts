/**
 * Konfiguracja datagridu dla monitoringu „Ile zarabiają lekarze?”.
 * Wspólna dla serwera (pierwszy widok) i przeglądarki — dlatego z danych importuje tylko typy,
 * a słowniki kodów bierze z zod-free modułu lib/monitoring/codes.
 */
import type { GridConfig, Html, RenderContext } from '@/components/datagrid/types';
import { esc } from '@/components/datagrid/render';
import { formatPL, slug } from '@/lib/format';
import { AGGREGATE_LABEL, NO_LIST_LABEL, VOIVODESHIPS, upperFirst } from '@/lib/monitoring/codes';
import type { Facility, MonitoringDoc, NetworkLevel, Payroll, Response } from '@/lib/monitoring';
import { prettyName } from '@/lib/monitoring/name';

export interface Row extends Facility {
  /** nazwa do wyświetlania */
  label: string;
  payroll: Payroll | null;
}

const METRICS = ['total', 'median', 'max', 'top10Share'] as const;
type Metric = (typeof METRICS)[number];

export interface Stats {
  year: number;
  labels: string[];
  /** koszyk zaczyna się od 500 tys. zł lub więcej — wyróżniony na wykresach */
  high: boolean[];
  /** wartości wśród placówek z listą płac, rosnąco — tło dla szczegółów wiersza */
  dist: Record<Metric, number[]>;
  /** kto zebrał dane — stopka grafiki do udostępnienia */
  source: MonitoringDoc['source'];
}

/* ---------- słowniki ---------- */

interface ResponseInfo {
  /** wartość w adresie (?odpowiedz=odmowa) */
  value: string;
  label: string;
  tone: string;
  /** komórka w miejscu kolumn płacowych, gdy placówka nie ma listy */
  title: string;
  note: string;
}

/** Kolejność = kolejność na pasku: najpierw trzy duże grupy (dane, odmowa, cisza). */
export const RESPONSE: Record<Response, ResponseInfo> = {
  disclosed: { value: 'dane', label: 'ujawniła dane', tone: 'ok', title: upperFirst(NO_LIST_LABEL.disclosed), note: 'placówka przysłała dane, ale nie udało się ich odczytać i zestawić w roczną listę (arkusz lub archiwum, skan, niepełna lista) — są w sprawie u źródła' },
  refused: { value: 'odmowa', label: 'odmówiła', tone: 'bad', title: upperFirst(NO_LIST_LABEL.refused), note: 'placówka nie udostępniła danych' },
  silence: { value: 'cisza', label: 'cisza', tone: 'mute', title: upperFirst(NO_LIST_LABEL.silence), note: 'brak odpowiedzi na wniosek' },
  other: { value: 'inna', label: 'inna odpowiedź', tone: 'mid', title: upperFirst(NO_LIST_LABEL.other), note: 'bez danych o wynagrodzeniach' },
  receipt: { value: 'potwierdzenie', label: 'tylko potwierdzenie', tone: 'soft', title: upperFirst(NO_LIST_LABEL.receipt), note: 'placówka potwierdziła odbiór wniosku i na tym poprzestała' },
  forwarded: { value: 'przekazana', label: 'przekazana dalej', tone: 'fwd', title: upperFirst(NO_LIST_LABEL.forwarded), note: 'wniosek trafił do innej instytucji' },
  unknown: { value: 'nieustalona', label: 'nieustalona', tone: 'unk', title: upperFirst(NO_LIST_LABEL.unknown), note: 'automat nie sklasyfikował odpowiedzi' },
};
const RESPONSE_ORDER = Object.keys(RESPONSE) as Response[];

const NETWORK: Record<NetworkLevel, { value: string; short: string; label: string }> = {
  I: { value: 'I', short: 'I st.', label: 'szpital I stopnia' },
  II: { value: 'II', short: 'II st.', label: 'szpital II stopnia' },
  III: { value: 'III', short: 'III st.', label: 'szpital III stopnia' },
  national: { value: 'ogolnopolskie', short: 'ogólnopolski', label: 'szpital ogólnopolski' },
  oncology: { value: 'specjalistyczne', short: 'onkologiczny', label: 'szpital onkologiczny' },
  pulmonology: { value: 'specjalistyczne', short: 'pulmonologiczny', label: 'szpital pulmonologiczny' },
  'oncology-pulmonology': { value: 'specjalistyczne', short: 'onkol./pulmon.', label: 'szpital onkologiczny lub pulmonologiczny' },
  pediatric: { value: 'specjalistyczne', short: 'pediatryczny', label: 'szpital pediatryczny' },
  unspecified: { value: 'bez-poziomu', short: '', label: 'poziom nieustalony' },
};

const capitalize = (s: string) => s.replace(/(^|-)(\p{L})/gu, (_, sep: string, ch: string) => sep + ch.toLocaleUpperCase('pl'));

const SIZES = [
  { value: 'do-20-tys', label: 'do 20 tys. mieszkańców', max: 20_000 },
  { value: '20-100-tys', label: '20–100 tys. mieszkańców', max: 100_000 },
  { value: 'ponad-100-tys', label: 'ponad 100 tys. mieszkańców', max: Infinity },
];

/* ---------- formatowanie ---------- */

const unit = (u: string): Html => `<span class="dg-u">&nbsp;${u}</span>`;

/** 166 851 557 → „166,9 mln”, 4 614 190 → „4,61 mln”, 219 503 → „220 tys.” */
const money = (n: number): Html =>
  n >= 1e6 ? `${formatPL(n / 1e6, n >= 1e7 ? 1 : 2)}${unit('mln')}` : `${formatPL(Math.round(n / 1e3))}${unit('tys.')}`;

const moneyText = (n: number) => money(n).replace(/<[^>]+>/g, '').replace('&nbsp;', '\u00A0');

const percent = (share: number): Html => `${Math.round(share * 100)}${unit('%').replace('&nbsp;', '')}`;

const people = (n: number) =>
  n >= 1e6 ? `${formatPL(n / 1e6, 2)} mln` : n >= 1e4 ? `${formatPL(n / 1e3, n < 1e5 ? 1 : 0)} tys.` : formatPL(n);

/** Granica koszyka: 100 000 → „100 tys.”, 1 000 000 → „1 mln” */
const edge = (n: number) => (n >= 1e6 ? `${formatPL(n / 1e6, n % 1e6 ? 1 : 0)} mln` : `${formatPL(n / 1e3)} tys.`);

function bucketLabels(buckets: number[]): string[] {
  return [
    `do ${edge(buckets[0])}`,
    ...buckets.slice(1).map((b, i) => {
      const a = buckets[i];
      return a < 1e6 && b < 1e6 ? `${formatPL(a / 1e3)}–${edge(b)}` : `${edge(a)}–${edge(b)}`;
    }),
    `ponad ${edge(buckets[buckets.length - 1])}`,
  ];
}

/* ---------- komórki ---------- */

const pay = (row: Row) => row.payroll!;

function nameCell(row: Row, ctx: RenderContext<Stats>): Html {
  const full = row.label !== row.name ? ` title="${esc(row.name)}"` : '';
  const pop = row.population
    ? `<span title="${formatPL(row.population)} mieszkańców — ${row.populationScope === 'city' ? 'miasto' : 'cała gmina'} (GUS)">${people(row.population)} mieszk.${row.populationScope === 'commune' ? ' gminy' : ''}</span>`
    : '';
  const net = row.network
    ? `<span class="mon-net" title="Sieć szpitali (PSZ): ${esc(NETWORK[row.network].label)}">sieć${NETWORK[row.network].short ? ` · ${NETWORK[row.network].short}` : ''}</span>`
    : '';
  return (
    `<span class="mon-name"${full}>${ctx.mark(row.label)}</span>` +
    `<span class="mon-meta"><span>${ctx.mark(row.city)}</span>${pop}<span>${ctx.mark(capitalize(row.voivodeship))}</span>${net}` +
    `<a class="mon-case" href="${esc(row.url)}" target="_blank" rel="noopener">sprawa #${row.id}<span aria-hidden="true">&nbsp;↗</span><span class="sr-only"> (fedrowanie, nowa karta)</span></a></span>`
  );
}

/** Miniaturowy histogram: ten sam podział na koszyki co w szczegółach wiersza. */
function spark(p: Payroll, high: boolean[]): Html {
  const w = 6, gap = 2, h = 22;
  const top = Math.max(...p.histogram);
  const width = p.histogram.length * (w + gap) - gap;
  const bars = p.histogram
    .map((n, i) => {
      const bh = n ? Math.max(1.5, (n / top) * h) : 0;
      return `<rect x="${i * (w + gap)}" y="${(h - bh).toFixed(1)}" width="${w}" height="${bh.toFixed(1)}"${high[i] ? ' class="hi"' : ''}/>`;
    })
    .join('');
  const share = Math.round((p.over500k / p.doctors) * 100);
  return `<svg class="mon-spark" viewBox="0 0 ${width} ${h + 1}" width="${width}" height="${h + 1}" role="img" aria-label="${share}% lekarzy z listy powyżej 500 tys. zł"><path class="mon-spark__base" d="M0 ${h + 0.5}H${width}"/>${bars}</svg>`;
}

/** Pozycja placówki na tle wszystkich list płac: kreski = placówki, niebieska = ta. */
function strip(values: number[], v: number): Html {
  const min = values[0];
  const span = values[values.length - 1] - min || 1;
  const x = (n: number) => (((n - min) / span) * 200).toFixed(1);
  const ticks = values.map((n) => `M${x(n)} 4v8`).join('');
  return `<svg class="mon-strip" viewBox="0 0 200 16" preserveAspectRatio="none" aria-hidden="true"><path class="mon-strip__axis" d="M0 8H200"/><path class="mon-strip__ticks" d="${ticks}"/><path class="mon-strip__me" d="M${x(v)} 0v16"/></svg>`;
}

const METRIC_INFO: Record<Metric, { label: string; format: (n: number) => Html }> = {
  total: { label: 'Fundusz płac', format: money },
  median: { label: 'Mediana', format: money },
  max: { label: 'Najwyższa', format: money },
  top10Share: { label: 'Udział top 10', format: percent },
};

function detail(row: Row, ctx: RenderContext<Stats>): Html {
  const p = pay(row);
  const s = ctx.data;
  const top = Math.max(...p.histogram);
  const bars = p.histogram
    .map(
      (n, i) =>
        `<li${s.high[i] ? ' class="is-hi"' : ''}><span class="mon-h__lab">${s.labels[i]}</span><span class="mon-h__bar"><i style="width:${((n / top) * 100).toFixed(1)}%"></i></span><span class="mon-h__n">${formatPL(n)}</span><span class="mon-h__pct">${Math.round((n / p.doctors) * 100)}%</span></li>`,
    )
    .join('');
  const n = s.dist.total.length;
  const ranks = METRICS.map((m) => {
    const v = p[m];
    const rank = 1 + s.dist[m].filter((x) => x > v).length;
    const info = METRIC_INFO[m];
    return `<li><span class="mon-r__lab">${info.label}</span><span class="mon-r__val">${info.format(v)}</span>${strip(s.dist[m], v)}<span class="mon-r__rank"><b>${rank}.</b> z ${n}</span></li>`;
  }).join('');
  const net = row.network ? `Sieć szpitali (PSZ): ${NETWORK[row.network].label}` : 'Bez znacznika sieci szpitali';

  return `<div class="mon-detail">
    <section class="mon-detail__hist" aria-label="Rozkład wynagrodzeń">
      <p class="mon-detail__head">Rozkład ${formatPL(p.doctors)} rocznych wypłat brutto</p>
      <ol class="mon-h">${bars}</ol>
      <p class="mon-detail__iqr">Środkowa połowa listy: <b>${moneyText(p.p25)}</b> – <b>${moneyText(p.p75)}</b> zł · mediana <b>${moneyText(p.median)}</b> zł</p>
    </section>
    <section class="mon-detail__rank" aria-label="Na tle innych placówek">
      <p class="mon-detail__head">Na tle ${n} placówek z listą płac</p>
      <ul class="mon-r">${ranks}</ul>
      <p class="mon-detail__note">Kreski to placówki, niebieska — ta. Miejsce liczone od najwyższej wartości.</p>
    </section>
    <dl class="mon-detail__meta">
      <div><dt>Nazwa rejestrowa</dt><dd>${esc(row.name)}</dd></div>
      <div><dt>Miejscowość</dt><dd>${esc(row.city)}${row.population ? ` — ${formatPL(row.population)} mieszk. (${row.populationScope === 'city' ? 'miasto' : 'cała gmina'})` : ''}, ${esc(capitalize(row.voivodeship))}</dd></div>
      <div><dt>Status</dt><dd>${esc(net)}</dd></div>
      <div><dt>Źródło</dt><dd><a href="${esc(row.url)}" target="_blank" rel="noopener">Sprawa #${row.id} w serwisie fedrowanie ↗</a></dd></div>
    </dl>
    <p class="mon-detail__note">Kwoty wypłacone przez tę jedną placówkę w ${s.year} r. Lekarz pracujący w kilku miejscach ma tu tylko część dochodu. Pokazujemy liczebności przedziałów — pojedynczych kwot nie publikujemy.</p>
    <p class="mon-detail__share"><button type="button" class="mon-share-btn" data-mon-share="${row.id}" aria-haspopup="dialog"><svg class="icon" width="16" height="16" aria-hidden="true"><use href="#i-share"/></svg>Grafika do udostępnienia</button></p>
  </div>`;
}

/* ---------- konfiguracja ---------- */

function toRow(f: Facility): Row {
  return { ...f, label: f.displayName ?? prettyName(f.name) };
}

const payrollColumn = (id: string, metric: (p: Payroll) => number, cellHtml: (p: Payroll) => Html) => ({
  id,
  group: 'lista',
  align: 'end' as const,
  sort: (row: Row) => (row.payroll ? metric(row.payroll) : null),
  dir: 'desc' as const,
  bar: true,
  cell: (row: Row) => cellHtml(pay(row)),
});

export const grid: GridConfig<Row, Stats> = {
  load(json) {
    const doc = json as MonitoringDoc;
    const rows = doc.facilities.map(toRow);
    const lists = rows.flatMap((r) => (r.payroll ? [r.payroll] : []));
    const dist = Object.fromEntries(METRICS.map((m) => [m, lists.map((p) => p[m]).sort((a, b) => a - b)])) as Stats['dist'];
    const labels = bucketLabels(doc.buckets);
    const high = labels.map((_, i) => i > 0 && doc.buckets[i - 1] >= 500_000);
    return { rows, data: { year: doc.year, labels, high, dist, source: doc.source } };
  },
  key: (row) => String(row.id),
  noun: ['placówka', 'placówki', 'placówek'],
  caption: 'Placówki objęte monitoringiem „Ile zarabiają lekarze?”: odpowiedzi na wnioski i roczne listy płac lekarzy',
  search: {
    label: 'Szukaj placówki',
    placeholder: 'Nazwa, miejscowość lub nr sprawy',
    text: (row) => `${row.label} ${row.name} ${row.city} ${row.voivodeship} #${row.id}`,
  },
  columns: [
    {
      id: 'placowka',
      label: 'Placówka',
      hint: 'Nazwa uporządkowana do czytania — pełna nazwa rejestrowa jest w dymku i w szczegółach. Pod nią: miejscowość z liczbą mieszkańców (GUS), województwo, znacznik sieci szpitali i link do sprawy u źródła.',
      sort: (row) => row.label.replace(/^[„"]/, ''),
      dir: 'asc',
      cell: nameCell,
    },
    {
      ...payrollColumn('lekarzy', (p) => p.doctors, (p) => formatPL(p.doctors)),
      label: 'Lekarzy',
      width: '5.5rem',
      priority: 2,
      hint: 'Ile osób jest na ujawnionej rocznej liście płac. To nie cała kadra szpitala, tylko tylu lekarzy obejmuje udostępniony wykaz.',
    },
    {
      ...payrollColumn('fundusz', (p) => p.total, (p) => money(p.total)),
      label: 'Fundusz płac',
      short: 'Fundusz',
      width: '7rem',
      hint: 'Suma ujawnionych rocznych kwot brutto dla lekarzy z listy. To nie budżet szpitala ani koszt całego personelu.',
    },
    {
      ...payrollColumn('mediana', (p) => p.median, (p) => money(p.median)),
      label: 'Mediana',
      width: '6.5rem',
      hint: 'Kwota środkowa: połowa lekarzy z listy dostała mniej, połowa więcej. Kilka rekordowych wypłat jej nie zawyża, dlatego lepiej niż średnia pokazuje typową wypłatę.',
    },
    {
      id: 'rozklad',
      label: 'Rozkład',
      group: 'lista',
      width: '5.5rem',
      priority: 2,
      hint: 'Ilu lekarzy mieści się w kolejnych przedziałach rocznego brutto, od „do 100 tys.” do „ponad 1 mln” (przedziały wspólne dla wszystkich placówek). Niebieskie słupki to wypłaty powyżej 500 tys. zł. Pełny wykres — po rozwinięciu wiersza.',
      cell: (row, ctx) => spark(pay(row), ctx.data.high),
    },
    {
      ...payrollColumn('najwyzsza', (p) => p.max, (p) => money(p.max)),
      label: 'Najwyższa',
      width: '6.5rem',
      priority: 2,
      hint: 'Największa kwota na liście — wypłata jednej osobie przez tę jedną placówkę. Ile ta osoba zarobiła łącznie we wszystkich miejscach pracy, nie wiadomo.',
    },
    {
      ...payrollColumn('ponad500', (p) => p.over500k, (p) => formatPL(p.over500k)),
      label: '>500 tys.',
      width: '5.5rem',
      priority: 3,
      hint: 'Ilu lekarzy z listy dostało od tej placówki ponad 500 tys. zł brutto w ciągu roku.',
    },
    {
      ...payrollColumn('ponad1m', (p) => p.over1m, (p) => formatPL(p.over1m)),
      label: '>1 mln',
      width: '5rem',
      priority: 3,
      hint: 'Ilu lekarzy z listy dostało od tej placówki ponad milion złotych brutto w ciągu roku.',
    },
    {
      ...payrollColumn('top10', (p) => p.top10Share, (p) => percent(p.top10Share)),
      label: 'Top 10',
      width: '5rem',
      priority: 2,
      hint: 'Jaka część funduszu płac trafia do dziesięciu najlepiej opłacanych lekarzy — miara koncentracji. W małej placówce dziesięć osób to większa część zespołu, więc porównuj placówki podobnej wielkości.',
    },
  ],
  groups: [
    {
      id: 'lista',
      label: 'Roczna lista płac lekarzy, brutto',
      has: (row) => row.payroll !== null,
      empty: (row) => {
        // spacja tysięcy nie łamie liczby („4 538 150,06”)
        if (row.aggregate) return `<span class="mon-void"><strong>${upperFirst(AGGREGATE_LABEL)}</strong> — ${esc(row.aggregate.note).replace(/(\d) (?=\d)/g, '$1&nbsp;')}</span>`;
        const r = RESPONSE[row.response];
        return `<span class="mon-void"><strong>${r.title}</strong> — ${r.note}</span>`;
      },
    },
  ],
  facets: [
    {
      id: 'odpowiedz',
      label: 'Odpowiedź',
      display: 'bar',
      hint: 'Kategorię nadaje automat platformy fedrowanie na podstawie treści odpowiedzi — bywa omylny. Placówki z pokazaną listą płac zawsze mają „ujawniła dane”.',
      options: RESPONSE_ORDER.map((r) => ({ value: RESPONSE[r].value, label: RESPONSE[r].label, tone: RESPONSE[r].tone })),
      value: (row) => RESPONSE[row.response].value,
    },
    {
      id: 'woj',
      label: 'Województwo',
      options: VOIVODESHIPS.map((v) => ({ value: slug(v), label: capitalize(v) })),
      value: (row) => slug(row.voivodeship),
    },
    {
      id: 'miejscowosc',
      label: 'Miejscowość',
      hint: 'Liczba mieszkańców miejscowości, w której zarejestrowana jest placówka (GUS). Dla gmin wiejskich — całej gminy.',
      options: SIZES.map(({ value, label }) => ({ value, label })),
      value: (row) => (row.population ? SIZES.find((s) => row.population! < s.max)!.value : null),
    },
    {
      id: 'siec',
      label: 'Sieć szpitali',
      hint: 'Szpitale zakwalifikowane do sieci (PSZ) mają z mocy ustawy umowę z NFZ. Dopasowanie do wykazów NFZ — po gminie i nazwie; przy niepewnym dopasowaniu znacznika nie stawiamy, więc jego brak nie dowodzi, że szpitala nie ma w sieci.',
      options: [
        { value: 'I', label: 'I stopnia' },
        { value: 'II', label: 'II stopnia' },
        { value: 'III', label: 'III stopnia' },
        { value: 'ogolnopolskie', label: 'ogólnopolskie' },
        { value: 'specjalistyczne', label: 'onkologiczne, pulmonologiczne, pediatryczne' },
        { value: 'bez-poziomu', label: 'w sieci, poziom nieustalony' },
        { value: 'brak', label: 'bez znacznika sieci' },
      ],
      value: (row) => (row.network ? NETWORK[row.network].value : 'brak'),
    },
  ],
  toggles: [
    {
      id: 'listy',
      label: 'Tylko z listą płac',
      test: (row) => row.payroll !== null,
      default: true,
      fallback: 'Żadna placówka z listą płac nie pasuje do tych kryteriów — pokazujemy wszystkie pasujące, także bez listy.',
    },
  ],
  sort: { by: 'fundusz', dir: 'desc' },
  // bez listy płac: najpierw wg odpowiedzi (jak na pasku), potem alfabetycznie
  tiebreak: (a, b) =>
    RESPONSE_ORDER.indexOf(a.response) - RESPONSE_ORDER.indexOf(b.response) || a.label.localeCompare(b.label, 'pl'),
  detail: {
    has: (row) => row.payroll !== null,
    label: (row) => `Rozkład wynagrodzeń: ${row.label}`,
    render: detail,
  },
  tone: (row) => RESPONSE[row.response].tone,
  pageSize: 25,
  pageSizes: [25, 50, 100, 0],
  csv: {
    filename: 'monitoring-watchdog.csv',
    columns: (data) => [
      { label: 'Nr sprawy', value: (r) => r.id },
      { label: 'Nazwa rejestrowa', value: (r) => r.name },
      { label: 'Miejscowość', value: (r) => r.city },
      { label: 'Województwo', value: (r) => r.voivodeship },
      { label: 'Ludność', value: (r) => r.population },
      { label: 'Ludność dotyczy', value: (r) => (r.populationScope === 'city' ? 'miasta' : 'gminy') },
      { label: 'Sieć szpitali (PSZ)', value: (r) => (r.network ? NETWORK[r.network].label : '') },
      { label: 'Odpowiedź', value: (r) => RESPONSE[r.response].label },
      { label: 'Lekarzy na liście', value: (r) => r.payroll?.doctors ?? null },
      { label: 'Fundusz płac (zł)', value: (r) => r.payroll?.total ?? null },
      { label: 'Mediana (zł)', value: (r) => r.payroll?.median ?? null },
      { label: 'Kwartyl dolny (zł)', value: (r) => r.payroll?.p25 ?? null },
      { label: 'Kwartyl górny (zł)', value: (r) => r.payroll?.p75 ?? null },
      { label: 'Najwyższa (zł)', value: (r) => r.payroll?.max ?? null },
      { label: 'Ponad 500 tys. zł', value: (r) => r.payroll?.over500k ?? null },
      { label: 'Ponad 1 mln zł', value: (r) => r.payroll?.over1m ?? null },
      { label: 'Udział top 10 (%)', value: (r) => (r.payroll ? Math.round(r.payroll.top10Share * 1000) / 10 : null) },
      { label: 'Dane zbiorcze (opis)', value: (r) => r.aggregate?.note ?? null },
      ...data.labels.map((label, i) => ({ label: `Lekarzy: ${label}`, value: (r: Row) => r.payroll?.histogram[i] ?? null })),
      { label: 'Sprawa (adres)', value: (r) => r.url },
    ],
  },
};
