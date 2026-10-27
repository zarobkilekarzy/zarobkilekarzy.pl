/**
 * Część „Pieniądze a kolejka” zestawienia /dane/budzet-nfz/ (do 27.10.2026 osobna strona /dane/kolejki/): Barometr WHC, inflacja, płaca minimalna, wydatki z własnej
 * kieszeni (GUS NRZ) i składka dla mediany (nasz rachunek). Budżet NFZ NIE jest tu wpisany — pochodzi
 * z jedynej serii w data/budzet-nfz.ts (koszty ogółem w planie ostatecznym).
 *
 * Wykres indeksowy: rok bazowy 2015 = 100 dla każdej linii (ten sam w treści i w tabeli).
 * Kolejka na wykresie to JEDNA miara Barometru: „pojedyncze świadczenie”. Drugą („porada specjalisty”)
 * podajemy tylko w tabeli i w tekście, zawsze z nazwą.
 *
 * AKTUALIZACJA:
 * - nowa edycja Barometru WHC (zwykle jesienią): dopisz do WHC_EDITIONS (obie miary z tekstu raportu),
 *   podmień SPECIALISTS_2025 i adres raportu;
 * - inflacja: roczny wskaźnik GUS (połowa stycznia) → CPI;
 * - wydatki z kieszeni: obwieszczenie Prezesa GUS o Narodowym Rachunku Zdrowia (ok. 21 miesięcy po roku);
 * - mediana płac: GUS, październik danego roku → MEDIAN_WAGES;
 * - płaca minimalna: rozporządzenie RM (wrzesień) → MIN_WAGE.
 */
import { BUDGET, budget, formatMld } from '@/data/budzet-nfz';
import { formatPL } from '@/lib/format';

export const LINKS = {
  whcRaporty: 'http://www.korektorzdrowia.pl/barometr/raporty/',
  whc2025: 'https://www.korektorzdrowia.pl/wp-content/uploads/barometr-whc-2025.pdf',
  whc2024: 'https://www.korektorzdrowia.pl/wp-content/uploads/2024-pazdziernik-listopad.pdf',
  whc2023: 'https://www.korektorzdrowia.pl/wp-content/uploads/2023-lipiec-sierpien.pdf',
  whc2022: 'https://www.korektorzdrowia.pl/wp-content/uploads/2022-listopad.pdf',
  whc2021: 'https://www.korektorzdrowia.pl/wp-content/uploads/2021-wrzesien.pdf',
  whc2019: 'https://www.korektorzdrowia.pl/wp-content/uploads/barometr_whc_xii_i_2019_final.pdf',
  rz2025: 'https://www.rynekzdrowia.pl/Polityka-zdrowotna/Barometr-Watch-Health-Care-sredni-czas-oczekiwania-na-leczenie-w-2025-r-to-ponad-4-miesiace,279890,14.html',
  gp: 'https://www.gazetaprawna.pl/biznes/zdrowie/artykuly/11155472,kolejkidolekarzynfz2025.html',
  gusCpi: 'https://stat.gov.pl/obszary-tematyczne/ceny-handel/wskazniki-cen/wskazniki-cen-towarow-i-uslug-konsumpcyjnych-pot-inflacja-/roczne-wskazniki-cen-towarow-i-uslug-konsumpcyjnych/',
  /** obwieszczenie Prezesa GUS z 30.09.2026 o NRZ za 2024 r. (M.P. 2026 poz. 971) */
  nrz2024: 'https://api.sejm.gov.pl/eli/acts/MP/2026/971/text.pdf',
  /** GUS, „Wydatki na ochronę zdrowia w latach 2021–2023” */
  nrz2123: 'https://stat.gov.pl/obszary-tematyczne/zdrowie/zdrowie/wydatki-na-ochrone-zdrowia-w-latach-2021-2023,27,4.html',
  /** prawo.pl za GUS: wydatki gospodarstw domowych na zdrowie w 2020 r. */
  nrz2020: 'https://www.prawo.pl/zdrowie/wydatki-gospodarstw-domowych-na-zdrowie-w-2020-r-gus,517633.html',
  /** GUS, zasoby kadrowe 2024 — ludność przyjęta jako mianownik wskaźników */
  gusLudnosc: 'https://stat.gov.pl/obszary-tematyczne/zdrowie/zdrowie/zasoby-kadrowe-w-wybranych-zawodach-medycznych-na-podstawie-zrodel-administracyjnych-w-2024-r-,28,4.html',
  median2020: 'https://stat.gov.pl/obszary-tematyczne/rynek-pracy/pracujacy-zatrudnieni-wynagrodzenia-koszty-pracy/struktura-wynagrodzen-wedlug-zawodow-w-pazdzierniku-2020-roku,5,7.html',
  median2022: 'https://stat.gov.pl/obszary-tematyczne/rynek-pracy/pracujacy-zatrudnieni-wynagrodzenia-koszty-pracy/struktura-wynagrodzen-wedlug-zawodow-za-pazdziernik-2022-r-,5,8.html',
  median2024: 'https://stat.gov.pl/obszary-tematyczne/rynek-pracy/pracujacy-zatrudnieni-wynagrodzenia-koszty-pracy/rozklad-wynagrodzen-w-gospodarce-narodowej-w-pazdzierniku-2024-r-,32,10.html',
  median2025: 'https://www.prawo.pl/kadry/mediana-wynagrodzen-pazdziernik-2025-r-gus,1542164.html',
  /** rozporządzenie RM z 15.09.2020 — płaca minimalna na 2021 r. (wzór dla pozostałych lat) */
  minWage2021: 'https://eli.gov.pl/eli/DU/2020/1596/ogl/pol/pdf',
} as const;

/* ── Barometr WHC ─────────────────────────────────────────────────────────── */

export interface WhcEdition {
  /** okres badania, jak w raporcie */
  label: string;
  /** rok w tabeli rocznej */
  year: number;
  /** położenie na osi czasu (rok + ułamek): środek okresu badania */
  x: number;
  /** średni czas oczekiwania na pojedyncze świadczenie, mies. (rys. 2 raportu 2025) */
  single: number;
  /** średni czas oczekiwania na poradę specjalisty, mies. (tekst raportu danej edycji); null = nie podajemy */
  specialist: number | null;
}

export const WHC_EDITIONS: WhcEdition[] = [
  { label: 'II/III 2015', year: 2015, x: 2015 + 2 / 12, single: 2.9, specialist: 2.4 },
  { label: 'VI/VII 2015', year: 2015, x: 2015 + 6 / 12, single: 2.9, specialist: 2.3 },
  { label: 'X/XI 2015', year: 2015, x: 2015 + 10 / 12, single: 3.0, specialist: 2.4 },
  { label: 'II/III 2016', year: 2016, x: 2016 + 2 / 12, single: 3.0, specialist: null },
  { label: 'VI/VII 2016', year: 2016, x: 2016 + 6 / 12, single: 3.0, specialist: null },
  { label: 'X/XI 2016', year: 2016, x: 2016 + 10 / 12, single: 2.9, specialist: null },
  { label: 'II/III 2017', year: 2017, x: 2017 + 2 / 12, single: 3.0, specialist: null },
  { label: 'VI/VII 2017', year: 2017, x: 2017 + 6 / 12, single: 3.1, specialist: null },
  { label: 'IV/V 2018', year: 2018, x: 2018 + 4 / 12, single: 3.7, specialist: null },
  { label: 'XII/I 2019', year: 2019, x: 2019, single: 3.8, specialist: 4.0 },
  { label: 'IX 2021', year: 2021, x: 2021 + 8.5 / 12, single: 3.4, specialist: 2.9 },
  { label: 'XI 2022', year: 2022, x: 2022 + 10.5 / 12, single: 3.6, specialist: 4.1 },
  { label: 'VII/VIII 2023', year: 2023, x: 2023 + 7 / 12, single: 3.5, specialist: 3.7 },
  { label: 'X/XI 2024', year: 2024, x: 2024 + 10 / 12, single: 4.2, specialist: 4.3 },
  { label: 'IX/X 2025', year: 2025, x: 2025 + 9 / 12, single: 4.2, specialist: 4.2 },
];

const edition = (label: string) => WHC_EDITIONS.find((e) => e.label === label)!;
export const WHC_FIRST_2015 = WHC_EDITIONS.filter((e) => e.year === 2015);
export const WHC_2021 = edition('IX 2021');
export const WHC_LATEST = WHC_EDITIONS.at(-1)!;
/** Punkt odniesienia wykresu: średnia z trzech edycji 2015 r. (2,9; 2,9; 3,0). */
export const WHC_BASE = WHC_FIRST_2015.reduce((s, e) => s + e.single, 0) / WHC_FIRST_2015.length;

/** Najdłuższe kolejki do specjalistów i dwie częste poradnie — Barometr WHC, IX/X 2025, mies. */
export const SPECIALISTS_2025 = {
  /** porada specjalisty, średnio (41 specjalistów) */
  average: 4.2,
  rows: [
    { label: 'Neurochirurg', value: 13.1 },
    { label: 'Endokrynolog', value: 12.9 },
    { label: 'Gastroenterolog', value: 9.9 },
    { label: 'Kardiolog', value: 4.6 },
    { label: 'Okulista', value: 3.0 },
  ],
} as const;

/** Te same poradnie w dwóch źródłach: NFZ (sprawozdania, II kw. 2025, za Gazetą Prawną) i WHC (IX/X 2025). */
export const TWO_SOURCES = [
  { label: 'Kardiolog', nfz: 4.2, whc: 4.6 },
  { label: 'Okulista', nfz: 3.4, whc: 3.0 },
] as const;
/** NFZ, II kw. 2025: ortopeda, przypadek stabilny — mies. i liczba oczekujących */
export const NFZ_ORTHOPEDIST = { months: 4.8, waiting: 225_800 } as const;

/* ── Ceny, płaca minimalna ─────────────────────────────────────────────────── */

/** Średnioroczny wskaźnik cen towarów i usług konsumpcyjnych (GUS), rok poprzedni = 100. */
export const CPI: Record<number, number> = {
  2015: 99.1, 2016: 99.4, 2017: 102.0, 2018: 101.6, 2019: 102.3, 2020: 103.4,
  2021: 105.1, 2022: 114.4, 2023: 111.4, 2024: 103.6, 2025: 103.6,
};

/** Poziom cen względem średniej 2015 r. (2015 = 1). */
export const priceLevel = (year: number): number => {
  let level = 1;
  for (let y = 2016; y <= year; y++) level *= CPI[y] / 100;
  return level;
};

/** Płaca minimalna brutto od stycznia, zł/mies.; `july` — druga stawka od lipca. */
export const MIN_WAGE: { year: number; value: number; july?: number }[] = [
  { year: 2015, value: 1750 }, { year: 2016, value: 1850 }, { year: 2017, value: 2000 },
  { year: 2018, value: 2100 }, { year: 2019, value: 2250 }, { year: 2020, value: 2600 },
  { year: 2021, value: 2800 }, { year: 2022, value: 3010 }, { year: 2023, value: 3490, july: 3600 },
  { year: 2024, value: 4242, july: 4300 }, { year: 2025, value: 4666 }, { year: 2026, value: 4806 },
];
const minWage = (year: number) => MIN_WAGE.find((m) => m.year === year)!.value;

/* ── Płacimy sami: wydatki z kieszeni i składka ──────────────────────────────── */

/**
 * Bezpośrednie wydatki gospodarstw domowych na ochronę zdrowia (HF.3 w Narodowym Rachunku Zdrowia),
 * mld zł. Na osobę liczymy sami — GUS takiego wskaźnika nie podaje.
 */
export const OUT_OF_POCKET = [
  { year: 2020, value: 32.2 },
  { year: 2021, value: 33.6253 },
  { year: 2022, value: 36.9634 },
  { year: 2023, value: 38.6332 },
  { year: 2024, value: 47.6405 },
] as const;
/** Wydatki prywatne ogółem w 2024 r. (z abonamentami i ubezpieczeniami), mld zł */
export const PRIVATE_TOTAL_2024 = 66.3777;
/** Ludność — mianownik wskaźników GUS za 2024 r. */
export const POPULATION_2024 = 37_489_087;
export const OOP_PER_PERSON_2024 = (OUT_OF_POCKET.at(-1)!.value * 1e9) / POPULATION_2024;

/**
 * Składka zdrowotna pracownika z medianą płac — NASZ RACHUNEK, nie dana GUS:
 * 9% × (mediana brutto − 13,71% składek na ubezpieczenia społeczne) × 12.
 * Mediana z października danego roku: 2020 i 2022 z badania „Struktura wynagrodzeń według zawodów”,
 * 2024 i 2025 z „Rozkładu wynagrodzeń” — metody nie są w pełni porównywalne.
 */
export const CONTRIBUTION_RATE = 0.09;
export const SOCIAL_SHARE = 0.1371;
export const contribution = (median: number) => CONTRIBUTION_RATE * median * (1 - SOCIAL_SHARE) * 12;
export const MEDIAN_WAGES = [
  { year: 2020, median: 4702.66, survey: 'Struktura wynagrodzeń', href: LINKS.median2020 },
  { year: 2022, median: 5701.62, survey: 'Struktura wynagrodzeń', href: LINKS.median2022 },
  { year: 2024, median: 6856.75, survey: 'Rozkład wynagrodzeń', href: LINKS.median2024 },
  { year: 2025, median: 7414, survey: 'Rozkład wynagrodzeń', href: LINKS.median2025 },
] as const;

/* ── Tempo zmian 2015 → 2025 (te same liczby w tekście, na wykresie i w tabeli) ─── */

export const FROM = 2015;
export const TO = 2025;

export const GROWTH = {
  /** koszty w planie ostatecznym NFZ, krotność */
  budget: budget(TO).costs / budget(FROM).costs,
  /** ta sama krotność w cenach 2015 r. */
  budgetReal: budget(TO).costs / budget(FROM).costs / priceLevel(TO),
  /** poziom cen, % */
  prices: (priceLevel(TO) - 1) * 100,
  /** płaca minimalna od stycznia, krotność */
  minWage: minWage(TO) / minWage(FROM),
  /** kolejka WHC (pojedyncze świadczenie): ostatnia edycja wobec średniej 2015 r., % */
  queue: (WHC_LATEST.single / WHC_BASE - 1) * 100,
  /** pojedyncze świadczenie IX 2021 → ostatnia edycja, % */
  single2021: (WHC_LATEST.single / WHC_2021.single - 1) * 100,
  /** porada specjalisty IX 2021 → ostatnia edycja, % */
  specialist2021: (WHC_LATEST.specialist! / WHC_2021.specialist! - 1) * 100,
};

/* ── Wykres indeksowy (components/budzet/IndexChart) ───────────────────────── */

const fmt = (n: number, d = 0) => formatPL(n, d);
const mid = (year: number) => year + 0.5;
const years = BUDGET.filter((r) => r.year >= FROM && r.year <= TO).map((r) => r.year);

export const INDEX_CHART = {
  base: FROM,
  xMin: FROM,
  xMax: TO + 1,
  yMin: 80,
  yMax: 320,
  ticks: [100, 150, 200, 250, 300],
  years,
  series: [
    {
      id: 'budget',
      label: 'Koszty w planie NFZ',
      tone: 'data' as const,
      end: `×${fmt(GROWTH.budget, 1)}`,
      points: years.map((y) => ({ x: mid(y), v: (budget(y).costs / budget(FROM).costs) * 100 })),
    },
    {
      id: 'prices',
      label: 'Ceny (inflacja)',
      tone: 'ref' as const,
      end: `+${fmt(GROWTH.prices)}%`,
      labelShift: -1,
      points: years.map((y) => ({ x: mid(y), v: priceLevel(y) * 100 })),
    },
    {
      id: 'queue',
      label: 'Kolejka (WHC)',
      tone: 'accent' as const,
      end: `+${fmt(GROWTH.queue)}%`,
      labelShift: 1,
      markers: true,
      // 2020: Barometr nie powstał — odcinek 2019–2021 przerywany
      points: WHC_EDITIONS.map((e) => ({
        x: e.x, v: (e.single / WHC_BASE) * 100, gapBefore: e.label === 'IX 2021',
        label: e.label, tip: `${fmt(e.single, 1)} mies.`, note: 'średnio na świadczenie (WHC)',
      })),
    },
  ],
  caption:
    `Indeksy, ${FROM} = 100, lata ${FROM}–${TO}. Koszty w ostatecznym planie finansowym NFZ: z ${formatMld(budget(FROM).costs)} do ` +
    `${formatMld(budget(TO).costs)} mld zł, czyli ${fmt(GROWTH.budget, 2)} raza. Poziom cen według GUS: o ${fmt(GROWTH.prices, 1)}% wyżej. ` +
    `Średni czas oczekiwania na pojedyncze świadczenie według Barometru WHC: z ${fmt(WHC_BASE, 1)} mies. (średnia z trzech pomiarów ` +
    `w ${FROM} r.) do ${fmt(WHC_LATEST.single, 1)} mies. (${WHC_LATEST.label}), o ${fmt(GROWTH.queue)}%; w 2020 r. Barometru nie było.`,
};

/* ── Tabela „Dłuższa perspektywa” (Comparison) ─────────────────────────────── */

const whcCell = (year: number, key: 'single' | 'specialist') => {
  if (year === 2020) return 'brak badania';
  const values = WHC_EDITIONS.filter((e) => e.year === year).map((e) => e[key]);
  if (!values.length || values.every((v) => v === null)) return '—';
  return values.map((v) => (v === null ? '—' : fmt(v, 1))).join(' · ');
};

export const HISTORY_TABLE = {
  caption: 'Kolejne lata w liczbach bezwzględnych. Kolejka: każda edycja Barometru WHC w danym roku osobno.',
  columns: ['Rok', 'Koszty w planie NFZ, mld zł', 'Inflacja, %', 'Płaca minimalna, zł', 'WHC: świadczenie, mies.', 'WHC: specjalista, mies.'],
  rows: BUDGET.filter((r) => r.year >= FROM).map((r) => {
    const wage = MIN_WAGE.find((m) => m.year === r.year);
    const infl = CPI[r.year];
    return {
      cells: [
        String(r.year),
        `${formatMld(r.costs)}${r.status === 'current' ? ' (plan w toku)' : ''}`,
        infl === undefined ? '—' : `${infl < 100 ? '−' : ''}${fmt(Math.abs(infl - 100), 1)}`,
        wage ? `${formatPL(wage.value)}${wage.july ? `, od lipca ${formatPL(wage.july)}` : ''}` : '—',
        r.year > TO ? '—' : whcCell(r.year, 'single'),
        r.year > TO ? '—' : whcCell(r.year, 'specialist'),
      ],
    };
  }),
};
